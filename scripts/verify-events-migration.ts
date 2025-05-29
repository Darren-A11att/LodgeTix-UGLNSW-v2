#!/usr/bin/env node
// Script to verify events in database
// Note: Hard-coded events have been removed from the system

import { createClient } from '@supabase/supabase-js'
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

async function verifyDatabaseEvents() {
  console.log('Verifying events in database...\n')
  
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
  
  // Display all events
  if (dbEvents && dbEvents.length > 0) {
    console.log('Events in database:')
    dbEvents.forEach(event => {
      console.log(`  ✅ ${event.title} (${event.slug || event.id})`)
      console.log(`     - Status: ${event.status || 'N/A'}`)
      console.log(`     - Date: ${event.date || event.event_start || 'Not set'}`)
      console.log(`     - Featured: ${event.featured ? 'Yes' : 'No'}`)
    })
  } else {
    console.log('⚠️  No events found in database')
  }
  
  console.log('\n=== Database Summary ===')
  console.log(`Total events: ${dbEvents?.length || 0}`)
  
  if (dbEvents && dbEvents.length > 0) {
    const publishedCount = dbEvents.filter(e => e.status === 'published').length
    const featuredCount = dbEvents.filter(e => e.featured).length
    console.log(`Published events: ${publishedCount}`)
    console.log(`Featured events: ${featuredCount}`)
  }
}

// Run verification
verifyDatabaseEvents()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })