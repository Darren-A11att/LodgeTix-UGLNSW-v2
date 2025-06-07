#!/usr/bin/env bun

/**
 * Direct test of the upsert_individual_registration RPC function
 * to verify the foreign key fix works
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Environment setup
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDirectRPC() {
  try {
    console.log('🧪 Testing direct RPC function call...');
    
    // Create anonymous session
    const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
    if (authError) throw authError;
    
    console.log('✅ Created anonymous session:', authData.user.id);
    
    // Create a simple test payload with relationship mapping issue
    const frontendId1 = crypto.randomUUID();
    const frontendId2 = crypto.randomUUID();
    
    const testPayload = {
      authUserId: authData.user.id,
      functionId: 'eebddef5-6833-43e3-8d32-700508b1c089',
      registrationId: crypto.randomUUID(),
      primaryAttendee: {
        attendeeId: frontendId1,
        firstName: 'John',
        lastName: 'Doe',
        attendeeType: 'mason',
        isPrimary: true,
        partner: frontendId2, // This should map to database ID
        email: 'john@example.com',
        mobileNumber: '0123456789',
        grandLodgeOrganisationId: '3e893fa6-2cc2-448c-be9c-e3858cc90e11',
        lodgeOrganisationId: '4c1479ba-cbaa-2072-f77a-87882c81f1be'
      },
      additionalAttendees: [
        {
          attendeeId: frontendId2,
          firstName: 'Jane',
          lastName: 'Doe',
          attendeeType: 'guest',
          isPrimary: false,
          partnerOf: frontendId1, // This should map to database ID
          email: 'jane@example.com',
          mobileNumber: '0123456790',
          relationship: 'Wife'
        }
      ],
      billingDetails: {
        firstName: 'John',
        lastName: 'Doe',
        emailAddress: 'john@example.com',
        mobileNumber: '0123456789'
      },
      paymentStatus: 'pending',
      totalAmount: 100.00,
      subtotal: 90.00,
      stripeFee: 10.00
    };
    
    console.log('🚀 Calling upsert_individual_registration RPC...');
    
    // Call the RPC function directly
    const { data, error } = await supabase.rpc('upsert_individual_registration', {
      p_registration_data: testPayload
    });
    
    if (error) {
      console.error('❌ RPC Error:', error);
      throw error;
    }
    
    console.log('✅ RPC Success:', data);
    
    // Verify the data was created correctly
    console.log('🔍 Verifying database data...');
    
    const registrationId = data.registrationId;
    
    // Check attendees were created
    const { data: attendees, error: attendeesError } = await supabase
      .from('attendees')
      .select('*')
      .eq('registration_id', registrationId);
      
    if (attendeesError) {
      console.error('❌ Error fetching attendees:', attendeesError);
      throw attendeesError;
    }
    
    console.log(`✅ Found ${attendees.length} attendees`);
    attendees.forEach((attendee, index) => {
      console.log(`${index + 1}. ${attendee.first_name} ${attendee.last_name}:`);
      console.log(`   - Attendee ID: ${attendee.attendee_id}`);
      console.log(`   - Is Primary: ${attendee.is_primary}`);
      console.log(`   - Related Attendee ID: ${attendee.related_attendee_id || 'none'}`);
    });
    
    // Check relationships are valid
    const relatedAttendeeIds = attendees
      .filter(a => a.related_attendee_id)
      .map(a => a.related_attendee_id);
    
    if (relatedAttendeeIds.length > 0) {
      console.log('🔗 Checking relationship validity...');
      relatedAttendeeIds.forEach(relatedId => {
        const relatedAttendee = attendees.find(a => a.attendee_id === relatedId);
        if (relatedAttendee) {
          console.log(`✅ Related attendee ${relatedId} exists: ${relatedAttendee.first_name} ${relatedAttendee.last_name}`);
        } else {
          console.log(`❌ Related attendee ${relatedId} NOT FOUND - This would cause FK violation`);
        }
      });
    }
    
    console.log('🎉 Test completed successfully!');
    
  } catch (error: any) {
    console.error('💥 Test failed:', error.message);
    if (error.details) {
      console.error('Details:', error.details);
    }
    process.exit(1);
  }
}

// Run the test
testDirectRPC();