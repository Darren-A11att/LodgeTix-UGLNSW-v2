import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from '@supabase/supabase-js'
import { 
  WebhookPayload, 
  GenerateConfirmationResponse 
} from './types/webhook.ts'
import { generateConfirmationNumber } from './utils/confirmation-generator.ts'
import { EmailOrchestrator } from './utils/email-orchestrator.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const startTime = Date.now()
  const response: GenerateConfirmationResponse = {
    success: false,
    errors: []
  }

  try {
    // Validate webhook signature (if configured)
    const signature = req.headers.get('x-webhook-signature')
    if (signature && !await validateWebhookSignature(req, signature)) {
      response.errors?.push('Invalid webhook signature')
      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401
      })
    }

    // Parse webhook payload
    const payload: WebhookPayload = await req.json()
    console.log('Webhook received:', {
      type: payload.type,
      table: payload.table,
      registrationId: payload.record?.id
    })

    // Validate this is a registration completion
    if (!isRegistrationCompletion(payload)) {
      console.log('Not a registration completion, skipping')
      response.success = true
      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      })
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Generate confirmation number
    const confirmationNumber = await generateUniqueConfirmationNumber(
      supabase,
      payload.record.registration_type
    )

    // Update registration with confirmation number
    const { error: updateError } = await supabase
      .from('registrations')
      .update({ 
        confirmation_number: confirmationNumber,
        confirmation_generated_at: new Date().toISOString()
      })
      .eq('id', payload.record.id)

    if (updateError) {
      response.errors?.push(`Failed to update confirmation number: ${updateError.message}`)
      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      })
    }

    console.log(`Generated confirmation number: ${confirmationNumber}`)
    response.confirmationNumber = confirmationNumber

    // Orchestrate email sending
    const emailOrchestrator = new EmailOrchestrator(supabase)
    const emailResults = await emailOrchestrator.orchestrateEmails(
      payload.record.id,
      payload.record.registration_type
    )

    response.emailsSent = {
      confirmation: emailResults.confirmation,
      directTickets: emailResults.directTickets,
      primaryContact: emailResults.primaryContact
    }

    if (emailResults.errors.length > 0) {
      response.errors?.push(...emailResults.errors)
    }

    // Success if confirmation was generated, even if some emails failed
    response.success = true

    const duration = Date.now() - startTime
    console.log(`Confirmation generation completed in ${duration}ms`, {
      registrationId: payload.record.id,
      confirmationNumber,
      emailsSent: response.emailsSent,
      errors: response.errors
    })

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error) {
    console.error('Confirmation generation error:', error)
    response.errors?.push(`Unexpected error: ${error.message}`)
    
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})

/**
 * Validates if the webhook payload represents a registration completion
 */
function isRegistrationCompletion(payload: WebhookPayload): boolean {
  if (payload.type !== 'UPDATE' || payload.table !== 'registrations') {
    return false
  }

  const { record, old_record } = payload

  // Check if status changed to completed
  const statusCompleted = record.status === 'completed' && 
    (old_record?.status !== 'completed' || !old_record)

  // Check if payment status is completed
  const paymentCompleted = record.payment_status === 'completed'

  // Check if confirmation number doesn't exist yet
  const noConfirmationYet = !record.confirmation_number && !old_record?.confirmation_number

  return statusCompleted && paymentCompleted && noConfirmationYet
}

/**
 * Generates a unique confirmation number with collision detection
 */
async function generateUniqueConfirmationNumber(
  supabase: ReturnType<typeof createClient>,
  registrationType: 'individual' | 'lodge' | 'delegation'
): Promise<string> {
  const maxAttempts = 10
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const confirmationNumber = generateConfirmationNumber(registrationType)
    
    // Check if this number already exists
    const { data: existing } = await supabase
      .from('registrations')
      .select('id')
      .eq('confirmation_number', confirmationNumber)
      .single()
    
    if (!existing) {
      return confirmationNumber
    }
    
    console.log(`Confirmation number collision detected: ${confirmationNumber}, retrying...`)
  }
  
  throw new Error('Unable to generate unique confirmation number after 10 attempts')
}

/**
 * Validates webhook signature for security
 */
async function validateWebhookSignature(req: Request, signature: string): Promise<boolean> {
  const webhookSecret = Deno.env.get('WEBHOOK_SECRET')
  if (!webhookSecret) {
    console.warn('WEBHOOK_SECRET not configured, skipping signature validation')
    return true
  }

  // Implement signature validation based on your webhook provider
  // This is a placeholder implementation
  const body = await req.text()
  const encoder = new TextEncoder()
  const data = encoder.encode(body)
  const key = encoder.encode(webhookSecret)
  
  // Use Web Crypto API to validate HMAC signature
  // Implementation depends on your webhook provider's signature method
  
  return true // Placeholder
}