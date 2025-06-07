#!/usr/bin/env node

/**
 * Check the function definition using SQL queries
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pwwpcjbbxotmiqrisjvf.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3d3BjamJieG90bWlxcmlzanZmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTU0ODU2OCwiZXhwIjoyMDYxMTI0NTY4fQ.pJ3CEbhkGpWX8mYL-AyJKahsZywuRz6PkQmnNuLYsZk';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkFunctionDef() {
  try {
    console.log('🔍 Analyzing the exact cause of the jsonb error...');
    
    // The problem might be in the complex payload structure
    // Let me test exactly what the API route is sending
    console.log('\n1. Creating a test payload that matches API route structure...');
    
    const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
    if (authError) throw authError;
    
    // This is exactly what the API route builds
    const apiStylePayload = {
      registrationId: crypto.randomUUID(),
      functionId: 'eebddef5-6833-43e3-8d32-700508b1c089',
      eventId: null,
      eventTitle: null,
      registrationType: 'individuals',
      primaryAttendee: {
        attendeeId: "019749dd-e255-73ae-af48-0dcddb3d97be",
        attendeeType: "mason",
        isPrimary: true,
        title: "RW Bro",
        firstName: "Darren",
        lastName: "Allatt",
        primaryEmail: "darren@allatt.me",
        primaryPhone: "0438 871 124",
        grandLodgeOrganisationId: "3e893fa6-2cc2-448c-be9c-e3858cc90e11",
        lodgeOrganisationId: "4c1479ba-cbaa-2072-f77a-87882c81f1be"
      },
      additionalAttendees: [
        {
          attendeeId: "019749de-6491-7120-a07c-b50d552123d0",
          attendeeType: "guest",
          isPrimary: false,
          firstName: "Caitlin",
          lastName: "Ellis",
          primaryEmail: "caitlin@allatt.me"
        }
      ],
      tickets: [
        {
          id: "ticket-1",
          attendeeId: "019749dd-e255-73ae-af48-0dcddb3d97be",
          ticketDefinitionId: "88567b9c-9675-4ee2-b572-eace1c580eb4",
          price: 100
        }
      ],
      totalAmount: 100,
      subtotal: 90,
      stripeFee: 10,
      paymentIntentId: null,
      billingDetails: {
        firstName: "Darren",
        lastName: "Allatt",
        emailAddress: "darren@allatt.me",
        mobileNumber: "0438 871 124"
      },
      agreeToTerms: true,
      billToPrimaryAttendee: false,
      authUserId: authData.user.id,
      paymentCompleted: false
    };
    
    console.log('✅ Built API-style payload');
    
    console.log('\n2. Testing API-style payload directly with RPC...');
    
    const { data: rpcResult, error: rpcError } = await supabase
      .rpc('upsert_individual_registration', {
        p_registration_data: apiStylePayload
      });
    
    if (rpcError) {
      console.error('❌ API-style payload fails:', rpcError);
      
      if (rpcError.message?.includes('operator does not exist: jsonb ->> jsonb')) {
        console.log('\n🔍 ANALYSIS: The complex payload structure is causing the jsonb error');
        console.log('This suggests the function has issues processing certain complex field structures.');
        console.log('The issue is likely in how the function handles:');
        console.log('- Complex attendee objects with many fields');
        console.log('- Ticket arrays with multiple properties');
        console.log('- Partner relationship mappings');
      }
      
      // Let's test with minimal version of the same structure
      console.log('\n3. Testing with minimal version of same structure...');
      
      const minimalApiPayload = {
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
      
      const { data: minimalResult, error: minimalError } = await supabase
        .rpc('upsert_individual_registration', {
          p_registration_data: minimalApiPayload
        });
      
      if (minimalError) {
        console.error('❌ Even minimal API-style payload fails:', minimalError);
        console.log('\n💡 CONCLUSION: The function itself has syntax errors that need to be fixed.');
        console.log('The permissions fix was not applied correctly.');
      } else {
        console.log('✅ Minimal API-style payload works:', minimalResult);
        console.log('\n💡 CONCLUSION: The issue is with complex field structures in the payload.');
        console.log('Need to identify which specific fields are causing the jsonb syntax error.');
      }
      
    } else {
      console.log('✅ API-style payload works:', rpcResult);
      console.log('\n💡 CONCLUSION: RPC function works fine. The issue is in the API route itself.');
    }
    
  } catch (error: any) {
    console.error('💥 Analysis failed:', error.message);
  }
}

checkFunctionDef();