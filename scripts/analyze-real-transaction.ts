#!/usr/bin/env tsx

/**
 * Analyze the real transaction to determine actual platform fee calculation
 */

// Real transaction data
const REAL_TRANSACTION = {
  customerPaid: 1170.19,
  connectedReceived: 1111.68,
  expectedPlatformFee: 38.31,
  ticketSubtotal: 1150.00
};

function analyzeTransaction() {
  console.log('🔍 REAL TRANSACTION ANALYSIS');
  console.log('=====================================');
  
  const { customerPaid, connectedReceived, expectedPlatformFee, ticketSubtotal } = REAL_TRANSACTION;
  
  // Calculate what actually happened
  const actualStripeFee = customerPaid - connectedReceived - expectedPlatformFee;
  const totalFeesToPlatform = customerPaid - connectedReceived; // Stripe + Platform
  
  console.log('TRANSACTION DETAILS:');
  console.log(`Customer paid: $${customerPaid.toFixed(2)}`);
  console.log(`Connected account received: $${connectedReceived.toFixed(2)}`);
  console.log(`Platform payout: $${expectedPlatformFee.toFixed(2)}`);
  console.log(`Original ticket price: $${ticketSubtotal.toFixed(2)}`);
  console.log('');
  
  console.log('CALCULATED BREAKDOWN:');
  console.log(`Stripe processing fee: $${actualStripeFee.toFixed(2)}`);
  console.log(`Platform fee: $${expectedPlatformFee.toFixed(2)}`);
  console.log(`Total fees: $${totalFeesToPlatform.toFixed(2)}`);
  console.log('');
  
  // Calculate effective platform fee percentages
  const platformFeeOnTicketPrice = (expectedPlatformFee / ticketSubtotal) * 100;
  const platformFeeOnCustomerPaid = (expectedPlatformFee / customerPaid) * 100;
  const platformFeeOnConnectedReceived = (expectedPlatformFee / connectedReceived) * 100;
  
  console.log('PLATFORM FEE PERCENTAGES:');
  console.log(`Platform fee as % of ticket price ($${ticketSubtotal}): ${platformFeeOnTicketPrice.toFixed(2)}%`);
  console.log(`Platform fee as % of customer paid ($${customerPaid}): ${platformFeeOnCustomerPaid.toFixed(2)}%`);
  console.log(`Platform fee as % of connected received ($${connectedReceived}): ${platformFeeOnConnectedReceived.toFixed(2)}%`);
  console.log('');
  
  // Test different scenarios to match the transaction
  console.log('TESTING SCENARIOS:');
  console.log('==================');
  
  // Scenario 1: 5% of ticket subtotal (environment default)
  const scenario1PlatformFee = ticketSubtotal * 0.05;
  console.log(`Scenario 1 - 5% of $${ticketSubtotal}: $${scenario1PlatformFee.toFixed(2)} (difference: $${Math.abs(scenario1PlatformFee - expectedPlatformFee).toFixed(2)})`);
  
  // Scenario 2: Platform fee calculated after Stripe fee deducted
  const amountAfterStripe = customerPaid - actualStripeFee; // $1150.00
  const scenario2PlatformFee = amountAfterStripe * 0.05;
  console.log(`Scenario 2 - 5% of amount after Stripe ($${amountAfterStripe.toFixed(2)}): $${scenario2PlatformFee.toFixed(2)} (difference: $${Math.abs(scenario2PlatformFee - expectedPlatformFee).toFixed(2)})`);
  
  // Scenario 3: What percentage of the customer payment would give us the actual platform fee?
  const scenario3Percentage = (expectedPlatformFee / customerPaid) * 100;
  console.log(`Scenario 3 - ${scenario3Percentage.toFixed(2)}% of customer payment ($${customerPaid}): $${expectedPlatformFee.toFixed(2)} (exact match)`);
  
  // Scenario 4: What percentage of the ticket subtotal would give us the actual platform fee?
  const scenario4Percentage = (expectedPlatformFee / ticketSubtotal) * 100;
  console.log(`Scenario 4 - ${scenario4Percentage.toFixed(2)}% of ticket subtotal ($${ticketSubtotal}): $${expectedPlatformFee.toFixed(2)} (exact match)`);
  
  console.log('');
  
  // Reverse engineer the calculation
  console.log('REVERSE ENGINEERING:');
  console.log('===================');
  
  // If platform fee is calculated on customer payment amount
  if (Math.abs((customerPaid * 0.05) - (ticketSubtotal * 0.05)) < 0.01) {
    console.log('✅ Platform fee appears to be calculated on the gross customer payment');
  }
  
  // Check if it matches calculation on subtotal
  const calculatedOnSubtotal = ticketSubtotal * 0.05;
  if (Math.abs(calculatedOnSubtotal - expectedPlatformFee) < 1) {
    console.log('✅ Platform fee is close to 5% of ticket subtotal');
  }
  
  // Check if it's calculated differently
  const possibleBase = expectedPlatformFee / 0.05;
  console.log(`If platform fee is 5%, the base amount would be: $${possibleBase.toFixed(2)}`);
  
  // Check against different bases
  if (Math.abs(possibleBase - ticketSubtotal) < 1) {
    console.log('✅ Platform fee is likely calculated on ticket subtotal');
  } else if (Math.abs(possibleBase - customerPaid) < 1) {
    console.log('✅ Platform fee is likely calculated on total customer payment');
  } else if (Math.abs(possibleBase - (customerPaid - actualStripeFee)) < 1) {
    console.log('✅ Platform fee is likely calculated after Stripe fee is deducted');
  } else {
    console.log(`❓ Platform fee base calculation unclear - base would be $${possibleBase.toFixed(2)}`);
  }
}

// Test with Stripe fee calculation accuracy
function testStripeFeeAccuracy() {
  console.log('\n💳 STRIPE FEE ACCURACY TEST');
  console.log('=====================================');
  
  const { ticketSubtotal } = REAL_TRANSACTION;
  
  // Calculate expected Stripe fee for $1150 domestic
  const stripePercentage = 0.017; // 1.7%
  const stripeFixed = 0.30;
  
  // Method 1: Direct calculation
  const directStripeFee = (ticketSubtotal * stripePercentage) + stripeFixed;
  console.log(`Direct Stripe fee on $${ticketSubtotal}: $${directStripeFee.toFixed(2)}`);
  
  // Method 2: Pass-to-customer calculation
  const total = (ticketSubtotal + stripeFixed) / (1 - stripePercentage);
  const passToCustomerStripeFee = total - ticketSubtotal;
  console.log(`Pass-to-customer Stripe fee: $${passToCustomerStripeFee.toFixed(2)}`);
  console.log(`Total customer would pay: $${total.toFixed(2)}`);
  
  // Compare with actual
  const actualStripeFee = REAL_TRANSACTION.customerPaid - REAL_TRANSACTION.connectedReceived - REAL_TRANSACTION.expectedPlatformFee;
  console.log(`Actual Stripe fee in transaction: $${actualStripeFee.toFixed(2)}`);
  
  console.log('');
  console.log('ACCURACY:');
  console.log(`Difference from direct calculation: $${Math.abs(directStripeFee - actualStripeFee).toFixed(2)}`);
  console.log(`Difference from pass-to-customer: $${Math.abs(passToCustomerStripeFee - actualStripeFee).toFixed(2)}`);
}

// Run analysis
analyzeTransaction();
testStripeFeeAccuracy();