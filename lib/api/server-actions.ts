import { getBrowserClient } from '@/lib/supabase-singleton'

/**
 * Fetches all events
 */
export async function fetchEvents() {
  const supabase = getBrowserClient();
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching events:', error)
    throw new Error('Failed to fetch events')
  }
  
  return data
}

/**
 * Fetches a single event by ID
 */
export async function fetchEventById(id: string) {
  const supabase = getBrowserClient();
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('event_id', id)
    .single()
  
  if (error) {
    console.error(`Error fetching event ${id}:`, error)
    throw new Error(`Failed to fetch event ${id}`)
  }
  
  return data
}

/**
 * Fetches tickets for an event
 */
export async function fetchEventTickets(eventId: string) {
  const supabase = getBrowserClient();
  const { data, error } = await supabase
    .from('ticket_definitions')
    .select('*')
    .eq('event_id', eventId)
  
  if (error) {
    console.error(`Error fetching tickets for event ${eventId}:`, error)
    throw new Error(`Failed to fetch tickets for event ${eventId}`)
  }
  
  return data
}

/**
 * Fetches user registrations (requires authentication)
 */
export async function fetchUserRegistrations() {
  const supabase = getBrowserClient();
  // Get current user session
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session?.user) {
    throw new Error('User not authenticated')
  }
  
  const { data, error } = await supabase
    .from('registrations')
    .select(`
      *,
      tickets(*)
    `)
    .eq('user_id', session.user.id)
  
  if (error) {
    console.error('Error fetching user registrations:', error)
    throw new Error('Failed to fetch registrations')
  }
  
  return data
}

/**
 * Creates a new registration
 */
export async function createRegistration(registrationData: any) {
  const supabase = getBrowserClient();
  // Get current user session
  const { data: { session } } = await supabase.auth.getSession()
  
  // Add user_id to registration data if authenticated
  if (session?.user) {
    registrationData.user_id = session.user.id
  }
  
  const { data, error } = await supabase
    .from('registrations')
    .insert(registrationData)
    .select()
    .single()
  
  if (error) {
    console.error('Error creating registration:', error)
    throw new Error('Failed to create registration')
  }
  
  return data
}