// Event Service using the existing public.Events table
import type { EventType } from '@/shared/types/event'
import { api } from '@/lib/api-logger'
import { getSupabaseClient } from '@/lib/supabase-singleton'

// Define the structure of events in the existing schema
interface EventsSchemaRow {
  id: string
  slug: string
  title: string
  subtitle?: string
  description: string
  eventStart: string // Using existing camelCase column names
  eventEnd?: string
  location: string
  locationid?: string // Reference to location record
  type?: string
  category?: string
  degree_type?: string
  dress_code?: string
  regalia?: string
  regalia_description?: string
  imageUrl?: string // Using existing camelCase column name
  organizer_name?: string
  organizer_contact?: any
  is_published?: boolean
  featured?: boolean
  sections?: any
  attendance?: any
  documents?: any
  related_events?: string[]
  parentEventId?: string // Using existing camelCase column name
  createdAt: string // Using existing camelCase column name
  updatedAt: string // Using existing camelCase column name
  
  // Legacy fields (maintained for backward compatibility)
  eventId?: string
  price?: number
  isPurchasableIndividually?: boolean
  isMultiDay?: boolean
  importantInformation?: string[]
  eventIncludes?: string[]
  maxAttendees?: number
  displayScopeId?: string
  registrationAvailabilityId?: string
  organiserorganisationid?: string
  locationid?: string
  latitude?: number
  longitude?: number
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
        .select('*')
        .single();
      
      if (isUUID) {
        query = query.eq('id', idOrSlug);
      } else {
        query = query.eq('slug', idOrSlug);
      }
      
      const { data, error } = await query;
      
      if (error) {
        api.error(`Error fetching event ${idOrSlug}:`, error);
        throw error;
      }
      
      if (!data) {
        api.warn(`No event found with ${isUUID ? 'UUID' : 'slug'}: ${idOrSlug}`);
        return null;
      }
      
      const transformedEvent = this.transformEvent(data);
      api.debug(`Successfully transformed event: ${data.title}`);
      
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
        api.warn('No published events found');
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
        api.error('transformEvent received invalid data');
        throw new Error('Invalid event data received');
      }
      
      // Get location data from location field
      const locationName = 
        data.location || 
        DEFAULT_EVENT_VALUES.location;
      
      // Parse dates for formatting (with fallbacks)
      const eventStartDate = safeParseDate(data.eventStart);
      const eventEndDate = safeParseDate(data.eventEnd);
      
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
        // Core required fields with defaults if needed
        id: data.id,
        slug: data.slug || `event-${data.id.slice(0, 8)}`, // Generate slug if missing
        title: isValidValue(data.title) ? data.title : DEFAULT_EVENT_VALUES.title,
        description: isValidValue(data.description) ? data.description : DEFAULT_EVENT_VALUES.description,
        
        // Date/time fields with validation
        event_start: data.eventStart,
        event_end: data.eventEnd || null,
        date: dateString,
        time: timeString,
        
        // Location handling
        location: locationName,
        locationDetails: null, // Location details would come from joined location table
        latitude: data.latitude || null,
        longitude: data.longitude || null,
        
        // Event details with proper defaulting
        type: isValidValue(data.type) ? data.type : null,
        category: isValidValue(data.category) ? data.category : null,
        featured: !!data.featured, // Convert to boolean
        
        // UI-specific fields
        image_url: isValidValue(data.imageUrl) ? data.imageUrl: null,
        imageSrc: isValidValue(data.imageUrl) ? data.imageUrl: null, // Alias for compatibility
        
        // Metadata fields
        created_at: data.createdAt,
        is_multi_day: !!data.isMultiDay,
        parent_event_id: isValidValue(data.parentEventId) ? data.parentEventId: null,
        
        // Content fields with array validation
        event_includes: Array.isArray(data.eventIncludes) ? data.eventIncludes: null,
        important_information: Array.isArray(data.importantInformation) ? data.importantInformation: null,
        
        // Status and feature flags
        is_purchasable_individually: !!data.isPurchasableIndividually,
        isPublished: data.is_published !== undefined ? !!data.is_published : !!data.featured,
        status: data.is_published ? "Published" : "Draft",
        
        // Additional fields with proper object handling
        organizerName: isValidValue(data.organizer_name) ? data.organizer_name : null,
        organizerContact: isValidValue(data.organizer_contact) ? data.organizer_contact : null,
        degreeType: isValidValue(data.degree_type) ? data.degree_type : null,
        dressCode: isValidValue(data.dress_code) ? data.dress_code : null,
        regalia: isValidValue(data.regalia) ? data.regalia : null,
        regaliaDescription: isValidValue(data.regalia_description) ? data.regalia_description : null,
        
        // Object fields that may contain structured data
        sections: isValidValue(data.sections) ? data.sections : null,
        attendance: isValidValue(data.attendance) ? data.attendance : null,
        documents: isValidValue(data.documents) ? data.documents : null,
        
        // Legacy compatibility fields
        price: formatPrice(data.price),
        ticketsSold: DEFAULT_EVENT_VALUES.ticketsSold,
        revenue: DEFAULT_EVENT_VALUES.revenue,
        
        // Related event fields
        relatedEventIds: Array.isArray(data.related_events) ? data.related_events : null,
      };
      
      // Add eligibility requirements if available in sections
      if (data.sections?.eligibilityRequirements) {
        event.eligibilityRequirements = data.sections.eligibilityRequirements;
      }
      
      return event;
    } catch (error) {
      api.error(`Error transforming event data for ID ${data?.id || 'unknown'}:`, error);
      
      // Return a minimal valid event object with defaults in case of error
      return {
        id: data?.id || 'error-event',
        slug: data?.slug || 'error-event',
        title: DEFAULT_EVENT_VALUES.title,
        description: DEFAULT_EVENT_VALUES.description,
        event_start: data?.eventStart || new Date().toISOString(),
        event_end: null,
        location: DEFAULT_EVENT_VALUES.location,
        date: DEFAULT_EVENT_VALUES.date,
        time: DEFAULT_EVENT_VALUES.time,
        created_at: data?.createdAt || new Date().toISOString(),
        status: DEFAULT_EVENT_VALUES.status,
        featured: false,
        image_url: null,
        type: null,
        is_multi_day: false,
        parent_event_id: null,
        event_includes: null,
        important_information: null,
        latitude: null,
        longitude: null,
        is_purchasable_individually: false
      };
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