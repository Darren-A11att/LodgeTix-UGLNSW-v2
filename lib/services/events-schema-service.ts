// Event Service using the existing public.Events table
import type { EventType } from '@/shared/types/event'
import { api } from '@/lib/api-logger'
import { getSupabaseClient } from '@/lib/supabase-singleton'

// Define the structure of events in the existing schema (matching actual database)
interface EventsSchemaRow {
  id: string
  slug: string
  title: string
  subtitle?: string | null
  description: string | null
  event_start: string | null // Using snake_case as in DB
  event_end?: string | null
  location: string | null
  locationid?: string | null // Reference to location record
  type?: string | null
  category?: string | null
  degree_type?: string | null
  dress_code?: string | null
  regalia?: string | null
  regalia_description?: string | null
  image_url?: string | null // Using snake_case as in DB
  organizer_name?: string | null
  organizer_contact?: any
  is_published?: boolean | null
  featured?: boolean | null
  sections?: any
  attendance?: any
  documents?: any
  related_events?: string[] | null
  parent_event_id?: string | null // Using snake_case as in DB
  created_at: string // Using snake_case as in DB
  updated_at?: string // Using snake_case as in DB
  
  // Legacy fields (maintained for backward compatibility)
  event_id?: string | null
  price?: number | null
  is_purchasable_individually?: boolean | null
  is_multi_day?: boolean | null
  important_information?: string[] | null
  event_includes?: string[] | null
  max_attendees?: number | null
  display_scope_id?: string | null
  registration_availability_id?: string | null
  organiserorganisationid?: string | null
  latitude?: number | null
  longitude?: number | null
}

// Default values for missing or invalid fields
const DEFAULT_EVENT_VALUES = {
  title: 'Untitled Event',
  description: 'No description available',
  location: 'TBD',
  date: 'Date TBD',
  time: 'Time TBD',
  ticketsSold: 0,
  revenue: '$0',
  status: 'Draft'
};

/**
 * Check if a value is valid and non-empty
 * Works for strings, arrays, objects
 */
function isValidValue(value: any): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim() !== '';
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return true;
}

/**
 * Safely parse a date string or return undefined
 */
function safeParseDate(dateStr: string | undefined): Date | undefined {
  if (!dateStr) return undefined;
  try {
    const date = new Date(dateStr);
    // Check if date is valid
    if (isNaN(date.getTime())) return undefined;
    return date;
  } catch (error) {
    return undefined;
  }
}

/**
 * Format a price as a currency string
 */
function formatPrice(price: number | undefined | null): string | undefined {
  if (price === undefined || price === null) return undefined;
  return `$${price.toFixed(2)}`;
}

export class EventsSchemaService {
  private supabase
  private isConnected: boolean = false
  
  constructor(isServer: boolean = false) {
    try {
      // Use the singleton pattern to get the Supabase client
      this.supabase = getSupabaseClient(isServer);
      this.isConnected = true;
    } catch (error) {
      api.error('Failed to initialize Supabase client:', error);
      // Create a dummy client that will throw errors when used
      this.supabase = {
        from: () => {
          throw new Error('Supabase client initialization failed');
        }
      };
      this.isConnected = false;
    }
  }
  
  /**
   * Get an event by UUID or slug
   */
  async getEventByIdOrSlug(idOrSlug: string): Promise<EventType | null> {
    // Validate input
    if (!idOrSlug) {
      api.warn('getEventByIdOrSlug called with empty idOrSlug');
      return null;
    }
    
    // Check connection status
    if (!this.isConnected) {
      api.error('Supabase client not connected, cannot fetch event');
      throw new Error('Database connection error');
    }
    
    try {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
      
      api.debug(`Fetching event by ${isUUID ? 'UUID' : 'slug'}: ${idOrSlug}`);
      
      let query = this.supabase
        .from("events") // Use snake_case table name
        .select('*');
      
      if (isUUID) {
        query = query.eq('id', idOrSlug);
      } else {
        query = query.eq('slug', idOrSlug);
      }
      
      const { data, error } = await query.single();
      
      if (error) {
        api.error(`Error fetching event ${idOrSlug}:`, error);
        throw error;
      }
      
      if (!data) {
        api.warn(`No event found with ${isUUID ? 'UUID' : 'slug'}: ${idOrSlug}`);
        return null;
      }
      
      // Additional validation to ensure we have valid data structure
      if (typeof data !== 'object' || Array.isArray(data)) {
        api.error(`Invalid data structure received for event ${idOrSlug}:`, data);
        return null;
      }
      
      const transformedEvent = this.transformEvent(data);
      api.debug(`Successfully transformed event: ${data.title || 'Unknown'}`);
      
      return transformedEvent;
    } catch (error) {
      api.error(`Error in getEventByIdOrSlug for ${idOrSlug}:`, error);
      throw error;
    }
  }
  
  /**
   * Get all published events
   */
  async getPublishedEvents(): Promise<EventType[]> {
    // Check connection status
    if (!this.isConnected) {
      api.error('Supabase client not connected, cannot fetch published events');
      throw new Error('Database connection error');
    }
    
    try {
      api.debug('Fetching published events');
      
      // Handle both old and new schema
      // Old schema used 'featured' or 'status' to determine published state
      // New schema uses is_published column
      const { data, error } = await this.supabase
        .from("events") // Use snake_case table name
        .select('*')
        .or('is_published.eq.true, featured.eq.true')
        .order("event_start", { ascending: true });
      
      if (error) {
        api.error('Error fetching published events:', error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        // Only warn if not during build time
        if (typeof window !== 'undefined' || process.env.NODE_ENV !== 'production') {
          api.warn('No published events found');
        }
        return [];
      }
      
      const transformedEvents = data.map(event => this.transformEvent(event));
      api.debug(`Successfully transformed ${transformedEvents.length} published events`);
      
      return transformedEvents;
    } catch (error) {
      api.error('Error in getPublishedEvents:', error);
      throw error;
    }
  }
  
  /**
   * Get featured events
   */
  async getFeaturedEvents(): Promise<EventType[]> {
    // Check connection status
    if (!this.isConnected) {
      api.error('Supabase client not connected, cannot fetch featured events');
      throw new Error('Database connection error');
    }
    
    try {
      api.debug('Fetching featured events');
      
      const { data, error } = await this.supabase
        .from("events") // Use snake_case table name
        .select('*')
        .eq('featured', true)
        .order("event_start", { ascending: true })
        .limit(3);
      
      if (error) {
        api.error('Error fetching featured events:', error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        api.warn('No featured events found');
        return [];
      }
      
      const transformedEvents = data.map(event => this.transformEvent(event));
      api.debug(`Successfully transformed ${transformedEvents.length} featured events`);
      
      return transformedEvents;
    } catch (error) {
      api.error('Error in getFeaturedEvents:', error);
      throw error;
    }
  }
  
  /**
   * Get events by category
   */
  async getEventsByCategory(category: string): Promise<EventType[]> {
    // Validate input
    if (!category) {
      api.warn('getEventsByCategory called with empty category');
      return [];
    }
    
    // Check connection status
    if (!this.isConnected) {
      api.error('Supabase client not connected, cannot fetch events by category');
      throw new Error('Database connection error');
    }
    
    try {
      api.debug(`Fetching events for category: ${category}`);
      
      const { data, error } = await this.supabase
        .from("events") // Use snake_case table name
        .select('*')
        .eq('type', category)
        .order("event_start", { ascending: true });
      
      if (error) {
        api.error(`Error fetching events for category ${category}:`, error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        api.warn(`No events found for category: ${category}`);
        return [];
      }
      
      const transformedEvents = data.map(event => this.transformEvent(event));
      api.debug(`Successfully transformed ${transformedEvents.length} events for category: ${category}`);
      
      return transformedEvents;
    } catch (error) {
      api.error(`Error in getEventsByCategory for ${category}:`, error);
      throw error;
    }
  }
  
  /**
   * Get upcoming events
   */
  async getUpcomingEvents(limit: number = 10): Promise<EventType[]> {
    // Validate limit
    if (limit <= 0) {
      api.warn(`Invalid limit (${limit}) provided to getUpcomingEvents, using default of 10`);
      limit = 10;
    }
    
    // Check connection status
    if (!this.isConnected) {
      api.error('Supabase client not connected, cannot fetch upcoming events');
      throw new Error('Database connection error');
    }
    
    try {
      const now = new Date().toISOString();
      api.debug(`Fetching upcoming events from ${now}, limit: ${limit}`);
      
      const { data, error } = await this.supabase
        .from("events") // Use snake_case table name
        .select('*')
        .gte("event_start", now)
        .order("event_start", { ascending: true })
        .limit(limit);
      
      if (error) {
        api.error('Error fetching upcoming events:', error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        api.warn('No upcoming events found');
        return [];
      }
      
      const transformedEvents = data.map(event => this.transformEvent(event));
      api.debug(`Successfully transformed ${transformedEvents.length} upcoming events`);
      
      return transformedEvents;
    } catch (error) {
      api.error('Error in getUpcomingEvents:', error);
      throw error;
    }
  }
  
  /**
   * Get related events
   */
  async getRelatedEvents(event_id: string): Promise<EventType[]> {
    // Validate input
    if (!event_id) {
      api.warn('getRelatedEvents called with empty event_id');
      return [];
    }
    
    // Check connection status
    if (!this.isConnected) {
      api.error('Supabase client not connected, cannot fetch related events');
      throw new Error('Database connection error');
    }
    
    try {
      api.debug(`Fetching related events for event_id: ${event_id}`);
      
      // First get the event and its related events array
      const { data: event, error: eventError } = await this.supabase
        .from("events") // Use snake_case table name
        .select('related_events')
        .eq('id', event_id)
        .single();
      
      if (eventError) {
        api.error(`Error fetching event ${event_id} for related events:`, eventError);
        throw eventError;
      }
      
      if (!event || !event.related_events || !Array.isArray(event.related_events) || event.related_events.length === 0) {
        api.debug(`No related events found for event_id: ${event_id}`);
        return [];
      }
      
      // Fetch the related events
      const { data, error } = await this.supabase
        .from("events") // Use snake_case table name
        .select('*')
        .in('id', event.related_events)
        .order("event_start", { ascending: true });
      
      if (error) {
        api.error(`Error fetching related events for event_id ${event_id}:`, error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        api.warn(`Related events array exists but no related events found for event_id: ${event_id}`);
        return [];
      }
      
      const transformedEvents = data.map(e => this.transformEvent(e));
      api.debug(`Successfully transformed ${transformedEvents.length} related events for event_id: ${event_id}`);
      
      return transformedEvents;
    } catch (error) {
      api.error(`Error in getRelatedEvents for event_id ${event_id}:`, error);
      throw error;
    }
  }
  
  /**
   * Search events
   */
  async searchEvents(query: string): Promise<EventType[]> {
    // Validate input
    if (!query || query.trim() === '') {
      api.warn('searchEvents called with empty query');
      return [];
    }
    
    // Check connection status
    if (!this.isConnected) {
      api.error('Supabase client not connected, cannot search events');
      throw new Error('Database connection error');
    }
    
    // Sanitize the query for security
    const sanitizedQuery = query.trim().replace(/['";\\]/g, '');
    
    if (sanitizedQuery === '') {
      api.warn('searchEvents query was sanitized to empty string');
      return [];
    }
    
    try {
      api.debug(`Searching events for query: ${sanitizedQuery}`);
      
      const { data, error } = await this.supabase
        .from("events") // Use snake_case table name
        .select('*')
        .or(`title.ilike.%${sanitizedQuery}%,description.ilike.%${sanitizedQuery}%,location.ilike.%${sanitizedQuery}%`)
        .order("event_start", { ascending: true });
      
      if (error) {
        api.error(`Error searching events for query "${sanitizedQuery}":`, error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        api.debug(`No events found for search query: ${sanitizedQuery}`);
        return [];
      }
      
      const transformedEvents = data.map(event => this.transformEvent(event));
      api.debug(`Successfully transformed ${transformedEvents.length} events for search query: ${sanitizedQuery}`);
      
      return transformedEvents;
    } catch (error) {
      api.error(`Error in searchEvents for query "${query}":`, error);
      throw error;
    }
  }
  
  /**
   * Transform database event to EventType
   * This function handles both the old schema (camelCase) and new schema (snake_case) fields
   * and deals with potentially missing or malformed data
   */
  private transformEvent(data: EventsSchemaRow): EventType {
    try {
      if (!data || !data.id) {
        api.error('transformEvent received invalid data:', data);
        throw new Error('Invalid event data received - missing required ID field');
      }
      
      // Get location data from location field
      const locationName = 
        data.location || 
        DEFAULT_EVENT_VALUES.location;
      
      // Parse dates for formatting (with fallbacks)
      const eventStartDate = safeParseDate(data.event_start || undefined);
      const eventEndDate = safeParseDate(data.event_end || undefined);
      
      // Format date string for display
      let dateString = DEFAULT_EVENT_VALUES.date;
      let timeString = DEFAULT_EVENT_VALUES.time;
      
      if (eventStartDate) {
        try {
          dateString = eventStartDate.toLocaleDateString();
          timeString = eventStartDate.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
          });
        } catch (error) {
          api.warn(`Error formatting date/time for event ${data.id}:`, error);
        }
      }
      
      // Format the full event object with proper type handling and defaults
      const event: EventType = {
        // Core required fields with camelCase mapping
        id: data.id,
        slug: data.slug || `event-${data.id.slice(0, 8)}`, // Generate slug if missing
        title: isValidValue(data.title) ? data.title : DEFAULT_EVENT_VALUES.title,
        description: isValidValue(data.description) ? data.description : DEFAULT_EVENT_VALUES.description,
        
        // Map snake_case to camelCase for core date fields
        eventStart: data.event_start || '', // Required field in EventType
        eventEnd: data.event_end || null,
        
        // Frontend-specific formatted fields
        date: dateString,
        time: timeString,
        
        // Location handling
        location: locationName,
        latitude: data.latitude || null,
        longitude: data.longitude || null,
        
        // Event details with proper defaulting
        type: isValidValue(data.type) ? data.type : null,
        featured: data.featured || null,
        
        // UI-specific fields
        imageUrl: isValidValue(data.image_url) ? data.image_url: null,
        imageSrc: isValidValue(data.image_url) ? data.image_url: undefined, // Optional alias
        
        // Map snake_case to camelCase for metadata
        createdAt: data.created_at,
        isMultiDay: data.is_multi_day || null,
        parentEventId: isValidValue(data.parent_event_id) ? data.parent_event_id: null,
        
        // Content fields with array validation
        eventIncludes: Array.isArray(data.event_includes) ? data.event_includes: null,
        importantInformation: Array.isArray(data.important_information) ? data.important_information: null,
        
        // Status and feature flags
        isPurchasableIndividually: data.is_purchasable_individually || null,
        
        // Additional fields not in EventType interface but used elsewhere
        // These will be type-ignored or extended later
        category: isValidValue(data.category) ? data.category : null,
        event_start: data.event_start || '', // Keep snake_case version for compatibility
        event_end: data.event_end || null,
        created_at: data.created_at, // Keep snake_case version
        is_multi_day: !!data.is_multi_day,
        parent_event_id: isValidValue(data.parent_event_id) ? data.parent_event_id: null,
        event_includes: Array.isArray(data.event_includes) ? data.event_includes: null,
        important_information: Array.isArray(data.important_information) ? data.important_information: null,
        is_purchasable_individually: !!data.is_purchasable_individually,
        image_url: isValidValue(data.image_url) ? data.image_url: null,
        isPublished: data.is_published !== undefined ? !!data.is_published : !!data.featured,
        status: data.is_published ? "Published" : "Draft",
        organizerName: isValidValue(data.organizer_name) ? data.organizer_name : null,
        organizerContact: isValidValue(data.organizer_contact) ? data.organizer_contact : null,
        degreeType: isValidValue(data.degree_type) ? data.degree_type : null,
        dressCode: isValidValue(data.dress_code) ? data.dress_code : null,
        regalia: isValidValue(data.regalia) ? data.regalia : null,
        regaliaDescription: isValidValue(data.regalia_description) ? data.regalia_description : null,
        sections: isValidValue(data.sections) ? data.sections : null,
        attendance: isValidValue(data.attendance) ? data.attendance : null,
        documents: isValidValue(data.documents) ? data.documents : null,
        price: formatPrice(data.price),
        ticketsSold: DEFAULT_EVENT_VALUES.ticketsSold,
        revenue: DEFAULT_EVENT_VALUES.revenue,
        relatedEventIds: Array.isArray(data.related_events) ? data.related_events : null,
      } as EventType & Record<string, any>; // Allow additional properties
      
      // Note: eligibility requirements would be in sections but not directly on EventType
      
      return event;
    } catch (error) {
      api.error(`Error transforming event data for ID ${data?.id || 'unknown'}:`, error);
      
      // Don't return invalid data - throw the error up the chain
      throw new Error(`Failed to transform event data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Factory functions for creating instances
export function getEventService(): EventsSchemaService {
  return new EventsSchemaService(false);
}

export function getServerEventService(): EventsSchemaService {
  return new EventsSchemaService(true);
}