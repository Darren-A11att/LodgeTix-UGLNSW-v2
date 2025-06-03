import { createClient } from '@/utils/supabase/server'
import { Database } from '@/shared/types/database'
import { supabase } from '@/lib/supabase-singleton'
import { getFilterParams, isFilteringEnabled } from '@/lib/config/environment'

// Types for RPC function returns
export interface EventCardData {
  event_id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string;
  event_start: string;
  event_end: string | null;
  location: string;
  image_url: string | null;
  is_featured: boolean;
  event_type: string | null;
  min_price: number;
  max_price: number;
  has_free_tickets: boolean;
  total_capacity: number;
  tickets_sold: number;
  is_sold_out: boolean;
}

export interface EventDetailData {
  event_id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string;
  long_description: string | null;
  event_start: string;
  event_end: string | null;
  location: string;
  venue_id: string | null;
  image_url: string | null;
  banner_image_url: string | null;
  is_featured: boolean;
  event_type: string | null;
  dress_code: string | null;
  regalia: string | null;
  degree_type: string | null;
  is_package: boolean;
  package_id: string | null;
  venue_name: string | null;
  venue_address: string | null;
  venue_city: string | null;
  venue_state: string | null;
  venue_postcode: string | null;
  venue_map_url: string | null;
  organiser_name: string | null;
  organiser_contact: string | null;
  packages: Array<{
    package_id: string;
    name: string;
    description: string | null;
    price: number;
    status: string;
    attendee_limit: number | null;
    eligibility_criteria: any;
    included_events: Array<{
      event_id: string;
      title: string;
      slug: string;
    }>;
  }>;
  ticket_types: Array<{
    ticket_type_id: string;
    ticket_type_name: string;
    description: string | null;
    price: number;
    total_capacity: number;
    available_count: number;
    actual_available: number;
    is_sold_out: boolean;
    percentage_sold: number;
    status: string;
    eligibility_criteria: any;
    has_eligibility_requirements: boolean;
    ticket_category: string | null;
  }>;
  min_price: number;
  max_price: number;
  has_free_tickets: boolean;
  total_capacity: number;
  tickets_sold: number;
  is_sold_out: boolean;
}

export interface RegistrationEventData {
  event_id: string;
  event_title: string;
  event_type: string | null;
  is_package: boolean;
  all_events: Array<{
    id: string;
    title: string;
    subtitle: string | null;
    event_start: string;
    event_end: string | null;
    location: string;
    type: string | null;
  }>;
  all_tickets: Array<{
    id: string;
    event_id: string;
    event_title: string;
    name: string;
    description: string | null;
    price: number;
    quantity_available: number;
    min_per_order: number;
    max_per_order: number;
    attendee_type: string | null;
    includes_events: string[];
  }>;
  package_info: {
    package_id: string | null;
    discount_percentage: number | null;
    discount_amount: number | null;
    package_price: number | null;
    includes_all_events: boolean | null;
  };
  venue_details: {
    venue_id: string | null;
    name: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    postcode: string | null;
    map_url: string | null;
  };
}

export class EventRPCService {
  private client: ReturnType<typeof createClient<Database>> | null = null;
  private isServer: boolean;

  constructor(isServer: boolean = false) {
    this.isServer = isServer;
    if (!isServer) {
      this.client = supabase;
    }
  }

  private async getClient() {
    if (!this.client) {
      this.client = this.isServer ? await createClient() : supabase;
    }
    return this.client;
  }

  /**
   * Fetch event card data for listing pages
   * @param options Query options
   * @returns Array of event card data
   */
  async getEventCardsData(options?: {
    eventIds?: string[];
    featuredOnly?: boolean;
    functionId?: string;
    limit?: number;
  }): Promise<EventCardData[]> {
    const client = await this.getClient();
    
    // Apply environment filtering
    const filterParams = getFilterParams();
    let effectiveFunctionId = options?.functionId;
    let effectiveOrganiserId: string | undefined;
    
    if (isFilteringEnabled() && filterParams) {
      if (filterParams.column === 'function_id') {
        // Override with environment function_id if not explicitly provided
        effectiveFunctionId = effectiveFunctionId || filterParams.value;
      } else if (filterParams.column === 'organiser_id') {
        effectiveOrganiserId = filterParams.value;
      }
    }
    
    // Query directly from events table with joins
    let query = client
      .from('events')
      .select(`
        event_id,
        slug,
        title,
        subtitle,
        description,
        event_start,
        event_end,
        image_url,
        featured,
        type,
        function_id,
        location_id,
        organiser_id,
        locations (
          place_name,
          street_address,
          suburb,
          state,
          postal_code
        ),
        event_tickets (
          price,
          total_capacity,
          available_count
        )
      `)
      .eq('is_published', true)
      .order('event_start', { ascending: true });

    // Apply filters
    if (options?.eventIds && options.eventIds.length > 0) {
      query = query.in('event_id', options.eventIds);
    }
    
    if (options?.featuredOnly) {
      query = query.eq('featured', true);
    }
    
    if (effectiveFunctionId) {
      query = query.eq('function_id', effectiveFunctionId);
    }
    
    if (effectiveOrganiserId) {
      query = query.eq('organiser_id', effectiveOrganiserId);
    }
    
    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching event cards:', error);
      throw error;
    }
    
    // Transform the data to match EventCardData interface
    return (data || []).map(event => {
      // Calculate min price from tickets
      const ticketPrices = (event.event_tickets || []).map(t => t.price).filter(p => p !== null);
      const minPrice = ticketPrices.length > 0 ? Math.min(...ticketPrices) : 0;
      const maxPrice = ticketPrices.length > 0 ? Math.max(...ticketPrices) : 0;
      
      // Calculate capacity and sold tickets
      const totalCapacity = (event.event_tickets || []).reduce((sum, t) => sum + (t.total_capacity || 0), 0);
      const totalAvailable = (event.event_tickets || []).reduce((sum, t) => sum + (t.available_count || 0), 0);
      const ticketsSold = totalCapacity - totalAvailable;
      
      // Format location string
      const location = event.locations ? 
        `${event.locations.place_name}, ${event.locations.suburb}, ${event.locations.state}` : 
        'TBD';
      
      return {
        event_id: event.event_id,
        slug: event.slug,
        title: event.title,
        subtitle: event.subtitle,
        description: event.description || '',
        event_start: event.event_start,
        event_end: event.event_end,
        location: location,
        image_url: event.image_url,
        is_featured: event.featured || false,
        event_type: event.type,
        min_price: minPrice,
        max_price: maxPrice,
        has_free_tickets: minPrice === 0,
        total_capacity: totalCapacity,
        tickets_sold: ticketsSold,
        is_sold_out: totalAvailable === 0 && totalCapacity > 0
      };
    });
  }

  /**
   * Fetch detailed event data for a single event page
   * @param eventIdentifier Event slug (the function expects a slug, not UUID)
   * @returns Event detail data or null if not found
   */
  async getEventDetailData(eventIdentifier: string): Promise<EventDetailData | null> {
    console.log('[EventRPCService] Calling get_event_with_details with slug:', eventIdentifier);
    const client = await this.getClient();
    console.log('[EventRPCService] Using client URL:', client.supabaseUrl);
    
    const { data, error } = await client.rpc('get_event_with_details', {
      p_event_slug: eventIdentifier
    });
    
    if (error) {
      console.error('[EventRPCService] Error fetching event details:', error);
      console.error('[EventRPCService] Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      throw error;
    }
    
    if (!data) return null;
    
    // Apply environment filtering
    const filterParams = getFilterParams();
    if (isFilteringEnabled() && filterParams && data.event) {
      if (filterParams.column === 'function_id' && data.event.function_id !== filterParams.value) {
        console.log('[EventRPCService] Event filtered out by function_id:', data.event.function_id, '!==', filterParams.value);
        return null;
      }
      if (filterParams.column === 'organiser_id' && data.event.organiser_id !== filterParams.value) {
        console.log('[EventRPCService] Event filtered out by organiser_id:', data.event.organiser_id, '!==', filterParams.value);
        return null;
      }
    }
    
    // The RPC returns a nested structure, extract and flatten the event data
    const eventData = data.event;
    const location = data.location;
    const organisation = data.organisation;
    const summary = data.summary;
    
    // Combine all the data into the expected flat structure
    const result: EventDetailData = {
      ...eventData,
      // Override with formatted location string if available
      location: location?.location_string || eventData.location || '',
      // Add location details
      venue_id: location?.location_id || null,
      venue_name: location?.place_name || null,
      venue_address: location?.street_address || null,
      venue_city: location?.suburb || null,
      venue_state: location?.state || null,
      venue_postcode: location?.postal_code || null,
      venue_map_url: location ? `https://maps.google.com/?q=${encodeURIComponent(location.street_address + ', ' + location.suburb + ', ' + location.state)}` : null,
      // Add organisation details
      organiser_name: organisation?.name || null,
      organiser_contact: null, // Not provided by RPC
      // Add summary data
      min_price: summary?.min_price || 0,
      max_price: summary?.max_price || summary?.min_price || 0, // Now provided by updated RPC
      total_capacity: summary?.total_capacity || 0,
      tickets_sold: summary?.tickets_sold || 0,
      is_sold_out: summary?.is_sold_out || false,
      has_free_tickets: summary?.min_price === 0,
      // Add missing fields with defaults
      long_description: eventData.description || null,
      banner_image_url: eventData.image_url || null,
      is_package: false,
      package_id: null,
      // Map tickets from RPC response to expected format
      tickets: (data.tickets || []).map((ticket: any) => ({
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
        eligibility_criteria: ticket.eligibility_type || null,
        has_eligibility_requirements: !!ticket.eligibility_type
      })),
      // Map packages with proper structure
      packages: (data.packages || []).map((pkg: any) => ({
        id: pkg.package_id,
        package_id: pkg.package_id,
        name: pkg.name,
        description: pkg.description || '',
        price: pkg.package_price || pkg.price || 0,
        status: pkg.status || 'Active',
        attendee_limit: pkg.attendee_limit || null,
        eligibility_criteria: pkg.eligibility_criteria || null,
        included_events: pkg.included_events || []
      })),
      // Keep raw data for backward compatibility
      ticket_types: data.tickets || []
    } as any;
    
    return result;
  }

  /**
   * Fetch all necessary data for event registration flow
   * @param eventId Event UUID
   * @returns Registration event data
   */
  async getRegistrationEventData(eventId: string): Promise<RegistrationEventData | null> {
    const client = await this.getClient();
    // Note: get_registration_event_data doesn't exist in current schema
    // This functionality needs to be replaced with get_event_with_details
    throw new Error('get_registration_event_data is not implemented. Use getEventDetailData instead.');
    
    if (error) {
      console.error('Error fetching registration event data:', error);
      throw error;
    }
    
    // RPC returns an array, get first item
    const result = Array.isArray(data) ? data[0] : data;
    return result || null;
  }

  /**
   * Helper method to get featured events
   */
  async getFeaturedEvents(limit: number = 3, functionId?: string): Promise<EventCardData[]> {
    return this.getEventCardsData({
      featuredOnly: true,
      functionId,
      limit
    });
  }

  /**
   * Helper method to get all published events
   */
  async getAllEvents(): Promise<EventCardData[]> {
    return this.getEventCardsData();
  }

  /**
   * Helper method to check if an event exists
   */
  async eventExists(eventIdentifier: string): Promise<boolean> {
    try {
      const event = await this.getEventDetailData(eventIdentifier);
      return event !== null;
    } catch {
      return false;
    }
  }
}