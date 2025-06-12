// Service for fetching function tickets and packages using the new database views
import { api } from '@/lib/api-logger'

// Raw database interface
interface FunctionTicketDefinitionRaw {
  event_ticket_id: string
  ticket_name: string
  ticket_description: string | null
  ticket_price: number
  event_id: string
  event_title: string
  event_subtitle: string | null
  event_slug: string
  function_id: string
  is_active: boolean | null
  total_capacity: number | null
  available_count: number | null
  reserved_count: number | null
  sold_count: number | null
  status: string | null
  eligibility_criteria: any | null
}

// Adapted interface for frontend consumption
export interface FunctionTicketDefinition {
  id: string
  name: string
  description: string | null
  price: number
  event_id: string
  event_title: string
  event_subtitle: string | null
  event_slug: string
  function_id: string
  is_active: boolean | null
  total_capacity: number | null
  available_count: number | null
  reserved_count: number | null
  sold_count: number | null
  status: string | null
  eligibility_criteria: any | null
  eligibleAttendeeTypes: string[]
}

// Raw database interface for packages
interface FunctionPackageRaw {
  package_id: string
  package_name: string
  package_description: string | null
  package_price: number
  original_price: number | null
  discount: number | null
  function_id: string
  is_active: boolean | null
  qty: number | null
  included_items: any[] | null
  includes_description: string[] | null
  eligibility_criteria: any | null
  registration_types: string[] | null  // This is a direct column in your view!
}

// Adapted interface for frontend consumption
export interface FunctionPackage {
  id: string
  name: string
  description: string | null
  price: number
  original_price: number | null
  discount: number | null
  function_id: string
  is_active: boolean | null
  qty: number | null
  includes: string[] // UUIDs of included tickets
  includes_description: string[] | null
  eligibility_criteria: any | null
  eligibleAttendeeTypes: string[]
  eligibleRegistrationTypes: string[]
  // New fields for enhanced display
  includedTicketNames?: string[] // Resolved ticket names for display
  includedTicketsCount?: number // Count of included tickets
}

export interface FunctionTicketsAndPackages {
  functionId: string
  tickets: FunctionTicketDefinition[]
  packages: FunctionPackage[]
}

// Adapter functions to transform database format to frontend format
function adaptTicketToFrontend(rawTicket: FunctionTicketDefinitionRaw): FunctionTicketDefinition {
  return {
    id: rawTicket.event_ticket_id,
    name: rawTicket.ticket_name,
    description: rawTicket.ticket_description,
    price: rawTicket.ticket_price,
    event_id: rawTicket.event_id,
    event_title: rawTicket.event_title,
    event_subtitle: rawTicket.event_subtitle,
    event_slug: rawTicket.event_slug,
    function_id: rawTicket.function_id,
    is_active: rawTicket.is_active,
    total_capacity: rawTicket.total_capacity,
    available_count: rawTicket.available_count,
    reserved_count: rawTicket.reserved_count,
    sold_count: rawTicket.sold_count,
    status: rawTicket.status,
    eligibility_criteria: rawTicket.eligibility_criteria,
    eligibleAttendeeTypes: rawTicket.eligibility_criteria?.attendeeTypes || rawTicket.eligibility_criteria?.attendee_types || ['mason', 'guest']
  }
}

function adaptPackageToFrontend(rawPackage: FunctionPackageRaw): FunctionPackage {
  // Debug log to see actual package structure
  console.log('Raw package data:', {
    name: rawPackage.package_name,
    registration_types: rawPackage.registration_types,
    eligibility_criteria: rawPackage.eligibility_criteria
  });
  
  return {
    id: rawPackage.package_id,
    name: rawPackage.package_name,
    description: rawPackage.package_description,
    price: rawPackage.package_price,
    original_price: rawPackage.original_price,
    discount: rawPackage.discount,
    function_id: rawPackage.function_id,
    is_active: rawPackage.is_active,
    qty: rawPackage.qty,
    includes: rawPackage.included_items || [],
    includes_description: rawPackage.includes_description,
    eligibility_criteria: rawPackage.eligibility_criteria,
    eligibleAttendeeTypes: rawPackage.eligibility_criteria?.attendeeTypes || rawPackage.eligibility_criteria?.attendee_types || ['mason', 'guest'],
    // Use the direct registration_types column from your view!
    eligibleRegistrationTypes: rawPackage.registration_types || ['individual', 'delegation', 'lodges']
  }
}

class FunctionTicketsService {
  /**
   * Get all tickets for a function using function_event_tickets_view via API
   * @param functionId - The function UUID
   * @param registrationType - Optional registration type filter
   */
  async getFunctionTickets(functionId: string, registrationType?: string): Promise<FunctionTicketDefinition[]> {
    try {
      if (!functionId) {
        console.error('getFunctionTickets called without functionId')
        throw new Error('Function ID is required to fetch tickets')
      }
      
      api.debug(`Fetching function tickets for function: ${functionId}, registrationType: ${registrationType}`)
      
      // Build URL with optional registration type filter
      let url = `/api/functions/${functionId}/tickets`
      if (registrationType) {
        url += `?registrationType=${encodeURIComponent(registrationType)}`
      }
      
      const response = await fetch(url)
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch tickets')
      }
      
      const { tickets } = await response.json()
      
      api.debug(`Fetched ${tickets?.length || 0} tickets for function ${functionId}`)
      
      // Transform and return tickets
      return (tickets || []).map(adaptTicketToFrontend)
    } catch (error) {
      api.error('Exception in getFunctionTickets:', error)
      throw error
    }
  }

  /**
   * Get all packages for a function using API route to bypass RLS
   * @param functionId - The function UUID
   * @param registrationType - Optional registration type filter
   */
  async getFunctionPackages(functionId: string, registrationType?: string): Promise<FunctionPackage[]> {
    try {
      if (!functionId) {
        console.error('getFunctionPackages called without functionId')
        throw new Error('Function ID is required to fetch packages')
      }
      
      api.debug(`Fetching function packages for function: ${functionId}, registrationType: ${registrationType}`)
      console.log('Fetching packages via API for function_id:', functionId)
      
      // Use API route to bypass RLS issues
      const response = await fetch(`/api/functions/${functionId}/packages`)
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch packages')
      }
      
      const { packages } = await response.json()
      
      console.log('Raw packages from API:', packages)
      
      // Map the raw package data to match our expected format
      let adapted = (packages || []).map((pkg: any) => ({
        id: pkg.package_id,
        name: pkg.name,
        description: pkg.description,
        price: parseFloat(pkg.package_price),
        original_price: pkg.original_price ? parseFloat(pkg.original_price) : null,
        discount: pkg.discount ? parseFloat(pkg.discount) : null,
        function_id: pkg.function_id,
        is_active: pkg.is_active,
        qty: pkg.qty,
        includes: pkg.included_items || [],
        includes_description: pkg.includes_description,
        eligibility_criteria: pkg.eligibility_criteria,
        eligibleAttendeeTypes: pkg.eligibility_criteria?.attendeeTypes || pkg.eligibility_criteria?.attendee_types || ['mason', 'guest'],
        eligibleRegistrationTypes: pkg.registration_types || ['individual', 'delegation', 'lodges']
      }))
      
      // Filter by registration type if provided
      if (registrationType) {
        adapted = adapted.filter(pkg => 
          pkg.eligibleRegistrationTypes.includes(registrationType)
        )
      }
      
      console.log('Adapted packages:', adapted)
      return adapted
    } catch (error) {
      api.error('Exception in getFunctionPackages:', error)
      throw error
    }
  }

  /**
   * Get both tickets and packages for a function
   * @param functionId - The function UUID
   * @param registrationType - Optional registration type filter
   */
  /**
   * Parse included_items array format like ["(uuid,1)","(uuid,1)"] to extract UUIDs
   * @param includedItems - Raw included_items from database
   * @returns Array of event ticket UUIDs
   */
  private parseIncludedItems(includedItems: any[]): string[] {
    if (!Array.isArray(includedItems)) return [];
    
    return includedItems
      .map(item => {
        // Convert to string if needed
        const itemStr = typeof item === 'string' ? item : String(item);
        
        // Parse format "(uuid,quantity)" to extract UUID
        const match = itemStr.match(/^\(([^,]+),\d+\)$/);
        return match ? match[1] : null;
      })
      .filter((uuid): uuid is string => uuid !== null);
  }

  /**
   * Resolve ticket names for UUIDs
   * @param ticketIds - Array of event ticket UUIDs
   * @param allTickets - All available tickets for the function
   * @returns Array of ticket names
   */
  private resolveTicketNames(ticketIds: string[], allTickets: FunctionTicketDefinition[]): string[] {
    return ticketIds
      .map(ticketId => {
        const ticket = allTickets.find(t => t.id === ticketId);
        return ticket ? ticket.name : null;
      })
      .filter((name): name is string => name !== null);
  }

  async getFunctionTicketsAndPackages(functionId: string, registrationType?: string): Promise<FunctionTicketsAndPackages> {
    try {
      if (!functionId) {
        console.error('getFunctionTicketsAndPackages called without functionId')
        throw new Error('Function ID is required to fetch tickets and packages')
      }
      
      api.debug(`Fetching tickets and packages for function: ${functionId}, registrationType: ${registrationType}`)
      
      const [tickets, rawPackages] = await Promise.all([
        this.getFunctionTickets(functionId, registrationType),
        this.getFunctionPackages(functionId, registrationType)
      ])

      // Process packages to resolve included ticket names
      const packages = rawPackages.map(pkg => {
        // Parse the included_items to get ticket UUIDs
        const includedTicketIds = this.parseIncludedItems(pkg.includes);
        
        // Resolve ticket names for the UUIDs
        const includedTicketNames = this.resolveTicketNames(includedTicketIds, tickets);
        
        api.debug(`Package "${pkg.name}" includes tickets:`, {
          rawIncludes: pkg.includes,
          parsedIds: includedTicketIds,
          ticketNames: includedTicketNames
        });

        return {
          ...pkg,
          includes: includedTicketIds, // Keep UUIDs for backend processing
          includedTicketNames, // Add resolved names for display
          includedTicketsCount: includedTicketIds.length
        };
      });

      return {
        functionId,
        tickets,
        packages
      }
    } catch (error) {
      api.error('Exception in getFunctionTicketsAndPackages:', error)
      throw error
    }
  }
}

// Singleton instance
let functionTicketsService: FunctionTicketsService | null = null

export function getFunctionTicketsService(): FunctionTicketsService {
  if (!functionTicketsService) {
    functionTicketsService = new FunctionTicketsService()
  }
  return functionTicketsService
}

export default getFunctionTicketsService