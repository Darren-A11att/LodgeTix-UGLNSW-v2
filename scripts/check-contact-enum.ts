import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://pwwpcjbbxotmiqrisjvf.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

async function checkContactEnum() {
  console.log('🔍 Checking contact_type enum values...');
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  try {
    // Check if we can get any existing contacts to see valid types
    const { data: contacts, error } = await supabase
      .from('contacts')
      .select('type')
      .limit(5);
    
    if (error) {
      console.error('❌ Error:', error);
    } else {
      console.log('✅ Found contact types in use:', [...new Set(contacts.map(c => c.type))]);
    }
  } catch (err) {
    console.error('💥 Exception:', err);
  }
}

checkContactEnum().then(() => process.exit(0)).catch(err => {
  console.error('💥 Fatal:', err);
  process.exit(1);
});