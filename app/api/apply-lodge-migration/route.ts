import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import * as fs from 'fs';
import * as path from 'path';

export async function POST() {
  try {
    console.log('🔌 Connecting to Supabase...');
    
    // Create server client with service role
    const supabase = await createClient();
    
    // Read the migration file
    const migrationPath = path.join(process.cwd(), 'supabase/migrations/20250608000107_create_lodge_registration_rpc.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Loaded migration SQL');
    console.log('🚀 Applying lodge registration RPC migration...');

    // Check if function already exists
    const { data: existingFunctions, error: checkError } = await supabase
      .rpc('check_function_exists', { 
        function_name: 'upsert_lodge_registration',
        schema_name: 'public'
      });

    if (checkError) {
      console.log('ℹ️  Function check failed, proceeding with creation...');
    }

    // Since we can't execute arbitrary SQL via the client,
    // return the SQL for manual execution
    return NextResponse.json({
      success: false,
      message: 'Migration SQL ready for manual execution',
      instructions: {
        dashboard: {
          url: 'https://supabase.com/dashboard/project/pwwpcjbbxotmiqrisjvf/sql',
          steps: [
            'Go to the SQL editor in Supabase dashboard',
            'Copy and paste the migration SQL below',
            'Click "Run" to execute'
          ]
        }
      },
      sql: migrationSql
    });

  } catch (error) {
    console.error('❌ Error in migration route:', error);
    return NextResponse.json(
      { 
        error: 'Failed to prepare migration', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}