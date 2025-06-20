#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required')
  process.exit(1)
}

async function applySchema() {
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  console.log('Applying website schema manually...\n')
  
  // First, let's check if the schema exists
  const { data: schemaCheck, error: checkError } = await supabase.rpc('to_regclass', {
    relation: 'website.meta_tags'
  })
  
  if (schemaCheck === null) {
    console.log('Website schema not found, reading migration file...')
    
    // Read the migration file
    const migrationPath = path.join(process.cwd(), 'supabase/migrations/20250606000001_create_website_schema.sql')
    const migrationContent = fs.readFileSync(migrationPath, 'utf-8')
    
    // Split into statements and execute
    const statements = migrationContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))
    
    console.log(`Found ${statements.length} SQL statements to execute`)
    
    // Execute CREATE SCHEMA first
    const schemaStatement = statements.find(s => s.includes('CREATE SCHEMA'))
    if (schemaStatement) {
      console.log('Creating schema...')
      const { error } = await supabase.rpc('exec_sql', {
        query: schemaStatement + ';'
      }).single()
      
      if (error) {
        console.error('Error creating schema:', error)
      } else {
        console.log('✅ Schema created')
      }
    }
  } else {
    console.log('✅ Website schema already exists')
  }
  
  // Now verify
  const { count, error } = await supabase
    .from('website.meta_tags')
    .select('*', { count: 'exact', head: true })
    
  if (error) {
    console.error('Still cannot access website.meta_tags:', error)
  } else {
    console.log(`✅ website.meta_tags table accessible (${count} records)`)
  }
}

applySchema()