'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { Database } from '@/shared/types/database'

type FunctionInput = {
  name: string
  slug: string
  description?: string
  start_date: string
  end_date: string
  location_id: string
  image_url?: string
  metadata?: any
}

type EventInput = {
  title: string
  slug: string
  description?: string
  event_start: string
  event_end: string
  location?: string
  type: string
  category?: string
  image_url?: string
  dress_code?: string
  regalia?: string
  is_purchasable_individually: boolean
  event_includes?: string[]
  important_information?: string
}

type TicketInput = {
  ticket_name: string
  description?: string
  ticket_type: 'standard' | 'vip' | 'early_bird' | 'group'
  price: number
  quantity_total: number
  sales_start?: string
  sales_end?: string
  min_purchase?: number
  max_purchase?: number
}

export async function createFunction(data: FunctionInput) {
  const supabase = await createClient()
  
  // Get current user's organisation
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: orgUser } = await supabase
    .from('organisation_users')
    .select('organisation_id, role')
    .eq('user_id', user.id)
    .single()

  if (!orgUser || orgUser.role !== 'admin') throw new Error('Unauthorized')

  const { data: newFunction, error } = await supabase
    .from('functions')
    .insert({
      ...data,
      organiser_id: orgUser.organisation_id,
      is_published: false
    })
    .select()
    .single()

  if (error) throw error

  revalidatePath('/organiser/functions')
  return newFunction
}

export async function updateFunction(functionId: string, data: Partial<FunctionInput>) {
  const supabase = await createClient()
  
  // Verify ownership
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: existingFunction } = await supabase
    .from('functions')
    .select('organiser_id')
    .eq('function_id', functionId)
    .single()

  const { data: orgUser } = await supabase
    .from('organisation_users')
    .select('organisation_id, role')
    .eq('user_id', user.id)
    .single()

  if (!orgUser || orgUser.role !== 'admin' || existingFunction?.organiser_id !== orgUser.organisation_id) {
    throw new Error('Unauthorized')
  }

  const { data: updatedFunction, error } = await supabase
    .from('functions')
    .update(data)
    .eq('function_id', functionId)
    .select()
    .single()

  if (error) throw error

  revalidatePath('/organiser/functions')
  revalidatePath(`/organiser/functions/${functionId}`)
  return updatedFunction
}

export async function deleteFunction(functionId: string) {
  const supabase = await createClient()
  
  // Verify ownership
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: existingFunction } = await supabase
    .from('functions')
    .select('organiser_id')
    .eq('function_id', functionId)
    .single()

  const { data: orgUser } = await supabase
    .from('organisation_users')
    .select('organisation_id, role')
    .eq('user_id', user.id)
    .single()

  if (!orgUser || orgUser.role !== 'admin' || existingFunction?.organiser_id !== orgUser.organisation_id) {
    throw new Error('Unauthorized')
  }

  // Delete function (cascade will handle related records)
  const { error } = await supabase
    .from('functions')
    .delete()
    .eq('function_id', functionId)

  if (error) throw error

  revalidatePath('/organiser/functions')
  redirect('/organiser/functions')
}

export async function publishFunction(functionId: string, isPublished: boolean) {
  const supabase = await createClient()
  
  // Verify ownership
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: existingFunction } = await supabase
    .from('functions')
    .select('organiser_id')
    .eq('function_id', functionId)
    .single()

  const { data: orgUser } = await supabase
    .from('organisation_users')
    .select('organisation_id, role')
    .eq('user_id', user.id)
    .single()

  if (!orgUser || orgUser.role !== 'admin' || existingFunction?.organiser_id !== orgUser.organisation_id) {
    throw new Error('Unauthorized')
  }

  const { error } = await supabase
    .from('functions')
    .update({ is_published: isPublished })
    .eq('function_id', functionId)

  if (error) throw error

  revalidatePath('/organiser/functions')
  revalidatePath(`/organiser/functions/${functionId}`)
}

// Event actions
export async function createEvent(functionId: string, data: EventInput) {
  const supabase = await createClient()
  
  // Verify function ownership
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: existingFunction } = await supabase
    .from('functions')
    .select('organiser_id')
    .eq('function_id', functionId)
    .single()

  const { data: orgUser } = await supabase
    .from('organisation_users')
    .select('organisation_id, role')
    .eq('user_id', user.id)
    .single()

  if (!orgUser || orgUser.role !== 'admin' || existingFunction?.organiser_id !== orgUser.organisation_id) {
    throw new Error('Unauthorized')
  }

  const { data: newEvent, error } = await supabase
    .from('events')
    .insert({
      ...data,
      function_id: functionId,
      is_published: false,
      featured: false,
      is_multi_day: new Date(data.event_end).getDate() !== new Date(data.event_start).getDate()
    })
    .select()
    .single()

  if (error) throw error

  revalidatePath(`/organiser/functions/${functionId}`)
  return newEvent
}

export async function updateEvent(eventId: string, data: Partial<EventInput>) {
  const supabase = await createClient()
  
  // Verify ownership through function
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: event } = await supabase
    .from('events')
    .select('function_id, functions!inner(organiser_id)')
    .eq('event_id', eventId)
    .single()

  const { data: organisation } = await supabase
    .from('organisations')
    .select('organisation_id')
    .eq('email_address', user.email)
    .single()

  if ((event?.functions as any)?.organiser_id !== organisation?.organisation_id) {
    throw new Error('Unauthorized')
  }

  const updateData: any = { ...data }
  if (data.event_start && data.event_end) {
    updateData.is_multi_day = new Date(data.event_end).getDate() !== new Date(data.event_start).getDate()
  }

  const { data: updatedEvent, error } = await supabase
    .from('events')
    .update(updateData)
    .eq('event_id', eventId)
    .select()
    .single()

  if (error) throw error

  revalidatePath(`/organiser/functions/${event.function_id}`)
  return updatedEvent
}

export async function deleteEvent(eventId: string) {
  const supabase = await createClient()
  
  // Verify ownership through function
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: event } = await supabase
    .from('events')
    .select('function_id, functions!inner(organiser_id)')
    .eq('event_id', eventId)
    .single()

  const { data: organisation } = await supabase
    .from('organisations')
    .select('organisation_id')
    .eq('email_address', user.email)
    .single()

  if ((event?.functions as any)?.organiser_id !== organisation?.organisation_id) {
    throw new Error('Unauthorized')
  }

  const { error } = await supabase
    .from('events')
    .delete()
    .eq('event_id', eventId)

  if (error) throw error

  revalidatePath(`/organiser/functions/${event.function_id}`)
}

// Ticket actions
export async function createTicket(eventId: string, data: TicketInput) {
  const supabase = await createClient()
  
  // Verify ownership through event and function
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: event } = await supabase
    .from('events')
    .select('event_id, functions!inner(organiser_id)')
    .eq('event_id', eventId)
    .single()

  const { data: organisation } = await supabase
    .from('organisations')
    .select('organisation_id')
    .eq('email_address', user.email)
    .single()

  if ((event?.functions as any)?.organiser_id !== organisation?.organisation_id) {
    throw new Error('Unauthorized')
  }

  // Create event_ticket record
  const { data: eventTicket, error } = await supabase
    .from('event_tickets')
    .insert({
      event_id: eventId,
      ...data,
      quantity_sold: 0,
      is_active: true
    })
    .select()
    .single()

  if (error) throw error

  revalidatePath(`/organiser/functions`)
  return eventTicket
}

export async function updateTicket(ticketId: string, data: Partial<TicketInput>) {
  const supabase = await createClient()
  
  // Verify ownership
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: ticket } = await supabase
    .from('event_tickets')
    .select(`
      event_ticket_id,
      events!inner(
        event_id,
        functions!inner(organiser_id)
      )
    `)
    .eq('event_ticket_id', ticketId)
    .single()

  const { data: organisation } = await supabase
    .from('organisations')
    .select('organisation_id')
    .eq('email_address', user.email)
    .single()

  if ((ticket?.events as any)?.functions?.organiser_id !== organisation?.organisation_id) {
    throw new Error('Unauthorized')
  }

  const { data: updatedTicket, error } = await supabase
    .from('event_tickets')
    .update(data)
    .eq('event_ticket_id', ticketId)
    .select()
    .single()

  if (error) throw error

  revalidatePath(`/organiser/functions`)
  return updatedTicket
}

export async function deleteTicket(ticketId: string) {
  const supabase = await createClient()
  
  // Verify ownership and check if tickets have been sold
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: ticket } = await supabase
    .from('event_tickets')
    .select(`
      event_ticket_id,
      quantity_sold,
      events!inner(
        event_id,
        functions!inner(organiser_id)
      )
    `)
    .eq('event_ticket_id', ticketId)
    .single()

  const { data: organisation } = await supabase
    .from('organisations')
    .select('organisation_id')
    .eq('email_address', user.email)
    .single()

  if ((ticket?.events as any)?.functions?.organiser_id !== organisation?.organisation_id) {
    throw new Error('Unauthorized')
  }

  if (ticket.quantity_sold > 0) {
    throw new Error('Cannot delete ticket type with sold tickets')
  }

  const { error } = await supabase
    .from('event_tickets')
    .delete()
    .eq('event_ticket_id', ticketId)

  if (error) throw error

  revalidatePath(`/organiser/functions`)
}

import { sendOrganiserBulkEmail } from '@/lib/services/organiser-email-service'

// Email actions
export async function sendBulkEmail(
  recipientFilters: {
    functionId?: string
    eventId?: string
    registrationStatus?: string[]
  },
  emailData: {
    subject: string
    content: string
    sendCopy?: boolean
  }
) {
  const supabase = await createClient()
  
  // Get recipients based on filters
  let query = supabase
    .from('registrations')
    .select(`
      registration_id,
      contact_email,
      contact_name,
      functions!inner(
        organiser_id,
        name,
        start_date,
        end_date,
        location:locations(name, city)
      )
    `)

  if (recipientFilters.functionId) {
    query = query.eq('function_id', recipientFilters.functionId)
  }

  if (recipientFilters.registrationStatus?.length) {
    query = query.in('payment_status', recipientFilters.registrationStatus)
  }

  const { data: recipients, error } = await query

  if (error) throw error

  // Verify ownership
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: orgUser } = await supabase
    .from('organisation_users')
    .select('organisation_id, role, organisation:organisations(*)')
    .eq('user_id', user.id)
    .single()

  if (!orgUser || orgUser.role !== 'admin') throw new Error('Unauthorized')

  // Filter recipients by organisation
  const authorizedRecipients = recipients?.filter(
    r => (r.functions as any)?.organiser_id === orgUser.organisation_id
  )

  if (!authorizedRecipients?.length) {
    throw new Error('No recipients found')
  }

  // Get user details for sender name
  const { data: userProfile } = await supabase
    .from('customers')
    .select('given_names, surname')
    .eq('auth_user_id', user.id)
    .single()

  const senderName = userProfile 
    ? `${userProfile.given_names} ${userProfile.surname}`.trim()
    : user.email?.split('@')[0] || 'Organiser'

  // Prepare function details if filtering by function
  let functionDetails = undefined
  if (recipientFilters.functionId && authorizedRecipients[0]?.functions) {
    const func = authorizedRecipients[0].functions as any
    functionDetails = {
      name: func.name,
      date: `${new Date(func.start_date).toLocaleDateString('en-AU')} - ${new Date(func.end_date).toLocaleDateString('en-AU')}`,
      location: func.location ? `${func.location.name}, ${func.location.city}` : ''
    }
  }

  // Send emails using the email service
  const result = await sendOrganiserBulkEmail({
    recipients: authorizedRecipients.map(r => ({
      email: r.contact_email!,
      name: r.contact_name!,
      registrationId: r.registration_id
    })),
    subject: emailData.subject,
    content: emailData.content,
    functionDetails,
    senderDetails: {
      name: senderName,
      organisationName: (orgUser.organisation as any).name,
      organisationLogo: (orgUser.organisation as any).logo_url
    },
    sendCopyToOrganiser: emailData.sendCopy,
    organiserEmail: user.email || undefined
  })

  return result
}