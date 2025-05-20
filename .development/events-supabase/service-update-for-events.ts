// Updated EventsSchemaService to use public.Events instead of public.events_new
import { createClient } from '@supabase/supabase-js'
import type { EventType } from '@/shared/types/event'

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
  location_json?: any // New JSON field for structured location data
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
}

export class EventsSchemaService {
  private supabase
  
  constructor(isServer: boolean = false) {
    if (isServer) {
      // Server-side with service role key
      this.supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
            detectSessionInUrl: false,
          }
        }
      )
    } else {
      // Client-side with anon key
      this.supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
    }
  }
  
  /**
   * Get an event by UUID or slug
   */
  async getEventByIdOrSlug(idOrSlug: string): Promise<EventType | null> {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug)
    
    let query = this.supabase
      .from('Events') // Use existing Events table with Pascal case
      .select('*')
      .single()
    
    if (isUUID) {
      query = query.eq('id', idOrSlug)
    } else {
      query = query.eq('slug', idOrSlug)
    }
    
    const { data, error } = await query
    
    if (error || !data) {
      console.error('Error fetching event:', error)
      return null
    }
    
    return this.transformEvent(data)
  }
  
  /**
   * Get all published events
   */
  async getPublishedEvents(): Promise<EventType[]> {
    // Handle both old and new schema
    // Old schema used 'featured' or 'status' to determine published state
    // New schema uses is_published column
    const { data, error } = await this.supabase
      .from('Events') // Use existing Events table with Pascal case
      .select('*')
      .or('is_published.eq.true, featured.eq.true')
      .order('eventStart', { ascending: true })
    
    if (error || !data) {
      console.error('Error fetching events:', error)
      return []
    }
    
    return data.map(event => this.transformEvent(event))
  }
  
  /**
   * Get featured events
   */
  async getFeaturedEvents(): Promise<EventType[]> {
    const { data, error } = await this.supabase
      .from('Events') // Use existing Events table with Pascal case
      .select('*')
      .eq('featured', true)
      .order('eventStart', { ascending: true })
      .limit(3)
    
    if (error || !data) {
      console.error('Error fetching featured events:', error)
      return []
    }
    
    return data.map(event => this.transformEvent(event))
  }
  
  /**
   * Get events by category
   */
  async getEventsByCategory(category: string): Promise<EventType[]> {
    const { data, error } = await this.supabase
      .from('Events') // Use existing Events table with Pascal case
      .select('*')
      .eq('category', category)
      .order('eventStart', { ascending: true })
    
    if (error || !data) {
      console.error('Error fetching events by category:', error)
      return []
    }
    
    return data.map(event => this.transformEvent(event))
  }
  
  /**
   * Get upcoming events
   */
  async getUpcomingEvents(limit: number = 10): Promise<EventType[]> {
    const now = new Date().toISOString()
    
    const { data, error } = await this.supabase
      .from('Events') // Use existing Events table with Pascal case
      .select('*')
      .gte('eventStart', now)
      .order('eventStart', { ascending: true })
      .limit(limit)
    
    if (error || !data) {
      console.error('Error fetching upcoming events:', error)
      return []
    }
    
    return data.map(event => this.transformEvent(event))
  }
  
  /**
   * Get related events
   */
  async getRelatedEvents(eventId: string): Promise<EventType[]> {
    // First get the event and its related events array
    const { data: event, error: eventError } = await this.supabase
      .from('Events') // Use existing Events table with Pascal case
      .select('related_events')
      .eq('id', eventId)
      .single()
    
    if (eventError || !event || !event.related_events) {
      return []
    }
    
    // Fetch the related events
    const { data, error } = await this.supabase
      .from('Events') // Use existing Events table with Pascal case
      .select('*')
      .in('id', event.related_events)
      .order('eventStart', { ascending: true })
    
    if (error || !data) {
      console.error('Error fetching related events:', error)
      return []
    }
    
    return data.map(e => this.transformEvent(e))
  }
  
  /**
   * Search events
   */
  async searchEvents(query: string): Promise<EventType[]> {
    const { data, error } = await this.supabase
      .from('Events') // Use existing Events table with Pascal case
      .select('*')
      .or(`title.ilike.%${query}%,description.ilike.%${query}%,location.ilike.%${query}%`)
      .order('eventStart', { ascending: true })
    
    if (error || !data) {
      console.error('Error searching events:', error)
      return []
    }
    
    return data.map(event => this.transformEvent(event))
  }
  
  /**
   * Transform database event to EventType
   * This function handles both the old schema (camelCase) and new schema (snake_case) fields
   */
  private transformEvent(data: EventsSchemaRow): EventType {
    // Get location data from either location_json (new) or location (old)
    const locationName = data.location_json?.name || data.location || '';
    
    return {
      id: data.id,
      slug: data.slug,
      title: data.title,
      subtitle: data.subtitle,
      description: data.description,
      eventStart: data.eventStart,
      eventEnd: data.eventEnd,
      location: locationName,
      locationDetails: data.location_json,
      type: data.type,
      category: data.category,
      degreeType: data.degree_type,
      dressCode: data.dress_code,
      regalia: data.regalia,
      regaliaDescription: data.regalia_description,
      featured: data.featured,
      imageUrl: data.imageUrl,
      imageSrc: data.imageUrl, // Alias for compatibility
      organizerName: data.organizer_name,
      organizerContact: data.organizer_contact,
      isPublished: data.is_published,
      createdAt: data.createdAt,
      
      // Parse date and time for display
      date: new Date(data.eventStart).toLocaleDateString(),
      time: new Date(data.eventStart).toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      }),
      
      // Additional fields from sections
      sections: data.sections,
      attendance: data.attendance,
      documents: data.documents,
      eligibilityRequirements: data.sections?.eligibilityRequirements,
      
      // Related events
      relatedEventIds: data.related_events,
      parentEventId: data.parentEventId,
    } as EventType
  }
}

// Factory functions for creating instances
export function getEventService(): EventsSchemaService {
  return new EventsSchemaService(false)
}

export function getServerEventService(): EventsSchemaService {
  return new EventsSchemaService(true)
}