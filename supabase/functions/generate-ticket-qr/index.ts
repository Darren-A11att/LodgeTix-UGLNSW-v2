import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'
import { encode } from "https://deno.land/x/qrcode@v2.0.0/mod.ts"
import { createHash } from "https://deno.land/std@0.168.0/crypto/mod.ts"

interface TicketRecord {
  ticket_id: string
  registration_id: string
  attendee_id: string | null
  event_id: string
  ticket_type_id: string
  package_id: string | null
  created_at: string
}

interface TicketQRData {
  type: "TICKET"
  fid: string // function_id
  tid: string // ticket_id
  rid: string // registration_id
  ttid: string // ticket_type_id
  pid: string | null // package_id
  tca: string // ticket created_at
  qca: string // qr code created_at
  spi: string | null // stripe_payment_intent_id
  rt: string | null // registration_type
  uid: string | null // auth_user_id
  fn: string // function_name
  en: string // event_name
  checksum: string
}

serve(async (req: Request) => {
  try {
    const { method } = req
    
    if (method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Parse webhook payload
    const { type, table, record, old_record } = await req.json()
    
    if (table !== 'tickets' || type !== 'INSERT') {
      return new Response(JSON.stringify({ message: 'Not a ticket insert event' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const ticket = record as TicketRecord

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check if QR code already exists
    if (ticket.qr_code_url) {
      return new Response(JSON.stringify({ message: 'QR code already exists' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Fetch additional data needed for QR code
    // 1. Get registration data
    const { data: registration, error: regError } = await supabase
      .from('registrations')
      .select(`
        stripe_payment_intent_id,
        registration_type,
        auth_user_id,
        function_id
      `)
      .eq('registration_id', ticket.registration_id)
      .single()

    if (regError || !registration) {
      throw new Error(`Failed to fetch registration: ${regError?.message}`)
    }

    // 2. Get function name
    const { data: functionData, error: funcError } = await supabase
      .from('functions')
      .select('name')
      .eq('function_id', registration.function_id)
      .single()

    if (funcError || !functionData) {
      throw new Error(`Failed to fetch function: ${funcError?.message}`)
    }

    // 3. Get event name
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('title')
      .eq('event_id', ticket.event_id)
      .single()

    if (eventError || !event) {
      throw new Error(`Failed to fetch event: ${eventError?.message}`)
    }

    // Build QR code data
    const qrData: TicketQRData = {
      type: "TICKET",
      fid: registration.function_id,
      tid: ticket.ticket_id,
      rid: ticket.registration_id,
      ttid: ticket.ticket_type_id,
      pid: ticket.package_id,
      tca: ticket.created_at,
      qca: new Date().toISOString(),
      spi: registration.stripe_payment_intent_id,
      rt: registration.registration_type,
      uid: registration.auth_user_id,
      fn: functionData.name,
      en: event.title,
      checksum: "" // Will be calculated below
    }

    // Calculate checksum
    const dataForChecksum = JSON.stringify({
      ...qrData,
      checksum: undefined
    })
    const hash = await createHash("sha256")
    hash.update(new TextEncoder().encode(dataForChecksum))
    qrData.checksum = hash.toString()

    // Generate QR code
    const qrCodeData = JSON.stringify(qrData)
    const qrCode = await encode(qrCodeData, {
      errorCorrectionLevel: 'H',
      width: 512,
      margin: 2
    })

    // Convert to PNG buffer
    const qrCodeBuffer = await qrCode.toBuffer()

    // Upload to Supabase Storage
    const fileName = `registrations/${ticket.registration_id}/tickets/${ticket.ticket_id}.png`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('ticket-qr-codes')
      .upload(fileName, qrCodeBuffer, {
        contentType: 'image/png',
        upsert: true
      })

    if (uploadError) {
      throw new Error(`Failed to upload QR code: ${uploadError.message}`)
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('ticket-qr-codes')
      .getPublicUrl(fileName)

    // Update ticket with QR code URL
    const { error: updateError } = await supabase
      .from('tickets')
      .update({ qr_code_url: publicUrl })
      .eq('ticket_id', ticket.ticket_id)

    if (updateError) {
      throw new Error(`Failed to update ticket: ${updateError.message}`)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        ticket_id: ticket.ticket_id,
        qr_code_url: publicUrl
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error generating ticket QR code:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate QR code',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
})