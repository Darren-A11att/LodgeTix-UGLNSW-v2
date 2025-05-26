// Service for fetching event tickets and packages from the database
import { getSupabaseClient } from '@/lib/supabase-singleton'
import { api } from '@/lib/api-logger'
import type { AttendeeType } from '@/components/register/RegistrationWizard/Steps/ticket-selection-step'

export interface TicketDefinition {
  id: string
  name: string
  price: number
  description: string | null
  category?: string
  eligibleAttendeeTypes: AttendeeType[]
  event_id: string | null
  is_active: boolean | null
}

export interface EventPackage {
  id: string
  name: string
  price: number
  description: string | null
  includes: string[] // ticket definition IDs
  eligibleAttendeeTypes: AttendeeType[]
}

export interface EventWithTicketsAndPackages {
  event: {
    id: string
    title: string
    slug: string
  }
  tickets: TicketDefinition[]
  packages: EventPackage[]
}

export class EventTicketsService {
  private supabase
  
  constructor(isServer: boolean = false) {
    this.supabase = getSupabaseClient(isServer)
  }
  
  /**
   * Get child events with their tickets and packages for a parent event
   */
  async getChildEventsWithTicketsAndPackages(parentEventId: string): Promise<EventWithTicketsAndPackages[]> {
    try {
      api.debug(`Fetching child events for parent event: ${parentEventId}`)
      
      // 1. Get child events
      const { data: childEvents, error: eventsError } = await this.supabase
        .from('events')
        .select('id, title, slug')
        .eq('parent_event_id', parentEventId)
        .order('event_start', { ascending: true })
      
      if (eventsError) {
        api.error('Error fetching child events:', eventsError)
        throw eventsError
      }
      
      if (!childEvents || childEvents.length === 0) {
        api.warn(`No child events found for parent event: ${parentEventId}`)
        return []
      }
      
      api.debug(`Found ${childEvents.length} child events`)
      
      // 2. Get all tickets for these events
      const eventIds = childEvents.map(e => e.id)
      const { data: ticketDefs, error: ticketsError } = await this.supabase
        .from('ticket_definitions')
        .select('*')
        .in('event_id', eventIds)
        .eq('is_active', true)
      
      if (ticketsError) {
        api.error('Error fetching ticket definitions:', ticketsError)
        throw ticketsError
      }
      
      // 3. Get packages for the parent event
      const { data: packages, error: packagesError } = await this.supabase
        .from('eventpackages')
        .select(`
          id,
          name,
          description,
          includes_description,
          eventpackagetickets (
            event_ticket_id,
            quantity
          )
        `)
        .eq('parent_event_id', parentEventId)
      
      if (packagesError) {
        api.error('Error fetching packages:', packagesError)
        throw packagesError
      }
      
      // 4. Transform and calculate package prices
      const transformedPackages = await this.transformPackages(packages || [], ticketDefs || [])
      
      // 5. Group tickets by event
      const eventTicketsMap = new Map<string, TicketDefinition[]>()
      
      if (ticketDefs) {
        for (const ticket of ticketDefs) {
          if (!ticket.event_id) continue
          
          const transformed = this.transformTicketDefinition(ticket)
          
          if (!eventTicketsMap.has(ticket.event_id)) {
            eventTicketsMap.set(ticket.event_id, [])
          }
          eventTicketsMap.get(ticket.event_id)!.push(transformed)
        }
      }
      
      // 6. Build result
      const result: EventWithTicketsAndPackages[] = childEvents.map(event => ({
        event: {
          id: event.id,
          title: event.title,
          slug: event.slug
        },
        tickets: eventTicketsMap.get(event.id) || [],
        packages: transformedPackages // All packages apply to all child events
      }))
      
      api.debug(`Successfully fetched tickets and packages for ${result.length} child events`)
      
      return result
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
      api.debug(`Fetching tickets and packages for event: ${eventId}`)
      
      // 1. Get the event to check if it has a parent
      const { data: event, error: eventError } = await this.supabase
        .from('events')
        .select('id, parent_event_id')
        .eq('id', eventId)
        .single()
      
      if (eventError) {
        api.error('Error fetching event:', eventError)
        throw eventError
      }
      
      // 2. Get tickets for this event
      const { data: ticketDefs, error: ticketsError } = await this.supabase
        .from('ticket_definitions')
        .select('*')
        .eq('event_id', eventId)
        .eq('is_active', true)
      
      if (ticketsError) {
        api.error('Error fetching ticket definitions:', ticketsError)
        throw ticketsError
      }
      
      // 3. Get packages - if this event has a parent, get packages from parent
      const packageEventId = event.parent_event_id || eventId
      const { data: packages, error: packagesError } = await this.supabase
        .from('eventpackages')
        .select(`
          id,
          name,
          description,
          includes_description,
          eventpackagetickets (
            event_ticket_id,
            quantity
          )
        `)
        .eq('parent_event_id', packageEventId)
      
      if (packagesError) {
        api.error('Error fetching packages:', packagesError)
        throw packagesError
      }
      
      // 4. Transform data
      const transformedTickets = (ticketDefs || []).map(t => this.transformTicketDefinition(t))
      const transformedPackages = await this.transformPackages(packages || [], ticketDefs || [])
      
      return {
        tickets: transformedTickets,
        packages: transformedPackages
      }
    } catch (error) {
      api.error('Error in getEventTicketsAndPackages:', error)
      throw error
    }
  }
  
  /**
   * Transform raw ticket definition from database
   */
  private transformTicketDefinition(ticket: any): TicketDefinition {
    // Determine category based on ticket name or description
    let category = 'general'
    const name = ticket.name.toLowerCase()
    if (name.includes('ceremony') || name.includes('installation')) {
      category = 'ceremony'
    } else if (name.includes('banquet') || name.includes('dinner') || name.includes('brunch')) {
      category = 'dining'
    } else if (name.includes('tour') || name.includes('activity')) {
      category = 'activity'
    }
    
    // Parse eligible attendee types
    let eligibleTypes: AttendeeType[] = ['mason', 'guest']
    if (ticket.eligibility_attendee_types && Array.isArray(ticket.eligibility_attendee_types)) {
      eligibleTypes = ticket.eligibility_attendee_types as AttendeeType[]
    } else if (ticket.eligibility_mason_rank) {
      // If there's a mason rank requirement, it's mason-only
      eligibleTypes = ['mason']
    }
    
    return {
      id: ticket.id,
      name: ticket.name,
      price: ticket.price,
      description: ticket.description,
      category,
      eligibleAttendeeTypes: eligibleTypes,
      event_id: ticket.event_id,
      is_active: ticket.is_active
    }
  }
  
  /**
   * Transform packages and calculate prices
   */
  private async transformPackages(packages: any[], allTickets: any[]): Promise<EventPackage[]> {
    const transformed: EventPackage[] = []
    
    for (const pkg of packages) {
      // Get included ticket IDs from eventpackagetickets
      const includedTicketIds: string[] = []
      let totalPrice = 0
      let eligibleTypes: Set<AttendeeType> = new Set(['mason', 'guest'])
      
      if (pkg.eventpackagetickets && Array.isArray(pkg.eventpackagetickets)) {
        for (const pt of pkg.eventpackagetickets) {
          if (pt.event_ticket_id) {
            includedTicketIds.push(pt.event_ticket_id)
            
            // Find the ticket definition to get price and eligibility
            const ticketDef = allTickets.find(t => t.id === pt.event_ticket_id)
            if (ticketDef) {
              totalPrice += ticketDef.price * (pt.quantity || 1)
              
              // Update eligible types based on ticket eligibility
              if (ticketDef.eligibility_attendee_types) {
                const ticketEligible = new Set(ticketDef.eligibility_attendee_types as AttendeeType[])
                // Package is only eligible for attendee types that can access ALL included tickets
                eligibleTypes = new Set([...eligibleTypes].filter(t => ticketEligible.has(t)))
              }
            }
          }
        }
      }
      
      // Determine actual package price (might have a discount)
      // For now, we'll calculate based on individual ticket prices
      // In a real implementation, you might have a separate price field on the package
      const packagePrice = Math.round(totalPrice * 0.9) // 10% discount for packages
      
      transformed.push({
        id: pkg.id,
        name: pkg.name,
        price: packagePrice,
        description: pkg.description || `Includes ${includedTicketIds.length} events`,
        includes: includedTicketIds,
        eligibleAttendeeTypes: Array.from(eligibleTypes)
      })
    }
    
    return transformed
  }
}

// Factory functions
export function getEventTicketsService(): EventTicketsService {
  return new EventTicketsService(false)
}

export function getServerEventTicketsService(): EventTicketsService {
  return new EventTicketsService(true)
}