import { getSupabaseClient } from '@/lib/supabase-singleton'
import type { PackageType } from '@/shared/types'
import type { Database } from '@/shared/types/database'

type PackageRow = Database['public']['Tables']['packages']['Row']
type FunctionRow = Database['public']['Tables']['functions']['Row']
type PackageEventRow = Database['public']['Tables']['package_events']['Row']
type EventRow = Database['public']['Tables']['events']['Row']

export interface PackageWithDetails extends PackageType {
  events?: {
    eventId: string
    eventName: string
    eventDate: string
    isIncluded: boolean
  }[]
  ticketTypeId?: string
  maxQuantity?: number
  availableQuantity?: number
}

export class PackageService {
  private supabase

  constructor(isServer: boolean = false) {
    this.supabase = getSupabaseClient(isServer)
  }

  async getPackagesForFunction(functionId: string): Promise<PackageWithDetails[]> {
    const { data, error } = await this.supabase
      .from('packages')
      .select(`
        *,
        function:functions!function_id(*),
        package_events(
          event_id,
          is_included,
          events!event_id(
            event_id,
            title,
            event_start
          )
        )
      `)
      .eq('function_id', functionId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) throw error
    if (!data) return []

    return data.map(pkg => this.transformPackage(pkg))
  }

  async getPackageById(packageId: string): Promise<PackageWithDetails> {
    const { data, error } = await this.supabase
      .from('packages')
      .select(`
        *,
        function:functions!function_id(*),
        package_events(
          event_id,
          is_included,
          events!event_id(
            event_id,
            title,
            event_start
          )
        )
      `)
      .eq('package_id', packageId)
      .single()

    if (error) throw error
    if (!data) throw new Error('Package not found')

    // Package MUST have a function
    if (!data.function_id) {
      throw new Error('Package missing function association')
    }

    return this.transformPackage(data)
  }

  async getActivePackages(functionId: string): Promise<PackageWithDetails[]> {
    const now = new Date().toISOString()
    
    const { data, error } = await this.supabase
      .from('packages')
      .select(`
        *,
        function:functions!function_id(*),
        package_events(
          event_id,
          is_included,
          events!event_id(
            event_id,
            title,
            event_start
          )
        )
      `)
      .eq('function_id', functionId)
      .eq('is_active', true)
      .lte('available_from', now)
      .gte('available_until', now)
      .order('sort_order', { ascending: true })

    if (error) throw error
    if (!data) return []

    return data.map(pkg => this.transformPackage(pkg))
  }

  async checkPackageAvailability(packageId: string, quantity: number): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('packages')
      .select('max_quantity, current_bookings')
      .eq('package_id', packageId)
      .eq('is_active', true)
      .single()

    if (error || !data) return false

    // If no max_quantity set, package is unlimited
    if (!data.max_quantity) return true

    const currentBookings = data.current_bookings || 0
    const availableQuantity = data.max_quantity - currentBookings

    return availableQuantity >= quantity
  }

  async updatePackageBookings(packageId: string, quantity: number): Promise<void> {
    // Use RPC to safely update bookings with concurrency control
    const { error } = await this.supabase
      .rpc('increment_package_bookings', {
        p_package_id: packageId,
        p_quantity: quantity
      })

    if (error) throw error
  }

  // REMOVE: getPackagesByParentEvent()
  // Packages now belong to functions, not parent events

  private transformPackage(data: any): PackageWithDetails {
    const pkg = data as PackageRow
    const packageEvents = data.package_events as any[] || []

    const events = packageEvents.map(pe => ({
      eventId: pe.event_id,
      eventName: pe.events?.title || '',
      eventDate: pe.events?.event_start || '',
      isIncluded: pe.is_included
    }))

    return {
      id: pkg.package_id,
      name: pkg.name,
      description: pkg.description,
      fullPrice: pkg.full_price,
      discount: pkg.discount,
      totalCost: pkg.total_cost,
      inclusions: pkg.inclusions,
      functionId: pkg.function_id,
      events,
      ticketTypeId: pkg.ticket_type_id,
      maxQuantity: pkg.max_quantity,
      availableQuantity: pkg.max_quantity ? 
        (pkg.max_quantity - (pkg.current_bookings || 0)) : 
        undefined
    }
  }

  async getPackagePricing(packageId: string): Promise<{
    basePrice: number
    discount: number
    finalPrice: number
    savingsAmount: number
    savingsPercentage: number
  }> {
    const pkg = await this.getPackageById(packageId)
    
    const basePrice = pkg.fullPrice
    const discount = pkg.discount || 0
    const finalPrice = pkg.totalCost || (basePrice - discount)
    const savingsAmount = basePrice - finalPrice
    const savingsPercentage = basePrice > 0 ? 
      Math.round((savingsAmount / basePrice) * 100) : 0

    return {
      basePrice,
      discount,
      finalPrice,
      savingsAmount,
      savingsPercentage
    }
  }
}