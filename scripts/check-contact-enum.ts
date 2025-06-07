import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pwwpcjbbxotmiqrisjvf.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3d3BjamJieG90bWlxcmlzanZmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTU0ODU2OCwiZXhwIjoyMDYxMTI0NTY4fQ.pJ3CEbhkGpWX8mYL-AyJKahsZywuRz6PkQmnNuLYsZk';

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