#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkActualFields() {
  console.log('🔍 Checking Actual Database Fields...\n')

  // Check Events table
  console.log('📅 Events Table Fields:')
  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('*')
    .limit(1)

  if (!eventsError && events && events.length > 0) {
    Object.keys(events[0]).forEach(key => {
      console.log(`  - ${key}: ${typeof events[0][key]}`)
    })
  }

  // Check Registrations table
  console.log('\n📝 Registrations Table Fields:')
  const { data: registrations, error: regError } = await supabase
    .from('registrations')
    .select('*')
    .limit(1)

  if (!regError && registrations && registrations.length > 0) {
    Object.keys(registrations[0]).forEach(key => {
      console.log(`  - ${key}: ${typeof registrations[0][key]}`)
    })
  }

  // Check Attendees table
  console.log('\n👥 Attendees Table Fields:')
  const { data: attendees, error: attError } = await supabase
    .from('attendees')
    .select('*')
    .limit(1)

  if (!attError && attendees && attendees.length > 0) {
    Object.keys(attendees[0]).forEach(key => {
      console.log(`  - ${key}: ${typeof attendees[0][key]}`)
    })
  }

  // Check Organisations table
  console.log('\n🏢 Organisations Table Fields:')
  const { data: orgs, error: orgError } = await supabase
    .from('organisations')
    .select('*')
    .limit(1)

  if (!orgError && orgs && orgs.length > 0) {
    Object.keys(orgs[0]).forEach(key => {
      console.log(`  - ${key}: ${typeof orgs[0][key]}`)
    })
  }

  // Check Tickets table
  console.log('\n🎫 Tickets Table Fields:')
  const { data: tickets, error: ticketError } = await supabase
    .from('tickets')
    .select('*')
    .limit(1)

  if (!ticketError && tickets && tickets.length > 0) {
    Object.keys(tickets[0]).forEach(key => {
      console.log(`  - ${key}: ${typeof tickets[0][key]}`)
    })
  }
}

checkActualFields()