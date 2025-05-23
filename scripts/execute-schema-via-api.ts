#!/usr/bin/env node
// Script to execute SQL schema using Supabase Management API

import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN || 'sbp_fb758f011217f94a34045be7cf0a99c4714d466c'
const SUPABASE_PROJECT_REF = process.env.SUPABASE_PROJECT_REF

if (!SUPABASE_PROJECT_REF) {
  console.error('Please set SUPABASE_PROJECT_REF in your .env.local file')
  console.error('You can find this in your Supabase project URL: https://[PROJECT_REF].supabase.co')
  process.exit(1)
}

async function executeSchema() {
  console.log('Reading SQL schema file...')
  
  const schemaPath = path.join(process.cwd(), '.development/events-supabase/01-events-schema-definition.sql')
  const sqlContent = fs.readFileSync(schemaPath, 'utf-8')
  
  console.log('Executing schema via Supabase API...')
  
  const response = await fetch(
    `https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/database/query`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: sqlContent
      })
    }
  )
  
  if (!response.ok) {
    const error = await response.text()
    console.error('Error executing schema:', error)
    process.exit(1)
  }
  
  const result = await response.json()
  console.log('Schema executed successfully!')
  console.log('Result:', result)
}

executeSchema()
  .then(() => {
    console.log('Schema execution completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })