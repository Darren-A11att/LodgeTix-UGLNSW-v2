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

async function checkDatabaseState() {
  console.log('📊 Checking Database State...\n')

  // Check what tables exist
  const { data: tables, error: tablesError } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .order('table_name')

  if (tablesError) {
    console.error('Error fetching tables:', tablesError)
    return
  }

  console.log('📋 Existing Tables:')
  tables?.forEach(t => console.log(`  - ${t.table_name}`))

  // Check what views exist
  const { data: views, error: viewsError } = await supabase
    .from('information_schema.views')
    .select('table_name')
    .eq('table_schema', 'public')
    .order('table_name')

  if (viewsError) {
    console.error('Error fetching views:', viewsError)
    return
  }

  console.log('\n👁️ Existing Views:')
  views?.forEach(v => console.log(`  - ${v.table_name}`))

  // Check what functions exist
  const { data: functions, error: functionsError } = await supabase
    .from('information_schema.routines')
    .select('routine_name')
    .eq('routine_schema', 'public')
    .eq('routine_type', 'FUNCTION')
    .order('routine_name')

  if (functionsError) {
    console.error('Error fetching functions:', functionsError)
    return
  }

  console.log('\n🔧 Existing Functions:')
  functions?.forEach(f => console.log(`  - ${f.routine_name}`))
}

checkDatabaseState()