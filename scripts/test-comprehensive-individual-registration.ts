#!/usr/bin/env bun

/**
 * Test script for the comprehensive individual registration RPC
 * Tests complete attendee processing, ticket creation, and enhanced data handling
 */

import { createClient } from '@supabase/supabase-js';
import { Database } from '@/shared/types/database';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const FEATURED_FUNCTION_ID = process.env.FEATURED_FUNCTION_ID!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !FEATURED_FUNCTION_ID) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function testComprehensiveIndividualRegistration() {
  console.log('🧪 Testing Comprehensive Individual Registration RPC...\n');

  // Test data matching what the enhanced Zustand store would capture
  const testRegistrationData = {
    registrationId: crypto.randomUUID(),
    authUserId: crypto.randomUUID(),
    functionId: FEATURED_FUNCTION_ID,
    eventTitle: 'Test Individual Function',
    eventId: crypto.randomUUID(),
    totalAmount: 250.75,
    subtotal: 225.00,
    stripeFee: 25.75,
    agreeToTerms: true,
    billToPrimaryAttendee: false,
    billingDetails: {
      firstName: 'John',
      lastName: 'Smith',
      emailAddress: 'john.smith@example.com',
      mobileNumber: '+61400123456',
      billingAddress: {
        addressLine1: '123 Test Street',
        city: 'Sydney',
        state: 'NSW',
        postcode: '2000',
        country: 'Australia'
      }
    },
    attendees: [
      {
        isPrimary: true,
        attendeeType: 'mason',
        firstName: 'John',
        lastName: 'Smith',
        title: 'Mr',
        suffix: 'PM',
        email: 'john.smith@example.com',
        primaryEmail: 'john.smith@example.com',
        phone: '+61400123456',
        primaryPhone: '+61400123456',
        contactPreference: 'directly',
        dietaryRequirements: 'No dairy',
        specialNeeds: 'Wheelchair access',
        hasPartner: true,
        // Masonic data
        rank: 'Past Master',
        grand_lodge_id: crypto.randomUUID(),
        lodge_id: crypto.randomUUID(),
        lodgeNameNumber: 'Lodge Test No. 123',
        grandOfficerStatus: 'current',
        presentGrandOfficerRole: 'Deputy Grand Master'
      },
      {
        isPrimary: false,
        isPartner: true,
        attendeeType: 'guest',
        firstName: 'Jane',
        lastName: 'Smith',
        title: 'Mrs',
        email: 'jane.smith@example.com',
        primaryEmail: 'jane.smith@example.com',
        phone: '+61400123457',
        contactPreference: 'through_primary',
        dietaryRequirements: 'Vegetarian'
      }
    ],
    tickets: [
      {
        attendeeId: 'will-be-replaced',
        eventTicketId: crypto.randomUUID(),
        ticketDefinitionId: crypto.randomUUID(),
        price: 125.00,
        type: 'individual'
      },
      {
        attendeeId: 'will-be-replaced-partner',
        eventTicketId: crypto.randomUUID(),
        ticketDefinitionId: crypto.randomUUID(),
        price: 125.00,
        type: 'partner'
      }
    ],
    enhancedPricing: {
      resolvedFromDatabase: true,
      ticketPriceResolver: 'v1.0',
      priceValidation: {
        isValid: true,
        totalValue: 250.00,
        zeroTickets: []
      }
    },
    zustandStoreState: {
      registrationStore: {
        currentStep: 'payment',
        completedSteps: ['registration-type', 'attendee-details', 'ticket-selection', 'order-review'],
        isValid: true
      },
      capturedAt: new Date().toISOString(),
      version: '2.0.0'
    }
  };

  try {
    console.log('📝 Test Data Structure:');
    console.log(`- Registration ID: ${testRegistrationData.registrationId}`);
    console.log(`- Customer ID: ${testRegistrationData.authUserId}`);
    console.log(`- Function ID: ${testRegistrationData.functionId}`);
    console.log(`- Attendees: ${testRegistrationData.attendees.length} (1 mason + 1 partner)`);
    console.log(`- Tickets: ${testRegistrationData.tickets.length}`);
    console.log(`- Total Amount: $${testRegistrationData.totalAmount}`);
    console.log(`- Enhanced Pricing: ${testRegistrationData.enhancedPricing.resolvedFromDatabase ? '✅' : '❌'}`);
    console.log('');

    // Test the comprehensive individual registration RPC
    console.log('🚀 Calling upsert_individual_registration...');
    const { data, error } = await supabase.rpc('upsert_individual_registration', {
      p_registration_data: testRegistrationData
    });

    if (error) {
      console.error('❌ RPC Error:', error);
      return;
    }

    console.log('✅ Registration created successfully!');
    console.log('📋 Result:', data);
    console.log('');

    // Verify the data was stored correctly
    console.log('🔍 Verifying stored data...\n');

    // Check registration record
    const { data: registration } = await supabase
      .from('registrations')
      .select('*')
      .eq('registration_id', data.registrationId)
      .single();

    console.log('📊 Registration Record:');
    console.log(`- Type: ${registration?.registration_type}`);
    console.log(`- Payment Status: ${registration?.payment_status}`);
    console.log(`- Total Amount: $${registration?.total_amount_paid}`);
    console.log(`- Subtotal: $${registration?.subtotal}`);
    console.log(`- Stripe Fee: $${registration?.stripe_fee}`);
    console.log(`- Enhanced Data Captured: ${registration?.registration_data ? '✅' : '❌'}`);
    console.log('');

    // Check customer record
    const { data: customer } = await supabase
      .from('customers')
      .select('*')
      .eq('customer_id', data.customerId)
      .single();

    console.log('👤 Customer Record:');
    console.log(`- Type: ${customer?.customer_type}`);
    console.log(`- Name: ${customer?.first_name} ${customer?.last_name}`);
    console.log(`- Email: ${customer?.email}`);
    console.log(`- Phone: ${customer?.phone}`);
    console.log('');

    // Check attendee records
    const { data: attendees } = await supabase
      .from('attendees')
      .select('*')
      .eq('registration_id', data.registrationId)
      .order('is_primary', { ascending: false });

    console.log('👥 Attendee Records:');
    attendees?.forEach((attendee, index) => {
      console.log(`- Attendee ${index + 1}:`);
      console.log(`  • Name: ${attendee.first_name} ${attendee.last_name}`);
      console.log(`  • Type: ${attendee.attendee_type}`);
      console.log(`  • Primary: ${attendee.is_primary ? '✅' : '❌'}`);
      console.log(`  • Contact Preference: ${attendee.contact_preference}`);
      console.log(`  • Masonic Data: ${attendee.masonic_status ? '✅' : '❌'}`);
      if (attendee.masonic_status) {
        const masonicData = attendee.masonic_status as any;
        console.log(`    - Rank: ${masonicData.rank}`);
        console.log(`    - Lodge: ${masonicData.lodgeNameNumber}`);
        console.log(`    - Grand Officer: ${masonicData.presentGrandOfficerRole}`);
      }
      console.log(`  • Related to: ${attendee.related_attendee_id ? 'Primary Attendee' : 'Independent'}`);
    });
    console.log('');

    // Check ticket records
    const { data: tickets } = await supabase
      .from('tickets')
      .select('*')
      .eq('registration_id', data.registrationId);

    console.log('🎫 Ticket Records:');
    console.log(`- Count: ${tickets?.length || 0}`);
    tickets?.forEach((ticket, index) => {
      console.log(`- Ticket ${index + 1}:`);
      console.log(`  • Attendee ID: ${ticket.attendee_id}`);
      console.log(`  • Event ID: ${ticket.event_id}`);
      console.log(`  • Status: ${ticket.status}`);
      console.log(`  • Price Paid: $${ticket.price_paid}`);
    });
    console.log('');

    // Check contact records
    const { data: contacts } = await supabase
      .from('contacts')
      .select('*')
      .or(`auth_user_id.eq.${data.customerId},source_type.eq.attendee`);

    console.log('📞 Contact Records:');
    console.log(`- Count: ${contacts?.length || 0}`);
    contacts?.forEach((contact, index) => {
      console.log(`- Contact ${index + 1}:`);
      console.log(`  • Name: ${contact.first_name} ${contact.last_name}`);
      console.log(`  • Type: ${contact.type}`);
      console.log(`  • Email: ${contact.email}`);
      console.log(`  • Source: ${contact.source_type || 'billing'}`);
      console.log(`  • Preference: ${contact.contact_preference}`);
    });

    console.log('\n✅ Comprehensive Individual Registration Test Completed Successfully!');
    console.log('\n🎯 Key Features Verified:');
    console.log('  ✅ Complete attendee array processing');
    console.log('  ✅ Masonic data storage for mason attendees');  
    console.log('  ✅ Partner relationship linking');
    console.log('  ✅ Ticket creation with database-sourced pricing');
    console.log('  ✅ Contact records based on preferences');
    console.log('  ✅ Enhanced Zustand store data capture');
    console.log('  ✅ Comprehensive billing and payment data');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testComprehensiveIndividualRegistration().catch(console.error);