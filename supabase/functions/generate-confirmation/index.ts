import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { Pool } from "https://deno.land/x/postgres@v0.17.0/mod.ts"
import { 
  WebhookPayload, 
  GenerateConfirmationResponse 
} from './types/webhook.ts'
import { generateConfirmationNumber } from './utils/confirmation-generator.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Create a database pool
const databaseUrl = Deno.env.get('SUPABASE_DB_URL')!
const pool = new Pool(databaseUrl, 3, true)

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

  let client;

  try {
    // Get authorization header
    const authHeader = req.headers.get('authorization')
    
    // Validate that request is authenticated (either via JWT or webhook signature)
    const signature = req.headers.get('x-webhook-signature')
    const isWebhookCall = !!signature
    const isClientCall = !!authHeader && authHeader.startsWith('Bearer ')
    
    if (!isWebhookCall && !isClientCall) {
      response.errors?.push('Unauthorized: Missing authentication')
      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401
      })
    }

    // Parse request body
    const rawPayload = await req.json()
    console.log('Raw webhook payload received:', JSON.stringify(rawPayload, null, 2))
    
    // Normalize the payload to handle different formats
    const payload: WebhookPayload = normalizeWebhookPayload(rawPayload)
    console.log('Normalized webhook payload:', {
      type: payload.type,
      table: payload.table,
      registrationId: payload.record?.registration_id || payload.record?.id
    })

    // Validate this is a registration completion
    if (!isRegistrationCompletion(payload)) {
      console.log('Not a registration completion, skipping')
      response.success = true
      response.message = 'Not a registration completion event'
      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      })
    }

    // Get the registration ID
    const registrationId = payload.record.registration_id || payload.record.id
    if (!registrationId) {
      throw new Error('Missing registration ID in payload')
    }

    // Get a client from the pool
    client = await pool.connect()

    // Check if confirmation number already exists
    const checkResult = await client.queryObject`
      SELECT confirmation_number 
      FROM registrations 
      WHERE registration_id = ${registrationId}
    `

    if (checkResult.rows.length > 0 && checkResult.rows[0].confirmation_number) {
      console.log('Confirmation number already exists:', checkResult.rows[0].confirmation_number)
      response.success = true
      response.confirmationNumber = checkResult.rows[0].confirmation_number
      response.message = 'Confirmation number already generated'
      
      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      })
    }

    // Map database registration type to confirmation generator type
    const mapRegistrationType = (dbType: string): 'individual' | 'lodge' | 'delegation' => {
      switch (dbType) {
        case 'individuals':
          return 'individual'
        case 'lodge':
          return 'lodge'
        case 'delegation':
          return 'delegation'
        default:
          return 'individual' // fallback
      }
    }

    // Generate unique confirmation number with collision detection
    let confirmationNumber: string
    let attempts = 0
    const maxAttempts = 10

    while (attempts < maxAttempts) {
      confirmationNumber = generateConfirmationNumber(
        mapRegistrationType(payload.record.registration_type)
      )
      
      // Check if this number already exists
      const existingResult = await client.queryObject`
        SELECT registration_id 
        FROM registrations 
        WHERE confirmation_number = ${confirmationNumber}
      `
      
      if (existingResult.rows.length === 0) {
        break // Found unique number
      }
      
      console.log(`Confirmation number collision detected: ${confirmationNumber}, retrying...`)
      attempts++
    }

    if (attempts >= maxAttempts) {
      throw new Error('Unable to generate unique confirmation number after 10 attempts')
    }

    // Update registration with confirmation number
    const updateResult = await client.queryObject`
      UPDATE registrations 
      SET 
        confirmation_number = ${confirmationNumber!},
        confirmation_generated_at = NOW()
      WHERE 
        registration_id = ${registrationId}
        AND confirmation_number IS NULL
      RETURNING confirmation_number
    `

    if (updateResult.rows.length === 0) {
      throw new Error('Failed to update registration - it may have been updated by another process')
    }

    console.log(`Generated confirmation number: ${confirmationNumber!} for registration: ${registrationId}`)
    response.confirmationNumber = confirmationNumber!
    response.success = true
    response.message = 'Confirmation number generated successfully'

    const duration = Date.now() - startTime
    console.log(`Confirmation generation completed in ${duration}ms`, {
      registrationId,
      confirmationNumber,
      errors: response.errors
    })

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error) {
    console.error('Confirmation generation error:', error)
    console.error('Error stack:', error.stack)
    response.errors?.push(`Unexpected error: ${error.message}`)
    
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  } finally {
    // Always release the client back to the pool
    if (client) {
      client.release()
    }
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
 * Normalizes webhook payload to handle both database trigger format and standard Supabase webhook format
 */
function normalizeWebhookPayload(rawPayload: any): WebhookPayload {
  // Debug logging
  console.log('Normalizing payload type:', typeof rawPayload)
  console.log('Payload keys:', Object.keys(rawPayload || {}))
  
  // Check if this is already in standard Supabase webhook format
  if (rawPayload.type && rawPayload.table && rawPayload.record) {
    return rawPayload as WebhookPayload
  }
  
  // Handle database trigger format (flat object with registration data)
  if (rawPayload.registration_id && rawPayload.registration_type) {
    return {
      type: 'UPDATE',
      table: 'registrations',
      schema: 'public',
      record: {
        id: rawPayload.registration_id,
        registration_id: rawPayload.registration_id,
        status: rawPayload.status,
        payment_status: rawPayload.payment_status,
        confirmation_number: null,
        registration_type: rawPayload.registration_type,
        function_id: rawPayload.function_id,
        customer_id: rawPayload.customer_id || '',
        created_at: rawPayload.created_at || new Date().toISOString(),
        updated_at: rawPayload.updated_at || new Date().toISOString()
      },
      old_record: rawPayload.old_status ? {
        id: rawPayload.registration_id,
        registration_id: rawPayload.registration_id,
        status: rawPayload.old_status,
        payment_status: rawPayload.old_payment_status,
        confirmation_number: null,
        registration_type: rawPayload.registration_type,
        function_id: rawPayload.function_id,
        customer_id: rawPayload.customer_id || '',
        created_at: rawPayload.created_at || new Date().toISOString(),
        updated_at: rawPayload.updated_at || new Date().toISOString()
      } : undefined
    }
  }
  
  // If we get here, the payload format is unexpected
  console.error('Unexpected payload format:', JSON.stringify(rawPayload, null, 2))
  throw new Error('Unable to normalize webhook payload: unexpected format')
}