#!/usr/bin/env node

/**
 * Direct RPC Test Script for Individual Registration
 * 
 * Tests the upsert_individual_registration RPC function directly
 * without creating new users, using service role access.
 */

const https = require('https');
const crypto = require('crypto');

// Simple UUID v4 generator
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Configuration - using anon key to test RPC directly
const SUPABASE_URL = 'https://pwwpcjbbxotmiqrisjvf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3d3BjamJieG90bWlxcmlzanZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU1NDg1NjgsImV4cCI6MjA2MTEyNDU2OH0.Ep3pzGlPgXbnTrcE84dIIbBxk-OsnXq7BSwL7vG-p3Q';

// Use an existing test user ID (from the original payload)
const TEST_USER_ID = '7e9a6303-0a11-4876-bfdb-f1c245995029';

function generateMinimalTestPayload() {
  // Use EXACT payload from user's error report
  return {
    "registrationId": null,
    "functionId": "eebddef5-6833-43e3-8d32-700508b1c089",
    "eventId": "e842bdb2-aff8-46d8-a347-bf50840fff13",
    "eventTitle": "Meet & Greet Cocktail Party",
    "registrationType": "individuals",
    "primaryAttendee": {
      "attendeeId": "01974831-7b99-71bd-b12a-0456dc127d5f",
      "attendeeType": "mason",
      "isPrimary": true,
      "isPartner": null,
      "title": "W Bro",
      "firstName": "1221pm",
      "lastName": "Sat7June",
      "lodgeNameNumber": "The Leichhardt Lodge No. 133",
      "primaryEmail": "1221pmsat7june@allatt.me",
      "primaryPhone": "0438 871 124",
      "dietaryRequirements": "",
      "specialNeeds": "",
      "contactPreference": "Directly",
      "contactConfirmed": false,
      "isCheckedIn": false,
      "firstTime": false,
      "rank": "GL",
      "postNominals": "",
      "grand_lodge_id": "3e893fa6-2cc2-448c-be9c-e3858cc90e11",
      "lodge_id": "4c1479ba-cbaa-2072-f77a-87882c81f1be",
      "tableAssignment": null,
      "notes": "",
      "paymentStatus": "pending",
      "relationship": "",
      "partner": null,
      "partnerOf": null,
      "guestOfId": null,
      "updatedAt": "2025-06-07T02:22:13.093Z",
      "suffix": "PSGW",
      "grandOfficerStatus": "Present",
      "presentGrandOfficerRole": "Grand Director of Ceremonies",
      "otherGrandOfficerRole": "",
      "grandLodgeOrganisationId": "3e893fa6-2cc2-448c-be9c-e3858cc90e11",
      "lodgeOrganisationId": "4c1479ba-cbaa-2072-f77a-87882c81f1be"
    },
    "additionalAttendees": [],
    "tickets": [
      {
        "id": "01974831-7b99-71bd-b12a-0456dc127d5f-d586ecc1-e410-4ef3-a59c-4a53a866bc33",
        "attendeeId": "01974831-7b99-71bd-b12a-0456dc127d5f",
        "eventTicketId": "d586ecc1-e410-4ef3-a59c-4a53a866bc33",
        "isPackage": false,
        "price": 0
      },
      {
        "id": "01974831-7b99-71bd-b12a-0456dc127d5f-7196514b-d4b8-4fe0-93ac-deb4c205dd09",
        "attendeeId": "01974831-7b99-71bd-b12a-0456dc127d5f",
        "eventTicketId": "7196514b-d4b8-4fe0-93ac-deb4c205dd09",
        "isPackage": false,
        "price": 0
      }
    ],
    "totalAmount": 0,
    "subtotal": 0,
    "stripeFee": 0,
    "paymentIntentId": null,
    "billingDetails": {
      "billToPrimary": true,
      "firstName": "1221pm",
      "lastName": "Sat7June",
      "emailAddress": "1221pmsat7june@allatt.me",
      "mobileNumber": "0438 871 124",
      "addressLine1": "100 Harris Street",
      "businessName": "",
      "suburb": "Chiswick",
      "postcode": "2046",
      "stateTerritory": {
        "id": 3909,
        "name": "New South Wales",
        "isoCode": "NSW",
        "countryCode": "AU"
      },
      "country": {
        "name": "Australia",
        "isoCode": "AU",
        "id": 14
      }
    },
    "agreeToTerms": true,
    "billToPrimaryAttendee": false,
    "authUserId": "7e9a6303-0a11-4876-bfdb-f1c245995029",
    "paymentCompleted": false
  };
}

// Test the RPC function directly
function testRPCFunction(payload) {
  return new Promise((resolve, reject) => {
    const rpcPayload = {
      p_registration_data: payload
    };
    
    const data = JSON.stringify(rpcPayload);
    
    const options = {
      hostname: 'pwwpcjbbxotmiqrisjvf.supabase.co',
      port: 443,
      path: '/rest/v1/rpc/upsert_individual_registration',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Prefer': 'return=representation'
      }
    };

    console.log('🔍 Testing RPC function with payload...');
    console.log('📦 Registration ID:', payload.registrationId);
    console.log('📦 Function ID:', payload.functionId);
    console.log('📦 User ID:', payload.authUserId);
    console.log('📦 Tickets:', payload.tickets.length);

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        try {
          const result = JSON.parse(responseData);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: result,
            rawResponse: responseData
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: responseData,
            parseError: error.message,
            rawResponse: responseData
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

// Analyze the response for specific errors
function analyzeResponse(response) {
  console.log('\n📊 RESPONSE ANALYSIS:');
  console.log('='.repeat(50));
  console.log('Status Code:', response.statusCode);
  
  if (response.parseError) {
    console.log('❌ JSON Parse Error:', response.parseError);
    console.log('Raw Response:', response.rawResponse);
    return;
  }
  
  console.log('Response Data:', JSON.stringify(response.data, null, 2));
  
  // Check for specific error patterns
  const responseStr = JSON.stringify(response.data);
  
  if (responseStr.includes('null value in column "event_id"') && responseStr.includes('violates not-null constraint')) {
    console.log('\n🎯 IDENTIFIED ISSUE: event_id is null in tickets table');
    console.log('💡 SOLUTION: Need to lookup event_id from event_tickets table using eventTicketId');
    console.log('💡 ACTION NEEDED: Update RPC function to resolve event_id from eventTicketId before inserting tickets');
    return 'EVENT_ID_NULL_ERROR';
  }
  
  if (responseStr.includes('ticket_status') && responseStr.includes('does not exist')) {
    console.log('\n🎯 IDENTIFIED ISSUE: ticket_status enum error');
    console.log('💡 SOLUTION: The RPC function is trying to cast to ticket_status enum which doesn\'t exist');
    console.log('💡 ACTION NEEDED: Remove ::ticket_status casts from the upsert_individual_registration function');
    return 'TICKET_STATUS_ENUM_ERROR';
  }
  
  if (responseStr.includes('column') && responseStr.includes('does not exist')) {
    console.log('\n🎯 IDENTIFIED ISSUE: Missing database column');
    console.log('💡 SOLUTION: Add missing column or update field mapping');
    return 'MISSING_COLUMN_ERROR';
  }
  
  if (response.statusCode === 200 && response.data) {
    console.log('\n✅ SUCCESS: RPC function executed successfully');
    return 'SUCCESS';
  }
  
  if (response.statusCode >= 400) {
    console.log('\n❌ HTTP ERROR:', response.statusCode);
    return 'HTTP_ERROR';
  }
  
  return 'UNKNOWN_ERROR';
}

// Main test function
async function runDirectTest() {
  console.log('🚀 Starting Direct RPC Test');
  console.log('============================\n');
  
  try {
    // Generate test payload
    const payload = generateMinimalTestPayload();
    
    // Test the RPC function
    const response = await testRPCFunction(payload);
    
    // Analyze the response
    const errorType = analyzeResponse(response);
    
    if (errorType === 'SUCCESS') {
      console.log('\n🎉 TEST PASSED! ✅');
      console.log('The individual registration RPC function is working correctly.');
      return 'OK';
    } else {
      console.log(`\n❌ TEST FAILED with error type: ${errorType}`);
      
      // Return specific error information for fixing
      return {
        result: 'FAIL',
        errorType: errorType,
        response: response
      };
    }
    
  } catch (error) {
    console.error('💥 Test failed with exception:', error.message);
    return {
      result: 'FAIL',
      errorType: 'EXCEPTION',
      error: error.message
    };
  }
}

// Run the test
if (require.main === module) {
  runDirectTest()
    .then(result => {
      if (typeof result === 'string' && result === 'OK') {
        console.log('\n🏁 Final Result: SUCCESS ✅');
        process.exit(0);
      } else {
        console.log('\n🏁 Final Result: FAILED ❌');
        console.log('Error Details:', JSON.stringify(result, null, 2));
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 Test script crashed:', error);
      process.exit(1);
    });
}

module.exports = {
  generateMinimalTestPayload,
  testRPCFunction,
  analyzeResponse,
  runDirectTest
};