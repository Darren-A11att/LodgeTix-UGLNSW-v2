import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import dotenv from 'dotenv';

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

interface TestResult {
  testName: string;
  status: 'passed' | 'failed';
  message: string;
  details?: any;
}

const results: TestResult[] = [];

async function logResult(testName: string, status: 'passed' | 'failed', message: string, details?: any) {
  results.push({ testName, status, message, details });
  console.log(`${status === 'passed' ? '✅' : '❌'} ${testName}: ${message}`);
  if (details) {
    console.log('   Details:', JSON.stringify(details, null, 2));
  }
}

async function testBasicPaymentFlow() {
  console.log('\n🧪 Testing Basic Payment Flow with Connected Account\n');
  
  try {
    // Step 1: Get a test event with a connected organization
    console.log('1️⃣ Finding test event with connected organization...');
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select(`
        *,
        organisations!inner(
          organisation_id,
          name,
          stripe_onbehalfof,
          stripe_account_status
        )
      `)
      .not('organisations.stripe_onbehalfof', 'is', null)
      .eq('organisations.stripe_account_status', 'active')
      .limit(1)
      .single();
    
    if (eventError || !event) {
      await logResult('Find Test Event', 'failed', 'No event with connected organization found', eventError);
      return;
    }
    
    await logResult('Find Test Event', 'passed', `Found event: ${event.title}`, {
      eventId: event.event_id,
      organizationName: event.organisations.name,
      stripeAccountId: event.organisations.stripe_onbehalfof,
    });
    
    // Step 2: Create a test registration
    console.log('\n2️⃣ Creating test registration...');
    const testRegistration = {
      parent_event_id: event.event_id,
      child_event_id: null,
      registration_type: 'individual',
      main_attendee_name: 'Test User',
      booking_email: 'test@example.com',
      booking_phone: '+61412345678',
      terms_accepted: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    const { data: registration, error: regError } = await supabase
      .from('registrations')
      .insert(testRegistration)
      .select()
      .single();
    
    if (regError || !registration) {
      await logResult('Create Registration', 'failed', 'Failed to create registration', regError);
      return;
    }
    
    await logResult('Create Registration', 'passed', 'Registration created', {
      registrationId: registration.registration_id,
    });
    
    // Step 3: Create test tickets
    console.log('\n3️⃣ Creating test tickets...');
    const testTickets = [
      {
        registration_id: registration.registration_id,
        ticket_type: 'standard',
        attendee_name: 'Test User',
        price: 125.00,
        status: 'pending',
      },
      {
        registration_id: registration.registration_id,
        ticket_type: 'standard',
        attendee_name: 'Test Partner',
        price: 125.00,
        status: 'pending',
      },
    ];
    
    const { data: tickets, error: ticketError } = await supabase
      .from('tickets')
      .insert(testTickets)
      .select();
    
    if (ticketError || !tickets) {
      await logResult('Create Tickets', 'failed', 'Failed to create tickets', ticketError);
      return;
    }
    
    await logResult('Create Tickets', 'passed', `Created ${tickets.length} tickets`, {
      totalAmount: tickets.reduce((sum, t) => sum + t.price, 0),
    });
    
    // Step 4: Create payment intent with connected account
    console.log('\n4️⃣ Creating payment intent...');
    const totalAmount = tickets.reduce((sum, t) => sum + t.price, 0);
    const platformFeePercentage = parseFloat(process.env.STRIPE_PLATFORM_FEE_PERCENTAGE || '0.05');
    const platformFee = Math.round(totalAmount * 100 * platformFeePercentage);
    
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(totalAmount * 100), // Convert to cents
        currency: 'aud',
        on_behalf_of: event.organisations.stripe_onbehalfof,
        application_fee_amount: platformFee,
        statement_descriptor_suffix: event.title.substring(0, 22).replace(/[^a-zA-Z0-9 ]/g, ''),
        metadata: {
          registration_id: registration.registration_id,
          registration_type: registration.registration_type,
          parent_event_id: event.event_id,
          parent_event_title: event.title,
          organisation_id: event.organisations.organisation_id,
          organisation_name: event.organisations.name,
          total_attendees: tickets.length.toString(),
          total_amount_paid: totalAmount.toFixed(2),
          platform_fee: (platformFee / 100).toFixed(2),
          tickets_count: tickets.length.toString(),
          created_at: new Date().toISOString(),
          environment: 'test',
        },
        description: `Registration for ${event.title}`,
      });
      
      await logResult('Create Payment Intent', 'passed', 'Payment intent created successfully', {
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
        onBehalfOf: paymentIntent.on_behalf_of,
        applicationFee: paymentIntent.application_fee_amount,
        statementDescriptor: paymentIntent.statement_descriptor_suffix,
      });
      
      // Step 5: Validate metadata
      console.log('\n5️⃣ Validating metadata...');
      const requiredMetadataFields = [
        'registration_id',
        'registration_type',
        'parent_event_id',
        'parent_event_title',
        'organisation_id',
        'organisation_name',
        'total_attendees',
        'total_amount_paid',
        'platform_fee',
        'tickets_count',
        'created_at',
        'environment',
      ];
      
      const missingFields = requiredMetadataFields.filter(field => !paymentIntent.metadata[field]);
      
      if (missingFields.length === 0) {
        await logResult('Validate Metadata', 'passed', 'All required metadata fields present');
      } else {
        await logResult('Validate Metadata', 'failed', 'Missing metadata fields', { missingFields });
      }
      
      // Step 6: Validate Connect parameters
      console.log('\n6️⃣ Validating Connect parameters...');
      if (paymentIntent.on_behalf_of === event.organisations.stripe_onbehalfof) {
        await logResult('Validate Connected Account', 'passed', 'Connected account correctly set');
      } else {
        await logResult('Validate Connected Account', 'failed', 'Connected account mismatch', {
          expected: event.organisations.stripe_onbehalfof,
          actual: paymentIntent.on_behalf_of,
        });
      }
      
      if (paymentIntent.application_fee_amount === platformFee) {
        await logResult('Validate Platform Fee', 'passed', `Platform fee correctly set to ${platformFeePercentage * 100}%`);
      } else {
        await logResult('Validate Platform Fee', 'failed', 'Platform fee mismatch', {
          expected: platformFee,
          actual: paymentIntent.application_fee_amount,
        });
      }
      
      // Step 7: Confirm payment (simulate)
      console.log('\n7️⃣ Confirming payment (test mode)...');
      const confirmedPayment = await stripe.paymentIntents.confirm(paymentIntent.id, {
        payment_method: 'pm_card_visa',
      });
      
      await logResult('Confirm Payment', 'passed', 'Payment confirmed successfully', {
        status: confirmedPayment.status,
      });
      
      // Step 8: Update registration status
      console.log('\n8️⃣ Updating registration status...');
      const { error: updateError } = await supabase
        .from('registrations')
        .update({
          payment_status: 'completed',
          stripe_payment_intent_id: paymentIntent.id,
          connected_account_id: event.organisations.stripe_onbehalfof,
          platform_fee_amount: platformFee / 100,
          updated_at: new Date().toISOString(),
        })
        .eq('registration_id', registration.registration_id);
      
      if (!updateError) {
        await logResult('Update Registration', 'passed', 'Registration status updated');
      } else {
        await logResult('Update Registration', 'failed', 'Failed to update registration', updateError);
      }
      
      // Cleanup: Cancel the payment intent to avoid charges
      await stripe.paymentIntents.cancel(paymentIntent.id);
      
    } catch (stripeError) {
      await logResult('Stripe API', 'failed', 'Stripe API error', stripeError);
    }
    
  } catch (error) {
    await logResult('Test Execution', 'failed', 'Unexpected error', error);
  }
}

async function generateReport() {
  console.log('\n📊 Test Results Summary');
  console.log('======================');
  
  const passed = results.filter(r => r.status === 'passed').length;
  const failed = results.filter(r => r.status === 'failed').length;
  const total = results.length;
  
  console.log(`Total Tests: ${total}`);
  console.log(`Passed: ${passed} (${((passed / total) * 100).toFixed(1)}%)`);
  console.log(`Failed: ${failed} (${((failed / total) * 100).toFixed(1)}%)`);
  
  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    results
      .filter(r => r.status === 'failed')
      .forEach(r => {
        console.log(`- ${r.testName}: ${r.message}`);
        if (r.details) {
          console.log(`  Details: ${JSON.stringify(r.details)}`);
        }
      });
  }
  
  // Save results to file
  const fs = await import('fs');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = `./scripts/stripe-connect-tests/test-results-${timestamp}.json`;
  
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: { total, passed, failed },
    results,
  }, null, 2));
  
  console.log(`\n💾 Full report saved to: ${reportPath}`);
}

// Run the test
if (require.main === module) {
  testBasicPaymentFlow()
    .then(() => generateReport())
    .then(() => {
      console.log('\n✅ Test completed!');
      process.exit(results.some(r => r.status === 'failed') ? 1 : 0);
    })
    .catch((error) => {
      console.error('\n❌ Test execution failed:', error);
      process.exit(1);
    });
}

export { testBasicPaymentFlow };