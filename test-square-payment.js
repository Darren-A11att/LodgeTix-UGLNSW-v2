#!/usr/bin/env node

/**
 * Test Square Payment Integration
 * Tests the complete payment flow using Square CreatePayment API
 */

const { Client, Environment } = require('square');

// Test card details provided
const TEST_CARD = {
  number: '4111111111111111',
  expiry: '12/26',
  cvv: '111',
  postalCode: '90210'
};

// Square sandbox credentials from .env
const SQUARE_CONFIG = {
  accessToken: 'EAAAl7isRcRWatepwSuzEULplnnOizmUT-W_w7DohjyU1x1PFW-zP9QehROk6yxw',
  applicationId: 'sandbox-sq0idb-yoaKno_APUlTTyLLHjjb5A',
  locationId: 'LH1V1T0V1M6JB',
  environment: Environment.Sandbox
};

async function testSquarePayment() {
  console.log('🟡 Testing Square Payment Integration...\n');

  try {
    // Initialize Square client
    const client = new Client({
      environment: SQUARE_CONFIG.environment,
      accessToken: SQUARE_CONFIG.accessToken,
    });

    // Test 1: Create a test payment using card nonce
    console.log('📋 Test Details:');
    console.log(`Card: ${TEST_CARD.number.slice(0,4)} **** **** ${TEST_CARD.number.slice(-4)}`);
    console.log(`Expiry: ${TEST_CARD.expiry}`);
    console.log(`CVV: ${TEST_CARD.cvv}`);
    console.log(`Postal Code: ${TEST_CARD.postalCode}\n`);

    // Generate a unique idempotency key
    const idempotencyKey = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    console.log('💳 Creating Square payment...');
    
    // Create payment request (using card nonce for testing)
    const paymentRequest = {
      idempotencyKey,
      amountMoney: {
        amount: BigInt(10000), // $100.00 in cents
        currency: 'AUD'
      },
      locationId: SQUARE_CONFIG.locationId,
      sourceId: 'cnon:card-nonce-ok', // Square test card nonce
      referenceId: `test-reg-${Date.now().toString().slice(-8)}`,
      note: 'Test Individual Registration Payment',
      buyerEmailAddress: 'test@example.com',
      billingAddress: {
        addressLine1: '123 Test Street',
        locality: 'Sydney',
        postalCode: TEST_CARD.postalCode,
        country: 'AU',
        firstName: 'Test',
        lastName: 'User'
      },
      customerDetails: {
        customerInitiated: true
      }
    };

    console.log('📤 Payment Request:');
    console.log(JSON.stringify(paymentRequest, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    , 2));
    console.log('');

    // Create the payment
    const { result, statusCode } = await client.paymentsApi.createPayment(paymentRequest);

    console.log('📥 Square API Response:');
    console.log(`Status Code: ${statusCode}`);
    
    if (result.payment) {
      const payment = result.payment;
      console.log(`✅ Payment Created Successfully!`);
      console.log(`Payment ID: ${payment.id}`);
      console.log(`Status: ${payment.status}`);
      console.log(`Amount: $${Number(payment.amountMoney.amount) / 100} ${payment.amountMoney.currency}`);
      console.log(`Created: ${payment.createdAt}`);
      console.log(`Location: ${payment.locationId}`);
      
      if (payment.receiptNumber) {
        console.log(`Receipt Number: ${payment.receiptNumber}`);
      }
      
      if (payment.receiptUrl) {
        console.log(`Receipt URL: ${payment.receiptUrl}`);
      }
      
      console.log('\n🎉 Square payment integration is working correctly!');
      
      // Test the API endpoint
      console.log('\n🔄 Testing local API endpoint...');
      await testLocalAPI(payment.id);
      
    } else {
      console.error('❌ No payment object in response');
      console.log('Full response:', JSON.stringify(result, null, 2));
    }

  } catch (error) {
    console.error('❌ Square Payment Test Failed:');
    
    if (error.result) {
      console.error('Square API Error:', JSON.stringify(error.result, null, 2));
    } else {
      console.error('Error:', error.message);
      console.error('Stack:', error.stack);
    }
  }
}

async function testLocalAPI(paymentId) {
  try {
    const response = await fetch('http://localhost:3001/api/debug-env');
    const data = await response.json();
    
    console.log('✅ Local API is responding');
    console.log(`Payment Gateway: ${data.paymentGateway || 'Not configured'}`);
    
    if (data.square) {
      console.log('Square Configuration:', data.square);
    }
    
  } catch (error) {
    console.log('⚠️  Local API test failed:', error.message);
    console.log('Make sure the development server is running on http://localhost:3001');
  }
}

// Run the test
if (require.main === module) {
  testSquarePayment().then(() => {
    console.log('\n✨ Test completed!');
    process.exit(0);
  }).catch((error) => {
    console.error('\n💥 Test failed:', error);
    process.exit(1);
  });
}

module.exports = { testSquarePayment };