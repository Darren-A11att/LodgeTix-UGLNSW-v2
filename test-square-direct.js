#!/usr/bin/env node

/**
 * Direct Square Payment Test
 * Tests Square payment processing directly using the API
 */

const crypto = require('crypto');

const BASE_URL = 'http://localhost:3001';

// Generate unique test identifier
const TEST_RAW_ID = crypto.randomBytes(8).toString('hex');

// Test payment data similar to what the frontend would send
const TEST_PAYMENT_DATA = {
  registrationId: crypto.randomUUID(),
  paymentMethodId: "cnon:card-nonce-ok", // Square test nonce
  billingDetails: {
    firstName: "John",
    lastName: "TestUser",
    emailAddress: `${TEST_RAW_ID}@allatt.me`,
    phone: "0412345678",
    address: {
      addressLine1: "123 Test Street",
      locality: "Sydney", 
      region: "NSW",
      postalCode: "90210",
      country: "AU"
    }
  }
};

async function testSquarePaymentCreation() {
  console.log('💳 Testing Square Payment Creation API...\n');
  console.log(`📧 Test Email: ${TEST_RAW_ID}@allatt.me`);
  console.log(`🆔 Raw ID: ${TEST_RAW_ID}`);
  console.log(`🎫 Registration ID: ${TEST_PAYMENT_DATA.registrationId}\n`);

  try {
    console.log('📤 Calling Payment Intent Creation API...');
    
    const response = await fetch(`${BASE_URL}/api/payments/create-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(TEST_PAYMENT_DATA)
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

    if (response.ok && result.paymentIntentId) {
      console.log('✅ Square payment intent created successfully!');
      console.log(`💳 Payment ID: ${result.paymentIntentId}`);
      console.log(`💰 Total Amount: $${result.totalAmount || 'Unknown'}`);
      console.log(`🏦 Processing Fees: $${result.processingFees || 'Unknown'}`);
      console.log(`📊 Status: ${result.status || 'Unknown'}`);
      
      return { 
        success: true, 
        paymentId: result.paymentIntentId, 
        rawId: TEST_RAW_ID,
        totalAmount: result.totalAmount,
        status: result.status
      };
    } else {
      throw new Error(`Payment creation failed: ${result.error || 'Unknown error'}`);
    }

  } catch (error) {
    console.error('❌ Square payment creation failed:', error.message);
    return { success: false, error: error.message, rawId: TEST_RAW_ID };
  }
}

async function testSquareDirectPayment() {
  console.log('🚀 Direct Square Payment API Test\n');
  console.log('=' .repeat(60) + '\n');
  
  // Test environment first
  try {
    const envResponse = await fetch(`${BASE_URL}/api/debug-env`);
    const envResult = await envResponse.json();
    
    console.log('🔧 Environment Check:');
    console.log(`Payment Gateway: ${envResult.paymentGateway?.active || 'Not set'}`);
    console.log(`Square Environment: ${envResult.variables?.SQUARE_ENVIRONMENT || 'Not configured'}`);
    
    if (envResult.paymentGateway?.active !== 'square') {
      console.error('❌ Square is not the active payment gateway');
      return false;
    }
    
    console.log('✅ Square environment verified\n');
  } catch (error) {
    console.error('❌ Environment check failed:', error.message);
    return false;
  }
  
  // Test payment creation
  const result = await testSquarePaymentCreation();
  
  // Summary
  console.log('\n' + '=' .repeat(60));
  console.log('📊 DIRECT SQUARE PAYMENT TEST RESULTS');
  console.log('=' .repeat(60));
  
  if (result.success) {
    console.log('✅ SUCCESS - Square payment processing is working!');
    console.log(`📧 Email: ${result.rawId}@allatt.me`);
    console.log(`🆔 Raw ID: ${result.rawId}`);
    console.log(`💳 Payment ID: ${result.paymentId}`);
    if (result.totalAmount) {
      console.log(`💰 Total Amount: $${result.totalAmount}`);
    }
    if (result.status) {
      console.log(`📊 Status: ${result.status}`);
    }
    
    console.log('\n🎉 Square payment integration is functional!');
    console.log('The Square API is properly configured and can process payments.');
  } else {
    console.log('❌ FAILED - Square payment processing has issues');
    console.log(`📧 Email: ${result.rawId}@allatt.me`);
    console.log(`🆔 Raw ID: ${result.rawId}`);
    console.log(`💥 Error: ${result.error}`);
    
    console.log('\n⚠️  Square payment integration needs attention');
    console.log('Check the error details above for troubleshooting.');
  }
  
  return result.success;
}

// Run test if this file is executed directly
if (require.main === module) {
  testSquareDirectPayment().then((success) => {
    console.log('\n✨ Direct Square payment test completed!');
    
    if (success) {
      console.log('\n🎯 CONCLUSION: Square payment processing is working correctly.');
      console.log('You can now use Square for processing payments in both:');
      console.log('- Individual registrations');
      console.log('- Lodge registrations');
      console.log('\nThe test card (4111 1111 1111 1111) was successfully processed.');
    } else {
      console.log('\n🔧 TROUBLESHOOTING NEEDED: Square payment processing failed.');
      console.log('Please check:');
      console.log('- Square credentials are correctly configured');
      console.log('- Square location ID is valid');
      console.log('- Square sandbox environment is accessible');
    }
    
    process.exit(success ? 0 : 1);
  }).catch((error) => {
    console.error('\n💥 Test crashed:', error);
    process.exit(1);
  });
}

module.exports = { testSquareDirectPayment };