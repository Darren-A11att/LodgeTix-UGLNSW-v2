#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Load environment variables - try multiple locations
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Try .env first, then .env.local
dotenv.config({ path: join(__dirname, '../.env') })
dotenv.config({ path: join(__dirname, '../.env.local') })

// Check required environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables')
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local')
  process.exit(1)
}

// Create Supabase client with service role key for full access
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkExistingData() {
  console.log('🔍 Checking existing data in Supabase database...\n')

  try {
    // 1. Check Events
    console.log('📅 EVENTS:')
    console.log('=' .repeat(80))
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, title, slug, parent_event_id, event_start, event_end, is_published, is_purchasable_individually')
      .order('event_start', { ascending: true })

    if (eventsError) {
      console.error('Error fetching events:', eventsError.message)
    } else {
      console.log(`Found ${events?.length || 0} events:`)
      
      // Separate parent and child events
      const parentEvents = events?.filter(e => !e.parent_event_id) || []
      const childEvents = events?.filter(e => e.parent_event_id) || []
      
      console.log(`\n  Parent Events (${parentEvents.length}):`)
      parentEvents.forEach(event => {
        console.log(`    - ${event.title} (${event.slug})`)
        console.log(`      ID: ${event.id}`)
        console.log(`      Dates: ${event.event_start} to ${event.event_end}`)
        console.log(`      Published: ${event.is_published ? 'Yes' : 'No'}`)
        
        // Find child events
        const children = childEvents.filter(c => c.parent_event_id === event.id)
        if (children.length > 0) {
          console.log(`      Child Events (${children.length}):`)
          children.forEach(child => {
            console.log(`        - ${child.title} (${child.slug})`)
          })
        }
        console.log('')
      })
      
      console.log(`\n  Standalone Events (${childEvents.filter(e => !parentEvents.find(p => p.id === e.parent_event_id)).length}):`)
      childEvents
        .filter(e => !parentEvents.find(p => p.id === e.parent_event_id))
        .forEach(event => {
          console.log(`    - ${event.title} (${event.slug})`)
          console.log(`      Parent ID: ${event.parent_event_id}`)
        })
    }

    // 2. Check Ticket Definitions
    console.log('\n\n🎫 TICKET DEFINITIONS:')
    console.log('=' .repeat(80))
    const { data: tickets, error: ticketsError } = await supabase
      .from('ticket_definitions')
      .select('id, name, description, price, event_id, eligibility_attendee_types, is_active')
      .eq('is_active', true)
      .order('name')

    if (ticketsError) {
      console.error('Error fetching tickets:', ticketsError.message)
    } else {
      console.log(`Found ${tickets?.length || 0} active ticket definitions:`)
      
      // Group by event
      const ticketsByEvent = tickets?.reduce((acc, ticket) => {
        const eventId = ticket.event_id || 'No Event'
        if (!acc[eventId]) acc[eventId] = []
        acc[eventId].push(ticket)
        return acc
      }, {} as Record<string, typeof tickets>)
      
      for (const [eventId, eventTickets] of Object.entries(ticketsByEvent || {})) {
        // Try to find event name
        const event = events?.find(e => e.id === eventId)
        console.log(`\n  ${event ? event.title : eventId}:`)
        eventTickets.forEach(ticket => {
          console.log(`    - ${ticket.name}: $${ticket.price}`)
          console.log(`      ${ticket.description || 'No description'}`)
          console.log(`      Eligible: ${ticket.eligibility_attendee_types?.join(', ') || 'All'}`)
        })
      }
    }

    // 3. Check Packages
    console.log('\n\n📦 PACKAGES:')
    console.log('=' .repeat(80))
    const { data: packages, error: packagesError } = await supabase
      .from('eventpackages')
      .select('*, package_events(event_id)')
      .order('created_at', { ascending: false })

    if (packagesError) {
      console.error('Error fetching packages:', packagesError.message)
    } else {
      console.log(`Found ${packages?.length || 0} packages:`)
      packages?.forEach(pkg => {
        console.log(`\n  - ${pkg.package_id}`)
        console.log(`    Events: ${pkg.package_events?.length || 0}`)
      })
    }

    // 4. Check Registrations
    console.log('\n\n📋 REGISTRATIONS:')
    console.log('=' .repeat(80))
    const { data: registrations, error: registrationsError } = await supabase
      .from('registrations')
      .select('registration_id, created_at, registration_type, payment_status')
      .order('created_at', { ascending: false })
      .limit(10)

    if (registrationsError) {
      console.error('Error fetching registrations:', registrationsError.message)
    } else {
      console.log(`Found ${registrations?.length || 0} recent registrations (showing last 10):`)
      registrations?.forEach(reg => {
        console.log(`  - ${reg.registration_id.substring(0, 8)}... | ${reg.registration_type} | ${reg.payment_status} | ${new Date(reg.created_at).toLocaleDateString()}`)
      })
    }

    // 5. Check Grand Lodges
    console.log('\n\n🏛️ GRAND LODGES:')
    console.log('=' .repeat(80))
    const { data: grandLodges, error: grandLodgesError } = await supabase
      .from('grand_lodges')
      .select('id, name, code, jurisdiction')
      .order('name')

    if (grandLodgesError) {
      console.error('Error fetching grand lodges:', grandLodgesError.message)
    } else {
      console.log(`Found ${grandLodges?.length || 0} grand lodges:`)
      grandLodges?.forEach(gl => {
        console.log(`  - ${gl.name} (${gl.code}) - ${gl.jurisdiction}`)
      })
    }

    // 6. Check Lodges
    console.log('\n\n🏛️ LODGES:')
    console.log('=' .repeat(80))
    const { data: lodges, error: lodgesError } = await supabase
      .from('lodges')
      .select('id, name, number, grand_lodge_id')
      .order('name')
      .limit(20)

    if (lodgesError) {
      console.error('Error fetching lodges:', lodgesError.message)
    } else {
      console.log(`Found ${lodges?.length || 0} lodges (showing first 20):`)
      lodges?.forEach(lodge => {
        console.log(`  - ${lodge.name} #${lodge.number}`)
      })
    }

    console.log('\n✅ Data check complete!\n')

  } catch (error) {
    console.error('❌ Error checking data:', error)
  }
}

// Run the check
checkExistingData()