#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'

async function checkFunctions() {
  const supabase = createClient(
    'http://127.0.0.1:54321',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
  )
  
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