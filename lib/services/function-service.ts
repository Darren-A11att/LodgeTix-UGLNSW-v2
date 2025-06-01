import { getBrowserClient } from '@/lib/supabase-singleton'
import type { FunctionType, EventType, PackageType } from '@/shared/types'
import type { Database } from '@/shared/types/database'
import type { SupabaseClient } from '@supabase/supabase-js'

type FunctionRow = Database['public']['Tables']['functions']['Row']
type EventRow = Database['public']['Tables']['events']['Row']
type PackageRow = Database['public']['Tables']['packages']['Row']
type LocationRow = Database['public']['Tables']['locations']['Row']

export class FunctionService {
  private supabase: SupabaseClient<Database>

  constructor(supabaseClient?: SupabaseClient<Database>) {
    // If no client provided, use browser client (for client-side usage)
    this.supabase = supabaseClient || getBrowserClient()
  }

  async getAllFunctions(): Promise<FunctionType[]> {
    const { data, error } = await this.supabase
      .from('functions')
      .select(`
        *,
        events (*),
        packages (*),
        location:locations (*)
      `)
      .eq('is_published', true)
      .order('start_date', { ascending: true })

    if (error) throw error
    if (!data) return []

    return data.map(functionData => this.transformFunction(functionData))
  }

  async getFunctionBySlug(slug: string): Promise<FunctionType> {
    const { data, error } = await this.supabase
      .from('functions')
      .select(`
        *,
        events (*),
        packages (*),
        location:locations (*)
      `)
      .eq('slug', slug)
      .eq('is_published', true)
      .single()

    if (error) throw error
    if (!data) throw new Error('Function not found')

    return this.transformFunction(data)
  }

  async getFunctionById(functionId: string): Promise<FunctionType> {
    const { data, error } = await this.supabase
      .from('functions')
      .select(`
        *,
        events (*),
        packages (*),
        location:locations (*)
      `)
      .eq('function_id', functionId)
      .single()

    if (error) throw error
    if (!data) throw new Error('Function not found')

    return this.transformFunction(data)
  }

  async getEventsForFunction(functionId: string): Promise<EventType[]> {
    const { data, error } = await this.supabase
      .from('events')
      .select('*')
      .eq('function_id', functionId)
      .eq('is_published', true)
      .order('event_start', { ascending: true })

    if (error) throw error
    if (!data) return []

    // Get function details to include in events
    const { data: functionData } = await this.supabase
      .from('functions')
      .select('name, slug')
      .eq('function_id', functionId)
      .single()

    return data.map(event => this.transformEvent(event, functionData))
  }

  async getPackagesForFunction(functionId: string): Promise<PackageType[]> {
    const { data, error } = await this.supabase
      .from('packages')
      .select('*')
      .eq('function_id', functionId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) throw error
    if (!data) return []

    return data.map(pkg => this.transformPackage(pkg))
  }

  async getFeaturedFunctions(): Promise<FunctionType[]> {
    const { data, error } = await this.supabase
      .from('functions')
      .select(`
        *,
        events (*),
        packages (*),
        location:locations (*)
      `)
      .eq('is_published', true)
      .order('start_date', { ascending: true })
      .limit(3)

    if (error) throw error
    if (!data) return []

    return data.map(functionData => this.transformFunction(functionData))
  }

  async getRegistrationCountForFunction(functionId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from('registrations')
      .select('*', { count: 'exact', head: true })
      .eq('function_id', functionId)
      .not('payment_status', 'eq', 'cancelled')

    if (error) throw error
    return count || 0
  }

  private transformFunction(data: any): FunctionType {
    const functionRow = data as FunctionRow
    const events = (data.events || []) as EventRow[]
    const packages = (data.packages || []) as PackageRow[]
    const location = data.location as LocationRow | null

    // Calculate min price from events and packages
    const eventPrices: number[] = []
    const packagePrices: number[] = []
    
    // Get prices from packages
    packages.forEach(pkg => {
      if (pkg.total_cost) packagePrices.push(pkg.total_cost)
    })
    
    const minPrice = Math.min(...[...eventPrices, ...packagePrices].filter(p => p > 0))
    const durationDays = this.calculateDurationDays(functionRow.start_date, functionRow.end_date)

    return {
      id: functionRow.function_id,
      name: functionRow.name,
      slug: functionRow.slug,
      description: functionRow.description,
      imageUrl: functionRow.image_url,
      startDate: functionRow.start_date,
      endDate: functionRow.end_date,
      locationId: functionRow.location_id,
      organiserId: functionRow.organiser_id,
      events: events.map(event => this.transformEvent(event, { 
        name: functionRow.name, 
        slug: functionRow.slug 
      })),
      packages: packages.map(pkg => this.transformPackage(pkg)),
      registrationCount: 0, // Will be populated separately if needed
      metadata: functionRow.metadata || {},
      minPrice: isFinite(minPrice) ? minPrice : 0,
      durationDays,
      location: location ? {
        id: location.location_id,
        name: location.name,
        city: location.city,
        state: location.state
      } : undefined
    }
  }

  private transformEvent(event: EventRow, functionData?: { name: string; slug: string } | null): EventType {
    return {
      id: event.event_id,
      slug: event.slug,
      eventStart: event.event_start,
      eventEnd: event.event_end,
      functionId: event.function_id,
      functionName: functionData?.name || '',
      functionSlug: functionData?.slug || '',
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

  private transformPackage(pkg: PackageRow): PackageType {
    return {
      id: pkg.package_id,
      name: pkg.name,
      description: pkg.description,
      fullPrice: pkg.full_price,
      discount: pkg.discount,
      totalCost: pkg.total_cost,
      inclusions: pkg.inclusions,
      functionId: pkg.function_id
    }
  }

  private calculateDurationDays(startDate: string, endDate: string): number {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays + 1 // Include both start and end days
  }

  // NO getFunctionByParentEventId
  // NO compatibility methods
  // NO fallback logic
}