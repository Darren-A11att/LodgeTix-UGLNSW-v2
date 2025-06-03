#!/usr/bin/env node

import { calculateStripeFees, getFeeModeFromEnv, getPlatformFeePercentage } from '../lib/utils/stripe-fee-calculator';

// Test cases for lodge package pricing
const testCases = [
  { name: 'Single package', packageCount: 1, packagePrice: 1950 },
  { name: 'Two packages', packageCount: 2, packagePrice: 1950 },
  { name: 'Five packages', packageCount: 5, packagePrice: 1950 },
  { name: 'Ten packages', packageCount: 10, packagePrice: 1950 },
];

console.log('=== Lodge Package Stripe Fee Calculation Test ===\n');
console.log(`Fee Mode: ${getFeeModeFromEnv()}`);
console.log(`Platform Fee: ${(getPlatformFeePercentage() * 100).toFixed(2)}%`);
console.log('\n--- Test Results ---\n');

testCases.forEach(test => {
  const subtotal = test.packageCount * test.packagePrice;
  
  // Calculate with Australian domestic rate (1.75% + $0.30)
  const domesticFees = calculateStripeFees(subtotal, {
    isDomestic: true,
    feeMode: getFeeModeFromEnv(),
    platformFeePercentage: getPlatformFeePercentage()
  });
  
  // Calculate with international rate (2.9% + $0.30)
  const internationalFees = calculateStripeFees(subtotal, {
    isDomestic: false,
    feeMode: getFeeModeFromEnv(),
    platformFeePercentage: getPlatformFeePercentage()
  });
  
  console.log(`${test.name}:`);
  console.log(`  Packages: ${test.packageCount} × $${test.packagePrice} = $${subtotal.toFixed(2)}`);
  console.log(`  Domestic (AU) Card:`);
  console.log(`    - Processing Fee: $${domesticFees.stripeFee.toFixed(2)}`);
  console.log(`    - Total Amount: $${domesticFees.total.toFixed(2)}`);
  console.log(`  International Card:`);
  console.log(`    - Processing Fee: $${internationalFees.stripeFee.toFixed(2)}`);
  console.log(`    - Total Amount: $${internationalFees.total.toFixed(2)}`);
  console.log('');
});

// Show fee breakdown calculation details
console.log('\n--- Fee Calculation Details ---\n');
console.log('For "pass_to_customer" mode:');
console.log('  Total = (Subtotal + Fixed Fee) / (1 - Percentage)');
console.log('  Stripe Fee = Total - Subtotal');
console.log('');
console.log('Australian domestic rate: 1.75% + $0.30');
console.log('International rate: 2.9% + $0.30');