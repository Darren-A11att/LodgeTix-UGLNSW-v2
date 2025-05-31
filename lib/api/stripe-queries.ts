import { createClient } from '@/utils/supabase/server';
import type { Database } from '@/shared/types/database';

/**
 * Stripe Payment Processing Queries
 * Optimized database queries for fetching all necessary data for Stripe payment processing
 */

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface RegistrationWithFullContext {
  registration: {
    registration_id: string;
    registration_type: string;
    attendee_count: number;
    subtotal: number;
    total_amount: number;
    status: string;
    payment_status: string;
    created_at: string;
    confirmation_number: string | null;
    stripe_payment_intent_id: string | null;
    total_amount_paid: number | null;
    stripe_fee: number | null;
    includes_processing_fee: boolean | null;
  };
  
  event: {
    event_id: string;
    title: string;
    subtitle: string | null;
    slug: string;
    parent_event_id: string | null;
    event_start: string | null;
    event_end: string | null;
    type: string | null;
    location_id: string | null;
    max_attendees: number | null;
    is_multi_day: boolean | null;
    is_published: boolean | null;
    featured: boolean | null;
    degree_type: string | null;
    dress_code: string | null;
    regalia: string | null;
    regalia_description: string | null;
    important_information: string | null;
  };
  
  organization: {
    organisation_id: string;
    name: string;
    type: string | null;
    abbreviation: string | null;
    stripe_onbehalfof: string | null;
    website: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
  };
  
  parent_event?: {
    event_id: string;
    title: string;
    subtitle: string | null;
    slug: string;
    event_start: string | null;
    event_end: string | null;
    type: string | null;
    image_url: string | null;
    max_attendees: number | null;
  };
  
  child_events?: Array<{
    event_id: string;
    title: string;
    subtitle: string | null;
    slug: string;
    event_start: string | null;
    event_end: string | null;
    type: string | null;
    is_purchasable_individually: boolean | null;
  }>;
  
  attendees: Array<{
    attendee_id: string;
    first_name: string;
    last_name: string;
    attendee_type: string;
    email: string | null;
    phone_number: string | null;
    dietary_requirements: string | null;
    accessibility_requirements: string | null;
    is_primary_contact: boolean | null;
    mason_type: string | null;
    lodge_name: string | null;
    lodge_number: string | null;
    grand_lodge: string | null;
    masonic_rank: string | null;
    masonic_profiles?: {
      profile_id: string;
      contact_id: string | null;
      masonic_title: string | null;
      rank: string | null;
      grand_rank: string | null;
      grand_officer: string | null;
      grand_office: string | null;
      lodges?: {
        lodge_id: string;
        name: string;
        number: string | null;
      };
      grand_lodges?: {
        grand_lodge_id: string;
        name: string;
        abbreviation: string | null;
      };
    };
  }>;
  
  tickets: Array<{
    ticket_id: string;
    event_ticket_id: string;
    price_paid: number;
    ticket_status: string | null;
    event_tickets: {
      id: string;
      title: string;
      description: string | null;
      price: number;
      ticket_type: string | null;
      event_id: string;
      events?: {
        event_id: string;
        title: string;
        slug: string;
      };
    };
  }>;
  
  lodge_registration?: {
    lodge_registration_id: string;
    table_count: number | null;
    lodges?: {
      lodge_id: string;
      name: string;
      number: string | null;
      meeting_location: string | null;
      grand_lodges?: {
        grand_lodge_id: string;
        name: string;
        abbreviation: string | null;
      };
    };
  };
}

// ============================================
// MAIN QUERY FUNCTIONS
// ============================================

/**
 * Get complete registration data with all context for payment processing
 */
export async function getRegistrationWithFullContext(
  registrationId: string
): Promise<RegistrationWithFullContext | null> {
  const supabase = await createClient();
  
  try {
    // Main registration query with event and organization
    const { data: registration, error: regError } = await supabase
      .from('registrations')
      .select(`
        *,
        events!inner (
          event_id,
          title,
          subtitle,
          slug,
          type,
          parent_event_id,
          event_start,
          event_end,
          location_id,
          max_attendees,
          is_multi_day,
          is_published,
          featured,
          degree_type,
          dress_code,
          regalia,
          regalia_description,
          important_information,
          organisations!inner (
            organisation_id,
            name,
            type,
            abbreviation,
            stripe_onbehalfof,
            website,
            city,
            state,
            country
          )
        )
      `)
      .eq('registration_id', registrationId)
      .single();
      
    if (regError || !registration) {
      console.error('Error fetching registration:', regError);
      return null;
    }
    
    // Fetch attendees with masonic profiles
    const { data: attendees } = await supabase
      .from('attendees')
      .select(`
        *,
        masonic_profiles (
          *,
          lodges (
            lodge_id,
            name,
            number
          ),
          grand_lodges (
            grand_lodge_id,
            name,
            abbreviation
          )
        )
      `)
      .eq('registration_id', registrationId)
      .order('is_primary_contact', { ascending: false });
      
    // Fetch tickets with event details
    const { data: tickets } = await supabase
      .from('tickets')
      .select(`
        *,
        event_tickets!inner (
          id,
          title,
          description,
          price,
          ticket_type,
          event_id,
          events!inner (
            event_id,
            title,
            slug
          )
        )
      `)
      .eq('registration_id', registrationId);
      
    // Fetch parent event if exists
    let parentEvent = null;
    if (registration.events.parent_event_id) {
      const { data: parent } = await supabase
        .from('events')
        .select(`
          event_id,
          title,
          subtitle,
          slug,
          event_start,
          event_end,
          type,
          image_url,
          max_attendees
        `)
        .eq('event_id', registration.events.parent_event_id)
        .single();
        
      parentEvent = parent;
    }
    
    // Fetch child events if this is a parent event or has siblings
    const parentId = registration.events.parent_event_id || registration.event_id;
    const { data: childEvents } = await supabase
      .from('events')
      .select(`
        event_id,
        title,
        subtitle,
        slug,
        event_start,
        event_end,
        type,
        is_purchasable_individually
      `)
      .eq('parent_event_id', parentId)
      .order('event_start');
      
    // Fetch lodge registration details if applicable
    let lodgeRegistration = null;
    if (registration.registration_type === 'lodge') {
      const { data: lodgeReg } = await supabase
        .from('lodge_registrations')
        .select(`
          *,
          lodges (
            lodge_id,
            name,
            number,
            meeting_location,
            grand_lodges (
              grand_lodge_id,
              name,
              abbreviation
            )
          )
        `)
        .eq('registration_id', registrationId)
        .single();
        
      lodgeRegistration = lodgeReg;
    }
      
    return {
      registration: {
        registration_id: registration.registration_id,
        registration_type: registration.registration_type,
        attendee_count: registration.attendee_count,
        subtotal: registration.subtotal,
        total_amount: registration.total_amount,
        status: registration.status,
        payment_status: registration.payment_status,
        created_at: registration.created_at,
        confirmation_number: registration.confirmation_number,
        stripe_payment_intent_id: registration.stripe_payment_intent_id,
        total_amount_paid: registration.total_amount_paid,
        stripe_fee: registration.stripe_fee,
        includes_processing_fee: registration.includes_processing_fee
      },
      event: registration.events,
      organization: registration.events.organisations,
      parent_event: parentEvent,
      child_events: childEvents || [],
      attendees: attendees || [],
      tickets: tickets || [],
      lodge_registration: lodgeRegistration
    };
  } catch (error) {
    console.error('Error in getRegistrationWithFullContext:', error);
    return null;
  }
}

/**
 * Get all ticket types for an event (including child events)
 */
export async function getEventTicketTypes(eventId: string) {
  const supabase = await createClient();
  
  try {
    // Get parent event ID if this is a child event
    const { data: event } = await supabase
      .from('events')
      .select('event_id, parent_event_id')
      .eq('event_id', eventId)
      .single();
      
    const parentEventId = event?.parent_event_id || eventId;
    
    // Get all tickets for parent and child events
    const { data: tickets } = await supabase
      .from('event_tickets')
      .select(`
        *,
        events!inner (
          event_id,
          title,
          slug,
          event_start
        )
      `)
      .or(`event_id.eq.${parentEventId},event_id.in.(
        SELECT event_id FROM events WHERE parent_event_id = '${parentEventId}'
      )`)
      .eq('is_active', true)
      .order('price');
      
    return tickets || [];
  } catch (error) {
    console.error('Error fetching event ticket types:', error);
    return [];
  }
}

/**
 * Get organization by event
 */
export async function getOrganizationByEvent(eventId: string) {
  const supabase = await createClient();
  
  try {
    const { data } = await supabase
      .from('events')
      .select(`
        organisations!inner (
          *
        )
      `)
      .eq('event_id', eventId)
      .single();
      
    return data?.organisations || null;
  } catch (error) {
    console.error('Error fetching organization by event:', error);
    return null;
  }
}

/**
 * Get registration summary for metadata
 */
export async function getRegistrationSummary(registrationId: string) {
  const supabase = await createClient();
  
  try {
    // Get attendee type breakdown
    const { data: attendeeStats } = await supabase
      .from('attendees')
      .select('attendee_type')
      .eq('registration_id', registrationId);
      
    const attendeeBreakdown = attendeeStats?.reduce((acc, curr) => {
      acc[curr.attendee_type] = (acc[curr.attendee_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Get ticket type breakdown
    const { data: ticketStats } = await supabase
      .from('tickets')
      .select(`
        event_tickets!inner (
          title,
          ticket_type
        )
      `)
      .eq('registration_id', registrationId);
      
    const ticketBreakdown = ticketStats?.reduce((acc, curr) => {
      const type = curr.event_tickets.ticket_type || 'standard';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      attendee_types: Object.entries(attendeeBreakdown || {})
        .map(([type, count]) => `${type}:${count}`)
        .join(','),
      ticket_types: Object.entries(ticketBreakdown || {})
        .map(([type, count]) => `${type}:${count}`)
        .join(',')
    };
  } catch (error) {
    console.error('Error getting registration summary:', error);
    return {
      attendee_types: '',
      ticket_types: ''
    };
  }
}

/**
 * Get lodge registration details
 */
export async function getLodgeRegistrationDetails(registrationId: string) {
  const supabase = await createClient();
  
  try {
    const { data } = await supabase
      .from('registrations')
      .select(`
        *,
        lodge_registrations!inner (
          *,
          lodges!inner (
            lodge_id,
            name,
            number,
            meeting_location,
            grand_lodges!inner (
              grand_lodge_id,
              name,
              abbreviation
            )
          )
        )
      `)
      .eq('registration_id', registrationId)
      .single();
      
    return data;
  } catch (error) {
    console.error('Error fetching lodge registration details:', error);
    return null;
  }
}

/**
 * Single optimized query for payment processing
 * This is the main function to use for Stripe payment processing
 */
export async function getPaymentProcessingData(registrationId: string) {
  const supabase = await createClient();
  
  try {
    // Check if RPC function exists
    const { data, error } = await supabase.rpc('get_payment_processing_data', {
      p_registration_id: registrationId
    });
    
    if (!error && data) {
      // Parse the JSON response from RPC
      return data as RegistrationWithFullContext;
    }
  } catch (rpcError) {
    console.log('RPC function not available, falling back to regular queries');
  }
  
  // Fallback to regular queries
  return await getRegistrationWithFullContext(registrationId);
}

/**
 * Get primary attendee details for Stripe customer creation
 */
export async function getPrimaryAttendeeDetails(registrationId: string) {
  const supabase = await createClient();
  
  try {
    const { data } = await supabase
      .from('attendees')
      .select(`
        *,
        masonic_profiles (
          *,
          lodges (
            lodge_id,
            name,
            number
          ),
          grand_lodges (
            grand_lodge_id,
            name,
            abbreviation
          )
        )
      `)
      .eq('registration_id', registrationId)
      .eq('is_primary_contact', true)
      .single();
      
    return data;
  } catch (error) {
    console.error('Error fetching primary attendee:', error);
    // Fallback to first attendee
    const { data: firstAttendee } = await supabase
      .from('attendees')
      .select(`
        *,
        masonic_profiles (
          *,
          lodges (
            lodge_id,
            name,
            number
          ),
          grand_lodges (
            grand_lodge_id,
            name,
            abbreviation
          )
        )
      `)
      .eq('registration_id', registrationId)
      .order('created_at')
      .limit(1)
      .single();
      
    return firstAttendee;
  }
}

/**
 * Get event hierarchy for metadata
 */
export async function getEventHierarchy(eventId: string) {
  const supabase = await createClient();
  
  try {
    // Get current event
    const { data: currentEvent } = await supabase
      .from('events')
      .select('event_id, title, slug, parent_event_id, event_start')
      .eq('event_id', eventId)
      .single();
      
    if (!currentEvent) return null;
    
    let parentEvent = null;
    let childEvents: any[] = [];
    
    // If has parent, get parent and siblings
    if (currentEvent.parent_event_id) {
      const { data: parent } = await supabase
        .from('events')
        .select('event_id, title, slug, event_start')
        .eq('event_id', currentEvent.parent_event_id)
        .single();
        
      parentEvent = parent;
      
      // Get all children of parent (siblings)
      const { data: siblings } = await supabase
        .from('events')
        .select('event_id, title, slug, event_start')
        .eq('parent_event_id', currentEvent.parent_event_id)
        .order('event_start');
        
      childEvents = siblings || [];
    } else {
      // This is a parent, get children
      const { data: children } = await supabase
        .from('events')
        .select('event_id, title, slug, event_start')
        .eq('parent_event_id', eventId)
        .order('event_start');
        
      childEvents = children || [];
    }
    
    return {
      current: currentEvent,
      parent: parentEvent,
      children: childEvents
    };
  } catch (error) {
    console.error('Error fetching event hierarchy:', error);
    return null;
  }
}

/**
 * Batch fetch multiple registrations (useful for bulk operations)
 */
export async function getMultipleRegistrations(registrationIds: string[]) {
  const supabase = await createClient();
  
  try {
    const { data: registrations } = await supabase
      .from('registrations')
      .select(`
        *,
        events (
          event_id,
          title,
          slug,
          organisations (
            organisation_id,
            name,
            stripe_onbehalfof
          )
        )
      `)
      .in('registration_id', registrationIds);
      
    return registrations || [];
  } catch (error) {
    console.error('Error fetching multiple registrations:', error);
    return [];
  }
}

/**
 * Get registration with minimal data for quick checks
 */
export async function getRegistrationMinimal(registrationId: string) {
  const supabase = await createClient();
  
  try {
    const { data } = await supabase
      .from('registrations')
      .select(`
        registration_id,
        registration_type,
        status,
        payment_status,
        total_amount,
        stripe_payment_intent_id,
        event_id
      `)
      .eq('registration_id', registrationId)
      .single();
      
    return data;
  } catch (error) {
    console.error('Error fetching minimal registration:', error);
    return null;
  }
}