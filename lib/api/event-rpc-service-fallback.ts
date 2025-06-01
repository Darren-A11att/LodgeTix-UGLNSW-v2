/**
 * Fallback implementation for event detail data
 * Used when RPC functions are not available or fail
 */

import { EventDetailData } from './event-rpc-service'

export async function getEventDetailDataFallback(
  client: any,
  eventIdentifier: string
): Promise<EventDetailData | null> {
  // This is a fallback implementation that queries tables directly
  // Used when the RPC function is not available
  
  try {
    // First, get the event by slug
    const { data: event, error: eventError } = await client
      .from('events')
      .select(`
        *,
        locations (*),
        organisations (*),
        functions (*),
        event_tickets (*)
      `)
      .eq('slug', eventIdentifier)
      .eq('is_published', true)
      .single()
    
    if (eventError || !event) {
      return null
    }
    
    // Get packages for the function
    const { data: packages } = await client
      .from('packages')
      .select('*')
      .eq('function_id', event.function_id)
      .eq('is_active', true)
    
    // Get related events
    const { data: relatedEvents } = await client
      .from('events')
      .select('event_id, title, slug, event_start, event_end')
      .eq('function_id', event.function_id)
      .neq('event_id', event.event_id)
      .eq('is_published', true)
      .order('event_start')
    
    // Calculate summary data
    const tickets = event.event_tickets || []
    const ticketPrices = tickets.map((t: any) => t.price).filter((p: any) => p !== null)
    const minPrice = ticketPrices.length > 0 ? Math.min(...ticketPrices) : 0
    const maxPrice = ticketPrices.length > 0 ? Math.max(...ticketPrices) : 0
    const totalCapacity = tickets.reduce((sum: number, t: any) => sum + (t.max_quantity || 0), 0)
    const totalAvailable = tickets.reduce((sum: number, t: any) => sum + (t.available_quantity || 0), 0)
    const ticketsSold = totalCapacity - totalAvailable
    
    // Format location
    const location = event.locations
    const locationString = location
      ? `${location.place_name}, ${location.suburb}, ${location.state}`
      : 'TBD'
    
    // Build the result
    return {
      event_id: event.event_id,
      slug: event.slug,
      title: event.title,
      subtitle: event.subtitle,
      description: event.description || '',
      long_description: event.description || null,
      event_start: event.event_start,
      event_end: event.event_end,
      location: locationString,
      venue_id: location?.location_id || null,
      venue_name: location?.place_name || null,
      venue_address: location?.street_address || null,
      venue_city: location?.suburb || null,
      venue_state: location?.state || null,
      venue_postcode: location?.postal_code || null,
      venue_map_url: location
        ? `https://maps.google.com/?q=${encodeURIComponent(
            location.street_address + ', ' + location.suburb + ', ' + location.state
          )}`
        : null,
      image_url: event.image_url,
      banner_image_url: event.image_url || null,
      is_featured: event.featured || false,
      event_type: event.type,
      dress_code: event.dress_code,
      regalia: event.regalia,
      degree_type: event.degree_type,
      is_package: false,
      package_id: null,
      organiser_name: event.organisations?.name || null,
      organiser_contact: null,
      min_price: minPrice,
      max_price: maxPrice,
      total_capacity: totalCapacity,
      tickets_sold: ticketsSold,
      is_sold_out: totalAvailable === 0 && totalCapacity > 0,
      has_free_tickets: minPrice === 0,
      tickets: tickets.map((ticket: any) => ({
        id: ticket.ticket_type_id,
        ticket_type_id: ticket.ticket_type_id,
        name: ticket.ticket_name,
        ticket_type_name: ticket.ticket_name,
        description: ticket.ticket_description || '',
        price: ticket.base_price || 0,
        quantity_available: ticket.available_quantity || 0,
        available_count: ticket.available_quantity || 0,
        total_capacity: ticket.max_quantity || 0,
        attendee_type: ticket.eligibility_type || 'General',
        is_sold_out: (ticket.available_quantity || 0) === 0,
        status: ticket.is_active ? 'Active' : 'Inactive',
        eligibility_criteria: null,
        has_eligibility_requirements: false
      })),
      packages: (packages || []).map((pkg: any) => ({
        id: pkg.package_id,
        package_id: pkg.package_id,
        name: pkg.name,
        description: pkg.description || '',
        price: pkg.price || 0,
        status: pkg.is_active ? 'Active' : 'Inactive',
        attendee_limit: null,
        eligibility_criteria: null,
        included_events: []
      })),
      ticket_types: tickets
    } as EventDetailData
  } catch (error) {
    console.error('[Fallback] Error fetching event detail data:', error)
    return null
  }
}