// Updated EventTicketsService for new database schema
import { getSupabaseClient } from '@/lib/supabase-singleton'
import { api } from '@/lib/api-logger'
import type { Database } from '@/shared/types/database'

type EventTicket = Database['public']['Tables']['event_tickets']['Row']
type Package = Database['public']['Tables']['packages']['Row']
type AttendeeType = Database['public']['Enums']['attendee_type']

export interface TicketDefinition {
  id: string
  name: string
  price: number
  description: string | null
  event_id: string
  eligibility_criteria: any
  is_active: boolean | null
  total_capacity: number | null
  available_count: number | null
  reserved_count: number | null
  sold_count: number | null
  status: string | null
}

export interface EventPackage {
  package_id: string
  name: string
  package_price: number
  original_price: number | null
  discount: number | null
  description: string | null
  includes_description: string[] | null
  included_items: Array<{
    event_ticket_id: string | null
    quantity: number | null
  }> | null
  eligibility_criteria: any
  event_id: string | null
  parent_event_id: string | null
  qty: number | null
  is_active: boolean | null
}

export interface EventWithTicketsAndPackages {
  event: {
    event_id: string
    title: string
    slug: string
  }
  tickets: TicketDefinition[]
  packages: EventPackage[]
}

export class EventTicketsServiceV2 {
  private supabase
  
  constructor(isServer: boolean = false) {
    this.supabase = getSupabaseClient(isServer)
  }
  
  /**
   * Get the minimum ticket price for an event
   */
  async getMinimumTicketPrice(eventId: string): Promise<number | null> {
    try {
      const { data: tickets, error } = await this.supabase
        .from('event_tickets')
        .select('price')
        .eq('event_id', eventId)
        .eq('is_active', true)
        .gt('price', 0)
        .order('price', { ascending: true })
        .limit(1)
      
      if (error) {
        api.error(`Error fetching minimum ticket price for event ${eventId}:`, error)
        return null
      }
      
      return tickets?.[0]?.price || null
    } catch (error) {
      api.error(`Error in getMinimumTicketPrice for event ${eventId}:`, error)
      return null
    }
  }
  
  /**
   * Get minimum ticket prices for multiple events
   */
  async getMinimumTicketPricesForEvents(eventIds: string[]): Promise<Map<string, number | null>> {
    const priceMap = new Map<string, number | null>()
    
    if (eventIds.length === 0) {
      return priceMap
    }
    
    try {
      const { data: tickets, error } = await this.supabase
        .from('event_tickets')
        .select('event_id, price')
        .in('event_id', eventIds)
        .eq('is_active', true)
        .gt('price', 0)
        .order('price', { ascending: true })
      
      if (error) {
        api.error('Error fetching minimum ticket prices:', error)
        eventIds.forEach(id => priceMap.set(id, null))
        return priceMap
      }
      
      // Process tickets to find minimum price per event
      const eventPrices = new Map<string, number>()
      
      tickets?.forEach(ticket => {
        const currentMin = eventPrices.get(ticket.event_id)
        if (currentMin === undefined || ticket.price < currentMin) {
          eventPrices.set(ticket.event_id, ticket.price)
        }
      })
      
      // Set prices for all requested events
      eventIds.forEach(id => {
        priceMap.set(id, eventPrices.get(id) || null)
      })
      
      return priceMap
    } catch (error) {
      api.error('Error in getMinimumTicketPricesForEvents:', error)
      eventIds.forEach(id => priceMap.set(id, null))
      return priceMap
    }
  }
  
  /**
   * Get child events with their tickets and packages
   */
  async getChildEventsWithTicketsAndPackages(parentEventId: string): Promise<EventWithTicketsAndPackages[]> {
    try {
      api.debug(`Fetching child events for parent: ${parentEventId}`)
      
      // 1. Get child events
      const { data: childEvents, error: eventsError } = await this.supabase
        .from('events')
        .select('event_id, title, slug')
        .eq('parent_event_id', parentEventId)
        .order('event_start', { ascending: true })
      
      if (eventsError) throw eventsError
      if (!childEvents?.length) return []
      
      // 2. Get tickets for child events
      const eventIds = childEvents.map(e => e.event_id)
      const { data: tickets, error: ticketsError } = await this.supabase
        .from('event_tickets')
        .select('*')
        .in('event_id', eventIds)
        .eq('is_active', true)
      
      if (ticketsError) throw ticketsError
      
      // 3. Get packages for parent event
      const { data: packages, error: packagesError } = await this.supabase
        .from('packages')
        .select('*')
        .or(`event_id.eq.${parentEventId},parent_event_id.eq.${parentEventId}`)
        .eq('is_active', true)
      
      if (packagesError) throw packagesError
      
      // 4. Transform and group data
      const eventTicketsMap = new Map<string, TicketDefinition[]>()
      
      tickets?.forEach(ticket => {
        const transformed = this.transformTicket(ticket)
        if (!eventTicketsMap.has(ticket.event_id)) {
          eventTicketsMap.set(ticket.event_id, [])
        }
        eventTicketsMap.get(ticket.event_id)!.push(transformed)
      })
      
      const transformedPackages = packages?.map(pkg => this.transformPackage(pkg)) || []
      
      // 5. Build result
      return childEvents.map(event => ({
        event: {
          event_id: event.event_id,
          title: event.title,
          slug: event.slug
        },
        tickets: eventTicketsMap.get(event.event_id) || [],
        packages: transformedPackages
      }))
    } catch (error) {
      api.error('Error in getChildEventsWithTicketsAndPackages:', error)
      throw error
    }
  }
  
  /**
   * Get tickets and packages for a specific event
   */
  async getEventTicketsAndPackages(eventId: string): Promise<{
    tickets: TicketDefinition[]
    packages: EventPackage[]
  }> {
    try {
      // Use the new RPC if available, otherwise fallback to direct queries
      const { data: rpcData, error: rpcError } = await this.supabase
        .rpc('rpc_get_event_with_packages', { p_event_id: eventId })
      
      if (!rpcError && rpcData) {
        return {
          tickets: rpcData.tickets?.map((t: any) => this.transformTicket(t)) || [],
          packages: rpcData.packages?.map((p: any) => this.transformPackage(p)) || []
        }
      }
      
      // Fallback to direct queries
      const [ticketsResult, packagesResult] = await Promise.all([
        this.supabase
          .from('event_tickets')
          .select('*')
          .eq('event_id', eventId)
          .eq('is_active', true),
        this.supabase
          .from('packages')
          .select('*')
          .or(`event_id.eq.${eventId},parent_event_id.eq.${eventId}`)
          .eq('is_active', true)
      ])
      
      if (ticketsResult.error) throw ticketsResult.error
      if (packagesResult.error) throw packagesResult.error
      
      return {
        tickets: ticketsResult.data?.map(t => this.transformTicket(t)) || [],
        packages: packagesResult.data?.map(p => this.transformPackage(p)) || []
      }
    } catch (error) {
      api.error('Error in getEventTicketsAndPackages:', error)
      throw error
    }
  }
  
  /**
   * Transform database ticket to TicketDefinition
   */
  private transformTicket(ticket: EventTicket): TicketDefinition {
    return {
      id: ticket.id,
      name: ticket.name,
      price: ticket.price,
      description: ticket.description,
      event_id: ticket.event_id,
      eligibility_criteria: ticket.eligibility_criteria,
      is_active: ticket.is_active,
      total_capacity: ticket.total_capacity,
      available_count: ticket.available_count,
      reserved_count: ticket.reserved_count,
      sold_count: ticket.sold_count,
      status: ticket.status
    }
  }
  
  /**
   * Transform database package to EventPackage
   */
  private transformPackage(pkg: Package): EventPackage {
    return {
      package_id: pkg.package_id,
      name: pkg.name,
      package_price: pkg.package_price,
      original_price: pkg.original_price,
      discount: pkg.discount,
      description: pkg.description,
      includes_description: pkg.includes_description,
      included_items: pkg.included_items,
      eligibility_criteria: pkg.eligibility_criteria,
      event_id: pkg.event_id,
      parent_event_id: pkg.parent_event_id,
      qty: pkg.qty,
      is_active: pkg.is_active
    }
  }
}

// Factory functions
export function getEventTicketsServiceV2(): EventTicketsServiceV2 {
  return new EventTicketsServiceV2(false)
}

export function getServerEventTicketsServiceV2(): EventTicketsServiceV2 {
  return new EventTicketsServiceV2(true)
}

// Direct function to get event tickets
export async function getEventTicketsV2(eventId: string): Promise<EventTicket[]> {
  const supabase = getSupabaseClient(true)
  
  try {
    const { data, error } = await supabase
      .from('event_tickets')
      .select('*')
      .eq('event_id', eventId)
      .eq('is_active', true)
      .order('price', { ascending: true })
    
    if (error) {
      api.error('Error fetching event tickets:', error)
      return []
    }
    
    return data || []
  } catch (error) {
    api.error('Error in getEventTicketsV2:', error)
    return []
  }
}