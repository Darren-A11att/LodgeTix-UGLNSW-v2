#!/usr/bin/env node
// Simple script to migrate hard-coded events to Supabase events.events table

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

// Verify environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗')
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗')
  process.exit(1)
}

// Initialize Supabase client with events schema
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  db: {
    schema: 'events'
  }
})

// Hard-coded events data (from lib/event-utils.ts)
const events = [
  {
    id: "d290f1ee-6c54-4b01-90e6-d701748f0851",
    slug: "third-degree-ceremony",
    title: "Third Degree Ceremony",
    description: "A solemn ceremony raising a Brother to the sublime degree of a Master Mason.",
    date: "October 10, 2023",
    location: "Harmony Lodge No. 123, Manchester",
    imageUrl: "/placeholder.svg?height=200&width=400",
    price: "£20",
    category: "Degree Ceremony",
    status: "Published",
    ticketsSold: 32,
    revenue: "£640",
    dressCode: "Dark Suit",
    regalia: "Craft Regalia",
    degreeType: "Third Degree",
  },
  {
    id: "d290f1ee-6c54-4b01-90e6-d701748f0852",
    slug: "masonic-lecture-series",
    title: "Masonic Lecture Series",
    description: "Learn about the symbolism and history of Freemasonry from distinguished speakers.",
    date: "September 25, 2023",
    location: "Wisdom Lodge No. 456, Birmingham",
    imageUrl: "/placeholder.svg?height=200&width=400",
    price: "£15",
    category: "Lecture",
    status: "Published",
    ticketsSold: 45,
    revenue: "£675",
  },
  {
    id: "d290f1ee-6c54-4b01-90e6-d701748f0853",
    slug: "annual-ladies-night",
    title: "Annual Ladies Night",
    description: "A formal dinner and dance celebrating the partners who support our Masonic journey.",
    date: "October 5, 2023",
    location: "Grand Hotel, Edinburgh",
    imageUrl: "/placeholder.svg?height=200&width=400",
    price: "£75",
    category: "Social Event",
    status: "Draft",
    ticketsSold: 0,
    revenue: "£0",
  },
  {
    id: "d290f1ee-6c54-4b01-90e6-d701748f0854",
    slug: "installation-ceremony",
    title: "Installation Ceremony",
    description: "Join us for the Installation of W.Bro. James Wilson as Worshipful Master of Harmony Lodge No. 123.",
    date: "November 15, 2023",
    location: "Masonic Hall, Manchester",
    imageUrl: "/placeholder.svg?height=400&width=800",
    price: "£30",
    category: "Installation",
    status: "Published",
    ticketsSold: 45,
    revenue: "£1,350",
    dressCode: "Dark Suit",
    regalia: "Craft Regalia",
  },
  {
    id: "d290f1ee-6c54-4b01-90e6-d701748f0855",
    slug: "grand-installation",
    title: "Grand Installation 2025",
    description: "Join us for the Installation of MW Bro Bernie Khristian Albano as Grand Master of the United Grand Lodge of NSW & ACT.",
    date: "May 15-17, 2025",
    location: "Sydney Masonic Centre, Sydney",
    imageUrl: "/placeholder.svg?height=400&width=800",
    price: "£75",
    category: "Installation",
    status: "Published",
    ticketsSold: 0,
    revenue: "£0",
    dressCode: "Morning Suit or Dark Lounge Suit",
    regalia: "Full Regalia according to rank",
  },
]

async function migrateEvents() {
  console.log('Starting event migration to events.events table...')
  console.log(`Found ${events.length} events to migrate`)

  let successCount = 0
  let errorCount = 0

  for (const event of events) {
    try {
      console.log(`\nMigrating: ${event.title} (${event.slug})`)
      
      // Parse the date and create proper timestamps
      const eventDate = new Date(event.date)
      const eventStart = new Date(eventDate)
      eventStart.setHours(19, 0) // Default 7 PM start
      
      const eventEnd = new Date(eventDate)
      eventEnd.setHours(22, 0) // Default 10 PM end
      
      // For multi-day events
      if (event.date.includes('-')) {
        const dates = event.date.split('-')
        const endDate = new Date(dates[1] + ', ' + dates[2])
        eventEnd.setTime(endDate.getTime())
      }
      
      const eventData = {
        id: event.id,
        slug: event.slug,
        title: event.title,
        description: event.description,
        event_start: eventStart.toISOString(),
        event_end: eventEnd.toISOString(),
        location: {
          name: event.location,
          address: null,
          city: null,
          state: null,
          postal_code: null,
          country: null
        },
        category: event.category,
        type: event.category,
        degree_type: event.degreeType,
        dress_code: event.dressCode,
        regalia: event.regalia,
        image_url: event.imageUrl,
        is_published: event.status === 'Published',
        featured: event.category === 'Installation' || event.slug === 'grand-installation',
        legacy_id: event.id
      }
      
      // Insert into events.events
      const { data, error } = await supabase
        .from('events')
        .upsert(eventData, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        })
        .select()
        .single()
      
      if (error) {
        console.error(`Error: ${error.message}`)
        errorCount++
      } else {
        console.log(`Success: Event migrated with ID ${data.id}`)
        successCount++
      }
      
    } catch (err) {
      console.error(`Failed to process ${event.title}:`, err)
      errorCount++
    }
  }
  
  console.log('\n=== Migration Summary ===')
  console.log(`Total events: ${events.length}`)
  console.log(`Successfully migrated: ${successCount}`)
  console.log(`Errors: ${errorCount}`)
  
  if (errorCount === 0) {
    console.log('\n✅ Migration completed successfully!')
  } else {
    console.log('\n⚠️  Migration completed with errors')
  }
}

// Run the migration
migrateEvents()
  .then(() => {
    console.log('\nMigration script finished')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\nFatal error:', error)
    process.exit(1)
  })