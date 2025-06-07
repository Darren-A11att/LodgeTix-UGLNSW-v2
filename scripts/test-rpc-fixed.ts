#!/usr/bin/env node

/**
 * Test if the RPC function has been fixed
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pwwpcjbbxotmiqrisjvf.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRPCFunction() {
  try {
    console.log('🧪 Testing if RPC function is fixed...');
    
    // Create anonymous session
    const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
    if (authError) throw authError;
    
    console.log('✅ Created anonymous session:', authData.user.id);
    
    const testPayload = {
      authUserId: authData.user.id,
      functionId: 'eebddef5-6833-43e3-8d32-700508b1c089',
      registrationId: crypto.randomUUID(),
      primaryAttendee: {
        attendeeId: crypto.randomUUID(),
        firstName: 'Test',
        lastName: 'User',
        attendeeType: 'guest',
        isPrimary: true,
        email: 'test@example.com',
        mobileNumber: '0123456789'
      },
      billingDetails: {
        firstName: 'Test',
        lastName: 'User',
        emailAddress: 'test@example.com',
        mobileNumber: '0123456789'
      },
      paymentStatus: 'pending',
      totalAmount: 100.00,
      subtotal: 90.00,
      stripeFee: 10.00
    };
    
    console.log('🚀 Calling upsert_individual_registration RPC...');
    
    const { data, error } = await supabase.rpc('upsert_individual_registration', {
      p_registration_data: testPayload
    });
    
    if (error) {
      console.error('❌ RPC Error:', error);
      
      if (error.message?.includes('operator does not exist: jsonb ->> jsonb')) {
        console.log('\n🔧 The RPC function still needs to be fixed!');
        console.log('Please run the SQL from scripts/SUPABASE_DASHBOARD_FIX.sql in your Supabase dashboard.');
        return false;
      }
      
      throw error;
    }
    
    console.log('✅ RPC function is working!', data);
    return true;
    
  } catch (error: any) {
    console.error('💥 Test failed:', error.message);
    return false;
  }
}

testRPCFunction().then(success => {
  if (success) {
    console.log('\n🎉 RPC function is fixed and ready for comprehensive testing!');
  } else {
    console.log('\n❌ RPC function still needs to be fixed.');
  }
});