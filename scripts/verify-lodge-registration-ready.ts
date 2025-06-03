#!/usr/bin/env bun

/**
 * Quick verification script to ensure lodge registration is ready
 * Run this after applying migrations and field mapping fixes
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function verifyLodgeRegistrationReady() {
  console.log('🔍 Verifying Lodge Registration Setup...\n');
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  let allGood = true;
  
  // Check 1: RPC function exists
  console.log('1️⃣ Checking RPC function...');
  try {
    const { data: functions } = await supabase
      .from('information_schema.routines')
      .select('routine_name, routine_definition')
      .eq('routine_schema', 'public')
      .eq('routine_name', 'upsert_lodge_registration')
      .single();
    
    if (functions) {
      console.log('✅ RPC function exists');
      
      // Check if it has the field mapping fixes
      const definition = functions.routine_definition || '';
      if (definition.includes('mobile_number') && definition.includes('billing_phone')) {
        console.log('✅ RPC function has correct field mappings');
      } else {
        console.log('⚠️  RPC function may need updating');
        allGood = false;
      }
    } else {
      console.log('❌ RPC function not found');
      allGood = false;
    }
  } catch (error) {
    console.error('❌ Error checking RPC function:', error);
    allGood = false;
  }
  
  // Check 2: Critical columns exist
  console.log('\n2️⃣ Checking critical database columns...');
  const criticalColumns = [
    'mobile_number',
    'billing_phone',
    'suffix_1',
    'special_needs',
    'address_line_1',
    'address_line_2',
    'suburb_city'
  ];
  
  try {
    const { data: columns } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'contacts')
      .in('column_name', criticalColumns);
    
    const foundColumns = columns?.map(c => c.column_name) || [];
    const missingColumns = criticalColumns.filter(c => !foundColumns.includes(c));
    
    if (missingColumns.length === 0) {
      console.log('✅ All critical columns exist');
    } else {
      console.log('❌ Missing columns:', missingColumns.join(', '));
      allGood = false;
    }
  } catch (error) {
    console.error('❌ Error checking columns:', error);
    allGood = false;
  }
  
  // Check 3: Anonymous auth is enabled
  console.log('\n3️⃣ Checking anonymous auth...');
  try {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (!error && data.user) {
      console.log('✅ Anonymous auth is working');
      await supabase.auth.signOut();
    } else {
      console.log('❌ Anonymous auth failed:', error?.message);
      allGood = false;
    }
  } catch (error) {
    console.error('❌ Error testing anonymous auth:', error);
    allGood = false;
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  if (allGood) {
    console.log('✅ Lodge registration is ready to use!');
    console.log('\nNext steps:');
    console.log('1. Test a complete lodge registration flow');
    console.log('2. Verify payment processing works');
    console.log('3. Check that confirmation emails are sent');
  } else {
    console.log('⚠️  Some issues need attention');
    console.log('\nPlease check:');
    console.log('1. Database migrations have been applied');
    console.log('2. RPC functions are up to date');
    console.log('3. Anonymous auth is enabled in Supabase dashboard');
  }
  
  console.log('\n💡 Tip: If you see any errors above, try:');
  console.log('   - Running: supabase db push');
  console.log('   - Checking Supabase dashboard for migration status');
  console.log('   - Verifying environment variables are set correctly');
}

// Run verification
verifyLodgeRegistrationReady().catch(console.error);