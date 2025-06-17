#!/usr/bin/env node

/**
 * Debug the specific jsonb syntax error
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

if (!supabaseUrl) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL environment variable is required');
  process.exit(1);
}
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugSyntaxError() {
  try {
    console.log('🔍 Checking current RPC function definition...');
    
    // Get the current function definition
    const { data: functions, error: funcError } = await supabase
      .rpc('pg_get_functiondef', { function_oid: 'upsert_individual_registration'::regproc });
    
    if (funcError) {
      console.log('Could not get function definition via pg_get_functiondef, trying alternative...');
      
      // Try to get function info from pg_proc
      const { data: procInfo, error: procError } = await supabase
        .from('pg_proc')
        .select('proname, prosrc')
        .eq('proname', 'upsert_individual_registration');
        
      if (procError) {
        console.error('Could not get function info:', procError);
      } else {
        console.log('Function found in pg_proc:', procInfo);
      }
    } else {
      console.log('Function definition:', functions);
    }
    
    // Try a very simple test to isolate the issue
    console.log('\n🧪 Testing with minimal payload...');
    
    const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
    if (authError) throw authError;
    
    const minimalPayload = {
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
    
    const { data: testResult, error: testError } = await supabase
      .rpc('upsert_individual_registration', {
        p_registration_data: minimalPayload
      });
    
    if (testError) {
      console.error('❌ Even minimal payload fails:', testError);
      
      // Let's check if there are multiple versions of the function
      console.log('\n🔍 Checking for multiple function versions...');
      
      const { data: allFunctions, error: allFuncError } = await supabase
        .rpc('exec', { 
          sql: `
            SELECT 
              proname,
              pronargs,
              proargtypes,
              prosrc,
              prorettype
            FROM pg_proc 
            WHERE proname LIKE '%individual_registration%'
          `
        });
        
      if (allFuncError) {
        console.log('Could not check for multiple functions:', allFuncError);
      } else {
        console.log('All individual registration functions:', allFunctions);
      }
      
    } else {
      console.log('✅ Minimal payload works:', testResult);
    }
    
  } catch (error: any) {
    console.error('💥 Debug failed:', error.message);
  }
}

debugSyntaxError();