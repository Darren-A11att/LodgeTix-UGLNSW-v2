// Service for fetching event tickets and packages from the database
import { getSupabaseClient } from '@/lib/supabase-singleton'
import { api } from '@/lib/api-logger'
import type { AttendeeType } from '@/components/register/RegistrationWizard/Steps/ticket-selection-step'

export interface TicketDefinition {
  id: string // This will map to ticket_definition_id from the database
  ticket_definition_id?: string // Include both for compatibility
  name: string
  price: number
  description: string | null
  category?: string
  eligibleAttendeeTypes: AttendeeType[]
  event_id: string | null
  event_title?: string // Add event title for display
  event_slug?: string // Add event slug for reference
  is_active: boolean | null
  total_capacity: number | null // null means unlimited
  available_count: number | null // null means unlimited
  reserved_count: number
  sold_count: number
  status: string
}

export interface EventPackage {
  id: string
  name: string
  price: number // Final price after discount
  original_price: number | null // Sum of all included ticket prices
  discount_percentage: number | null // Discount percentage (0-100)
  discount_amount: number | null // Calculated discount amount
  package_type: 'multi_buy' | 'bulk_buy' | null // Auto-determined package type
  quantity: number | null // Total number of tickets in package
  description: string | null
  includes: string[] // ticket definition IDs
  includes_description?: string[] | null // Human-readable descriptions
  eligibleAttendeeTypes: AttendeeType[]
  parent_event_id: string | null
  created_at?: string
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
   * Get the minimum ticket price for an event
   * Returns null if no tickets are found or all tickets are free
   */
  async getMinimumTicketPrice(eventId: string): Promise<number | null> {
    try {
      const { data: tickets, error } = await this.supabase
        .from('event_tickets')
        .select('price')
        .eq('event_id', eventId)
        .eq('is_active', true)
        .gt('price', 0) // Only consider tickets with price > 0
        .order('price', { ascending: true })
        .limit(1)
      
      if (error) {
        api.error(`Error fetching minimum ticket price for event ${eventId}:`, error)
        return null
      }
      
      if (!tickets || tickets.length === 0) {
        // No paid tickets found
        return null
      }
      
      return tickets[0].price
    } catch (error) {
      api.error(`Error in getMinimumTicketPrice for event ${eventId}:`, error)
      return null
    }
  }
  
  /**
   * Get minimum ticket prices for multiple events
   * Returns a map of event ID to minimum price
   */
  async getMinimumTicketPricesForEvents(eventIds: string[]): Promise<Map<string, number | null>> {
    const priceMap = new Map<string, number | null>()
    
    if (eventIds.length === 0) {
      return priceMap
    }
    
    try {
      // Get all active tickets for the given events
      const { data: tickets, error } = await this.supabase
        .from('event_tickets')
        .select('event_id, price')
        .in('event_id', eventIds)
        .eq('is_active', true)
        .gt('price', 0)
        .order('price', { ascending: true })
      
      if (error) {
        api.error('Error fetching minimum ticket prices for events:', error)
        // Return empty map on error
        eventIds.forEach(id => priceMap.set(id, null))
        return priceMap
      }
      
      // Process tickets to find minimum price per event
      const eventPrices = new Map<string, number>()
      
      if (tickets && tickets.length > 0) {
        tickets.forEach(ticket => {
          const currentMin = eventPrices.get(ticket.event_id)
          if (currentMin === undefined || ticket.price < currentMin) {
            eventPrices.set(ticket.event_id, ticket.price)
          }
        })
      }
      
      // Set prices for all requested events
      eventIds.forEach(id => {
        priceMap.set(id, eventPrices.get(id) || null)
      })
      
      return priceMap
    } catch (error) {
      api.error('Error in getMinimumTicketPricesForEvents:', error)
      // Return null for all events on error
      eventIds.forEach(id => priceMap.set(id, null))
      return priceMap
    }
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
        .select('event_id, title, slug')
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
      const eventIds = childEvents.map(e => e.event_id)
      const { data: ticketDefs, error: ticketsError } = await this.supabase
        .from('event_tickets')
        .select('*')
        .in('event_id', eventIds)
        .eq('is_active', true)
      
      if (ticketsError) {
        api.error('Error fetching ticket definitions:', ticketsError)
        throw ticketsError
      }
      
      // 3. Get packages for the parent event
      const { data: packages, error: packagesError } = await this.supabase
        .from('packages')
        .select(`
          package_id,
          name,
          description,
          includes_description,
          package_price,
          original_price,
          discount,
          qty,
          parent_event_id,
          created_at,
          included_items
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
          id: event.event_id,
          title: event.title,
          slug: event.slug
        },
        tickets: eventTicketsMap.get(event.event_id) || [],
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
        .select('event_id, parent_event_id')
        .eq('event_id', eventId)
        .single()
      
      if (eventError) {
        api.error('Error fetching event:', eventError)
        throw eventError
      }
      
      // 2. Get tickets for this event
      const { data: ticketDefs, error: ticketsError } = await this.supabase
        .from('event_tickets')
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
        .from('packages')
        .select(`
          package_id,
          name,
          description,
          includes_description,
          package_price,
          original_price,
          discount,
          qty,
          parent_event_id,
          created_at,
          included_items
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
      id: ticket.id, // Use the ticket ID
      ticket_definition_id: ticket.id, // Keep for backward compatibility
      name: ticket.name,
      price: ticket.price,
      description: ticket.description,
      category,
      eligibleAttendeeTypes: eligibleTypes,
      event_id: ticket.event_id,
      is_active: ticket.is_active,
      total_capacity: ticket.total_capacity,
      available_count: ticket.available_count,
      reserved_count: ticket.reserved_count || 0,
      sold_count: ticket.sold_count || 0,
      status: ticket.status || 'Active'
    }
  }
  
  /**
   * Transform packages and calculate prices
   */
  private async transformPackages(packages: any[], allTickets: any[]): Promise<EventPackage[]> {
    const transformed: EventPackage[] = []
    
    for (const pkg of packages) {
      // Get included ticket IDs from included_items array
      const includedTicketIds: string[] = []
      let totalPrice = 0
      let eligibleTypes: Set<AttendeeType> = new Set(['mason', 'guest'])
      
      if (pkg.included_items && Array.isArray(pkg.included_items)) {
        for (const ticketId of pkg.included_items) {
          if (ticketId) {
            includedTicketIds.push(ticketId)
            
            // Find the ticket definition to get price and eligibility
            const ticketDef = allTickets.find(t => t.id === ticketId)
            if (ticketDef) {
              // Use qty field for quantity (default to 1)
              const quantity = pkg.qty || 1
              totalPrice += ticketDef.price * quantity
              
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
      
      // Use the actual price from the database (already includes any discounts)
      const packagePrice = pkg.package_price || totalPrice // Fallback to calculated price if not set
      
      transformed.push({
        id: pkg.package_id,
        name: pkg.name,
        price: packagePrice,
        original_price: pkg.original_price || totalPrice,
        discount_percentage: pkg.discount,
        discount_amount: null, // This field doesn't exist in the database
        package_type: null, // This field doesn't exist in the database
        quantity: pkg.qty,
        description: pkg.description || `Includes ${includedTicketIds.length} events`,
        includes: includedTicketIds,
        includes_description: pkg.includes_description,
        eligibleAttendeeTypes: Array.from(eligibleTypes),
        parent_event_id: pkg.parent_event_id,
        created_at: pkg.created_at
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

// Simplified function to get tickets for a specific event
export async function getEventTickets(eventId: string) {
  const service = getServerEventTicketsService()
  try {
    const supabase = getSupabaseClient(true)
    
    // Get tickets for this specific event
    const { data: tickets, error } = await supabase
      .from('event_tickets')
      .select('*')
      .eq('event_id', eventId)
      .eq('is_active', true)
      .order('price', { ascending: true })
    
    if (error) {
      api.error('Error fetching event tickets:', error)
      return []
    }
    
    return tickets || []
  } catch (error) {
    api.error('Error in getEventTickets:', error)
    return []
  }
}