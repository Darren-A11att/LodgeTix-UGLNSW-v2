#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function testRegistrationFlow() {
  console.log('🎫 Testing Registration Flow Integration...\n')

  const results = {
    dataFlow: { passed: 0, failed: 0 },
    fieldNames: { passed: 0, failed: 0 },
    relationships: { passed: 0, failed: 0 }
  }

  try {
    // 1. Test Events Data Structure
    console.log('📅 Testing Events Data Structure...')
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .limit(1)

    if (eventsError) throw eventsError

    if (events && events.length > 0) {
      const event = events[0]
      
      // Check for new field names
      const expectedFields = [
        'event_id',
        'event_name',
        'event_date',
        'event_type',
        'is_published',
        'organisation_id',
        'location_id'
      ]

      expectedFields.forEach(field => {
        if (field in event) {
          results.fieldNames.passed++
          console.log(`  ✅ ${field} - present`)
        } else {
          results.fieldNames.failed++
          console.log(`  ❌ ${field} - missing`)
        }
      })
    }

    // 2. Test Registrations Structure
    console.log('\n📝 Testing Registrations Structure...')
    const { data: registrations, error: regError } = await supabase
      .from('registrations')
      .select('*')
      .limit(1)

    if (regError) throw regError

    if (registrations && registrations.length > 0) {
      const reg = registrations[0]
      
      const regFields = [
        'registration_id',
        'event_id',
        'registration_type',
        'registration_status',
        'payment_status',
        'stripe_payment_intent_id'
      ]

      regFields.forEach(field => {
        if (field in reg) {
          results.fieldNames.passed++
          console.log(`  ✅ ${field} - present`)
        } else {
          results.fieldNames.failed++
          console.log(`  ❌ ${field} - missing`)
        }
      })
    }

    // 3. Test Attendees Structure
    console.log('\n👥 Testing Attendees Structure...')
    const { data: attendees, error: attError } = await supabase
      .from('attendees')
      .select('*')
      .limit(1)

    if (attError) throw attError

    if (attendees && attendees.length > 0) {
      const attendee = attendees[0]
      
      const attFields = [
        'attendee_id',
        'registration_id',
        'attendee_type',
        'is_partner',
        'is_primary',
        'diet_req'
      ]

      attFields.forEach(field => {
        if (field in attendee) {
          results.fieldNames.passed++
          console.log(`  ✅ ${field} - present`)
        } else {
          results.fieldNames.failed++
          console.log(`  ❌ ${field} - missing`)
        }
      })
    }

    // 4. Test Relationships
    console.log('\n🔗 Testing Table Relationships...')
    
    // Test event -> registrations relationship
    const { data: eventWithRegs, error: relError1 } = await supabase
      .from('events')
      .select(`
        event_id,
        event_name,
        registrations (
          registration_id,
          registration_type
        )
      `)
      .limit(1)

    if (!relError1) {
      results.relationships.passed++
      console.log('  ✅ events -> registrations relationship works')
    } else {
      results.relationships.failed++
      console.log(`  ❌ events -> registrations: ${relError1.message}`)
    }

    // Test registration -> attendees relationship
    const { data: regWithAttendees, error: relError2 } = await supabase
      .from('registrations')
      .select(`
        registration_id,
        attendees (
          attendee_id,
          attendee_type
        )
      `)
      .limit(1)

    if (!relError2) {
      results.relationships.passed++
      console.log('  ✅ registrations -> attendees relationship works')
    } else {
      results.relationships.failed++
      console.log(`  ❌ registrations -> attendees: ${relError2.message}`)
    }

    // 5. Test Stripe Integration Fields
    console.log('\n💳 Testing Stripe Integration Fields...')
    const { data: orgs, error: orgError } = await supabase
      .from('organisations')
      .select('organisation_id, stripe_account_id')
      .limit(1)

    if (!orgError && orgs) {
      results.fieldNames.passed++
      console.log('  ✅ organisations.stripe_account_id field exists')
    } else {
      results.fieldNames.failed++
      console.log('  ❌ organisations.stripe_account_id field missing')
    }

  } catch (error: any) {
    console.error('❌ Test failed:', error.message)
    results.dataFlow.failed++
  }

  // Summary
  console.log('\n📊 Registration Flow Integration Summary:')
  console.log(`Field Names: ${results.fieldNames.passed} passed, ${results.fieldNames.failed} failed`)
  console.log(`Relationships: ${results.relationships.passed} passed, ${results.relationships.failed} failed`)
  console.log(`Data Flow: ${results.dataFlow.passed} passed, ${results.dataFlow.failed} failed`)

  const totalFailed = results.fieldNames.failed + results.relationships.failed + results.dataFlow.failed
  return totalFailed === 0
}

// Run test
testRegistrationFlow().then(success => {
  if (success) {
    console.log('\n✅ Registration flow integration test passed')
    process.exit(0)
  } else {
    console.log('\n❌ Registration flow integration test failed')
    process.exit(1)
  }
})