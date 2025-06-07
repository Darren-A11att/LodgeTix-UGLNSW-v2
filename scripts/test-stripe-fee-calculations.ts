#!/usr/bin/env tsx

/**
 * Test script for Stripe fee calculations
 * Tests current method vs corrected method to ensure connected accounts receive expected amounts
 */

import { calculateStripeFees } from '@/lib/utils/stripe-fee-calculator';

// Stripe rates for Australia
const STRIPE_RATES = {
  domestic: { percentage: 0.017, fixed: 0.30 },
  international: { percentage: 0.035, fixed: 0.30 }
};

interface FeeBreakdown {
  method: string;
  desiredNetToConnectedAccount: number;
  platformFeePercentage: number;
  subtotalUsedInCalculation: number;
  stripeFee: number;
  platformFee: number;
  customerPays: number;
  connectedAccountReceives: number;
  platformReceives: number;
  isCorrect: boolean;
}

/**
 * Current method: Platform fee calculated on subtotal
 */
function currentMethod(desiredNet: number, platformFeeRate: number = 0.05, isDomestic: boolean = true): FeeBreakdown {
  const subtotal = desiredNet; // Current method uses desired net as subtotal
  const platformFee = subtotal * platformFeeRate;
  
  // Calculate Stripe fees on subtotal
  const stripeRates = isDomestic ? STRIPE_RATES.domestic : STRIPE_RATES.international;
  const stripeFeeCalc = calculateStripeFees(subtotal, {
    isDomestic,
    feeMode: 'pass_to_customer',
    platformFeePercentage: 0 // Calculate separately
  });
  
  const customerPays = stripeFeeCalc.total;
  const stripeFee = stripeFeeCalc.stripeFee;
  const connectedAccountReceives = customerPays - stripeFee - platformFee;
  
  return {
    method: 'Current Method',
    desiredNetToConnectedAccount: desiredNet,
    platformFeePercentage: platformFeeRate,
    subtotalUsedInCalculation: subtotal,
    stripeFee,
    platformFee,
    customerPays,
    connectedAccountReceives,
    platformReceives: platformFee,
    isCorrect: Math.abs(connectedAccountReceives - desiredNet) < 0.01
  };
}

/**
 * Corrected method: Calculate backwards from desired net amount
 */
function correctedMethod(desiredNet: number, platformFeeRate: number = 0.05, isDomestic: boolean = true): FeeBreakdown {
  // Calculate platform fee that results in desired net
  const platformFee = desiredNet * (platformFeeRate / (1 - platformFeeRate));
  const subtotalBeforeStripe = desiredNet + platformFee;
  
  // Calculate Stripe fees on the gross amount
  const stripeRates = isDomestic ? STRIPE_RATES.domestic : STRIPE_RATES.international;
  const stripeFeeCalc = calculateStripeFees(subtotalBeforeStripe, {
    isDomestic,
    feeMode: 'pass_to_customer',
    platformFeePercentage: 0 // Calculate separately
  });
  
  const customerPays = stripeFeeCalc.total;
  const stripeFee = stripeFeeCalc.stripeFee;
  const connectedAccountReceives = customerPays - stripeFee - platformFee;
  
  return {
    method: 'Corrected Method',
    desiredNetToConnectedAccount: desiredNet,
    platformFeePercentage: platformFeeRate,
    subtotalUsedInCalculation: subtotalBeforeStripe,
    stripeFee,
    platformFee,
    customerPays,
    connectedAccountReceives,
    platformReceives: platformFee,
    isCorrect: Math.abs(connectedAccountReceives - desiredNet) < 0.01
  };
}

/**
 * Test against real transaction data
 */
function testRealTransaction(): FeeBreakdown {
  const customerPaid = 1170.19;
  const connectedReceived = 1111.68;
  const expectedPlatformFee = 38.31;
  
  // Work backwards from real data
  const stripeFee = customerPaid - connectedReceived - expectedPlatformFee;
  const subtotal = connectedReceived + expectedPlatformFee; // What was likely used as subtotal
  
  return {
    method: 'Real Transaction Analysis',
    desiredNetToConnectedAccount: 1150, // Original ticket price
    platformFeePercentage: expectedPlatformFee / subtotal,
    subtotalUsedInCalculation: subtotal,
    stripeFee,
    platformFee: expectedPlatformFee,
    customerPays: customerPaid,
    connectedAccountReceives: connectedReceived,
    platformReceives: expectedPlatformFee,
    isCorrect: false // We'll analyze this
  };
}

/**
 * Format currency for display
 */
function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

/**
 * Print breakdown table
 */
function printBreakdown(breakdown: FeeBreakdown) {
  console.log(`\n=== ${breakdown.method} ===`);
  console.log(`Desired net to connected account: ${formatCurrency(breakdown.desiredNetToConnectedAccount)}`);
  console.log(`Platform fee percentage: ${(breakdown.platformFeePercentage * 100).toFixed(2)}%`);
  console.log(`Subtotal used in calculation: ${formatCurrency(breakdown.subtotalUsedInCalculation)}`);
  console.log('');
  console.log('BREAKDOWN:');
  console.log(`Customer pays: ${formatCurrency(breakdown.customerPays)}`);
  console.log(`  - Stripe fee: ${formatCurrency(breakdown.stripeFee)}`);
  console.log(`  - Platform fee: ${formatCurrency(breakdown.platformFee)}`);
  console.log(`  = Connected account receives: ${formatCurrency(breakdown.connectedAccountReceives)}`);
  console.log('');
  console.log(`Platform receives: ${formatCurrency(breakdown.platformReceives)}`);
  console.log(`Connected account net: ${formatCurrency(breakdown.connectedAccountReceives)}`);
  console.log(`✅ Correct calculation: ${breakdown.isCorrect ? 'YES' : 'NO'}`);
  
  if (!breakdown.isCorrect) {
    const difference = breakdown.connectedAccountReceives - breakdown.desiredNetToConnectedAccount;
    console.log(`❌ Difference: ${formatCurrency(difference)}`);
  }
}

/**
 * Main test function
 */
function runTests() {
  console.log('🧮 STRIPE FEE CALCULATION TESTS');
  console.log('=====================================');
  
  const desiredNet = 1150; // The amount we want connected account to receive
  const platformFeeRate = 0.05; // 5%
  
  // Test current method
  const currentResult = currentMethod(desiredNet, platformFeeRate);
  printBreakdown(currentResult);
  
  // Test corrected method
  const correctedResult = correctedMethod(desiredNet, platformFeeRate);
  printBreakdown(correctedResult);
  
  // Test real transaction
  const realTransaction = testRealTransaction();
  printBreakdown(realTransaction);
  
  // Comparison
  console.log('\n=== COMPARISON ===');
  console.log(`Current method - Customer pays: ${formatCurrency(currentResult.customerPays)}`);
  console.log(`Corrected method - Customer pays: ${formatCurrency(correctedResult.customerPays)}`);
  console.log(`Real transaction - Customer paid: ${formatCurrency(realTransaction.customerPays)}`);
  console.log('');
  console.log(`Difference (Current vs Real): ${formatCurrency(currentResult.customerPays - realTransaction.customerPays)}`);
  console.log(`Difference (Corrected vs Real): ${formatCurrency(correctedResult.customerPays - realTransaction.customerPays)}`);
  
  // Test different amounts
  console.log('\n=== TESTING DIFFERENT AMOUNTS ===');
  const testAmounts = [100, 500, 1000, 2000, 5000];
  
  testAmounts.forEach(amount => {
    const current = currentMethod(amount, 0.05);
    const corrected = correctedMethod(amount, 0.05);
    
    console.log(`\nDesired net: ${formatCurrency(amount)}`);
    console.log(`Current method - Customer pays: ${formatCurrency(current.customerPays)}, Connected gets: ${formatCurrency(current.connectedAccountReceives)}`);
    console.log(`Corrected method - Customer pays: ${formatCurrency(corrected.customerPays)}, Connected gets: ${formatCurrency(corrected.connectedAccountReceives)}`);
  });
}

// Run the tests
runTests();