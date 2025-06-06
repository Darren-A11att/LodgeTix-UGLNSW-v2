import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables from the root .env file
config({ path: resolve(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'Set' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testPaymentUpdate() {
  console.log('🧪 Testing payment update fix for registration_id field error...\n');

  try {
    // First, get a valid user ID (or create an anonymous user)
    console.log('0️⃣ Setting up test user...');
    const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
    
    if (authError || !authData.user) {
      console.error('❌ Failed to create anonymous user:', authError);
      return;
    }
    
    const testUserId = authData.user.id;
    console.log('✅ Test user created:', testUserId);

    // First, create a test registration
    console.log('1️⃣ Creating test registration...');
    const testRegistrationId = uuidv4();
    const { data: registration, error: createError } = await supabase
      .from('registrations')
      .insert({
        registration_id: testRegistrationId,
        registration_type: 'individuals',
        function_id: process.env.FEATURED_FUNCTION_ID || '7a614082-a8f5-41bc-8f3f-e58dc4a4339b',
        status: 'pending',
        payment_status: 'pending',
        total_amount_paid: 0,
        subtotal: 10.00,
        stripe_fee: 0.34,
        agree_to_terms: true,
        auth_user_id: testUserId // Use the created test user ID
      })
      .select()
      .single();

    if (createError) {
      console.error('❌ Failed to create test registration:', createError);
      return;
    }

    console.log('✅ Test registration created:', registration.registration_id);
    console.log('   Status:', registration.status);
    console.log('   Payment Status:', registration.payment_status);

    // Now update the registration to simulate payment completion
    console.log('\n2️⃣ Updating registration to completed status...');
    const { data: updated, error: updateError } = await supabase
      .from('registrations')
      .update({
        status: 'completed',
        payment_status: 'completed',
        total_amount_paid: 10.34,
        stripe_payment_intent_id: 'pi_test_' + Date.now(),
        updated_at: new Date().toISOString()
      })
      .eq('registration_id', registration.registration_id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Update failed with error:', updateError);
      console.error('   Error code:', updateError.code);
      console.error('   Error message:', updateError.message);
      console.error('   Error details:', updateError.details);
      console.error('   Error hint:', updateError.hint);
      
      // Clean up test registration
      await supabase
        .from('registrations')
        .delete()
        .eq('registration_id', registration.registration_id);
      
      return;
    }

    console.log('✅ Registration updated successfully!');
    console.log('   Registration ID:', updated.registration_id);
    console.log('   Status:', updated.status);
    console.log('   Payment Status:', updated.payment_status);
    console.log('   Total Amount Paid:', updated.total_amount_paid);

    // Check if webhook was logged
    console.log('\n3️⃣ Checking webhook logs...');
    const { data: webhookLogs, error: webhookError } = await supabase
      .from('webhook_logs')
      .select('*')
      .eq('record_id', registration.registration_id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (!webhookError && webhookLogs && webhookLogs.length > 0) {
      console.log('✅ Webhook logged successfully:');
      console.log('   Webhook ID:', webhookLogs[0].webhook_id);
      console.log('   Table:', webhookLogs[0].table_name);
      console.log('   Operation:', webhookLogs[0].operation);
      console.log('   Status:', webhookLogs[0].status);
      console.log('   Payload:', JSON.stringify(webhookLogs[0].payload, null, 2));
    } else {
      console.log('⚠️  No webhook logs found (this might be expected if net.http_post is not available locally)');
    }

    // Clean up test data
    console.log('\n4️⃣ Cleaning up test data...');
    
    // Delete webhook logs if any
    if (webhookLogs && webhookLogs.length > 0) {
      await supabase
        .from('webhook_logs')
        .delete()
        .eq('record_id', registration.registration_id);
    }
    
    // Delete test registration
    const { error: deleteError } = await supabase
      .from('registrations')
      .delete()
      .eq('registration_id', registration.registration_id);

    if (deleteError) {
      console.error('⚠️  Failed to clean up test registration:', deleteError.message);
    } else {
      console.log('✅ Test data cleaned up successfully');
    }
    
    // Clean up test user
    const { error: userDeleteError } = await supabase.auth.admin.deleteUser(testUserId);
    if (userDeleteError) {
      console.error('⚠️  Failed to clean up test user:', userDeleteError.message);
    } else {
      console.log('✅ Test user cleaned up successfully');
    }

    console.log('\n🎉 Payment update test completed successfully! The NEW.registration_id fix is working.');

  } catch (error) {
    console.error('❌ Test failed with unexpected error:', error);
  }
}

// Run the test
testPaymentUpdate();