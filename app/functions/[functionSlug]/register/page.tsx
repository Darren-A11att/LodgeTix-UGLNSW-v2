import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export default async function FunctionRegisterPage({
  params
}: {
  params: Promise<{ functionSlug: string }>
}) {
  const { functionSlug } = await params
  console.log('[Registration Page] Starting registration for function:', functionSlug)
  
  const supabase = await createClient()
  
  // Get the function details with its events
  const { data: functionData, error: functionError } = await supabase
    .from('functions')
    .select(`
      function_id, 
      name,
      events!function_id(
        event_id,
        slug,
        title,
        event_start,
        status
      )
    `)
    .eq('slug', functionSlug)
    .single()
    
  if (functionError || !functionData) {
    console.error('[Registration Page] Error finding function:', functionError)
    console.error('[Registration Page] Function slug:', functionSlug)
    redirect('/functions')
  }
  
  console.log('[Registration Page] Found function:', functionData)
  
  // Get active events for this function
  const activeEvents = functionData.events?.filter(
    (event: any) => event.status === 'Active' && new Date(event.event_start) > new Date()
  ) || []
  
  if (activeEvents.length === 0) {
    console.error('[Registration Page] No active events found for function')
    redirect(`/functions/${functionSlug}`)
  }
  
  // For now, use the first active event
  // TODO: In the future, add an event selection step if multiple events exist
  const targetEvent = activeEvents[0]
  
  // Get the authenticated user
  const { data: { user } } = await supabase.auth.getUser()
  
  // Create a new registration draft for the event
  const { data: registration, error } = await supabase
    .from('registrations')
    .insert({
      registration_id: crypto.randomUUID(),
      event_id: targetEvent.event_id,  // Use event_id instead of function_id
      contact_id: user?.id || null,
      registration_type: 'individual', // Default type matching the enum
      status: 'draft',
      payment_status: 'pending',
      total_amount_paid: 0,
      total_price_paid: 0,
      registration_date: new Date().toISOString()
    })
    .select('registration_id')
    .single()
    
  if (error || !registration) {
    console.error('[Registration Page] Error creating registration:', error)
    console.error('[Registration Page] Registration data attempted:', {
      registration_id: 'auto-generated',
      event_id: targetEvent.event_id,
      contact_id: user?.id || null,
      registration_type: 'individual',
      status: 'draft',
      payment_status: 'pending'
    })
    // If we can't create a registration, redirect back to the function page
    redirect(`/functions/${functionSlug}`)
  }
  
  console.log('[Registration Page] Successfully created registration:', registration.registration_id)
  
  // Redirect to the event's registration wizard with the new ID
  redirect(`/events/${targetEvent.slug}/register/${registration.registration_id}/tickets`)
}