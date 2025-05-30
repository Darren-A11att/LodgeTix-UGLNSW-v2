import { createClient } from '@supabase/supabase-js'
import { Database } from '@/shared/types/database'
import { supabase, getServerClient } from '@/lib/supabase-singleton'

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
  parent_event_id: string | null;
  event_type: string | null;
  parent_slug: string | null;
  parent_title: string | null;
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
  parent_event_id: string | null;
  event_type: string | null;
  dress_code: string | null;
  regalia: string | null;
  degree_type: string | null;
  parent_slug: string | null;
  parent_title: string | null;
  is_package: boolean;
  package_id: string | null;
  venue_name: string | null;
  venue_address: string | null;
  venue_city: string | null;
  venue_state: string | null;
  venue_postcode: string | null;
  venue_map_url: string | null;
  organizer_name: string | null;
  organizer_contact: string | null;
  child_events: Array<{
    id: string;
    slug: string;
    title: string;
    subtitle: string | null;
    description: string;
    event_start: string;
    event_end: string | null;
    location: string;
    image_url: string | null;
    type: string | null;
    min_price: number;
    is_sold_out: boolean;
  }>;
  tickets: Array<{
    id: string;
    name: string;
    description: string | null;
    price: number;
    quantity_total: number;
    quantity_sold: number;
    quantity_available: number;
    min_per_order: number;
    max_per_order: number;
    attendee_type: string | null;
    is_active: boolean;
    sort_order: number | null;
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
    is_parent: boolean;
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
  private client: ReturnType<typeof createClient<Database>>;

  constructor(isServer: boolean = false) {
    this.client = isServer ? getServerClient() : supabase;
  }

  /**
   * Fetch event card data for listing pages
   * @param options Query options
   * @returns Array of event card data
   */
  async getEventCardsData(options?: {
    eventIds?: string[];
    featuredOnly?: boolean;
    limit?: number;
  }): Promise<EventCardData[]> {
    const { data, error } = await this.client.rpc('get_event_card_data', {
      p_event_ids: options?.eventIds || null,
      p_featured_only: options?.featuredOnly || false,
      p_limit: options?.limit || null
    });
    
    if (error) {
      console.error('Error fetching event cards:', error);
      throw error;
    }
    
    return (data as EventCardData[]) || [];
  }

  /**
   * Fetch detailed event data for a single event page
   * @param eventIdentifier Event UUID or slug
   * @returns Event detail data or null if not found
   */
  async getEventDetailData(eventIdentifier: string): Promise<EventDetailData | null> {
    const { data, error } = await this.client.rpc('get_event_detail_data', {
      p_event_identifier: eventIdentifier
    });
    
    if (error) {
      console.error('Error fetching event details:', error);
      throw error;
    }
    
    // RPC returns an array, get first item
    const result = Array.isArray(data) ? data[0] : data;
    return result || null;
  }

  /**
   * Fetch all necessary data for event registration flow
   * @param eventId Event UUID
   * @returns Registration event data
   */
  async getRegistrationEventData(eventId: string): Promise<RegistrationEventData | null> {
    const { data, error } = await this.client.rpc('get_registration_event_data', {
      p_event_id: eventId
    });
    
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
  async getFeaturedEvents(limit: number = 3): Promise<EventCardData[]> {
    return this.getEventCardsData({
      featuredOnly: true,
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