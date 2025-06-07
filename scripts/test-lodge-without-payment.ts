#!/usr/bin/env tsx

// Test lodge registration without payment to isolate database issues

async function testLodgeWithoutPayment() {
  const baseUrl = 'http://localhost:3001';
  const endpoint = '/api/functions/eebddef5-6833-43e3-8d32-700508b1c089/packages/794841e4-5f04-4899-96e2-c0afece4d5f2/lodge-registration';
  
  // Test payload without payment method
  const testPayload = {
    "tableCount": 1,
    "bookingContact": {
      "firstName": "Test",
      "lastName": "Test",
      "email": "darren@allatt.me",
      "mobile": "0438 871 124",
      "addressLine1": "123 Test Street",
      "city": "Sydney",
      "state": "NSW",
      "postcode": "2000",
      "country": "Australia",
      "title": "Bro",
      "rank": "EAF"
    },
    "lodgeDetails": {
      "lodgeName": "The Leichhardt Lodge No. 133",
      "lodgeId": "4c1479ba-cbaa-2072-f77a-87882c81f1be"
    },
    // Remove paymentMethodId to skip payment processing
    "amount": 117019,
    "subtotal": 115000,
    "stripeFee": 2019,
    "billingDetails": {
      "title": "",
      "firstName": "Test",
      "lastName": "Test",
      "emailAddress": "darren@allatt.me",
      "mobileNumber": "0438 871 124",
      "phone": "0438 871 124",
      "addressLine1": "The Leichhardt Lodge No. 133",
      "suburb": "Sydney",
      "stateTerritory": {
        "name": "NSW"
      },
      "postcode": "2000",
      "country": {
        "isoCode": "AU"
      },
      "businessName": "The Leichhardt Lodge No. 133"
    }
  };

  console.log('🧪 Testing lodge registration WITHOUT payment');
  console.log('🎯 Endpoint:', `${baseUrl}${endpoint}`);
  console.log('📋 Payload:', JSON.stringify(testPayload, null, 2));

  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload)
    });

    const data = await response.json();
    const statusCode = response.status;

    console.log(`📊 Status: ${statusCode}`);
    console.log('📋 Response:', JSON.stringify(data, null, 2));

    if (response.ok && data.success) {
      console.log('🎉 SUCCESS! Lodge registration without payment worked!');
      console.log('✅ This confirms the enum error is fixed');
      console.log(`✅ Registration ID: ${data.registrationId}`);
      return true;
    } else {
      console.log('❌ Registration failed');
      if (data.error && data.error.includes('enum')) {
        console.log('🔍 ENUM ERROR STILL EXISTS:', data.error);
      } else {
        console.log('🔍 Different error (not enum):', data.error);
      }
      return false;
    }

  } catch (error: any) {
    console.log('❌ Network error:', error.message);
    return false;
  }
}

testLodgeWithoutPayment()
  .then(success => {
    if (success) {
      console.log('\n🎉 CONCLUSION: Lodge registration works without payment!');
      console.log('📋 The enum error has been successfully fixed.');
      console.log('📋 The only remaining issue is Stripe payment method reuse.');
    } else {
      console.log('\n❌ CONCLUSION: There are still issues to fix.');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Test crashed:', error);
    process.exit(1);
  });