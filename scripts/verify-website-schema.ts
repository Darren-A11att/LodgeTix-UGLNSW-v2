#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'

async function verifySchema() {
  const supabase = createClient(
    'http://127.0.0.1:54321',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
  )
  
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