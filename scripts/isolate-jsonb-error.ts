#!/usr/bin/env node

/**
 * Systematically test which fields cause the jsonb error
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pwwpcjbbxotmiqrisjvf.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3d3BjamJieG90bWlxcmlzanZmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTU0ODU2OCwiZXhwIjoyMDYxMTI0NTY4fQ.pJ3CEbhkGpWX8mYL-AyJKahsZywuRz6PkQmnNuLYsZk';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testPayload(testName: string, payload: any): Promise<boolean> {
  console.log(`\n🧪 Testing: ${testName}`);
  
  const { data, error } = await supabase
    .rpc('upsert_individual_registration', {
      p_registration_data: payload
    });
  
  if (error) {
    console.log(`❌ ${testName}: ${error.message}`);
    return false;
  } else {
    console.log(`✅ ${testName}: SUCCESS`);
    return true;
  }
}

async function isolateError() {
  try {
    const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
    if (authError) throw authError;
    
    console.log('🔍 SYSTEMATICALLY ISOLATING JSONB ERROR...');
    
    // Base payload that we know works
    const basePayload = {
      registrationId: crypto.randomUUID(),
      functionId: 'eebddef5-6833-43e3-8d32-700508b1c089',
      registrationType: 'individuals',
      primaryAttendee: {
        attendeeId: crypto.randomUUID(),
        attendeeType: "guest",
        firstName: "Test",
        lastName: "User"
      },
      additionalAttendees: [],
      tickets: [],
      billingDetails: {
        firstName: "Test",
        lastName: "User",
        emailAddress: "test@example.com",
        mobileNumber: "0123456789"
      },
      authUserId: authData.user.id,
      paymentCompleted: false
    };
    
    // Test 1: Base payload (should work)
    await testPayload("1. Base payload", basePayload);
    
    // Test 2: Add email field to primaryAttendee
    const test2 = { ...basePayload };
    test2.primaryAttendee = { 
      ...test2.primaryAttendee, 
      primaryEmail: "test@example.com" 
    };
    await testPayload("2. With primaryEmail", test2);
    
    // Test 3: Add more fields to primaryAttendee
    const test3 = { ...basePayload };
    test3.primaryAttendee = {
      ...test3.primaryAttendee,
      primaryEmail: "test@example.com",
      primaryPhone: "0123456789",
      isPrimary: true,
      grandLodgeOrganisationId: "3e893fa6-2cc2-448c-be9c-e3858cc90e11"
    };
    await testPayload("3. With more attendee fields", test3);
    
    // Test 4: Add partner field (potential issue)
    const test4 = { ...basePayload };
    test4.primaryAttendee = {
      ...test4.primaryAttendee,
      partner: "019749de-6491-7120-a07c-b50d552123d0"
    };
    await testPayload("4. With partner field", test4);
    
    // Test 5: Add one additional attendee
    const test5 = { ...basePayload };
    test5.additionalAttendees = [
      {
        attendeeId: "019749de-6491-7120-a07c-b50d552123d0",
        attendeeType: "guest",
        firstName: "Jane",
        lastName: "Doe"
      }
    ];
    await testPayload("5. With one additional attendee", test5);
    
    // Test 6: Add partner relationship between attendees
    const test6 = { ...basePayload };
    test6.primaryAttendee = {
      ...test6.primaryAttendee,
      partner: "019749de-6491-7120-a07c-b50d552123d0"
    };
    test6.additionalAttendees = [
      {
        attendeeId: "019749de-6491-7120-a07c-b50d552123d0",
        attendeeType: "guest",
        firstName: "Jane",
        lastName: "Doe",
        partnerOf: test6.primaryAttendee.attendeeId
      }
    ];
    await testPayload("6. With partner relationships", test6);
    
    // Test 7: Add one simple ticket
    const test7 = { ...basePayload };
    test7.tickets = [
      {
        id: "ticket-1",
        attendeeId: test7.primaryAttendee.attendeeId,
        price: 100
      }
    ];
    await testPayload("7. With one simple ticket", test7);
    
    // Test 8: Add ticket with more fields
    const test8 = { ...basePayload };
    test8.tickets = [
      {
        id: "ticket-1",
        attendeeId: test8.primaryAttendee.attendeeId,
        ticketDefinitionId: "88567b9c-9675-4ee2-b572-eace1c580eb4",
        eventTicketId: "fd12d7f0-f346-49bf-b1eb-0682ad226216",
        price: 100,
        isPackage: true
      }
    ];
    await testPayload("8. With complex ticket", test8);
    
    console.log('\n🎯 ANALYSIS COMPLETE');
    console.log('The failing test(s) above indicate which fields cause the jsonb error.');
    
  } catch (error: any) {
    console.error('💥 Isolation failed:', error.message);
  }
}

isolateError();