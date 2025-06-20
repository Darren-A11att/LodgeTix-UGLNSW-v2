#!/usr/bin/env node

/**
 * Check if the function exists and what version we have
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

if (!supabaseUrl) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL environment variable is required')
  process.exit(1)
}
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.PROD_SUPABASE_SERVICE_ROLE_KEY

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkFunction() {
  try {
    console.log('🔍 Checking function existence and permissions...');
    
    // Test with service role first
    console.log('\n1. Testing with SERVICE ROLE:');
    const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
    if (authError) throw authError;
    
    const testPayload = {
      authUserId: authData.user.id,
      functionId: 'eebddef5-6833-43e3-8d32-700508b1c089',
      billingDetails: {
        firstName: 'Test',
        lastName: 'User',
        emailAddress: 'test@example.com',
        mobileNumber: '0123456789'
      },
      paymentStatus: 'pending'
    };
    
    const { data: serviceResult, error: serviceError } = await supabase
      .rpc('upsert_individual_registration', {
        p_registration_data: testPayload
      });
    
    if (serviceError) {
      console.error('❌ Service role fails:', serviceError);
    } else {
      console.log('✅ Service role works:', serviceResult);
    }
    
    // Test with anon role
    console.log('\n2. Testing with ANON ROLE:');
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseAnonKey) {
      console.error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable is required')
      return
    }
    const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data: anonAuthData, error: anonAuthError } = await supabaseAnon.auth.signInAnonymously();
    if (anonAuthError) throw anonAuthError;
    
    const anonTestPayload = {
      authUserId: anonAuthData.user.id,
      functionId: 'eebddef5-6833-43e3-8d32-700508b1c089',
      billingDetails: {
        firstName: 'Test',
        lastName: 'User',
        emailAddress: 'test@example.com',
        mobileNumber: '0123456789'
      },
      paymentStatus: 'pending'
    };
    
    const { data: anonResult, error: anonError } = await supabaseAnon
      .rpc('upsert_individual_registration', {
        p_registration_data: anonTestPayload
      });
    
    if (anonError) {
      console.error('❌ Anon role fails:', anonError);
      
      if (anonError.message?.includes('operator does not exist: jsonb ->> jsonb')) {
        console.log('\n💡 ANALYSIS: The function has syntax errors that prevent execution with anon role.');
        console.log('This suggests either:');
        console.log('1. The function update was not applied correctly');
        console.log('2. There are multiple versions of the function');
        console.log('3. The anon role is seeing a different/cached version');
      }
    } else {
      console.log('✅ Anon role works:', anonResult);
    }
    
    console.log('\n🔍 Summary:');
    console.log(`Service Role: ${serviceError ? '❌ FAIL' : '✅ PASS'}`);
    console.log(`Anon Role: ${anonError ? '❌ FAIL' : '✅ PASS'}`);
    
    if (serviceError || anonError) {
      console.log('\n📋 RECOMMENDATION:');
      console.log('The function needs to be updated again. Please run the SQL from:');
      console.log('scripts/FIX_ANON_ROLE_PERMISSIONS.sql');
    }
    
  } catch (error: any) {
    console.error('💥 Check failed:', error.message);
  }
}

checkFunction();