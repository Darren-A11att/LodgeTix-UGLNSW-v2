import { createClient } from '@/utils/supabase/server';

/**
 * Fixed version of getRegistrationWithFullContext that works with the new schema
 * where registrations link to functions, not events
 */
export async function getRegistrationWithFullContext(
  registrationId: string
): Promise<any | null> {
  const supabase = await createClient();
  
  try {
    // Main registration query with function and organization
    const { data: registration, error: regError } = await supabase
      .from('registrations')
      .select(`
        *,
        functions!inner (
          function_id,
          name,
          description,
          slug,
          start_date,
          end_date,
          image_url,
          organiser_id,
          organisations!organiser_id (
            organisation_id,
            name,
            type,
            abbreviation,
            stripe_onbehalfof,
            website,
            city,
            state,
            country
          ),
          events (
            event_id,
            title,
            subtitle,
            slug,
            type,
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
            is_purchasable_individually
          )
        )
      `)
      .eq('registration_id', registrationId)
      .single();
      
    if (regError || !registration) {
      console.error('Error fetching registration:', regError);
      return null;
    }
    
    // Get the first event from the function for backward compatibility
    const firstEvent = registration.functions?.events?.[0] || null;
    
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
      .order('is_primary', { ascending: false });
      
    // Fetch tickets with event details
    const { data: tickets } = await supabase
      .from('tickets')
      .select(`
        *,
        event_tickets!ticket_type_id (
          event_ticket_id,
          title,
          description,
          price,
          ticket_type,
          event_id,
          events!inner (
            event_id,
            title,
            slug,
            function_id
          )
        )
      `)
      .eq('registration_id', registrationId);
      
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
    
    // Calculate attendee count
    const attendeeCount = attendees?.length || 0;
    const totalAmount = registration.total_price_paid || 0;
    
    // Map primary attendee - check both is_primary and is_primary_contact for compatibility
    const primaryAttendee = attendees?.find(a => a.is_primary || a.is_primary_contact) || attendees?.[0];
    
    // Build the response structure for backward compatibility
    return {
      registration: {
        registration_id: registration.registration_id,
        registration_type: registration.registration_type || 'individual',
        attendee_count: attendeeCount,
        subtotal: registration.subtotal || totalAmount,
        total_amount: totalAmount,
        status: registration.status || 'unpaid',
        payment_status: registration.payment_status || 'pending',
        created_at: registration.created_at,
        confirmation_number: registration.confirmation_number,
        stripe_payment_intent_id: registration.stripe_payment_intent_id,
        total_amount_paid: registration.total_amount_paid,
        stripe_fee: registration.stripe_fee,
        includes_processing_fee: registration.includes_processing_fee
      },
      
      // Map the first event for backward compatibility with payment processing
      event: firstEvent ? {
        event_id: firstEvent.event_id,
        title: firstEvent.title,
        subtitle: firstEvent.subtitle,
        slug: firstEvent.slug,
        function_id: registration.function_id,
        event_start: firstEvent.event_start,
        event_end: firstEvent.event_end,
        type: firstEvent.type,
        location_id: firstEvent.location_id,
        max_attendees: firstEvent.max_attendees,
        is_multi_day: firstEvent.is_multi_day,
        is_published: firstEvent.is_published,
        featured: firstEvent.featured,
        degree_type: firstEvent.degree_type,
        dress_code: firstEvent.dress_code,
        regalia: firstEvent.regalia,
        regalia_description: firstEvent.regalia_description,
        important_information: firstEvent.important_information
      } : {
        // Fallback if no events - use function data
        event_id: registration.function_id,
        title: registration.functions?.name || 'Event',
        subtitle: null,
        slug: registration.functions?.slug || '',
        function_id: registration.function_id,
        event_start: registration.functions?.start_date,
        event_end: registration.functions?.end_date,
        type: 'function',
        location_id: null,
        max_attendees: null,
        is_multi_day: true,
        is_published: true,
        featured: false,
        degree_type: null,
        dress_code: null,
        regalia: null,
        regalia_description: null,
        important_information: null
      },
      
      organization: registration.functions?.organisations || {},
      
      function: registration.functions ? {
        function_id: registration.functions.function_id,
        name: registration.functions.name,
        description: registration.functions.description,
        slug: registration.functions.slug,
        start_date: registration.functions.start_date,
        end_date: registration.functions.end_date,
        image_url: registration.functions.image_url
      } : null,
      
      function_events: registration.functions?.events || [],
      
      attendees: (attendees || []).map(attendee => ({
        attendee_id: attendee.attendee_id,
        first_name: attendee.first_name || '',
        last_name: attendee.last_name || '',
        attendee_type: attendee.attendee_type || 'guest',
        email: attendee.email,
        phone_number: attendee.phone,
        dietary_requirements: attendee.dietary_requirements,
        accessibility_requirements: attendee.special_needs,
        is_primary_contact: attendee.is_primary || false,
        mason_type: attendee.attendee_type === 'mason' ? attendee.attendee_type : null,
        lodge_name: attendee.masonic_profiles?.lodges?.name,
        lodge_number: attendee.masonic_profiles?.lodges?.number,
        grand_lodge: attendee.masonic_profiles?.grand_lodges?.name,
        masonic_rank: attendee.suffix,
        masonic_profiles: attendee.masonic_profiles
      })),
      
      tickets: (tickets || []).map(ticket => ({
        ticket_id: ticket.ticket_id,
        event_ticket_id: ticket.ticket_type_id,
        event_id: ticket.event_id,
        price: ticket.ticket_price || 0,
        event_tickets: ticket.event_tickets
      })),
      
      lodge_registration: lodgeRegistration
    };
    
  } catch (error) {
    console.error('Error in getRegistrationWithFullContext:', error);
    return null;
  }
}