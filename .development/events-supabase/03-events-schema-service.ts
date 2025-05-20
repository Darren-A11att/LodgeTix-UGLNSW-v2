// Event Service for the new events.events table
import { createClient } from '@supabase/supabase-js'
import type { EventType } from '@/shared/types/event'

// Define the structure of events in the new schema
interface EventsSchemaRow {
  id: string
  slug: string
  title: string
  subtitle?: string
  description: string
  event_start: string
  event_end?: string
  location: any
  category?: string
  type?: string
  degree_type?: string
  dress_code?: string
  regalia?: string
  regalia_description?: string
  image_url?: string
  organizer_name?: string
  organizer_contact?: any
  is_published: boolean
  featured: boolean
  sections?: any
  attendance?: any
  documents?: any
  related_events?: string[]
  legacy_id?: string
  parent_event_id?: string
  created_at: string
  updated_at: string
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
          },
          db: {
            schema: 'events' // Use the events schema
          }
        }
      )
    } else {
      // Client-side with anon key
      this.supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          db: {
            schema: 'events' // Use the events schema
          }
        }
      )
    }
  }
  
  /**
   * Get an event by UUID or slug
   */
  async getEventByIdOrSlug(idOrSlug: string): Promise<EventType | null> {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug)
    
    let query = this.supabase
      .from('events')
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
    const { data, error } = await this.supabase
      .from('events')
      .select('*')
      .eq('is_published', true)
      .order('event_start', { ascending: true })
    
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
      .from('events')
      .select('*')
      .eq('featured', true)
      .eq('is_published', true)
      .order('event_start', { ascending: true })
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
      .from('events')
      .select('*')
      .eq('category', category)
      .eq('is_published', true)
      .order('event_start', { ascending: true })
    
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
      .from('events')
      .select('*')
      .gte('event_start', now)
      .eq('is_published', true)
      .order('event_start', { ascending: true })
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
      .from('events')
      .select('related_events')
      .eq('id', eventId)
      .single()
    
    if (eventError || !event || !event.related_events) {
      return []
    }
    
    // Fetch the related events
    const { data, error } = await this.supabase
      .from('events')
      .select('*')
      .in('id', event.related_events)
      .eq('is_published', true)
      .order('event_start', { ascending: true })
    
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
      .from('events')
      .select('*')
      .eq('is_published', true)
      .or(`title.ilike.%${query}%,description.ilike.%${query}%,location->>'name'.ilike.%${query}%`)
      .order('event_start', { ascending: true })
    
    if (error || !data) {
      console.error('Error searching events:', error)
      return []
    }
    
    return data.map(event => this.transformEvent(event))
  }
  
  /**
   * Transform database event to EventType
   */
  private transformEvent(data: EventsSchemaRow): EventType {
    return {
      id: data.id,
      slug: data.slug,
      title: data.title,
      subtitle: data.subtitle,
      description: data.description,
      eventStart: data.event_start,
      eventEnd: data.event_end,
      location: data.location?.name || '',
      locationDetails: data.location,
      type: data.type,
      category: data.category,
      degreeType: data.degree_type,
      dressCode: data.dress_code,
      regalia: data.regalia,
      regaliaDescription: data.regalia_description,
      featured: data.featured,
      imageUrl: data.image_url,
      imageSrc: data.image_url, // Alias for compatibility
      organizerName: data.organizer_name,
      organizerContact: data.organizer_contact,
      isPublished: data.is_published,
      createdAt: data.created_at,
      
      // Parse date and time for display
      date: new Date(data.event_start).toLocaleDateString(),
      time: new Date(data.event_start).toLocaleTimeString('en-US', { 
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
      parentEventId: data.parent_event_id,
      
      // Legacy support
      legacyId: data.legacy_id
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