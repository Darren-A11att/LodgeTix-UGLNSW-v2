#!/usr/bin/env node

/**
 * Test Pay Now API Calls
 * Simulates the "Pay Now" button click by calling the registration APIs directly
 */

const crypto = require('crypto');

// Test card details provided
const TEST_CARD = {
  number: '4111111111111111',
  expiry: '12/26',
  cvv: '111',
  postalCode: '90210'
};

const BASE_URL = 'http://localhost:3001';
const FUNCTION_ID = 'eebddef5-6833-43e3-8d32-700508b1c089';
const PACKAGE_ID = '794841e4-5f04-4899-96e2-c0afece4d5f2'; // From CSV data

// Generate unique test identifiers
const INDIVIDUAL_RAW_ID = crypto.randomBytes(8).toString('hex');
const LODGE_RAW_ID = crypto.randomBytes(8).toString('hex');

// Individual registration test data based on actual API expectations
const INDIVIDUAL_TEST_DATA = {
  attendees: [{
    firstName: "John",
    lastName: "TestUser",
    email: `${INDIVIDUAL_RAW_ID}@allatt.me`,
    phoneNumber: "0412345678",
    attendeeType: "mason",
    dietaryRequirements: "",
    accessibilityRequirements: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    isPrimary: true,
    lodgeName: "Lodge Canoblas Lewis No. 806",
    lodgeNumber: "806",
    grandLodge: "United Grand Lodge of NSW & ACT"
  }],
  selectedTickets: [{
    eventTicketId: "7196514b-d4b8-4fe0-93ac-deb4c205dd09",
    quantity: 1
  }],
  bookingContact: {
    email: `${INDIVIDUAL_RAW_ID}@allatt.me`,
    firstName: "John",
    lastName: "TestUser",
    mobile: "0412345678",
    addressLine1: "123 Test Street",
    suburb: "Sydney",
    postcode: "2000",
    stateTerritory: "New South Wales",
    country: "AU"
  },
  paymentMethodId: "cnon:card-nonce-ok", // Square test nonce - renamed to match API
  totalAmount: 21.67, // Based on CSV data
  subtotal: 20.00,
  squareFee: 1.67
};

// Lodge registration test data based on API expectations
const LODGE_TEST_DATA = {
  tableCount: 1,
  bookingContact: {
    email: `${LODGE_RAW_ID}@allatt.me`,
    firstName: "Jane",
    lastName: "TestSecretary",
    mobile: "0412345679",
    rank: "IM",
    title: "W Bro",
    country: "Australia"
  },
  lodgeDetails: {
    lodgeName: "Test Lodge No. 999",
    lodgeNumber: "999",
    grandLodgeName: "United Grand Lodge of NSW & ACT"
  },
  paymentMethodId: "cnon:card-nonce-ok", // Square test nonce
  amount: 119054, // $1190.54 in cents (1 table)
  subtotal: 115000, // $1150.00 in cents  
  squareFee: 2054, // Square fee in cents
  billingDetails: {
    firstName: "Jane",
    lastName: "TestSecretary",
    emailAddress: `${LODGE_RAW_ID}@allatt.me`,
    phone: "0412345679",
    addressLine1: "Test Lodge No. 999",
    locality: "Sydney",
    postalCode: "2000",
    country: "AU"
  }
};

async function createAnonymousAuth() {
  try {
    console.log('🔐 Creating anonymous authentication...');
    const response = await fetch(`${BASE_URL}/api/verify-turnstile-and-anon-auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        turnstileToken: 'dummy-test-token'
      })
    });

    if (response.ok) {
      // Extract auth cookie from Set-Cookie header
      const setCookie = response.headers.get('set-cookie');
      if (setCookie) {
        console.log('✅ Anonymous auth created');
        return setCookie;
      }
    }
    
    console.log('⚠️  Anonymous auth not available, proceeding without auth');
    return null;
  } catch (error) {
    console.log('⚠️  Anonymous auth failed, proceeding without auth');
    return null;
  }
}

async function testIndividualPayNow() {
  console.log('🧑 Testing Individual Registration API...\n');
  console.log(`📧 Test Email: ${INDIVIDUAL_RAW_ID}@allatt.me`);
  console.log(`🆔 Raw ID: ${INDIVIDUAL_RAW_ID}\n`);

  try {
    // Try to get authentication cookie
    const authCookie = await createAnonymousAuth();
    
    console.log('📤 Calling Individual Registration API...');
    
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (authCookie) {
      headers['Cookie'] = authCookie;
    }
    
    const response = await fetch(`${BASE_URL}/api/functions/${FUNCTION_ID}/individual-registration`, {
      method: 'POST',
      headers,
      body: JSON.stringify(INDIVIDUAL_TEST_DATA)
    });

    const responseText = await response.text();
    console.log(`📥 Response Status: ${response.status}`);
    console.log(`📄 Response Headers:`, Object.fromEntries(response.headers.entries()));
    
    let result;
    try {
      result = JSON.parse(responseText);
      console.log('📋 Response Body:', JSON.stringify(result, null, 2));
    } catch (parseError) {
      console.log('📋 Raw Response Body:', responseText);
      throw new Error(`Failed to parse JSON response: ${parseError.message}`);
    }

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} - ${result.error || 'Unknown error'}`);
    }

    if (result.success && result.registrationId) {
      console.log('✅ Individual registration successful!');
      console.log(`🆔 Registration ID: ${result.registrationId}`);
      if (result.confirmationNumber) {
        console.log(`🎫 Confirmation Number: ${result.confirmationNumber}`);
      }
      if (result.paymentId) {
        console.log(`💳 Square Payment ID: ${result.paymentId}`);
      }
      return { success: true, ...result, rawId: INDIVIDUAL_RAW_ID };
    } else {
      throw new Error('Registration failed: ' + (result.error || 'Unknown error'));
    }

  } catch (error) {
    console.error('❌ Individual registration failed:', error.message);
    return { success: false, error: error.message, rawId: INDIVIDUAL_RAW_ID };
  }
}

async function testLodgePayNow() {
  console.log('🏛️ Testing Lodge Registration API...\n');
  console.log(`📧 Test Email: ${LODGE_RAW_ID}@allatt.me`);
  console.log(`🆔 Raw ID: ${LODGE_RAW_ID}\n`);

  try {
    console.log('📤 Calling Lodge Registration API...');
    
    const response = await fetch(`${BASE_URL}/api/functions/${FUNCTION_ID}/packages/${PACKAGE_ID}/lodge-registration`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(LODGE_TEST_DATA)
    });

    const responseText = await response.text();
    console.log(`📥 Response Status: ${response.status}`);
    console.log(`📄 Response Headers:`, Object.fromEntries(response.headers.entries()));
    
    let result;
    try {
      result = JSON.parse(responseText);
      console.log('📋 Response Body:', JSON.stringify(result, null, 2));
    } catch (parseError) {
      console.log('📋 Raw Response Body:', responseText);
      throw new Error(`Failed to parse JSON response: ${parseError.message}`);
    }

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} - ${result.error || 'Unknown error'}`);
    }

    if (result.success && result.registrationId) {
      console.log('✅ Lodge registration successful!');
      console.log(`🆔 Registration ID: ${result.registrationId}`);
      if (result.confirmationNumber) {
        console.log(`🎫 Confirmation Number: ${result.confirmationNumber}`);
      }
      if (result.paymentId) {
        console.log(`💳 Square Payment ID: ${result.paymentId}`);
      }
      return { success: true, ...result, rawId: LODGE_RAW_ID };
    } else {
      throw new Error('Registration failed: ' + (result.error || 'Unknown error'));
    }

  } catch (error) {
    console.error('❌ Lodge registration failed:', error.message);
    return { success: false, error: error.message, rawId: LODGE_RAW_ID };
  }
}

async function testSquareConnection() {
  console.log('🔧 Testing Square Configuration...\n');
  
  try {
    const response = await fetch(`${BASE_URL}/api/debug-env`);
    const result = await response.json();
    
    console.log('📊 Environment Status:');
    console.log(`Payment Gateway: ${result.paymentGateway?.active || 'Not set'}`);
    console.log(`Square Environment: ${result.variables?.SQUARE_ENVIRONMENT || 'Not configured'}`);
    console.log(`Square Application ID: ${result.variables?.NEXT_PUBLIC_SQUARE_APPLICATION_ID ? 'Configured' : 'Missing'}`);
    console.log(`Square Location ID: ${result.variables?.SQUARE_LOCATION_ID ? 'Configured' : 'Missing'}`);
    
    return result.paymentGateway?.active === 'square';
  } catch (error) {
    console.error('❌ Environment check failed:', error.message);
    return false;
  }
}

async function runPayNowTests() {
  console.log('🚀 Starting Square Pay Now API Tests\n');
  console.log('=' .repeat(70) + '\n');
  
  // Test Square configuration first
  const isSquareConfigured = await testSquareConnection();
  
  if (!isSquareConfigured) {
    console.error('❌ Square is not properly configured. Aborting tests.');
    process.exit(1);
  }
  
  console.log('✅ Square configuration verified\n');
  console.log('=' .repeat(70) + '\n');
  
  const results = {
    individual: null,
    lodge: null
  };
  
  try {
    // Test Individual Registration
    results.individual = await testIndividualPayNow();
    
    console.log('\n' + '=' .repeat(70) + '\n');
    
    // Test Lodge Registration
    results.lodge = await testLodgePayNow();
    
  } catch (error) {
    console.error('💥 Test suite failed:', error);
  }
  
  // Summary
  console.log('\n' + '=' .repeat(70));
  console.log('📊 PAY NOW API TEST RESULTS');
  console.log('=' .repeat(70));
  
  console.log('\n🧑 Individual Registration:');
  if (results.individual?.success) {
    console.log(`  ✅ SUCCESS`);
    console.log(`  📧 Email: ${results.individual.rawId}@allatt.me`);
    console.log(`  🆔 Raw ID: ${results.individual.rawId}`);
    console.log(`  📝 Registration ID: ${results.individual.registrationId}`);
    if (results.individual.confirmationNumber) {
      console.log(`  🎫 Confirmation: ${results.individual.confirmationNumber}`);
    }
    if (results.individual.paymentId) {
      console.log(`  💳 Square Payment ID: ${results.individual.paymentId}`);
    }
  } else {
    console.log(`  ❌ FAILED: ${results.individual?.error || 'Unknown error'}`);
    console.log(`  📧 Email: ${results.individual?.rawId}@allatt.me`);
  }
  
  console.log('\n🏛️ Lodge Registration:');
  if (results.lodge?.success) {
    console.log(`  ✅ SUCCESS`);
    console.log(`  📧 Email: ${results.lodge.rawId}@allatt.me`);
    console.log(`  🆔 Raw ID: ${results.lodge.rawId}`);
    console.log(`  📝 Registration ID: ${results.lodge.registrationId}`);
    if (results.lodge.confirmationNumber) {
      console.log(`  🎫 Confirmation: ${results.lodge.confirmationNumber}`);
    }
    if (results.lodge.paymentId) {
      console.log(`  💳 Square Payment ID: ${results.lodge.paymentId}`);
    }
  } else {
    console.log(`  ❌ FAILED: ${results.lodge?.error || 'Unknown error'}`);
    console.log(`  📧 Email: ${results.lodge?.rawId}@allatt.me`);
  }
  
  const successCount = (results.individual?.success ? 1 : 0) + (results.lodge?.success ? 1 : 0);
  console.log(`\n🎯 Overall: ${successCount}/2 tests passed`);
  
  if (successCount === 2) {
    console.log('🎉 All Square Pay Now API tests passed!');
    console.log('\nSquare payment integration is working correctly for both:');
    console.log('- Individual registrations');
    console.log('- Lodge registrations');
  } else {
    console.log('⚠️  Some tests failed. Check the error details above.');
  }
  
  return successCount === 2;
}

// Run tests if this file is executed directly
if (require.main === module) {
  runPayNowTests().then((success) => {
    console.log('\n✨ Pay Now API test suite completed!');
    process.exit(success ? 0 : 1);
  }).catch((error) => {
    console.error('\n💥 Test suite crashed:', error);
    process.exit(1);
  });
}

module.exports = { testIndividualPayNow, testLodgePayNow, runPayNowTests };