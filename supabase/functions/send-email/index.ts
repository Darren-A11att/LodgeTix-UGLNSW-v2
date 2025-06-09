import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from '@supabase/supabase-js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailPayload {
  to: string | string[]
  subject: string
  html?: string
  text?: string
  from?: string
  replyTo?: string
  template?: string
  templateData?: Record<string, any>
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    // Validate the request
    const payload: EmailPayload = await req.json()
    
    if (!payload.to || !payload.subject) {
      throw new Error('Missing required fields: to and subject')
    }

    if (!payload.html && !payload.text && !payload.template) {
      throw new Error('Must provide either html, text, or template')
    }

    // Initialize Supabase client to verify the auth token
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { authorization: authHeader } }
    })

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    // Get Resend API key
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      throw new Error('Resend API key not configured')
    }

    // Prepare email data
    const emailData = {
      from: payload.from || 'LodgeTix <noreply@lodgetix.io>',
      to: Array.isArray(payload.to) ? payload.to : [payload.to],
      subject: payload.subject,
      ...(payload.html && { html: payload.html }),
      ...(payload.text && { text: payload.text }),
      ...(payload.replyTo && { reply_to: payload.replyTo }),
    }

    // If template is specified, this would be where we'd process it
    // For now, we'll just use the HTML/text provided

    // Send email using Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to send email: ${error}`)
    }

    const result = await response.json()

    // Log the email send to database (optional)
    const serviceClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    await serviceClient
      .from('email_logs')
      .insert({
        user_id: user.id,
        to: Array.isArray(payload.to) ? payload.to.join(', ') : payload.to,
        subject: payload.subject,
        status: 'sent',
        provider: 'resend',
        provider_id: result.id,
        metadata: {
          from: emailData.from,
          template: payload.template,
        }
      })
      .select()
      .single()

    return new Response(
      JSON.stringify({ 
        success: true, 
        id: result.id,
        message: 'Email sent successfully' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error sending email:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: error.message === 'Unauthorized' ? 401 : 400,
      }
    )
  }
})