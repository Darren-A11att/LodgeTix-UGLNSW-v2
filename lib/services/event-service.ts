import { getSupabaseClient } from '@/lib/supabase-singleton'
import type { EventType, FunctionType } from '@/shared/types'
import type { Database } from '@/shared/types/database'

type EventRow = Database['public']['Tables']['events']['Row']
type FunctionRow = Database['public']['Tables']['functions']['Row']
type LocationRow = Database['public']['Tables']['locations']['Row']
type TicketRow = Database['public']['Tables']['event_tickets']['Row']

export class EventService {
  private supabase

  constructor(isServer: boolean = false) {
    this.supabase = getSupabaseClient(isServer)
  }

  async getEvent(eventSlug: string): Promise<EventType> {
    const { data, error } = await this.supabase
      .from('events')
      .select(`
        *,
        function:functions!function_id(*),
        tickets:event_tickets(*),
        location:locations!location_id(*)
      `)
      .eq('slug', eventSlug)
      .single()

    if (error) throw error
    if (!data) throw new Error('Event not found')

    // Event MUST have a function
    if (!data.function_id) {
      throw new Error('Event missing function association')
    }

    return this.transformEvent(data)
  }

  async getEventById(eventId: string): Promise<EventType> {
    const { data, error } = await this.supabase
      .from('events')
      .select(`
        *,
        function:functions!function_id(*),
        tickets:event_tickets(*),
        location:locations!location_id(*)
      `)
      .eq('event_id', eventId)
      .single()

    if (error) throw error
    if (!data) throw new Error('Event not found')

    // Event MUST have a function
    if (!data.function_id) {
      throw new Error('Event missing function association')
    }

    return this.transformEvent(data)
  }


  async getEventsByFunction(functionId: string): Promise<EventType[]> {
    const { data, error } = await this.supabase
      .from('events')
      .select(`
        *,
        function:functions!function_id(name, slug)
      `)
      .eq('function_id', functionId)
      .eq('is_published', true)
      .order('event_start', { ascending: true })

    if (error) throw error
    if (!data) return []

    return data.map(event => this.transformEvent(event))
  }

  async getEventTickets(eventId: string): Promise<TicketRow[]> {
    const { data, error } = await this.supabase
      .from('event_tickets')
      .select('*')
      .eq('event_id', eventId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) throw error
    return data || []
  }

  async getUpcomingEvents(limit: number = 10): Promise<EventType[]> {
    const now = new Date().toISOString()
    
    const { data, error } = await this.supabase
      .from('events')
      .select(`
        *,
        function:functions!function_id(name, slug)
      `)
      .gte('event_start', now)
      .eq('is_published', true)
      .order('event_start', { ascending: true })
      .limit(limit)

    if (error) throw error
    if (!data) return []

    // Filter out any events without function association
    const validEvents = data.filter(event => event.function_id)
    return validEvents.map(event => this.transformEvent(event))
  }

  async getFeaturedEvents(): Promise<EventType[]> {
    const { data, error } = await this.supabase
      .from('events')
      .select(`
        *,
        function:functions!function_id(name, slug)
      `)
      .eq('featured', true)
      .eq('is_published', true)
      .order('event_start', { ascending: true })

    if (error) throw error
    if (!data) return []

    // Filter out any events without function association
    const validEvents = data.filter(event => event.function_id)
    return validEvents.map(event => this.transformEvent(event))
  }

  private transformEvent(data: any): EventType {
    const event = data as EventRow
    const functionData = data.function as FunctionRow | null

    if (!functionData) {
      throw new Error(`Event ${event.event_id} missing function data`)
    }

    return {
      id: event.event_id,
      slug: event.slug,
      eventStart: event.event_start,
      eventEnd: event.event_end,
      functionId: event.function_id,
      functionName: functionData.name,
      functionSlug: functionData.slug,
      title: event.title,
      description: event.description,
      location: event.location,
      type: event.type,
      featured: event.featured,
      imageUrl: event.image_url,
      isMultiDay: event.is_multi_day,
      eventIncludes: event.event_includes,
      importantInformation: event.important_information,
      latitude: event.latitude,
      longitude: event.longitude,
      isPurchasableIndividually: event.is_purchasable_individually,
      createdAt: event.created_at,
      dressCode: event.dress_code,
      regalia: event.regalia,
      category: event.category,
      status: event.status,
      organiserName: event.organiser_name
    }
  }
}

// Legacy function for compatibility - will be removed in next phase
export async function getEventByIdOrSlug(idOrSlug: string): Promise<any> {
  const eventService = new EventService(true)
  try {
    return await eventService.getEvent(idOrSlug)
  } catch (error) {
    return null
  }
}