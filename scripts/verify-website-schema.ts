#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required')
  process.exit(1)
}

async function verifySchema() {
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  console.log('Verifying website schema in local database...\n')
  
  // Check if website schema exists
  const { data: schemas, error: schemaError } = await supabase
    .rpc('current_schemas')
    .select('schema_name')
    
  if (schemaError) {
    // Try a different approach
    const { data, error } = await supabase
      .from('website.meta_tags')
      .select('count')
      .limit(0)
      
    if (error) {
      console.error('❌ Website schema not found:', error.message)
      return
    }
  }
  
  console.log('✅ Website schema exists')
  
  // Check each table
  const tables = [
    'meta_tags',
    'hero_sections',
    'sponsors',
    'sponsor_sections',
    'location_info',
    'cta_sections',
    'navigation_links',
    'footer_content',
    'scripts'
  ]
  
  console.log('\nChecking tables:')
  for (const table of tables) {
    const { count, error } = await supabase
      .from(`website.${table}`)
      .select('*', { count: 'exact', head: true })
      
    if (error) {
      console.log(`❌ ${table}: Error - ${error.message}`)
    } else {
      console.log(`✅ ${table}: ${count || 0} records`)
    }
  }
}

verifySchema()