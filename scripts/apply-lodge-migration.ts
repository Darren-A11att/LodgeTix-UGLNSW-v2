import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function applyLodgeMigration() {
  console.log('🔌 Connecting to Supabase...');
  
  // Create admin client
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // Read the migration file
    const migrationPath = path.join(process.cwd(), 'supabase/migrations/20250608000107_create_lodge_registration_rpc.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Loaded migration SQL');
    console.log('🚀 Applying lodge registration RPC migration...');

    // Execute the migration SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSql
    });

    if (error) {
      // If the rpc doesn't exist, try direct SQL execution
      console.log('📝 Trying direct SQL execution...');
      const { error: directError } = await supabase
        .from('_supabase_migrations')
        .select('*')
        .limit(1);
      
      if (directError) {
        console.error('❌ Database connection failed:', directError);
        return;
      }

      // Since we can't execute arbitrary SQL via the client, 
      // we'll provide instructions for manual execution
      console.log('⚠️  Direct SQL execution not available via client API');
      console.log('📋 Please run the following SQL in your Supabase Dashboard:');
      console.log('🔗 https://supabase.com/dashboard/project/pwwpcjbbxotmiqrisjvf/sql');
      console.log('\n--- SQL TO RUN ---');
      console.log(migrationSql);
      console.log('--- END SQL ---\n');
      
      return;
    }

    console.log('✅ Migration applied successfully!');
    
    // Verify the function was created
    const { data: functions, error: verifyError } = await supabase
      .rpc('verify_function_exists', { function_name: 'upsert_lodge_registration' });
      
    if (!verifyError && functions) {
      console.log('✅ Function verification successful');
    } else {
      console.log('ℹ️  Function verification not available, but migration likely succeeded');
    }

  } catch (error) {
    console.error('❌ Error applying migration:', error);
  }
}

// Run the migration
applyLodgeMigration().then(() => {
  console.log('🏁 Migration process completed');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});