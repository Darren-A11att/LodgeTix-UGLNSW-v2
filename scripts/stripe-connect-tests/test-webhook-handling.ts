import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import crypto from 'crypto';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Initialize clients
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface WebhookTestCase {
  name: string;
  eventType: string;
  createPayload: () => any;
  validateResult: (payload: any) => Promise<boolean>;
}

// Helper to generate webhook signature
function generateWebhookSignature(payload: string, secret: string): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const signedPayload = `${timestamp}.${payload}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');
  
  return `t=${timestamp},v1=${signature}`;
}

// Helper to send webhook to local endpoint
async function sendWebhook(event: any, endpoint: string = 'http://localhost:3000/api/stripe/webhook') {
  const payload = JSON.stringify(event);
  const secret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test';
  const signature = generateWebhookSignature(payload, secret);
  
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': signature,
      },
      body: payload,
    });
    
    return {
      status: response.status,
      body: await response.text(),
    };
  } catch (error) {
    return {
      status: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

const WEBHOOK_TEST_CASES: WebhookTestCase[] = [
  {
    name: 'Payment Intent Succeeded',
    eventType: 'payment_intent.succeeded',
    createPayload: () => ({
      id: 'evt_test_payment_succeeded',
      object: 'event',
      type: 'payment_intent.succeeded',
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: 'pi_test_succeeded_' + Date.now(),
          object: 'payment_intent',
          amount: 25000,
          currency: 'aud',
          status: 'succeeded',
          on_behalf_of: 'acct_test_account',
          application_fee_amount: 1250,
          metadata: {
            registration_id: 'test-reg-' + Date.now(),
            registration_type: 'individual',
            parent_event_id: 'test-event-id',
            parent_event_title: 'Test Event',
            organisation_id: 'test-org-id',
            organisation_name: 'Test Organization',
            total_attendees: '2',
            total_amount_paid: '250.00',
            platform_fee: '12.50',
            tickets_count: '2',
            created_at: new Date().toISOString(),
            environment: 'test',
          },
          charges: {
            data: [{
              id: 'ch_test_charge',
              amount: 25000,
              currency: 'aud',
              paid: true,
            }],
          },
        },
      },
    }),
    validateResult: async (payload) => {
      // Check if registration was updated
      const regId = payload.data.object.metadata.registration_id;
      const { data, error } = await supabase
        .from('registrations')
        .select('payment_status, stripe_payment_intent_id')
        .eq('registration_id', regId)
        .single();
      
      return !error && data?.payment_status === 'completed';
    },
  },
  {
    name: 'Payment Intent Failed',
    eventType: 'payment_intent.payment_failed',
    createPayload: () => ({
      id: 'evt_test_payment_failed',
      object: 'event',
      type: 'payment_intent.payment_failed',
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: 'pi_test_failed_' + Date.now(),
          object: 'payment_intent',
          amount: 25000,
          currency: 'aud',
          status: 'requires_payment_method',
          on_behalf_of: 'acct_test_account',
          metadata: {
            registration_id: 'test-reg-failed-' + Date.now(),
            registration_type: 'individual',
          },
          last_payment_error: {
            code: 'card_declined',
            message: 'Your card was declined.',
            type: 'card_error',
          },
        },
      },
    }),
    validateResult: async (payload) => {
      // Check if registration reflects the failure
      const regId = payload.data.object.metadata.registration_id;
      const { data, error } = await supabase
        .from('registrations')
        .select('payment_status')
        .eq('registration_id', regId)
        .single();
      
      return !error && data?.payment_status !== 'completed';
    },
  },
  {
    name: 'Account Updated',
    eventType: 'account.updated',
    createPayload: () => ({
      id: 'evt_test_account_updated',
      object: 'event',
      type: 'account.updated',
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: 'acct_test_update_' + Date.now(),
          object: 'account',
          business_type: 'non_profit',
          charges_enabled: true,
          payouts_enabled: true,
          details_submitted: true,
          country: 'AU',
          email: 'test@example.com',
          metadata: {
            organisation_name: 'Test Organization',
          },
        },
        previous_attributes: {
          charges_enabled: false,
          payouts_enabled: false,
        },
      },
    }),
    validateResult: async (payload) => {
      // Check if organization was updated
      const accountId = payload.data.object.id;
      const { data, error } = await supabase
        .from('organisations')
        .select('stripe_account_status, stripe_charges_enabled, stripe_payouts_enabled')
        .eq('stripe_onbehalfof', accountId)
        .single();
      
      return !error && 
        data?.stripe_account_status === 'active' &&
        data?.stripe_charges_enabled === true &&
        data?.stripe_payouts_enabled === true;
    },
  },
  {
    name: 'Payout Paid',
    eventType: 'payout.paid',
    createPayload: () => ({
      id: 'evt_test_payout_paid',
      object: 'event',
      type: 'payout.paid',
      created: Math.floor(Date.now() / 1000),
      account: 'acct_test_payout',
      data: {
        object: {
          id: 'po_test_' + Date.now(),
          object: 'payout',
          amount: 10000,
          currency: 'aud',
          status: 'paid',
          arrival_date: Math.floor(Date.now() / 1000),
          destination: 'ba_test_bank',
          metadata: {
            organisation_id: 'test-org-id',
          },
        },
      },
    }),
    validateResult: async () => {
      // For payout events, we mainly care that they're processed without error
      return true;
    },
  },
  {
    name: 'Transfer Created',
    eventType: 'transfer.created',
    createPayload: () => ({
      id: 'evt_test_transfer_created',
      object: 'event',
      type: 'transfer.created',
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: 'tr_test_' + Date.now(),
          object: 'transfer',
          amount: 23750, // $250 - 5% fee
          currency: 'aud',
          destination: 'acct_test_destination',
          source_transaction: 'ch_test_charge',
          metadata: {
            registration_id: 'test-reg-transfer',
            organisation_id: 'test-org-id',
          },
        },
      },
    }),
    validateResult: async () => {
      // Transfer events are informational
      return true;
    },
  },
];

async function testWebhookHandling() {
  console.log('🧪 Testing Stripe Webhook Handling\n');
  
  const results: Array<{
    testName: string;
    eventType: string;
    status: 'passed' | 'failed';
    message: string;
    details?: any;
  }> = [];
  
  // Check if local server is running
  console.log('🔍 Checking if local server is running...');
  try {
    const healthCheck = await fetch('http://localhost:3000/api/stripe/webhook', {
      method: 'GET',
    });
    if (healthCheck.status === 405) {
      console.log('✅ Local server is running\n');
    } else {
      console.log('⚠️  Warning: Local server may not be configured correctly\n');
    }
  } catch (error) {
    console.log('❌ Local server is not running. Please start the development server.\n');
    console.log('Run: npm run dev\n');
    return;
  }
  
  for (const testCase of WEBHOOK_TEST_CASES) {
    console.log(`\n📨 Testing: ${testCase.name}`);
    console.log(`Event Type: ${testCase.eventType}`);
    
    try {
      // Create test payload
      const payload = testCase.createPayload();
      console.log('📝 Created test payload');
      
      // Send webhook
      const response = await sendWebhook(payload);
      console.log(`📤 Sent webhook - Status: ${response.status}`);
      
      if (response.status === 200) {
        // Wait a bit for database updates
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Validate result
        const isValid = await testCase.validateResult(payload);
        
        if (isValid) {
          console.log('✅ Webhook handled correctly');
          results.push({
            testName: testCase.name,
            eventType: testCase.eventType,
            status: 'passed',
            message: 'Webhook processed successfully',
          });
        } else {
          console.log('❌ Webhook validation failed');
          results.push({
            testName: testCase.name,
            eventType: testCase.eventType,
            status: 'failed',
            message: 'Webhook processed but validation failed',
          });
        }
      } else {
        console.log(`❌ Webhook returned status ${response.status}`);
        results.push({
          testName: testCase.name,
          eventType: testCase.eventType,
          status: 'failed',
          message: `Webhook returned status ${response.status}`,
          details: response,
        });
      }
      
    } catch (error) {
      console.log(`❌ Test failed with error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      results.push({
        testName: testCase.name,
        eventType: testCase.eventType,
        status: 'failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
  
  // Summary
  console.log('\n📊 Webhook Test Summary');
  console.log('======================');
  const passed = results.filter(r => r.status === 'passed').length;
  const failed = results.filter(r => r.status === 'failed').length;
  console.log(`Total tests: ${results.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  
  if (failed > 0) {
    console.log('\n❌ Failed tests:');
    results
      .filter(r => r.status === 'failed')
      .forEach(r => {
        console.log(`- ${r.testName} (${r.eventType}): ${r.message}`);
      });
  }
  
  // Save results
  const fs = await import('fs');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = `./scripts/stripe-connect-tests/webhook-test-results-${timestamp}.json`;
  
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
  testWebhookHandling()
    .then((results) => {
      const failed = results.filter(r => r.status === 'failed').length;
      process.exit(failed > 0 ? 1 : 0);
    })
    .catch((error) => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

export { testWebhookHandling };