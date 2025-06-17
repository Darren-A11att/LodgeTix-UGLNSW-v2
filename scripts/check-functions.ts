#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required')
  process.exit(1)
}

async function checkFunctions() {
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  console.log('Checking functions in local database...\n')
  
  const { data, error } = await supabase
    .from('functions')
    .select('function_id, name, slug, is_published')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error:', error)
    return
  }
  
  if (!data || data.length === 0) {
    console.log('No functions found in database')
    console.log('\nYou need to create a function first!')
    return
  }
  
  console.log('Functions found:')
  data.forEach(func => {
    console.log(`- ${func.name}`)
    console.log(`  ID: ${func.function_id}`)
    console.log(`  Slug: ${func.slug}`)
    console.log(`  Published: ${func.is_published}`)
    console.log('')
  })
}

checkFunctions()