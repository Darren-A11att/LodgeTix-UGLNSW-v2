// Service for fetching function tickets and packages using the new database views
import { getSupabaseClient } from '@/lib/supabase-singleton'
import { api } from '@/lib/api-logger'

// Raw database interface
interface FunctionTicketDefinitionRaw {
  event_ticket_id: string
  ticket_name: string
  ticket_description: string | null
  ticket_price: number
  event_id: string
  event_title: string
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
  event_slug: string
  function_id: string
  is_active: boolean | null
  total_capacity: number | null
  available_count: number | null
  reserved_count: number | null
  sold_count: number | null
  status: string | null
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
  includes: string[]
  includes_description: string[] | null
  eligibleAttendeeTypes: string[]
  eligibleRegistrationTypes: string[]
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
    event_slug: rawTicket.event_slug,
    function_id: rawTicket.function_id,
    is_active: rawTicket.is_active,
    total_capacity: rawTicket.total_capacity,
    available_count: rawTicket.available_count,
    reserved_count: rawTicket.reserved_count,
    sold_count: rawTicket.sold_count,
    status: rawTicket.status,
    eligibleAttendeeTypes: rawTicket.eligibility_criteria?.attendeeTypes || rawTicket.eligibility_criteria?.attendee_types || ['mason', 'guest']
  }
}

function adaptPackageToFrontend(rawPackage: FunctionPackageRaw): FunctionPackage {
  // Debug log to see what's in eligibility_criteria
  if (rawPackage.eligibility_criteria) {
    console.log('Package eligibility_criteria:', {
      name: rawPackage.package_name,
      eligibility_criteria: rawPackage.eligibility_criteria
    });
  }
  
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
    eligibleAttendeeTypes: rawPackage.eligibility_criteria?.attendeeTypes || rawPackage.eligibility_criteria?.attendee_types || ['mason', 'guest'],
    eligibleRegistrationTypes: rawPackage.eligibility_criteria?.registrationTypes || rawPackage.eligibility_criteria?.registration_types || ['individual', 'delegation', 'lodges']
  }
}

class FunctionTicketsService {
  private supabase = getSupabaseClient()

  /**
   * Get all tickets for a function using function_event_tickets_view
   */
  async getFunctionTickets(functionId: string): Promise<FunctionTicketDefinition[]> {
    try {
      api.debug(`Fetching function tickets for function: ${functionId}`)
      
      const { data, error } = await this.supabase
        .from('function_event_tickets_view')
        .select('*')
        .eq('function_id', functionId)
        .eq('ticket_is_active', true)
        .order('event_title', { ascending: true })

      if (error) {
        api.error('Error fetching function tickets:', error)
        throw new Error(`Failed to fetch function tickets: ${error.message}`)
      }

      api.debug(`Fetched ${data?.length || 0} tickets for function ${functionId}`)
      return (data || []).map(adaptTicketToFrontend)
    } catch (error) {
      api.error('Exception in getFunctionTickets:', error)
      throw error
    }
  }

  /**
   * Get all packages for a function using function_packages_view
   */
  async getFunctionPackages(functionId: string): Promise<FunctionPackage[]> {
    try {
      api.debug(`Fetching function packages for function: ${functionId}`)
      console.log('Querying packages with function_id:', functionId)
      
      // Temporarily query without is_active filter to debug
      const { data: allPackages } = await this.supabase
        .from('function_packages_view')
        .select('*')
        .eq('function_id', functionId)
        .order('package_name', { ascending: true })
      
      console.log('All packages (including inactive):', allPackages)
      
      const { data, error } = await this.supabase
        .from('function_packages_view')
        .select('*')
        .eq('function_id', functionId)
        .eq('is_active', true)
        .order('package_name', { ascending: true })

      if (error) {
        api.error('Error fetching function packages:', error)
        throw new Error(`Failed to fetch function packages: ${error.message}`)
      }

      api.debug(`Fetched ${data?.length || 0} packages for function ${functionId}`)
      console.log('Raw packages from database:', data)
      const adapted = (data || []).map(adaptPackageToFrontend)
      console.log('Adapted packages:', adapted)
      return adapted
    } catch (error) {
      api.error('Exception in getFunctionPackages:', error)
      throw error
    }
  }

  /**
   * Get both tickets and packages for a function
   */
  async getFunctionTicketsAndPackages(functionId: string): Promise<FunctionTicketsAndPackages> {
    try {
      api.debug(`Fetching tickets and packages for function: ${functionId}`)
      
      const [tickets, packages] = await Promise.all([
        this.getFunctionTickets(functionId),
        this.getFunctionPackages(functionId)
      ])

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