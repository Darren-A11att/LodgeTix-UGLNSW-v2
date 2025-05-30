#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkTables() {
  console.log('📊 Checking Table Access...\n')

  const tablesToCheck = [
    'events',
    'registrations', 
    'attendees',
    'tickets',
    'email_log',
    'email_logs',
    'stripe_connected_accounts',
    'organisations'
  ]

  for (const table of tablesToCheck) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(0)
      if (error) {
        console.log(`❌ ${table}: ${error.message}`)
      } else {
        console.log(`✅ ${table}: accessible`)
      }
    } catch (e: any) {
      console.log(`❌ ${table}: ${e.message}`)
    }
  }
}

checkTables()