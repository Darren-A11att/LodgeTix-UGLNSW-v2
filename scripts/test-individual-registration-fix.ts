import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function testIndividualRegistration() {
  console.log('🧪 Testing Individual Registration Fix');
  console.log('=====================================\n');

  const testData = {
    registrationId: 'test-' + Date.now(),
    authUserId: '123e4567-e89b-12d3-a456-426614174000', // Test UUID
    functionId: process.env.FEATURED_FUNCTION_ID || '123e4567-e89b-12d3-a456-426614174000',
    eventId: null,
    registrationType: 'individuals',
    primaryAttendee: {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      mobileNumber: '+61400000000',
      attendeeType: 'guest',
      contactPreference: 'directly'
    },
    billingDetails: {
      firstName: 'Test',
      lastName: 'User',
      emailAddress: 'test@example.com',
      mobileNumber: '+61400000000',
      billingAddress: {
        addressLine1: '123 Test St',
        city: 'Sydney',
        state: 'NSW',
        postcode: '2000',
        country: 'Australia'
      }
    },
    // Using totalAmount (what frontend sends)
    totalAmount: 150.00,
    subtotal: 145.00,
    stripeFee: 5.00,
    paymentIntentId: null,
    agreeToTerms: true,
    tickets: []
  };

  try {
    console.log('📤 Calling upsert_individual_registration with:');
    console.log(JSON.stringify(testData, null, 2));
    console.log('\n');

    const { data, error } = await supabase.rpc('upsert_individual_registration', {
      p_registration_data: testData
    });

    if (error) {
      console.error('❌ RPC Error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return;
    }

    console.log('✅ Registration created successfully!');
    console.log('Response:', JSON.stringify(data, null, 2));

    // Verify the registration was created with correct total_amount_paid
    const { data: registration, error: fetchError } = await supabase
      .from('registrations')
      .select('*')
      .eq('registration_id', data.registrationId)
      .single();

    if (fetchError) {
      console.error('❌ Error fetching registration:', fetchError);
      return;
    }

    console.log('\n📋 Stored Registration:');
    console.log('- Registration ID:', registration.registration_id);
    console.log('- Total Amount Paid:', registration.total_amount_paid);
    console.log('- Subtotal:', registration.subtotal);
    console.log('- Stripe Fee:', registration.stripe_fee);
    console.log('- Confirmation Number:', registration.confirmation_number || 'NULL (as expected)');
    console.log('- Payment Status:', registration.payment_status);

    // Test payment completion
    console.log('\n💳 Testing Payment Completion...');
    const paymentData = {
      ...testData,
      paymentCompleted: true,
      paymentIntentId: 'pi_test_' + Date.now(),
      totalAmountPaid: 150.00
    };

    const { data: paymentResult, error: paymentError } = await supabase.rpc('upsert_individual_registration', {
      p_registration_data: paymentData
    });

    if (paymentError) {
      console.error('❌ Payment update error:', paymentError);
      return;
    }

    console.log('✅ Payment completed successfully!');
    console.log('Response:', JSON.stringify(paymentResult, null, 2));

    // Cleanup
    await supabase
      .from('registrations')
      .delete()
      .eq('registration_id', data.registrationId);

    console.log('\n✅ Test completed successfully!');

  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

testIndividualRegistration();