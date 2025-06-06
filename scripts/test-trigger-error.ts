import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testTriggerError() {
  console.log('🔍 Testing trigger error isolation...\n');

  try {
    // Check if the trigger function exists
    console.log('1️⃣ Checking database functions...');
    const { data: functions, error: funcError } = await supabase
      .rpc('pg_proc')
      .select('proname')
      .like('proname', '%should_generate_confirmation%');
    
    console.log('Functions found:', functions);

    // Check if the trigger exists
    console.log('\n2️⃣ Checking database triggers...');
    const { data: triggers, error: trigError } = await supabase
      .from('information_schema.triggers')
      .select('trigger_name, event_object_table, action_statement')
      .eq('event_object_table', 'registrations');
    
    if (triggers) {
      console.log('Triggers on registrations table:');
      triggers.forEach(t => {
        console.log(`  - ${t.trigger_name}: ${t.action_statement}`);
      });
    }

    // Look at the webhook_logs table structure
    console.log('\n3️⃣ Checking webhook_logs table structure...');
    const { data: columns, error: colError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'webhook_logs')
      .order('ordinal_position');
    
    if (columns) {
      console.log('webhook_logs columns:');
      columns.forEach(c => {
        console.log(`  - ${c.column_name} (${c.data_type})`);
      });
    }

    // Note: Can't easily get function definition through Supabase client
    console.log('\n4️⃣ Function definition check skipped (requires direct SQL access)');

  } catch (error) {
    console.error('❌ Error during investigation:', error);
  }
}

// Run the test
testTriggerError();