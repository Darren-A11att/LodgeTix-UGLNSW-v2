import Stripe from 'stripe';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

interface FeeTestCase {
  name: string;
  totalAmount: number;
  expectedPlatformFee: number;
  expectedConnectAmount: number;
  feePercentage?: number;
}

// Get configured fee percentage or default to 5%
const PLATFORM_FEE_PERCENTAGE = parseFloat(process.env.STRIPE_PLATFORM_FEE_PERCENTAGE || '0.05');

const FEE_TEST_CASES: FeeTestCase[] = [
  {
    name: 'Small amount ($10)',
    totalAmount: 10.00,
    expectedPlatformFee: 0.50,
    expectedConnectAmount: 9.50,
  },
  {
    name: 'Standard ticket ($125)',
    totalAmount: 125.00,
    expectedPlatformFee: 6.25,
    expectedConnectAmount: 118.75,
  },
  {
    name: 'Multiple tickets ($250)',
    totalAmount: 250.00,
    expectedPlatformFee: 12.50,
    expectedConnectAmount: 237.50,
  },
  {
    name: 'Large group ($1,250)',
    totalAmount: 1250.00,
    expectedPlatformFee: 62.50,
    expectedConnectAmount: 1187.50,
  },
  {
    name: 'Decimal amount ($99.99)',
    totalAmount: 99.99,
    expectedPlatformFee: 5.00, // Rounded
    expectedConnectAmount: 94.99,
  },
  {
    name: 'Very small amount ($1)',
    totalAmount: 1.00,
    expectedPlatformFee: 0.05,
    expectedConnectAmount: 0.95,
  },
  {
    name: 'Zero amount (free ticket)',
    totalAmount: 0.00,
    expectedPlatformFee: 0.00,
    expectedConnectAmount: 0.00,
  },
  {
    name: 'Odd amount ($123.45)',
    totalAmount: 123.45,
    expectedPlatformFee: 6.17, // Rounded down
    expectedConnectAmount: 117.28,
  },
  {
    name: 'Custom fee percentage (10%)',
    totalAmount: 100.00,
    expectedPlatformFee: 10.00,
    expectedConnectAmount: 90.00,
    feePercentage: 0.10,
  },
];

async function testFeeCalculations() {
  console.log('🧪 Testing Stripe Connect Fee Calculations\n');
  console.log(`Platform Fee Percentage: ${PLATFORM_FEE_PERCENTAGE * 100}%\n`);
  
  const results: Array<{
    testName: string;
    passed: boolean;
    details: {
      totalAmount: number;
      calculatedFee: number;
      expectedFee: number;
      actualFee?: number;
      feeMatch: boolean;
      connectAmount?: number;
      error?: string;
    };
  }> = [];
  
  for (const testCase of FEE_TEST_CASES) {
    console.log(`\n💰 Testing: ${testCase.name}`);
    console.log(`Total Amount: $${testCase.totalAmount.toFixed(2)}`);
    
    try {
      // Calculate fees
      const feePercentage = testCase.feePercentage || PLATFORM_FEE_PERCENTAGE;
      const amountInCents = Math.round(testCase.totalAmount * 100);
      const calculatedFee = Math.round(amountInCents * feePercentage);
      const calculatedFeeInDollars = calculatedFee / 100;
      
      console.log(`Calculated Platform Fee: $${calculatedFeeInDollars.toFixed(2)} (${calculatedFee} cents)`);
      console.log(`Expected Platform Fee: $${testCase.expectedPlatformFee.toFixed(2)}`);
      
      // Test with Stripe API
      if (amountInCents > 0) {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: amountInCents,
          currency: 'aud',
          application_fee_amount: calculatedFee,
          metadata: {
            test_case: testCase.name,
            platform_fee_percentage: (feePercentage * 100).toString(),
          },
          description: `Fee calculation test: ${testCase.name}`,
        });
        
        const actualFee = paymentIntent.application_fee_amount || 0;
        const actualFeeInDollars = actualFee / 100;
        
        console.log(`Stripe Actual Fee: $${actualFeeInDollars.toFixed(2)}`);
        
        const feeMatch = actualFee === Math.round(testCase.expectedPlatformFee * 100);
        const connectAmount = (amountInCents - actualFee) / 100;
        
        if (feeMatch) {
          console.log('✅ Fee calculation correct');
        } else {
          console.log('❌ Fee calculation mismatch');
        }
        
        results.push({
          testName: testCase.name,
          passed: feeMatch,
          details: {
            totalAmount: testCase.totalAmount,
            calculatedFee: calculatedFeeInDollars,
            expectedFee: testCase.expectedPlatformFee,
            actualFee: actualFeeInDollars,
            feeMatch,
            connectAmount,
          },
        });
        
        // Cancel the payment intent
        await stripe.paymentIntents.cancel(paymentIntent.id);
        
      } else {
        // Zero amount case
        const feeMatch = calculatedFeeInDollars === testCase.expectedPlatformFee;
        
        results.push({
          testName: testCase.name,
          passed: feeMatch,
          details: {
            totalAmount: testCase.totalAmount,
            calculatedFee: calculatedFeeInDollars,
            expectedFee: testCase.expectedPlatformFee,
            feeMatch,
            connectAmount: 0,
          },
        });
        
        console.log(feeMatch ? '✅ Zero amount handled correctly' : '❌ Zero amount calculation error');
      }
      
    } catch (error) {
      console.log(`❌ Test failed with error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      results.push({
        testName: testCase.name,
        passed: false,
        details: {
          totalAmount: testCase.totalAmount,
          calculatedFee: 0,
          expectedFee: testCase.expectedPlatformFee,
          feeMatch: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  }
  
  // Additional rounding tests
  console.log('\n\n🔢 Rounding Edge Cases\n');
  
  const roundingTests = [
    { amount: 33.33, description: 'Repeating decimal' },
    { amount: 66.66, description: 'Another repeating decimal' },
    { amount: 15.555, description: 'Three decimal places' },
    { amount: 0.01, description: 'One cent' },
    { amount: 0.99, description: 'Less than one dollar' },
  ];
  
  for (const test of roundingTests) {
    const amountInCents = Math.round(test.amount * 100);
    const fee = Math.round(amountInCents * PLATFORM_FEE_PERCENTAGE);
    const feeInDollars = fee / 100;
    
    console.log(`$${test.amount} → Fee: $${feeInDollars.toFixed(2)} (${test.description})`);
  }
  
  // Summary
  console.log('\n\n📊 Fee Calculation Test Summary');
  console.log('===============================');
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  console.log(`Total tests: ${results.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  
  // Detailed results table
  console.log('\n📋 Detailed Results:\n');
  console.log('| Test Case | Amount | Expected Fee | Actual Fee | Connect Gets | Status |');
  console.log('|-----------|--------|--------------|------------|--------------|--------|');
  
  results.forEach(r => {
    const amount = `$${r.details.totalAmount.toFixed(2)}`;
    const expected = `$${r.details.expectedFee.toFixed(2)}`;
    const actual = r.details.actualFee ? `$${r.details.actualFee.toFixed(2)}` : 'N/A';
    const connect = r.details.connectAmount ? `$${r.details.connectAmount.toFixed(2)}` : 'N/A';
    const status = r.passed ? '✅' : '❌';
    
    console.log(`| ${r.testName.padEnd(25)} | ${amount.padEnd(6)} | ${expected.padEnd(12)} | ${actual.padEnd(10)} | ${connect.padEnd(12)} | ${status} |`);
  });
  
  // Save results
  const fs = await import('fs');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = `./scripts/stripe-connect-tests/fee-calculation-results-${timestamp}.json`;
  
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    platformFeePercentage: PLATFORM_FEE_PERCENTAGE,
    summary: {
      total: results.length,
      passed,
      failed,
    },
    results,
  }, null, 2));
  
  console.log(`\n💾 Results saved to: ${reportPath}`);
  
  return results;
}

// Run the test
if (require.main === module) {
  testFeeCalculations()
    .then((results) => {
      const failed = results.filter(r => !r.passed).length;
      process.exit(failed > 0 ? 1 : 0);
    })
    .catch((error) => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

export { testFeeCalculations };