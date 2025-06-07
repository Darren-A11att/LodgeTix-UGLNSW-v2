#!/usr/bin/env tsx

/**
 * Test the complete flow including processing fee calculation
 */

import { calculateStripeFees } from '@/lib/utils/stripe-fee-calculator';

function simulateCompleteFlow(ticketSubtotal: number, platformFeePercentage: number = 0.05) {
  console.log('🔄 COMPLETE FLOW SIMULATION');
  console.log('===========================');
  console.log(`Ticket subtotal: $${ticketSubtotal.toFixed(2)}`);
  console.log(`Platform fee percentage: ${(platformFeePercentage * 100).toFixed(2)}%`);
  console.log('');
  
  // Step 1: Calculate what customer pays (including Stripe processing fee)
  const stripeCalculation = calculateStripeFees(ticketSubtotal, {
    isDomestic: true,
    feeMode: 'pass_to_customer',
    platformFeePercentage: 0 // Calculate platform fee separately
  });
  
  console.log('STEP 1 - Calculate customer payment:');
  console.log(`  Subtotal: $${stripeCalculation.subtotal.toFixed(2)}`);
  console.log(`  Stripe processing fee: $${stripeCalculation.stripeFee.toFixed(2)}`);
  console.log(`  Customer pays: $${stripeCalculation.total.toFixed(2)}`);
  console.log('');
  
  // Step 2: Calculate platform fee (this is where the confusion might be)
  const customerPaymentAmount = stripeCalculation.total;
  
  // Method A: Platform fee on subtotal (what your code might be doing)
  const platformFeeOnSubtotal = ticketSubtotal * platformFeePercentage;
  
  // Method B: Platform fee on customer payment amount 
  const platformFeeOnCustomerPayment = customerPaymentAmount * platformFeePercentage;
  
  console.log('STEP 2 - Platform fee calculation methods:');
  console.log(`  Method A - Platform fee on subtotal ($${ticketSubtotal}): $${platformFeeOnSubtotal.toFixed(2)}`);
  console.log(`  Method B - Platform fee on customer payment ($${customerPaymentAmount}): $${platformFeeOnCustomerPayment.toFixed(2)}`);
  console.log('');
  
  // Step 3: What connected account receives
  const connectedReceivesMethodA = customerPaymentAmount - stripeCalculation.stripeFee - platformFeeOnSubtotal;
  const connectedReceivesMethodB = customerPaymentAmount - stripeCalculation.stripeFee - platformFeeOnCustomerPayment;
  
  console.log('STEP 3 - Connected account receives:');
  console.log(`  Method A: $${connectedReceivesMethodA.toFixed(2)}`);
  console.log(`  Method B: $${connectedReceivesMethodB.toFixed(2)}`);
  console.log('');
  
  return {
    customerPays: customerPaymentAmount,
    stripeFee: stripeCalculation.stripeFee,
    methodA: {
      platformFee: platformFeeOnSubtotal,
      connectedReceives: connectedReceivesMethodA
    },
    methodB: {
      platformFee: platformFeeOnCustomerPayment,
      connectedReceives: connectedReceivesMethodB
    }
  };
}

// Test with real transaction
const realData = {
  customerPaid: 1170.19,
  platformFee: 38.31,
  connectedReceived: 1111.68,
  ticketSubtotal: 1150.00
};

console.log('Testing with $1150 ticket and different platform fee percentages:\n');

// Test with 5%
const result5pct = simulateCompleteFlow(1150, 0.05);

console.log('='.repeat(50) + '\n');

// Test with 3.33%
const result333pct = simulateCompleteFlow(1150, 0.0333);

console.log('='.repeat(50) + '\n');

// Now let's figure out what percentage gives us the exact platform fee
// If platform fee is calculated on subtotal: 38.31 / 1150 = 3.331%
// If platform fee is calculated on customer payment: 38.31 / 1170.19 = 3.273%

const percentageForSubtotal = realData.platformFee / realData.ticketSubtotal;
const percentageForCustomerPayment = realData.platformFee / realData.customerPaid;

console.log(`Required percentage if calculated on subtotal: ${(percentageForSubtotal * 100).toFixed(3)}%`);
console.log(`Required percentage if calculated on customer payment: ${(percentageForCustomerPayment * 100).toFixed(3)}%`);
console.log('');

const resultExactSubtotal = simulateCompleteFlow(1150, percentageForSubtotal);
const resultExactCustomer = simulateCompleteFlow(1150, percentageForCustomerPayment);

console.log('='.repeat(50) + '\n');

// Final comparison
console.log('📊 FINAL COMPARISON WITH REAL TRANSACTION');
console.log('=========================================');
console.log(`Real: Customer paid $${realData.customerPaid}, Platform fee $${realData.platformFee}, Connected received $${realData.connectedReceived}`);
console.log('');

function compareResults(label: string, result: any, method: 'A' | 'B') {
  const methodData = method === 'A' ? result.methodA : result.methodB;
  
  const customerDiff = Math.abs(result.customerPays - realData.customerPaid);
  const platformDiff = Math.abs(methodData.platformFee - realData.platformFee);
  const connectedDiff = Math.abs(methodData.connectedReceives - realData.connectedReceived);
  
  console.log(`${label} (Method ${method}):`);
  console.log(`  Customer pays: $${result.customerPays.toFixed(2)} (diff: $${customerDiff.toFixed(2)})`);
  console.log(`  Platform fee: $${methodData.platformFee.toFixed(2)} (diff: $${platformDiff.toFixed(2)})`);
  console.log(`  Connected receives: $${methodData.connectedReceives.toFixed(2)} (diff: $${connectedDiff.toFixed(2)})`);
  
  const isExactMatch = customerDiff < 0.01 && platformDiff < 0.01 && connectedDiff < 0.01;
  const isCloseMatch = customerDiff < 0.50 && platformDiff < 0.50 && connectedDiff < 0.50;
  
  if (isExactMatch) {
    console.log(`  ✅ EXACT MATCH!`);
  } else if (isCloseMatch) {
    console.log(`  🟡 Close match`);
  } else {
    console.log(`  ❌ No match`);
  }
  console.log('');
}

compareResults('Exact subtotal percentage', resultExactSubtotal, 'A');
compareResults('Exact customer payment percentage', resultExactCustomer, 'B');

// Test environment default (5%)
const envDefault = simulateCompleteFlow(1150, 0.05);
compareResults('Environment default (5%)', envDefault, 'A');