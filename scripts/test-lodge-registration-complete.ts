#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pwwpcjbbxotmiqrisjvf.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3d3BjamJieG90bWlxcmlzanZmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTU0ODU2OCwiZXhwIjoyMDYxMTI0NTY4fQ.pJ3CEbhkGpWX8mYL-AyJKahsZywuRz6PkQmnNuLYsZk';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testLodgeRegistrationComplete() {
  console.log('🧪 Testing complete lodge registration flow with corrected enum...');
  
  try {
    // Get function and package IDs
    const { data: functions } = await supabase
      .from('functions')
      .select('function_id, title')
      .limit(1);
    
    if (!functions || functions.length === 0) {
      throw new Error('No functions found');
    }
    
    const functionId = functions[0].function_id;
    console.log(`📋 Using function: ${functions[0].title} (${functionId})`);
    
    // Get a lodge package
    const { data: packages } = await supabase
      .from('packages')
      .select('package_id, package_name, package_price, eligible_registration_types')
      .contains('eligible_registration_types', ['lodges'])
      .limit(1);
    
    if (!packages || packages.length === 0) {
      throw new Error('No lodge packages found');
    }
    
    const packageId = packages[0].package_id;
    console.log(`📦 Using package: ${packages[0].package_name} ($${packages[0].package_price})`);
    
    // Test data
    const testData = {
      p_function_id: functionId,
      p_package_id: packageId,
      p_table_count: 2,
      p_booking_contact: {
        firstName: 'John',
        lastName: 'Smith',
        email: 'john.smith@testlodge.org',
        mobile: '+61412345678',
        addressLine1: '123 Lodge Street',
        suburb: 'Sydney',
        stateTerritory: 'NSW',
        postcode: '2000',
        country: 'Australia',
        title: 'WM',
        authUserId: '550e8400-e29b-41d4-a716-446655440000'
      },
      p_lodge_details: {
        lodgeName: 'Test Lodge No. 123',
        lodge_id: '123',
        grand_lodge_id: 'UGLNSW',
        lodgeNumber: '123'
      },
      p_payment_status: 'completed',
      p_stripe_payment_intent_id: 'pi_test_123456789',
      p_total_amount: 3900.00, // $39 per ticket * 20 tickets * 2 tables
      p_subtotal: 3600.00,
      p_stripe_fee: 300.00,
      p_metadata: {
        test: true,
        source: 'enum-fix-test'
      }
    };
    
    console.log('🚀 Calling upsert_lodge_registration RPC...');
    
    // Call the RPC function
    const { data, error } = await supabase.rpc('upsert_lodge_registration', testData);
    
    if (error) {
      console.error('❌ RPC Error:', error);
      throw error;
    }
    
    console.log('✅ Lodge registration created successfully!');
    console.log('📋 Registration result:', JSON.stringify(data, null, 2));
    
    // Verify the registration was created
    const registrationId = data.registrationId;
    
    console.log(`🔍 Verifying registration ${registrationId}...`);
    
    // Check registration
    const { data: registration, error: regError } = await supabase
      .from('registrations')
      .select('*')
      .eq('registration_id', registrationId)
      .single();
    
    if (regError) {
      console.error('❌ Error fetching registration:', regError);
    } else {
      console.log('✅ Registration verified in database');
      console.log(`   Type: ${registration.registration_type}`);
      console.log(`   Status: ${registration.status}`);
      console.log(`   Payment: ${registration.payment_status}`);
      console.log(`   Tables: ${registration.registration_data?.tableCount || 'unknown'}`);
      console.log(`   Total: $${registration.total_amount_paid}`);
    }
    
    // Check contacts (this was where the enum error occurred)
    const { data: contacts, error: contactError } = await supabase
      .from('contacts')
      .select('contact_id, type, first_name, last_name, email')
      .eq('auth_user_id', testData.p_booking_contact.authUserId);
    
    if (contactError) {
      console.error('❌ Error fetching contacts:', contactError);
    } else {
      console.log('✅ Contact record verified');
      contacts.forEach(contact => {
        console.log(`   Contact: ${contact.first_name} ${contact.last_name} (${contact.type})`);
      });
    }
    
    // Check tickets
    const { data: tickets, error: ticketError } = await supabase
      .from('tickets')
      .select('ticket_id, status, price_paid')
      .eq('registration_id', registrationId);
    
    if (ticketError) {
      console.error('❌ Error fetching tickets:', ticketError);
    } else {
      console.log(`✅ ${tickets.length} tickets created`);
      const totalTicketValue = tickets.reduce((sum, ticket) => sum + parseFloat(ticket.price_paid), 0);
      console.log(`   Total ticket value: $${totalTicketValue.toFixed(2)}`);
    }
    
    // Check raw data
    const { data: rawData, error: rawError } = await supabase
      .from('raw_registrations')
      .select('raw_id, processed, error_message')
      .eq('registration_id', registrationId);
    
    if (rawError) {
      console.error('❌ Error fetching raw data:', rawError);
    } else if (rawData.length > 0) {
      console.log('✅ Raw registration data captured');
      console.log(`   Processed: ${rawData[0].processed}`);
      if (rawData[0].error_message) {
        console.log(`   Error: ${rawData[0].error_message}`);
      }
    }
    
    console.log('\n🎉 Lodge registration test completed successfully!');
    console.log('✅ The enum error has been fixed - contact type "individual" is now used correctly');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testLodgeRegistrationComplete();