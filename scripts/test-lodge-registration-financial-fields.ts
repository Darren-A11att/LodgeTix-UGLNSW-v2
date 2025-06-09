#!/usr/bin/env npx tsx
/**
 * Test script for Lodge Registration Financial Fields
 * Tests that booking_contact_id, connected_account_id, and stripe_fee are properly populated
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function testLodgeRegistrationFields() {
  console.log('🧪 Testing Lodge Registration Financial Fields\n');

  try {
    // 1. Create a test organisation with stripe_onbehalfof
    console.log('1️⃣ Creating test organisation...');
    const { data: org, error: orgError } = await supabase
      .from('organisations')
      .insert({
        name: 'Test Lodge for Financial Fields',
        organisation_type: 'lodge',
        stripe_onbehalfof: 'acct_TEST123456789'
      })
      .select()
      .single();

    if (orgError) throw orgError;
    console.log('✅ Organisation created:', org.organisation_id);

    // 2. Get a test function and package
    console.log('\n2️⃣ Getting test function and package...');
    const { data: func } = await supabase
      .from('functions')
      .select('function_id')
      .limit(1)
      .single();

    const { data: pkg } = await supabase
      .from('packages')
      .select('package_id, package_price')
      .eq('function_id', func.function_id)
      .limit(1)
      .single();

    console.log('✅ Using function:', func.function_id);
    console.log('✅ Using package:', pkg.package_id);

    // 3. Create test registration
    console.log('\n3️⃣ Creating lodge registration...');
    const testData = {
      p_function_id: func.function_id,
      p_package_id: pkg.package_id,
      p_table_count: 2,
      p_booking_contact: {
        email: 'test@lodge.com',
        firstName: 'Test',
        lastName: 'Contact',
        mobile: '0411222333'
      },
      p_lodge_details: {
        lodgeName: org.name,
        lodgeNumber: '12345',
        organisation_id: org.organisation_id,
        lodge_id: org.organisation_id // For backward compatibility
      },
      p_payment_status: 'pending',
      p_total_amount: 1530.61, // Example with processing fees
      p_subtotal: 1500.00,
      p_stripe_fee: 30.61, // Processing fees from frontend
      p_connected_account_id: 'acct_TEST123456789' // Pass the connected account ID
    };

    const { data: result, error: rpcError } = await supabase
      .rpc('upsert_lodge_registration', testData);

    if (rpcError) throw rpcError;
    console.log('✅ Registration created:', result.registrationId);

    // 4. Verify the fields were populated
    console.log('\n4️⃣ Verifying fields...');
    const { data: registration, error: fetchError } = await supabase
      .from('registrations')
      .select('*')
      .eq('registration_id', result.registrationId)
      .single();

    if (fetchError) throw fetchError;

    console.log('\n📋 Registration Details:');
    console.log('- Registration ID:', registration.registration_id);
    console.log('- Customer ID:', registration.customer_id);
    console.log('- Booking Contact ID:', registration.booking_contact_id);
    console.log('- Organisation ID:', registration.organisation_id);
    console.log('- Connected Account ID:', registration.connected_account_id);
    console.log('- Subtotal:', registration.subtotal);
    console.log('- Stripe Fee:', registration.stripe_fee);
    console.log('- Total Amount Paid:', registration.total_amount_paid);
    console.log('- Includes Processing Fee:', registration.includes_processing_fee);

    // 5. Validate results
    console.log('\n5️⃣ Validation:');
    const validations = [
      {
        field: 'booking_contact_id',
        expected: registration.customer_id,
        actual: registration.booking_contact_id,
        pass: registration.booking_contact_id === registration.customer_id
      },
      {
        field: 'connected_account_id',
        expected: 'acct_TEST123456789',
        actual: registration.connected_account_id,
        pass: registration.connected_account_id === 'acct_TEST123456789'
      },
      {
        field: 'stripe_fee',
        expected: 30.61,
        actual: registration.stripe_fee,
        pass: Number(registration.stripe_fee) === 30.61
      },
      {
        field: 'includes_processing_fee',
        expected: true,
        actual: registration.includes_processing_fee,
        pass: registration.includes_processing_fee === true
      }
    ];

    let allPassed = true;
    validations.forEach(v => {
      const status = v.pass ? '✅' : '❌';
      console.log(`${status} ${v.field}: ${v.actual} (expected: ${v.expected})`);
      if (!v.pass) allPassed = false;
    });

    // 6. Test without connected account ID
    console.log('\n6️⃣ Testing without connected account ID...');
    const { data: org2 } = await supabase
      .from('organisations')
      .insert({
        name: 'Test Lodge Without Stripe',
        organisation_type: 'lodge'
      })
      .select()
      .single();

    const testData2 = {
      ...testData,
      p_lodge_details: {
        ...testData.p_lodge_details,
        lodgeName: org2.name,
        organisation_id: org2.organisation_id,
        lodge_id: org2.organisation_id
      },
      p_connected_account_id: null // No connected account
    };

    const { data: result2 } = await supabase
      .rpc('upsert_lodge_registration', testData2);

    const { data: reg2 } = await supabase
      .from('registrations')
      .select('connected_account_id')
      .eq('registration_id', result2.registrationId)
      .single();

    console.log('✅ Connected Account ID (should be null):', reg2.connected_account_id);

    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await supabase.from('registrations').delete().eq('registration_id', result.registrationId);
    await supabase.from('registrations').delete().eq('registration_id', result2.registrationId);
    await supabase.from('organisations').delete().eq('organisation_id', org.organisation_id);
    await supabase.from('organisations').delete().eq('organisation_id', org2.organisation_id);

    console.log('\n✅ All tests completed!');
    console.log(allPassed ? '🎉 All validations passed!' : '⚠️ Some validations failed');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testLodgeRegistrationFields();