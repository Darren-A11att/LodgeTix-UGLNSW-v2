import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pwwpcjbbxotmiqrisjvf.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function quickTest() {
  console.log('🧪 Quick Lodge Registration Test...');
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  try {
    const testCustomerId = 'e88225e7-23b7-4faa-881c-734486852990';
    
    const { data, error } = await supabase.rpc('upsert_lodge_registration', {
      p_function_id: 'eebddef5-6833-43e3-8d32-700508b1c089',
      p_package_id: '794841e4-5f04-4899-96e2-c0afece4d5f2',
      p_table_count: 1,
      p_booking_contact: {
        title: 'Bro',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        mobile: '0400123456',
        authUserId: testCustomerId
      },
      p_lodge_details: {
        lodgeName: 'Test Lodge No. 999',
        lodge_id: '11c66ae7-763d-2a2a-d226-10415d997a84'
      },
      p_payment_status: 'pending',
      p_total_amount: 1950,
      p_subtotal: 1900,
      p_stripe_fee: 50
    });

    if (error) {
      console.error('❌ Error:', error);
    } else {
      console.log('✅ Success!');
      console.log('📄 Result:', JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error('💥 Exception:', err);
  }
}

quickTest().then(() => process.exit(0)).catch((err) => {
  console.error('💥 Fatal:', err);
  process.exit(1);
});