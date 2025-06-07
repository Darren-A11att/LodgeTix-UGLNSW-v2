#!/usr/bin/env node

/**
 * Test the function tickets API to debug HTML response issue
 */

const FEATURED_FUNCTION_ID = 'eebddef5-6833-43e3-8d32-700508b1c089';

async function testFunctionTicketsAPI() {
  try {
    console.log('🧪 Testing Function Tickets API');
    console.log('================================');
    
    const url = `http://localhost:3001/api/functions/${FEATURED_FUNCTION_ID}/tickets`;
    console.log(`📡 Testing URL: ${url}`);
    
    const response = await fetch(url);
    console.log(`📊 Response Status: ${response.status} ${response.statusText}`);
    console.log(`📊 Response Headers:`, response.headers.get('content-type'));
    
    const responseText = await response.text();
    console.log(`📊 Response Length: ${responseText.length} characters`);
    
    if (response.status === 200) {
      try {
        const data = JSON.parse(responseText);
        console.log('✅ Valid JSON response');
        console.log(`🎫 Found ${data.tickets?.length || 0} tickets`);
        if (data.tickets?.length > 0) {
          console.log('📋 First ticket:', data.tickets[0]);
        }
      } catch (parseError) {
        console.error('❌ JSON Parse Error:', parseError);
        console.log('📄 Response preview (first 500 chars):');
        console.log(responseText.substring(0, 500));
      }
    } else {
      console.error(`❌ API Error: ${response.status}`);
      console.log('📄 Response preview (first 500 chars):');
      console.log(responseText.substring(0, 500));
    }
    
  } catch (error: any) {
    console.error('💥 Test failed:', error.message);
  }
}

testFunctionTicketsAPI();