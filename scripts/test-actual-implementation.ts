#!/usr/bin/env tsx

/**
 * Test the actual implementation to see what's happening
 */

// Simulate the actual payment intent creation calculation
function simulatePaymentIntentCreation(subtotal: number, platformFeePercentage: number = 0.05) {
  console.log('🔧 SIMULATING ACTUAL PAYMENT INTENT CREATION');
  console.log('==============================================');
  
  console.log(`Input subtotal: $${subtotal.toFixed(2)}`);
  console.log(`Platform fee percentage: ${(platformFeePercentage * 100).toFixed(1)}%`);
  console.log('');
  
  // Step 1: Calculate total amount in cents (what customer pays)
  const amountInCents = Math.round(subtotal * 100); // Convert to cents
  console.log(`Amount in cents: ${amountInCents} cents`);
  
  // Step 2: Calculate application fee (what your payment intent code does)
  const applicationFeeAmount = Math.round(amountInCents * platformFeePercentage);
  console.log(`Application fee amount: ${applicationFeeAmount} cents ($${(applicationFeeAmount / 100).toFixed(2)})`);
  
  // Step 3: What happens in Stripe
  const customerPaysInCents = amountInCents;
  const stripeFeeInCents = Math.round(amountInCents * 0.017) + 30; // 1.7% + 30 cents
  const connectedAccountReceivesInCents = customerPaysInCents - stripeFeeInCents - applicationFeeAmount;
  
  console.log('');
  console.log('STRIPE PROCESSING:');
  console.log(`Customer pays: ${customerPaysInCents} cents ($${(customerPaysInCents / 100).toFixed(2)})`);
  console.log(`Stripe fee: ${stripeFeeInCents} cents ($${(stripeFeeInCents / 100).toFixed(2)})`);
  console.log(`Platform fee: ${applicationFeeAmount} cents ($${(applicationFeeAmount / 100).toFixed(2)})`);
  console.log(`Connected account receives: ${connectedAccountReceivesInCents} cents ($${(connectedAccountReceivesInCents / 100).toFixed(2)})`);
  
  return {
    customerPays: customerPaysInCents / 100,
    stripeFee: stripeFeeInCents / 100,
    platformFee: applicationFeeAmount / 100,
    connectedAccountReceives: connectedAccountReceivesInCents / 100
  };
}

// Test with real transaction amount
console.log('Testing with $1150 subtotal and different platform fee percentages:\n');

// Test with 5% (environment default)
const result5pct = simulatePaymentIntentCreation(1150, 0.05);

console.log('\n' + '='.repeat(50) + '\n');

// Test with ~3.33% to match real transaction
const result333pct = simulatePaymentIntentCreation(1150, 0.0333);

console.log('\n' + '='.repeat(50) + '\n');

// What percentage would give us exactly $38.31?
const targetPlatformFee = 38.31;
const requiredPercentage = targetPlatformFee / 1150;
console.log(`Required percentage for $${targetPlatformFee} platform fee: ${(requiredPercentage * 100).toFixed(3)}%`);

const resultExact = simulatePaymentIntentCreation(1150, requiredPercentage);

console.log('\n' + '='.repeat(50) + '\n');

// Summary comparison
console.log('📊 SUMMARY COMPARISON');
console.log('===================');
console.log('Real transaction:');
console.log(`  Customer paid: $1170.19`);
console.log(`  Platform fee: $38.31`);
console.log(`  Connected received: $1111.68`);
console.log('');

console.log('5% platform fee simulation:');
console.log(`  Customer pays: $${result5pct.customerPays.toFixed(2)}`);
console.log(`  Platform fee: $${result5pct.platformFee.toFixed(2)}`);
console.log(`  Connected receives: $${result5pct.connectedAccountReceives.toFixed(2)}`);
console.log('');

console.log('3.33% platform fee simulation:');
console.log(`  Customer pays: $${result333pct.customerPays.toFixed(2)}`);
console.log(`  Platform fee: $${result333pct.platformFee.toFixed(2)}`);
console.log(`  Connected receives: $${result333pct.connectedAccountReceives.toFixed(2)}`);
console.log('');

console.log('Exact match simulation:');
console.log(`  Customer pays: $${resultExact.customerPays.toFixed(2)}`);
console.log(`  Platform fee: $${resultExact.platformFee.toFixed(2)}`);
console.log(`  Connected receives: $${resultExact.connectedAccountReceives.toFixed(2)}`);

// Check which one matches
console.log('\n🎯 ACCURACY CHECK:');
const real = { customerPays: 1170.19, platformFee: 38.31, connectedReceives: 1111.68 };

function checkAccuracy(label: string, simulated: any) {
  const customerDiff = Math.abs(simulated.customerPays - real.customerPays);
  const platformDiff = Math.abs(simulated.platformFee - real.platformFee);
  const connectedDiff = Math.abs(simulated.connectedAccountReceives - real.connectedReceives);
  
  console.log(`${label}:`);
  console.log(`  Customer pays difference: $${customerDiff.toFixed(2)}`);
  console.log(`  Platform fee difference: $${platformDiff.toFixed(2)}`);
  console.log(`  Connected receives difference: $${connectedDiff.toFixed(2)}`);
  
  const isMatch = customerDiff < 0.01 && platformDiff < 0.01 && connectedDiff < 0.01;
  console.log(`  ${isMatch ? '✅ EXACT MATCH' : '❌ No match'}`);
  console.log('');
}

checkAccuracy('5% platform fee', result5pct);
checkAccuracy('3.33% platform fee', result333pct);
checkAccuracy('Exact percentage', resultExact);