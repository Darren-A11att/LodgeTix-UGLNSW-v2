import { createClient } from '@/utils/supabase/server'

export interface UserRole {
  id: string
  role: string
  user_id: string
  created_at: string
}

export interface UserPersona {
  role: string
  title: string
  description: string
  path: string
  icon: string
  available: boolean
}

export class UserRoleService {
  private supabase = createClient()

  /**
   * Get all roles for the current authenticated user
   */
  async getUserRoles(): Promise<UserRole[]> {
    const supabase = await this.supabase
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return []
    }

    const { data: roles, error } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', user.id)

    if (error) {
      console.error('Error fetching user roles:', error)
      return []
    }

    return roles || []
  }

  /**
   * Check if user has a specific role
   */
  async hasRole(roleName: string): Promise<boolean> {
    const roles = await this.getUserRoles()
    return roles.some(role => role.role === roleName)
  }

  /**
   * Check if user is an organiser (has organisation)
   */
  async isOrganiser(): Promise<boolean> {
    const supabase = await this.supabase
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return false

    const { data: organisation } = await supabase
      .from('organisations')
      .select('organisation_id')
      .eq('email_address', user.email)
      .single()

    return !!organisation
  }

  /**
   * Check if user is a customer (has registrations or tickets)
   */
  async isCustomer(): Promise<boolean> {
    const supabase = await this.supabase
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return false

    // Check for registrations
    const { data: registrations } = await supabase
      .from('registrations')
      .select('registration_id')
      .eq('auth_user_id', user.id)
      .limit(1)

    if (registrations && registrations.length > 0) {
      return true
    }

    // Check for customer records
    const { data: customer } = await supabase
      .from('customers')
      .select('customer_id')
      .eq('auth_user_id', user.id)
      .limit(1)

    return !!(customer && customer.length > 0)
  }

  /**
   * Check if user is an attendee (has attendee records)
   */
  async isAttendee(): Promise<boolean> {
    const supabase = await this.supabase
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return false

    const { data: attendees } = await supabase
      .from('attendees')
      .select('attendee_id')
      .eq('auth_user_id', user.id)
      .limit(1)

    return !!(attendees && attendees.length > 0)
  }

  /**
   * Get available personas for the current user
   */
  async getAvailablePersonas(): Promise<UserPersona[]> {
    const [isOrganiser, isCustomer, isAttendee] = await Promise.all([
      this.isOrganiser(),
      this.isCustomer(),
      this.isAttendee()
    ])

    const personas: UserPersona[] = [
      {
        role: 'organiser',
        title: 'Organiser Portal',
        description: 'Manage your functions, events, and registrations',
        path: '/organiser',
        icon: 'calendar-days',
        available: isOrganiser
      },
      {
        role: 'customer',
        title: 'Customer Portal',
        description: 'View your registrations and tickets',
        path: '/customer',
        icon: 'ticket',
        available: isCustomer
      },
      {
        role: 'attendee',
        title: 'Attendee Portal',
        description: 'Access your event information and tickets',
        path: '/attendee',
        icon: 'user',
        available: isAttendee
      }
    ]

    return personas
  }

  /**
   * Get the default portal for the user based on their primary role
   */
  async getDefaultPortal(): Promise<string> {
    const personas = await this.getAvailablePersonas()
    const availablePersonas = personas.filter(p => p.available)

    if (availablePersonas.length === 0) {
      // New user - direct to customer portal to encourage registration
      return '/customer'
    }

    if (availablePersonas.length === 1) {
      // Single role - direct to that portal
      return availablePersonas[0].path
    }

    // Multiple roles - show portal hub
    return '/portal'
  }
}

export const userRoleService = new UserRoleService()