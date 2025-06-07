#!/usr/bin/env node

/**
 * Test the API with a simple payload that matches our working RPC test
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pwwpcjbbxotmiqrisjvf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3d3BjamJieG90bWlxcmlzanZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU1NDg1NjgsImV4cCI6MjA2MTEyNDU2OH0.Ep3pzGlPgXbnTrcE84dIIbBxk-OsnXq7BSwL7vG-p3Q';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSimpleAPIPayload() {
  try {
    console.log('🧪 Testing API with simple payload...');
    
    // Create anonymous session
    const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
    if (authError) throw authError;
    
    console.log('✅ Created anonymous session:', authData.user.id);
    
    // Create simple payload that matches our working RPC test
    const simplePayload = {
      functionId: 'eebddef5-6833-43e3-8d32-700508b1c089',
      customerId: authData.user.id,
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
      tickets: [],
      additionalAttendees: [],
      totalAmount: 0,
      subtotal: 0,
      stripeFee: 0
    };
    
    console.log('📋 Simple payload summary:');
    console.log(`- Function ID: ${simplePayload.functionId}`);
    console.log(`- Customer ID: ${simplePayload.customerId}`);
    console.log(`- Primary Attendee: ${simplePayload.primaryAttendee.firstName} ${simplePayload.primaryAttendee.lastName}`);
    
    console.log('\n🚀 Testing individuals registration API...');
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authData.session.access_token}`
    };
    
    const response = await fetch('http://localhost:3001/api/registrations/individuals', {
      method: 'POST',
      headers,
      body: JSON.stringify(simplePayload)
    });
    
    const result = await response.json();
    
    console.log(`📊 API Response: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      console.error('❌ API Error:', result);
      throw new Error(`API failed: ${result.error || result.message || 'Unknown error'}`);
    }
    
    console.log('✅ API Success with simple payload:', result);
    
    // Now let's verify in database
    if (result.registrationId) {
      console.log('\n🔍 Verifying in database...');
      
      const { data: registration, error: dbError } = await supabase
        .from('comprehensive_registration_view')
        .select('*')
        .eq('registration_id', result.registrationId);
      
      if (dbError) {
        console.error('❌ Database verification failed:', dbError);
      } else if (registration && registration.length > 0) {
        console.log('✅ Registration found in database:', registration[0]);
      } else {
        console.log('⚠️ Registration not found in comprehensive view');
      }
    }
    
    console.log('\n🎉 Simple payload test completed successfully!');
    return result;
    
  } catch (error: any) {
    console.error('\n💥 Simple payload test failed:', error.message);
    return null;
  }
}

testSimpleAPIPayload();