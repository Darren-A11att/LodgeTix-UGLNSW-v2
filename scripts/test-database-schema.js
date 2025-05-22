#!/usr/bin/env node

/**
 * Test Database Schema Script
 * 
 * This script tests the database schema to verify the migration was successful
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTable(tableName) {
  try {
    console.log(`\n🔍 Testing table: ${tableName}`);
    
    // Try to select from the table
    const { data, error, count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact' })
      .limit(1);
    
    if (error) {
      console.log(`❌ Error: ${error.message}`);
      return false;
    }
    
    console.log(`✅ Table exists, ${count || 0} rows`);
    if (data && data.length > 0) {
      console.log(`📄 Sample columns: ${Object.keys(data[0]).join(', ')}`);
    }
    return true;
  } catch (error) {
    console.log(`❌ Exception: ${error.message}`);
    return false;
  }
}

async function testDatabaseSchema() {
  console.log('🚀 Testing database schema after migration...\n');
  
  const tablesToTest = [
    'events',
    'registrations', 
    'customers',
    'tickets',
    'attendees',
    'eventtickets',
    'masonicprofiles',
    'displayscopes'
  ];
  
  let successCount = 0;
  
  for (const table of tablesToTest) {
    const success = await testTable(table);
    if (success) successCount++;
  }
  
  console.log(`\n📊 Schema Test Results:`);
  console.log(`   Tables tested: ${tablesToTest.length}`);
  console.log(`   Tables accessible: ${successCount}`);
  console.log(`   Tables missing: ${tablesToTest.length - successCount}`);
  
  if (successCount === tablesToTest.length) {
    console.log('\n🎉 All tables accessible! Migration appears successful.');
  } else {
    console.log('\n⚠️  Some tables are not accessible. Check your database migration.');
  }
}

testDatabaseSchema().catch(console.error);