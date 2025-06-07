#!/usr/bin/env node

/**
 * Test the RPC function using the same pattern as the API route
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Use anon key like the API route does
const supabaseUrl = 'https://pwwpcjbbxotmiqrisjvf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3d3BjamJieG90bWlxcmlzanZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU1NDg1NjgsImV4cCI6MjA2MTEyNDU2OH0.Ep3pzGlPgXbnTrcE84dIIbBxk-OsnXq7BSwL7vG-p3Q';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAPIRoutePattern() {
  try {
    console.log('🧪 Testing RPC function using API route pattern...');
    
    // Create anonymous session (like API route does)
    const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
    if (authError) throw authError;
    
    console.log('✅ Created anonymous session:', authData.user.id);
    
    // Load the debug payload
    const payloadPath = path.join(process.cwd(), 'docs/debug-api-payload.json');
    const payloadContent = fs.readFileSync(payloadPath, 'utf-8');
    const debugPayload = JSON.parse(payloadContent);
    
    // Build RPC data like the API route does
    const rpcData = {
      registrationId: crypto.randomUUID(),
      authUserId: authData.user.id,
      functionId: debugPayload.functionId,
      primaryAttendee: debugPayload.primaryAttendee,
      additionalAttendees: debugPayload.additionalAttendees || [],
      tickets: debugPayload.tickets || [],
      billingDetails: debugPayload.billingDetails,
      paymentStatus: 'pending',
      totalAmount: debugPayload.totalAmount || 0,
      subtotal: debugPayload.subtotal || 0,
      stripeFee: debugPayload.stripeFee || 0,
      paymentIntentId: null,
      paymentCompleted: false
    };
    
    console.log('🚀 Calling upsert_individual_registration RPC with anon key...');
    console.log('Registration ID:', rpcData.registrationId);
    console.log('Auth User ID:', rpcData.authUserId);
    console.log('Function ID:', rpcData.functionId);
    
    // Call the RPC function using anon key (like API route)
    const { data: rpcResult, error: rpcError } = await supabase
      .rpc('upsert_individual_registration', {
        p_registration_data: rpcData
      });
    
    if (rpcError) {
      console.error('❌ RPC Error:', rpcError);
      
      if (rpcError.message?.includes('operator does not exist: jsonb ->> jsonb')) {
        console.log('\n🔧 The RPC function still has syntax errors when called with anon key!');
        console.log('This explains why the API route fails even though direct service role calls work.');
        return false;
      }
      
      throw rpcError;
    }
    
    console.log('✅ RPC function works with anon key!', rpcResult);
    return true;
    
  } catch (error: any) {
    console.error('💥 Test failed:', error.message);
    return false;
  }
}

testAPIRoutePattern().then(success => {
  if (success) {
    console.log('\n🎉 RPC function works with anon key - API route should work!');
  } else {
    console.log('\n❌ RPC function fails with anon key - this explains the API route failure.');
    console.log('The fix may not have been applied correctly, or there might be RLS policies blocking it.');
  }
});