#!/usr/bin/env node

/**
 * Test the registration API with the real test payload
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.SUPABASE_URL || 'https://pwwpcjbbxotmiqrisjvf.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function loadTestPayload() {
  const payloadPath = path.join(process.cwd(), 'docs/individuals-test.json');
  console.log(`📄 Loading test payload from: ${payloadPath}`);
  
  if (!fs.existsSync(payloadPath)) {
    throw new Error(`Test payload file not found at: ${payloadPath}`);
  }
  
  const payloadContent = fs.readFileSync(payloadPath, 'utf-8');
  const payload = JSON.parse(payloadContent);
  
  console.log(`✅ Loaded test payload with ${payload.state.attendees.length} attendees`);
  return payload;
}

function preparePayloadForAPI(payload: any, userId: string) {
  console.log('\n🔄 Preparing payload for API...');
  
  const { state } = payload;
  
  // Find primary attendee
  const primaryAttendee = state.attendees.find((a: any) => a.isPrimary);
  const additionalAttendees = state.attendees.filter((a: any) => !a.isPrimary);
  
  console.log(`👤 Primary attendee: ${primaryAttendee?.firstName} ${primaryAttendee?.lastName}`);
  console.log(`👥 Additional attendees: ${additionalAttendees.length}`);
  
  // Build tickets array from packages and selections with deduplication
  const tickets: any[] = [];
  const ticketMap = new Map(); // Track unique attendee+event combinations
  
  // Process each attendee's ticket selections
  state.attendees.forEach((attendee: any) => {
    const attendeeId = attendee.attendeeId;
    const packageSelection = state.packages?.[attendeeId];
    const ticketSelection = state.ticketSelections?.[attendeeId];
    
    
    // Add package ticket if there is one
    if (packageSelection?.ticketDefinitionId) {
      const key = `${attendeeId}-package-${packageSelection.ticketDefinitionId}`;
      if (!ticketMap.has(key)) {
        ticketMap.set(key, true);
        tickets.push({
          id: `${attendeeId}-${packageSelection.ticketDefinitionId}`,
          attendeeId,
          ticketDefinitionId: packageSelection.ticketDefinitionId,
          isPackage: true,
          price: 0
        });
      }
    }
    
    // Add package event tickets (only if they have a package)
    if (packageSelection?.selectedEvents && packageSelection?.ticketDefinitionId) {
      packageSelection.selectedEvents.forEach((event: any) => {
        const eventTicketId = typeof event === 'string' ? event : event.event_ticket_id;
        const key = `${attendeeId}-event-${eventTicketId}`;
        if (!ticketMap.has(key)) {
          ticketMap.set(key, true);
          tickets.push({
            id: `${attendeeId}-${eventTicketId}`,
            attendeeId,
            eventTicketId: eventTicketId,
            isPackage: false,
            price: 0
          });
        }
      });
    }
    
    // Add individual tickets (only if they DON'T have a package)
    if (ticketSelection?.individualTickets && !packageSelection?.ticketDefinitionId) {
      ticketSelection.individualTickets.forEach((ticket: any) => {
        const ticketId = typeof ticket.ticketId === 'string' ? ticket.ticketId : ticket.ticketId.event_ticket_id;
        const key = `${attendeeId}-event-${ticketId}`;
        if (!ticketMap.has(key)) {
          ticketMap.set(key, true);
          tickets.push({
            id: `${attendeeId}-${ticketId}`,
            attendeeId,
            eventTicketId: ticketId,
            isPackage: false,
            price: 0
          });
        }
      });
    }
  });
  
  console.log(`🎫 Generated ${tickets.length} tickets`);
  
  
  // Build the API payload
  const apiPayload = {
    registrationType: state.registrationType,
    functionId: state.functionId,
    primaryAttendee,
    additionalAttendees,
    tickets,
    totalAmount: 0,
    billingDetails: {
      firstName: state.billingDetails?.firstName || primaryAttendee?.firstName || 'Test',
      lastName: state.billingDetails?.lastName || primaryAttendee?.lastName || 'User',
      emailAddress: state.billingDetails?.email || primaryAttendee?.primaryEmail || 'test@example.com',
      mobileNumber: state.billingDetails?.phone || primaryAttendee?.primaryPhone || '0123456789',
      billingAddress: {
        addressLine1: state.billingDetails?.addressLine1 || '',
        city: state.billingDetails?.city || '',
        state: state.billingDetails?.stateProvince || '',
        postcode: state.billingDetails?.postalCode || '',
        country: state.billingDetails?.country || 'Australia'
      }
    },
    customerId: userId,
    authUserId: userId
  };
  
  return apiPayload;
}

async function testAPI(payload: any, session: any) {
  console.log('\n🚀 Testing individuals registration API...');
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  // Add auth token if available
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
    console.log('🔐 Added authorization header to request');
  }
  
  const response = await fetch('http://localhost:3001/api/registrations/individuals', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });
  
  const result = await response.json();
  
  console.log(`📊 API Response: ${response.status} ${response.statusText}`);
  
  if (!response.ok) {
    console.error('❌ API Error:', result);
    throw new Error(`API failed: ${result.error || result.message || 'Unknown error'}`);
  }
  
  console.log('✅ API Success:', result);
  return result;
}

async function verifyInDatabase(registrationId: string) {
  console.log('\n🔍 Verifying registration in database...');
  
  // Read from comprehensive_registration_view
  const { data: comprehensive_registration_view, error } = await supabase
    .from('comprehensive_registration_view')
    .select('*')
    .eq('registration_id', registrationId);
  
  if (error) {
    console.error('❌ Error reading comprehensive_registration_view:', error);
    throw error;
  }
  
  if (!comprehensive_registration_view || comprehensive_registration_view.length === 0) {
    console.warn('⚠️ Registration not found in comprehensive_registration_view');
    return;
  }
  
  const registration = comprehensive_registration_view[0];
  console.log('✅ Found registration in database!');
  console.log(`Registration ID: ${registration.registration_id}`);
  console.log(`Registration Type: ${registration.registration_type}`);
  console.log(`Customer ID: ${registration.customer_id}`);
  console.log(`Function ID: ${registration.function_id}`);
  console.log(`Payment Status: ${registration.payment_status}`);
  console.log(`Total Amount Paid: ${registration.total_amount_paid}`);
  console.log(`Confirmation Number: ${registration.confirmation_number || 'Not generated yet'}`);
  
  // Verify attendees
  console.log('\n👥 Attendees Verification:');
  const { data: attendees, error: attendeesError } = await supabase
    .from('attendees')
    .select('*')
    .eq('registration_id', registrationId);
  
  if (attendeesError) {
    console.error('❌ Error reading attendees:', attendeesError);
  } else if (attendees) {
    console.log(`✅ Found ${attendees.length} attendees in database`);
    attendees.forEach((attendee, index) => {
      console.log(`${index + 1}. ${attendee.first_name} ${attendee.last_name}:`);
      console.log(`   - Attendee ID: ${attendee.attendee_id}`);
      console.log(`   - Attendee Type: ${attendee.attendee_type}`);
      console.log(`   - Is Primary: ${attendee.is_primary}`);
      console.log(`   - Related Attendee ID: ${attendee.related_attendee_id || 'none'}`);
    });
  }
  
  // Verify tickets
  console.log('\n🎫 Tickets Verification:');
  const { data: tickets, error: ticketsError } = await supabase
    .from('tickets')
    .select('*')
    .eq('registration_id', registrationId);
  
  if (ticketsError) {
    console.error('❌ Error reading tickets:', ticketsError);
  } else if (tickets) {
    console.log(`✅ Found ${tickets.length} tickets in database`);
    tickets.forEach((ticket, index) => {
      console.log(`${index + 1}. Ticket ${ticket.ticket_id}:`);
      console.log(`   - Attendee ID: ${ticket.attendee_id}`);
      console.log(`   - Event ID: ${ticket.event_id}`);
      console.log(`   - Package ID: ${ticket.package_id || 'none'}`);
      console.log(`   - Price Paid: $${ticket.price_paid}`);
      console.log(`   - Status: ${ticket.status}`);
    });
  }
}

async function runTest() {
  try {
    console.log('🧪 COMPREHENSIVE INDIVIDUALS REGISTRATION TEST');
    console.log('='.repeat(50));
    
    // Load test payload
    const testPayload = await loadTestPayload();
    
    // Create anonymous session
    console.log('\n🔐 Creating anonymous session...');
    const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
    if (authError) throw authError;
    
    console.log(`✅ Created anonymous session: ${authData.user.id}`);
    
    // Prepare payload
    const apiPayload = preparePayloadForAPI(testPayload, authData.user.id);
    
    // Log the final payload summary
    console.log('\n📋 Final API Payload Summary:');
    console.log(`- Function ID: ${apiPayload.functionId}`);
    console.log(`- Registration Type: ${apiPayload.registrationType}`);
    console.log(`- Primary Attendee: ${apiPayload.primaryAttendee?.firstName} ${apiPayload.primaryAttendee?.lastName}`);
    console.log(`- Additional Attendees: ${apiPayload.additionalAttendees.length}`);
    console.log(`- Tickets: ${apiPayload.tickets.length}`);
    console.log(`- Billing Details: ${apiPayload.billingDetails.firstName} ${apiPayload.billingDetails.lastName}`);
    
    // Test the API
    const result = await testAPI(apiPayload, authData.session);
    
    // Verify the registration was created correctly in the database
    if (result.registrationId) {
      await verifyInDatabase(result.registrationId);
    }
    
    console.log('\n🎉 TEST COMPLETED SUCCESSFULLY!');
    console.log(`Registration ID: ${result.registrationId}`);
    console.log(`Confirmation Number: ${result.confirmationNumber || 'Will be generated by webhook'}`);
    
    return result;
    
  } catch (error: any) {
    console.error('\n💥 TEST FAILED:');
    console.error(error.message);
    
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    
    process.exit(1);
  }
}

// Run the test
runTest();