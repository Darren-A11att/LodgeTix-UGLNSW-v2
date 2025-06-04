import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'
import { encode } from "https://deno.land/x/qrcode@v2.0.0/mod.ts"
import { createHash } from "https://deno.land/std@0.168.0/crypto/mod.ts"

interface AttendeeRecord {
  attendee_id: string
  registration_id: string
  created_at: string
  qr_code_url: string | null
}

interface AttendeeQRData {
  type: "ATTENDEE"
  fid: string // function_id
  aid: string // attendee_id
  rid: string // registration_id
  qca: string // qr code created_at
  spi: string | null // stripe_payment_intent_id
  rt: string | null // registration_type
  uid: string | null // auth_user_id
  fn: string // function_name
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
    
    if (table !== 'attendees' || type !== 'INSERT') {
      return new Response(JSON.stringify({ message: 'Not an attendee insert event' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const attendee = record as AttendeeRecord

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check if QR code already exists
    if (attendee.qr_code_url) {
      return new Response(JSON.stringify({ message: 'QR code already exists' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Fetch registration and function data
    const { data: registration, error: regError } = await supabase
      .from('registrations')
      .select(`
        stripe_payment_intent_id,
        registration_type,
        auth_user_id,
        function_id,
        functions (
          name
        )
      `)
      .eq('registration_id', attendee.registration_id)
      .single()

    if (regError || !registration) {
      throw new Error(`Failed to fetch registration: ${regError?.message}`)
    }

    // Build QR code data
    const qrData: AttendeeQRData = {
      type: "ATTENDEE",
      fid: registration.function_id,
      aid: attendee.attendee_id,
      rid: attendee.registration_id,
      qca: new Date().toISOString(),
      spi: registration.stripe_payment_intent_id,
      rt: registration.registration_type,
      uid: registration.auth_user_id,
      fn: registration.functions.name,
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
    const fileName = `registrations/${attendee.registration_id}/attendees/${attendee.attendee_id}.png`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('attendee-qr-codes')
      .upload(fileName, qrCodeBuffer, {
        contentType: 'image/png',
        upsert: true
      })

    if (uploadError) {
      throw new Error(`Failed to upload QR code: ${uploadError.message}`)
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('attendee-qr-codes')
      .getPublicUrl(fileName)

    // Update attendee with QR code URL
    const { error: updateError } = await supabase
      .from('attendees')
      .update({ qr_code_url: publicUrl })
      .eq('attendee_id', attendee.attendee_id)

    if (updateError) {
      throw new Error(`Failed to update attendee: ${updateError.message}`)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        attendee_id: attendee.attendee_id,
        qr_code_url: publicUrl
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error generating attendee QR code:', error)
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