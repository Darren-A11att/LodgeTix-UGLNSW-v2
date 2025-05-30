#!/usr/bin/env tsx

import Stripe from 'stripe'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-01-27.acacia'
})

async function testStripeIntegration() {
  console.log('💳 Testing Stripe Integration...\n')

  const results = {
    config: { passed: 0, failed: 0 },
    connectivity: { passed: 0, failed: 0 },
    webhooks: { passed: 0, failed: 0 }
  }

  // 1. Test configuration
  console.log('🔑 Testing Stripe Configuration...')
  if (process.env.STRIPE_SECRET_KEY) {
    results.config.passed++
    console.log('  ✅ STRIPE_SECRET_KEY configured')
  } else {
    results.config.failed++
    console.log('  ❌ STRIPE_SECRET_KEY missing')
  }

  if (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    results.config.passed++
    console.log('  ✅ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY configured')
  } else {
    results.config.failed++
    console.log('  ❌ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY missing')
  }

  // 2. Test Stripe connectivity
  console.log('\n🌐 Testing Stripe Connectivity...')
  try {
    const account = await stripe.accounts.retrieve()
    results.connectivity.passed++
    console.log(`  ✅ Connected to Stripe account: ${account.id}`)
    console.log(`     Business name: ${account.business_profile?.name || 'Not set'}`)
    console.log(`     Charges enabled: ${account.charges_enabled}`)
  } catch (error: any) {
    results.connectivity.failed++
    console.log(`  ❌ Failed to connect to Stripe: ${error.message}`)
  }

  // 3. Test webhook endpoint configuration
  console.log('\n🔗 Testing Webhook Configuration...')
  if (process.env.STRIPE_WEBHOOK_SECRET) {
    results.webhooks.passed++
    console.log('  ✅ STRIPE_WEBHOOK_SECRET configured')
  } else {
    results.webhooks.failed++
    console.log('  ❌ STRIPE_WEBHOOK_SECRET missing')
  }

  // 4. Test creating a payment intent with metadata
  console.log('\n💰 Testing Payment Intent Creation...')
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 1000, // $10.00
      currency: 'aud',
      metadata: {
        registration_id: 'test-registration-123',
        event_id: 'test-event-456',
        event_name: 'Test Integration Event',
        attendee_count: '1',
        registrant_name: 'Test User',
        registrant_email: 'test@example.com'
      },
      description: 'Integration test payment'
    })

    console.log(`  ✅ Created test payment intent: ${paymentIntent.id}`)
    console.log(`     Amount: $${(paymentIntent.amount / 100).toFixed(2)} ${paymentIntent.currency.toUpperCase()}`)
    console.log(`     Metadata attached: ${Object.keys(paymentIntent.metadata).length} fields`)

    // Cancel it immediately to avoid charges
    await stripe.paymentIntents.cancel(paymentIntent.id)
    console.log(`  ✅ Cancelled test payment intent`)

    results.connectivity.passed++
  } catch (error: any) {
    results.connectivity.failed++
    console.log(`  ❌ Failed to create payment intent: ${error.message}`)
  }

  // Summary
  console.log('\n📊 Stripe Integration Summary:')
  console.log(`Configuration: ${results.config.passed} passed, ${results.config.failed} failed`)
  console.log(`Connectivity: ${results.connectivity.passed} passed, ${results.connectivity.failed} failed`)
  console.log(`Webhooks: ${results.webhooks.passed} passed, ${results.webhooks.failed} failed`)

  const totalFailed = results.config.failed + results.connectivity.failed + results.webhooks.failed
  return totalFailed === 0
}

// Run test
testStripeIntegration().then(success => {
  process.exit(success ? 0 : 1)
})