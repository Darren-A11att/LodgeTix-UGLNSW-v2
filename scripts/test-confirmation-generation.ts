#!/usr/bin/env node
/**
 * Test script for confirmation generation edge function
 * Usage: npx tsx scripts/test-confirmation-generation.ts
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testConfirmationGeneration() {
  console.log('🧪 Testing Confirmation Generation Edge Function')
  console.log('='.repeat(50))

  try {
    // 1. Find a test registration or create one
    const { data: testRegistration, error: findError } = await supabase
      .from('registrations')
      .select('*')
      .eq('status', 'pending')
      .limit(1)
      .single()

    if (findError || !testRegistration) {
      console.error('❌ No pending registration found for testing')
      console.log('Please create a test registration first')
      return
    }

    console.log(`✅ Found test registration: ${testRegistration.id}`)
    console.log(`   Type: ${testRegistration.registration_type}`)
    console.log(`   Current status: ${testRegistration.status}`)
    console.log(`   Payment status: ${testRegistration.payment_status}`)

    // 2. Simulate payment completion
    console.log('\n📝 Simulating payment completion...')
    const { error: updateError } = await supabase
      .from('registrations')
      .update({
        status: 'completed',
        payment_status: 'completed',
        stripe_payment_intent_id: 'pi_test_' + Date.now()
      })
      .eq('id', testRegistration.id)

    if (updateError) {
      console.error('❌ Failed to update registration:', updateError)
      return
    }

    console.log('✅ Registration marked as completed')

    // 3. Wait for webhook processing
    console.log('\n⏳ Waiting for webhook processing (5 seconds)...')
    await new Promise(resolve => setTimeout(resolve, 5000))

    // 4. Check if confirmation number was generated
    const { data: updatedRegistration, error: checkError } = await supabase
      .from('registrations')
      .select('confirmation_number, confirmation_generated_at')
      .eq('id', testRegistration.id)
      .single()

    if (checkError) {
      console.error('❌ Failed to check registration:', checkError)
      return
    }

    if (!updatedRegistration.confirmation_number) {
      console.error('❌ Confirmation number was not generated')
      console.log('\nPossible issues:')
      console.log('- Webhook not configured')
      console.log('- Edge function not deployed')
      console.log('- Edge function error (check logs)')
      return
    }

    console.log('✅ Confirmation number generated:', updatedRegistration.confirmation_number)
    console.log('   Generated at:', new Date(updatedRegistration.confirmation_generated_at).toLocaleString())

    // 5. Check webhook logs if available
    const { data: webhookLogs } = await supabase
      .from('webhook_logs')
      .select('*')
      .eq('record_id', testRegistration.id)
      .order('created_at', { ascending: false })
      .limit(1)

    if (webhookLogs && webhookLogs.length > 0) {
      console.log('\n📊 Webhook Log:')
      console.log('   Status:', webhookLogs[0].status_code || 'N/A')
      console.log('   Response:', JSON.stringify(webhookLogs[0].response, null, 2))
    }

    // 6. Reset test registration (optional)
    console.log('\n🔄 Resetting test registration...')
    await supabase
      .from('registrations')
      .update({
        status: 'pending',
        payment_status: 'pending',
        confirmation_number: null,
        confirmation_generated_at: null
      })
      .eq('id', testRegistration.id)

    console.log('\n✅ Test completed successfully!')

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run edge function logs check
async function checkEdgeFunctionLogs() {
  console.log('\n📋 Checking Edge Function Logs...')
  console.log('Run this command to see logs:')
  console.log('supabase functions logs generate-confirmation --limit 10')
}

// Main execution
async function main() {
  await testConfirmationGeneration()
  await checkEdgeFunctionLogs()
}

main().catch(console.error)