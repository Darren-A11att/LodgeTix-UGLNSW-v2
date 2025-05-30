import Stripe from 'stripe';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

interface MetadataTestCase {
  name: string;
  metadata: Record<string, string>;
  expectedValid: boolean;
  checkFunction?: (metadata: Record<string, string>) => boolean;
}

const METADATA_TEST_CASES: MetadataTestCase[] = [
  {
    name: 'Complete valid metadata',
    metadata: {
      registration_id: '123e4567-e89b-12d3-a456-426614174000',
      registration_type: 'individual',
      parent_event_id: '123e4567-e89b-12d3-a456-426614174001',
      parent_event_title: 'Grand Installation 2025',
      organisation_id: '123e4567-e89b-12d3-a456-426614174002',
      organisation_name: 'Grand Lodge of NSW & ACT',
      total_attendees: '2',
      total_amount: '250.00',
      platform_fee: '12.50',
      tickets_count: '2',
      created_at: new Date().toISOString(),
      environment: 'test',
    },
    expectedValid: true,
  },
  {
    name: 'Missing required field (registration_id)',
    metadata: {
      registration_type: 'individual',
      parent_event_id: '123e4567-e89b-12d3-a456-426614174001',
      parent_event_title: 'Grand Installation 2025',
      organisation_id: '123e4567-e89b-12d3-a456-426614174002',
      organisation_name: 'Grand Lodge of NSW & ACT',
      total_attendees: '2',
      total_amount: '250.00',
      platform_fee: '12.50',
      tickets_count: '2',
      created_at: new Date().toISOString(),
      environment: 'test',
    },
    expectedValid: false,
  },
  {
    name: 'Invalid registration type',
    metadata: {
      registration_id: '123e4567-e89b-12d3-a456-426614174000',
      registration_type: 'invalid_type',
      parent_event_id: '123e4567-e89b-12d3-a456-426614174001',
      parent_event_title: 'Grand Installation 2025',
      organisation_id: '123e4567-e89b-12d3-a456-426614174002',
      organisation_name: 'Grand Lodge of NSW & ACT',
      total_attendees: '2',
      total_amount: '250.00',
      platform_fee: '12.50',
      tickets_count: '2',
      created_at: new Date().toISOString(),
      environment: 'test',
    },
    expectedValid: false,
    checkFunction: (metadata) => {
      const validTypes = ['individual', 'lodge', 'delegation'];
      return validTypes.includes(metadata.registration_type);
    },
  },
  {
    name: 'Numeric values as strings',
    metadata: {
      registration_id: '123e4567-e89b-12d3-a456-426614174000',
      registration_type: 'lodge',
      parent_event_id: '123e4567-e89b-12d3-a456-426614174001',
      parent_event_title: 'Grand Installation 2025',
      organisation_id: '123e4567-e89b-12d3-a456-426614174002',
      organisation_name: 'Grand Lodge of NSW & ACT',
      total_attendees: '10',
      total_amount: '1250.00',
      platform_fee: '62.50',
      tickets_count: '10',
      created_at: new Date().toISOString(),
      environment: 'test',
    },
    expectedValid: true,
    checkFunction: (metadata) => {
      return (
        !isNaN(parseInt(metadata.total_attendees)) &&
        !isNaN(parseFloat(metadata.total_amount)) &&
        !isNaN(parseFloat(metadata.platform_fee))
      );
    },
  },
  {
    name: 'Long event title (should be truncated)',
    metadata: {
      registration_id: '123e4567-e89b-12d3-a456-426614174000',
      registration_type: 'delegation',
      parent_event_id: '123e4567-e89b-12d3-a456-426614174001',
      parent_event_title: 'The Most Worshipful Grand Lodge of New South Wales and Australian Capital Territory Annual Grand Installation Ceremony and Banquet 2025',
      organisation_id: '123e4567-e89b-12d3-a456-426614174002',
      organisation_name: 'Grand Lodge of NSW & ACT',
      total_attendees: '50',
      total_amount: '6250.00',
      platform_fee: '312.50',
      tickets_count: '50',
      created_at: new Date().toISOString(),
      environment: 'test',
    },
    expectedValid: true,
  },
  {
    name: 'Child event metadata',
    metadata: {
      registration_id: '123e4567-e89b-12d3-a456-426614174000',
      registration_type: 'individual',
      parent_event_id: '123e4567-e89b-12d3-a456-426614174001',
      parent_event_title: 'Grand Installation 2025',
      child_event_id: '123e4567-e89b-12d3-a456-426614174003',
      child_event_title: 'Ladies Luncheon',
      organisation_id: '123e4567-e89b-12d3-a456-426614174002',
      organisation_name: 'Grand Lodge of NSW & ACT',
      total_attendees: '1',
      total_amount: '85.00',
      platform_fee: '4.25',
      tickets_count: '1',
      created_at: new Date().toISOString(),
      environment: 'test',
    },
    expectedValid: true,
  },
  {
    name: 'Zero platform fee',
    metadata: {
      registration_id: '123e4567-e89b-12d3-a456-426614174000',
      registration_type: 'individual',
      parent_event_id: '123e4567-e89b-12d3-a456-426614174001',
      parent_event_title: 'Grand Installation 2025',
      organisation_id: '123e4567-e89b-12d3-a456-426614174002',
      organisation_name: 'Grand Lodge of NSW & ACT',
      total_attendees: '1',
      total_amount: '0.00',
      platform_fee: '0.00',
      tickets_count: '1',
      created_at: new Date().toISOString(),
      environment: 'test',
    },
    expectedValid: true,
  },
];

async function testMetadataValidation() {
  console.log('🧪 Testing Stripe Metadata Validation\n');
  
  const results: Array<{
    testName: string;
    passed: boolean;
    error?: string;
    paymentIntentId?: string;
  }> = [];
  
  for (const testCase of METADATA_TEST_CASES) {
    console.log(`\n📝 Testing: ${testCase.name}`);
    
    try {
      // Create a test payment intent with the metadata
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(parseFloat(testCase.metadata.total_amount || '100') * 100),
        currency: 'aud',
        metadata: testCase.metadata,
        description: `Test: ${testCase.name}`,
      });
      
      console.log(`✅ Payment intent created: ${paymentIntent.id}`);
      
      // Validate required fields
      const requiredFields = [
        'registration_id',
        'registration_type',
        'parent_event_id',
        'parent_event_title',
        'organisation_id',
        'organisation_name',
        'total_attendees',
        'total_amount',
        'platform_fee',
        'tickets_count',
        'created_at',
        'environment',
      ];
      
      const missingFields = requiredFields.filter(field => !paymentIntent.metadata[field]);
      const hasAllRequiredFields = missingFields.length === 0;
      
      // Run custom validation if provided
      let customValidation = true;
      if (testCase.checkFunction) {
        customValidation = testCase.checkFunction(paymentIntent.metadata);
      }
      
      const isValid = hasAllRequiredFields && customValidation;
      const passed = isValid === testCase.expectedValid;
      
      if (passed) {
        console.log(`✅ Test passed: Metadata validation result matches expected`);
      } else {
        console.log(`❌ Test failed: Expected ${testCase.expectedValid}, got ${isValid}`);
        if (missingFields.length > 0) {
          console.log(`   Missing fields: ${missingFields.join(', ')}`);
        }
      }
      
      results.push({
        testName: testCase.name,
        passed,
        paymentIntentId: paymentIntent.id,
        error: passed ? undefined : `Expected ${testCase.expectedValid}, got ${isValid}`,
      });
      
      // Cancel the payment intent to clean up
      await stripe.paymentIntents.cancel(paymentIntent.id);
      
    } catch (error) {
      console.log(`❌ Test failed with error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      results.push({
        testName: testCase.name,
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
  
  // Summary
  console.log('\n📊 Test Summary');
  console.log('===============');
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  console.log(`Total tests: ${results.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  
  if (failed > 0) {
    console.log('\n❌ Failed tests:');
    results
      .filter(r => !r.passed)
      .forEach(r => {
        console.log(`- ${r.testName}: ${r.error}`);
      });
  }
  
  // Save results
  const fs = await import('fs');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = `./scripts/stripe-connect-tests/metadata-test-results-${timestamp}.json`;
  
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
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
  testMetadataValidation()
    .then((results) => {
      const failed = results.filter(r => !r.passed).length;
      process.exit(failed > 0 ? 1 : 0);
    })
    .catch((error) => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

export { testMetadataValidation };