import { getSupabaseClient } from '@/lib/supabase-singleton'
import type { Database } from '@/shared/types/database'

type RegistrationRow = Database['public']['Tables']['registrations']['Row']
type AttendeeRow = Database['public']['Tables']['attendees']['Row']
type FunctionRow = Database['public']['Tables']['functions']['Row']
type EventRow = Database['public']['Tables']['events']['Row']
type PackageRow = Database['public']['Tables']['packages']['Row']

export interface AttendeeInput {
  firstName: string
  lastName: string
  email: string
  phone: string | null
  dietaryRequirements: string | null
  accessibilityRequirements: string | null
  attendeeType: 'mason' | 'guest'
  isMaster?: boolean
  masonicProfile?: {
    lodgeName?: string
    lodgeNumber?: string
    grandLodgeAffiliation?: string
    masonicRank?: string
  }
}

export interface ContactInfo {
  firstName: string
  lastName: string
  email: string
  phone: string
  preferredContact: 'email' | 'phone'
  address?: {
    street: string
    city: string
    state: string
    postcode: string
    country: string
  }
}

export interface PackageSelection {
  packageId: string
  quantity: number
  attendeeIds: string[]
}

export interface CreateRegistrationInput {
  functionId: string // REQUIRED
  attendees: AttendeeInput[]
  selectedEvents: string[] // Event IDs within the function
  packages: PackageSelection[]
  contactInfo: ContactInfo
}

export interface Registration {
  id: string
  functionId: string
  functionName: string
  functionSlug: string
  attendees: Attendee[]
  selectedEvents: Event[]
  packages: Package[]
  totalAmount: number
  paymentStatus: string
  createdAt: string
  contactInfo: ContactInfo
}

export interface Attendee {
  id: string
  registrationId: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  attendeeType: 'mason' | 'guest'
  ticketIds: string[]
}

export interface Event {
  id: string
  name: string
  date: string
  time: string
}

export interface Package {
  id: string
  name: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

export class RegistrationService {
  private supabase

  constructor(isServer: boolean = false) {
    this.supabase = getSupabaseClient(isServer)
  }

  async createRegistration(input: CreateRegistrationInput): Promise<Registration> {
    // Validate function exists
    const { data: functionData, error: functionError } = await this.supabase
      .from('functions')
      .select('*')
      .eq('function_id', input.functionId)
      .single()

    if (functionError || !functionData) {
      throw new Error('Invalid function')
    }

    // Validate selected events belong to function
    if (input.selectedEvents.length > 0) {
      const { data: events, error: eventsError } = await this.supabase
        .from('events')
        .select('event_id')
        .eq('function_id', input.functionId)
        .in('event_id', input.selectedEvents)

      if (eventsError || events?.length !== input.selectedEvents.length) {
        throw new Error('Invalid events for function')
      }
    }

    // Validate packages belong to function
    if (input.packages.length > 0) {
      const packageIds = input.packages.map(p => p.packageId)
      const { data: packages, error: packagesError } = await this.supabase
        .from('packages')
        .select('package_id')
        .eq('function_id', input.functionId)
        .in('package_id', packageIds)

      if (packagesError || packages?.length !== packageIds.length) {
        throw new Error('Invalid packages for function')
      }
    }

    // Create registration for function
    const registration = {
      function_id: input.functionId,
      // NO event_id field
      status: 'pending',
      payment_status: 'pending',
      total_amount_paid: 0, // Will be calculated
      contact_details: {
        firstName: input.contactInfo.firstName,
        lastName: input.contactInfo.lastName,
        email: input.contactInfo.email,
        phone: input.contactInfo.phone,
        preferredContact: input.contactInfo.preferredContact,
        address: input.contactInfo.address
      },
      metadata: {
        function_name: functionData.name,
        function_slug: functionData.slug,
        selected_events: input.selectedEvents,
        packages: input.packages
      }
    }

    const { data: registrationData, error: registrationError } = await this.supabase
      .from('registrations')
      .insert(registration)
      .select()
      .single()

    if (registrationError) {
      throw new Error(`Failed to create registration: ${registrationError.message}`)
    }

    // Create attendees
    const attendees = await Promise.all(
      input.attendees.map(async (attendee) => {
        const attendeeData = {
          registration_id: registrationData.registration_id,
          first_name: attendee.firstName,
          last_name: attendee.lastName,
          email: attendee.email,
          phone: attendee.phone,
          dietary_requirements: attendee.dietaryRequirements,
          accessibility_requirements: attendee.accessibilityRequirements,
          attendee_type: attendee.attendeeType,
          is_master: attendee.isMaster || false,
          masonic_profile: attendee.masonicProfile || null
        }

        const { data, error } = await this.supabase
          .from('attendees')
          .insert(attendeeData)
          .select()
          .single()

        if (error) {
          throw new Error(`Failed to create attendee: ${error.message}`)
        }

        return data
      })
    )

    return this.transformRegistration({
      ...registrationData,
      function: functionData,
      attendees
    })
  }

  // REMOVE: createRegistrationForEvent()
  // REMOVE: createRegistrationForParentEvent()

  async getRegistration(registrationId: string): Promise<Registration> {
    const { data, error } = await this.supabase
      .from('registrations')
      .select(`
        *,
        function:functions!function_id(*),
        attendees(*),
        tickets(*),
        packages:registration_packages(*)
      `)
      .eq('registration_id', registrationId)
      .single()

    if (error) throw error
    if (!data) throw new Error('Registration not found')

    // Registration MUST have a function
    if (!data.function_id) {
      throw new Error('Registration missing function association')
    }

    return this.transformRegistration(data)
  }

  async getRegistrationsByFunction(functionId: string): Promise<Registration[]> {
    const { data, error } = await this.supabase
      .from('registrations')
      .select(`
        *,
        function:functions!function_id(*),
        attendees(*),
        tickets(*),
        packages:registration_packages(*)
      `)
      .eq('function_id', functionId)
      .order('created_at', { ascending: false })

    if (error) throw error
    if (!data) return []

    return data.map(reg => this.transformRegistration(reg))
  }

  async updateRegistrationPaymentStatus(
    registrationId: string, 
    status: 'pending' | 'completed' | 'failed' | 'cancelled'
  ): Promise<void> {
    const { error } = await this.supabase
      .from('registrations')
      .update({ payment_status: status })
      .eq('registration_id', registrationId)

    if (error) throw error
  }

  async cancelRegistration(registrationId: string): Promise<void> {
    const { error } = await this.supabase
      .from('registrations')
      .update({ 
        status: 'cancelled',
        payment_status: 'cancelled' 
      })
      .eq('registration_id', registrationId)

    if (error) throw error
  }

  private transformRegistration(data: any): Registration {
    const registration = data as RegistrationRow
    const functionData = data.function as FunctionRow
    const attendees = (data.attendees || []) as AttendeeRow[]

    return {
      id: registration.registration_id,
      functionId: registration.function_id,
      functionName: functionData.name,
      functionSlug: functionData.slug,
      attendees: attendees.map(attendee => ({
        id: attendee.attendee_id,
        registrationId: attendee.registration_id,
        firstName: attendee.first_name,
        lastName: attendee.last_name,
        email: attendee.email,
        phone: attendee.phone,
        attendeeType: attendee.attendee_type as 'mason' | 'guest',
        ticketIds: [] // Will be populated from tickets relation
      })),
      selectedEvents: registration.metadata?.selected_events || [],
      packages: registration.metadata?.packages || [],
      totalAmount: registration.total_amount_paid,
      paymentStatus: registration.payment_status,
      createdAt: registration.created_at,
      contactInfo: registration.contact_details as ContactInfo
    }
  }
}