#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required')
  process.exit(1)
}

async function createTestFunction() {
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  console.log('Creating test function in local database...\n')
  
  // First check if we need an organisation
  const { data: orgs, error: orgCheckError } = await supabase
    .from('organisations')
    .select('organisation_id')
    .limit(1)
    
  let organisationId
  
  if (!orgs || orgs.length === 0) {
    // Create a test organisation
    const { data: newOrg, error: orgError } = await supabase
      .from('organisations')
      .insert({
        name: 'United Grand Lodge of NSW & ACT',
        type: 'grandlodge',
        city: 'Sydney',
        state: 'NSW'
      })
      .select()
      .single()
      
    if (orgError) {
      console.error('Error creating organisation:', orgError)
      return
    }
    
    organisationId = newOrg.organisation_id
    console.log('✅ Created organisation')
  } else {
    organisationId = orgs[0].organisation_id
  }
  
  // Now create the function with the specific ID
  const { data, error } = await supabase
    .from('functions')
    .insert({
      function_id: 'eebddef5-6833-43e3-8d32-700508b1c089',
      name: 'Grand Proclamation 2025',
      slug: 'grand-proclamation-2025',
      description: 'The most prestigious Masonic event of the year',
      start_date: '2025-03-15T00:00:00Z',
      end_date: '2025-03-17T23:59:59Z',
      is_published: true,
      organiser_id: organisationId
    })
    .select()
    .single()
  
  if (error) {
    console.error('Error creating function:', error)
    return
  }
  
  console.log('✅ Function created successfully!')
  console.log(`   Name: ${data.name}`)
  console.log(`   ID: ${data.function_id}`)
  console.log(`   Slug: ${data.slug}`)
}

createTestFunction()