import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from '@supabase/supabase-js'
import { render } from '@react-email/render'
import { EmailType, EmailRequestPayload, EmailResponse, RegistrationEmailData, AttendeeEmailData } from './types/email.ts'
import { sendEmail } from './services/resend-client.ts'
import { IndividualConfirmationTemplate } from './templates/individuals_confirmation_template.tsx'
import { LodgeConfirmationTemplate } from './templates/lodge_confirmation_template.tsx'
import { DelegationConfirmationTemplate } from './templates/delegation_confirmation_template.tsx'
import { AttendeeDirectTicketTemplate } from './templates/attendee_direct_ticket_template.tsx'
import { PrimaryContactTicketTemplate } from './templates/primary_contact_ticket_template.tsx'
import { logEmailEvent } from './utils/logger.ts'
import { getEmailSubject, determineRecipients } from './utils/email-helpers.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload: EmailRequestPayload = await req.json()
    
    // Validate request
    if (!payload.type || !payload.registrationId) {
      throw new Error('Missing required fields: type and registrationId')
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Log email request
    await logEmailEvent(supabase, {
      registrationId: payload.registrationId,
      emailType: payload.type,
      status: 'pending',
      metadata: { testMode: payload.testMode }
    })

    // Fetch registration data based on type
    const emailData = await fetchEmailData(supabase, payload)
    
    // Determine recipients
    const recipients = await determineRecipients(payload, emailData)
    
    // Render email based on type
    const { html, subject } = await renderEmail(payload.type, emailData)
    
    // Send emails
    const results = []
    for (const recipient of recipients) {
      try {
        const emailId = await sendEmail({
          to: recipient.email,
          subject,
          html,
          attachments: emailData.confirmationPdfUrl ? [{
            filename: 'confirmation.pdf',
            url: emailData.confirmationPdfUrl
          }] : undefined
        })

        results.push({
          success: true,
          recipient: recipient.email,
          emailId
        })

        // Log successful send
        await logEmailEvent(supabase, {
          registrationId: payload.registrationId,
          emailType: payload.type,
          recipientEmail: recipient.email,
          status: 'sent',
          resendId: emailId
        })
      } catch (error) {
        results.push({
          success: false,
          recipient: recipient.email,
          error: error.message
        })

        // Log failed send
        await logEmailEvent(supabase, {
          registrationId: payload.registrationId,
          emailType: payload.type,
          recipientEmail: recipient.email,
          status: 'failed',
          errorMessage: error.message
        })
      }
    }

    const response: EmailResponse = {
      success: results.every(r => r.success),
      emailId: results.find(r => r.emailId)?.emailId,
      error: results.find(r => !r.success)?.error
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error) {
    console.error('Email function error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})

async function fetchEmailData(supabase: any, payload: EmailRequestPayload): Promise<any> {
  const { data: registration, error } = await supabase
    .from('registrations')
    .select(`
      *,
      customers!inner(
        id,
        email,
        first_name,
        last_name,
        phone
      ),
      functions!inner(
        id,
        name,
        slug,
        start_date,
        end_date,
        venue_name,
        venue_address,
        venue_city,
        venue_state
      ),
      attendees(
        *,
        tickets(
          *,
          events(
            name,
            start_time,
            end_time,
            location
          )
        )
      )
    `)
    .eq('id', payload.registrationId)
    .single()

  if (error || !registration) {
    throw new Error('Registration not found')
  }

  // Format data based on registration type
  const baseData: RegistrationEmailData = {
    registrationId: registration.id,
    confirmationNumber: registration.confirmation_number,
    registrationType: registration.registration_type,
    functionDetails: {
      id: registration.functions.id,
      name: registration.functions.name,
      slug: registration.functions.slug,
      dateRange: `${new Date(registration.functions.start_date).toLocaleDateString()} - ${new Date(registration.functions.end_date).toLocaleDateString()}`,
      location: `${registration.functions.venue_city}, ${registration.functions.venue_state}`,
      venueName: registration.functions.venue_name
    },
    customerDetails: {
      id: registration.customers.id,
      email: registration.customers.email,
      firstName: registration.customers.first_name,
      lastName: registration.customers.last_name,
      phone: registration.customers.phone
    },
    paymentDetails: {
      totalAmount: registration.total_amount_paid,
      stripeFee: registration.stripe_fee,
      subtotal: registration.total_amount_paid - registration.stripe_fee,
      paymentIntentId: registration.stripe_payment_intent_id,
      receiptUrl: registration.stripe_receipt_url
    },
    confirmationPdfUrl: registration.confirmation_pdf_url
  }

  // Add booking contact if present
  if (registration.booking_contact_email) {
    baseData.bookingContact = {
      firstName: registration.booking_contact_first_name,
      lastName: registration.booking_contact_last_name,
      email: registration.booking_contact_email,
      phone: registration.booking_contact_phone,
      role: registration.booking_contact_role
    }
  }

  // Add lodge-specific data if applicable
  if (registration.registration_type === 'lodge') {
    const { data: lodge } = await supabase
      .from('lodges')
      .select('*, grand_lodges(*)')
      .eq('id', registration.lodge_id)
      .single()

    const { data: packageData } = await supabase
      .from('packages')
      .select('*')
      .eq('id', registration.package_id)
      .single()

    return {
      ...baseData,
      lodgeDetails: {
        id: lodge.id,
        name: lodge.name,
        number: lodge.number,
        grandLodge: lodge.grand_lodges.name
      },
      packageDetails: {
        id: packageData.id,
        name: packageData.name,
        description: packageData.description,
        attendeeCount: registration.attendees.length,
        pricePerPerson: packageData.price,
        totalPrice: packageData.price * registration.attendees.length
      },
      attendees: formatAttendees(registration.attendees)
    }
  }

  // Add delegation-specific data if applicable
  if (registration.registration_type === 'delegation') {
    return {
      ...baseData,
      delegationDetails: {
        name: registration.registration_data?.delegationName || 'Delegation',
        leader: registration.registration_data?.delegationLeader || 'Leader',
        size: registration.attendees.length.toString()
      },
      delegates: formatAttendees(registration.attendees)
    }
  }

  return {
    ...baseData,
    attendees: formatAttendees(registration.attendees)
  }
}

function formatAttendees(attendees: any[]): AttendeeEmailData[] {
  return attendees.map(attendee => ({
    id: attendee.id,
    customerId: attendee.customer_id,
    title: attendee.title,
    firstName: attendee.first_name,
    lastName: attendee.last_name,
    email: attendee.email,
    phone: attendee.phone,
    attendeeType: attendee.is_mason ? 'mason' : 'guest',
    dietaryRequirements: attendee.dietary_requirements,
    accessibilityRequirements: attendee.accessibility_requirements,
    contactPreference: attendee.contact_preference,
    tickets: attendee.tickets.map((ticket: any) => ({
      id: ticket.id,
      eventName: ticket.events.name,
      eventDate: new Date(ticket.events.start_time).toLocaleDateString(),
      eventTime: new Date(ticket.events.start_time).toLocaleTimeString(),
      venueName: ticket.events.location,
      venueAddress: '', // Would need to add this to event data
      ticketType: ticket.ticket_type,
      qrCodeUrl: ticket.qr_code_url,
      seatNumber: ticket.seat_number,
      tableNumber: ticket.table_number
    })),
    partner: attendee.partner_first_name ? {
      title: attendee.partner_title,
      firstName: attendee.partner_first_name,
      lastName: attendee.partner_last_name,
      relationship: attendee.partner_relationship
    } : undefined
  }))
}

async function renderEmail(type: EmailType, data: any): Promise<{ html: string, subject: string }> {
  let template
  
  switch (type) {
    case EmailType.INDIVIDUAL_CONFIRMATION:
      template = <IndividualConfirmationTemplate data={data} />
      break
    case EmailType.LODGE_CONFIRMATION:
      template = <LodgeConfirmationTemplate data={data} />
      break
    case EmailType.DELEGATION_CONFIRMATION:
      template = <DelegationConfirmationTemplate data={data} />
      break
    case EmailType.ATTENDEE_DIRECT_TICKET:
      // For individual attendee tickets, we need to format the data appropriately
      const attendeeData = {
        attendee: data.attendee, // This should be passed in when calling this function
        functionDetails: data.functionDetails,
        registrationId: data.registrationId,
        confirmationNumber: data.confirmationNumber,
        registrationType: data.registrationType
      }
      template = <AttendeeDirectTicketTemplate data={attendeeData} />
      break
    case EmailType.PRIMARY_CONTACT_TICKET:
      // For primary contact tickets, we need all attendees
      const primaryContactData = {
        attendees: data.attendees || [],
        functionDetails: data.functionDetails,
        bookingContact: data.bookingContact,
        registrationId: data.registrationId,
        confirmationNumber: data.confirmationNumber,
        registrationType: data.registrationType,
        lodgeName: data.lodgeDetails?.name
      }
      template = <PrimaryContactTicketTemplate data={primaryContactData} />
      break
    default:
      throw new Error(`Unknown email type: ${type}`)
  }

  const html = render(template)
  const subject = getEmailSubject(type, data)

  return { html, subject }
}