#!/usr/bin/env node

/**
 * Verify Field Naming Script
 * 
 * This script checks the actual column names in the database to verify
 * the field naming migration was successful
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

async function getTableColumns(tableName) {
  try {
    // Get table structure by selecting with limit 0
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error) {
      console.log(`❌ Error getting columns for ${tableName}: ${error.message}`);
      return [];
    }
    
    // If we have data, get the keys
    if (data && data.length > 0) {
      return Object.keys(data[0]);
    }
    
    // If no data, try to get schema info differently
    // For now, return empty array
    return [];
  } catch (error) {
    console.log(`❌ Exception getting columns for ${tableName}: ${error.message}`);
    return [];
  }
}

async function verifyFieldNaming() {
  console.log('🔍 Verifying field naming conventions...\n');
  
  const tablesToCheck = [
    'events',
    'registrations',
    'customers', 
    'eventtickets'
  ];
  
  for (const tableName of tablesToCheck) {
    console.log(`\n📋 Table: ${tableName}`);
    const columns = await getTableColumns(tableName);
    
    if (columns.length > 0) {
      console.log(`   Columns (${columns.length}):`, columns.join(', '));
      
      // Check for naming convention compliance
      const camelCaseFields = columns.filter(col => /[A-Z]/.test(col));
      const snake_caseFields = columns.filter(col => /^[a-z][a-z0-9_]*$/.test(col));
      
      console.log(`   ✅ snake_case fields: ${snake_caseFields.length}`);
      if (camelCaseFields.length > 0) {
        console.log(`   ⚠️  camelCase fields: ${camelCaseFields.length} - ${camelCaseFields.join(', ')}`);
      }
    } else {
      console.log('   No data available to check columns');
    }
  }
  
  console.log('\n🎯 Field naming verification complete!');
}

verifyFieldNaming().catch(console.error);