#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-01-27.acacia'
})

async function testWorkingFeatures() {
  console.log('✅ Testing Currently Working Features...\n')

  const results = {
    database: { passed: 0, failed: 0 },
    stripe: { passed: 0, failed: 0 },
    integration: { passed: 0, failed: 0 }
  }

  // 1. Test Core Database Tables
  console.log('📊 Testing Core Database Tables...')
  const coreTables = ['events', 'registrations', 'attendees', 'tickets', 'organisations']
  
  for (const table of coreTables) {
    const { error } = await supabase.from(table).select('*').limit(1)
    if (!error) {
      results.database.passed++
      console.log(`  ✅ ${table} table accessible`)
    } else {
      results.database.failed++
      console.log(`  ❌ ${table}: ${error.message}`)
    }
  }

  // 2. Test Stripe Integration
  console.log('\n💳 Testing Stripe Integration...')
  try {
    // Test payment intent creation with full metadata
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 50000, // $500.00
      currency: 'aud',
      metadata: {
        registration_id: 'test-123',
        event_id: 'event-456',
        event_name: 'Grand Installation 2025',
        organiser_id: 'org-789',
        attendee_count: '2',
        registrant_name: 'John Smith',
        registrant_email: 'john@example.com',
        registration_type: 'individual'
      },
      description: 'Grand Installation 2025 - Individual Registration (2 attendees)'
    })

    results.stripe.passed++
    console.log(`  ✅ Created payment intent: ${paymentIntent.id}`)
    console.log(`     Amount: $${(paymentIntent.amount / 100).toFixed(2)} ${paymentIntent.currency.toUpperCase()}`)
    console.log(`     Metadata fields: ${Object.keys(paymentIntent.metadata).length}`)

    // Cancel it
    await stripe.paymentIntents.cancel(paymentIntent.id)
    results.stripe.passed++
    console.log(`  ✅ Cancelled payment intent successfully`)

  } catch (error: any) {
    results.stripe.failed++
    console.log(`  ❌ Stripe error: ${error.message}`)
  }

  // 3. Test Database Relationships
  console.log('\n🔗 Testing Database Relationships...')
  
  // Test registration with attendees
  const { data: regData, error: regError } = await supabase
    .from('registrations')
    .select(`
      registration_id,
      event_id,
      registration_type,
      attendees (
        attendee_id,
        attendee_type,
        is_primary
      )
    `)
    .limit(1)

  if (!regError) {
    results.integration.passed++
    console.log('  ✅ Registration → Attendees relationship works')
  } else {
    results.integration.failed++
    console.log(`  ❌ Registration → Attendees: ${regError.message}`)
  }

  // 4. Test API Endpoint
  console.log('\n🌐 Testing API Endpoints...')
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/check-tables`)
    if (response.ok) {
      results.integration.passed++
      console.log('  ✅ /api/check-tables endpoint working')
    } else {
      results.integration.failed++
      console.log(`  ❌ /api/check-tables returned ${response.status}`)
    }
  } catch (error: any) {
    results.integration.failed++
    console.log(`  ❌ API error: ${error.message}`)
  }

  // 5. Test Existing Views
  console.log('\n👁️ Testing Existing Views...')
  const views = ['memberships_view', 'auth_user_customer_view']
  
  for (const view of views) {
    const { error } = await supabase.from(view).select('*').limit(1)
    if (!error) {
      results.database.passed++
      console.log(`  ✅ ${view} accessible`)
    } else {
      results.database.failed++
      console.log(`  ❌ ${view}: ${error.message}`)
    }
  }

  // Summary
  console.log('\n\n📊 Working Features Summary:')
  console.log('================================')
  console.log(`Database: ${results.database.passed} passed, ${results.database.failed} failed`)
  console.log(`Stripe: ${results.stripe.passed} passed, ${results.stripe.failed} failed`)
  console.log(`Integration: ${results.integration.passed} passed, ${results.integration.failed} failed`)
  
  const totalPassed = results.database.passed + results.stripe.passed + results.integration.passed
  const totalFailed = results.database.failed + results.stripe.failed + results.integration.failed
  
  console.log(`\nTotal: ${totalPassed} passed, ${totalFailed} failed`)
  
  if (totalFailed === 0) {
    console.log('\n✅ All working features tested successfully!')
    return true
  } else {
    console.log('\n⚠️ Some features have issues')
    return false
  }
}

// Run test
testWorkingFeatures().then(success => {
  process.exit(success ? 0 : 1)
})