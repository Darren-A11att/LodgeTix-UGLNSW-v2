#!/usr/bin/env node
// Script to verify that events migration was successful

import { createClient } from '@supabase/supabase-js'
import { getEvents as getHardCodedEvents } from '../lib/event-utils'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  db: {
    schema: 'events'
  }
})

async function verifyMigration() {
  console.log('Verifying event migration...\n')
  
  // Get hard-coded events
  const hardCodedEvents = getHardCodedEvents()
  console.log(`Found ${hardCodedEvents.length} hard-coded events`)
  
  // Get database events
  const { data: dbEvents, error } = await supabase
    .from('events')
    .select('*')
    .order('created_at')
  
  if (error) {
    console.error('Error fetching events from database:', error)
    process.exit(1)
  }
  
  console.log(`Found ${dbEvents?.length || 0} events in database\n`)
  
  // Compare each hard-coded event with database
  let missingCount = 0
  let mismatchCount = 0
  
  for (const hcEvent of hardCodedEvents) {
    const dbEvent = dbEvents?.find(e => e.slug === hcEvent.slug || e.id === hcEvent.id)
    
    if (!dbEvent) {
      console.error(`❌ Missing: ${hcEvent.title} (${hcEvent.slug})`)
      missingCount++
    } else {
      // Check key fields
      const mismatches = []
      
      if (dbEvent.title !== hcEvent.title) {
        mismatches.push(`title: "${dbEvent.title}" vs "${hcEvent.title}"`)
      }
      
      if (dbEvent.description !== hcEvent.description) {
        mismatches.push('description differs')
      }
      
      if (mismatches.length > 0) {
        console.warn(`⚠️  Mismatch: ${hcEvent.title}`)
        console.warn(`   Issues: ${mismatches.join(', ')}`)
        mismatchCount++
      } else {
        console.log(`✅ Verified: ${hcEvent.title}`)
      }
    }
  }
  
  console.log('\n=== Verification Summary ===')
  console.log(`Total hard-coded events: ${hardCodedEvents.length}`)
  console.log(`Total database events: ${dbEvents?.length || 0}`)
  console.log(`Missing events: ${missingCount}`)
  console.log(`Mismatched events: ${mismatchCount}`)
  
  if (missingCount === 0 && mismatchCount === 0) {
    console.log('\n✅ All events successfully migrated!')
  } else {
    console.log('\n⚠️  Some issues found - please review above')
  }
  
  // Show database events not in hard-coded list
  const extraEvents = dbEvents?.filter(db => 
    !hardCodedEvents.find(hc => hc.slug === db.slug || hc.id === db.id)
  )
  
  if (extraEvents && extraEvents.length > 0) {
    console.log('\nAdditional events in database:')
    extraEvents.forEach(event => {
      console.log(`  - ${event.title} (${event.slug})`)
    })
  }
}

// Run verification
verifyMigration()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })