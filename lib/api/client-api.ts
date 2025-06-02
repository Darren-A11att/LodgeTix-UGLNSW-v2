/**
 * Client-side API for functions-based architecture
 * Direct implementation without parent-child event compatibility
 */

import type { FunctionType, EventType, Attendee } from '@/shared/types'

interface CreateRegistrationData {
  functionId: string
  selectedEvents: string[]
  attendees: Attendee[]
  packages?: string[]
  registrationType: 'individual' | 'lodge' | 'delegation'
  bookingContact: {
    firstName: string
    lastName: string
    email: string
    phone: string
  }
}

interface RegistrationResponse {
  registrationId: string
  functionId: string
  totalAmount: number
  status: string
}

export const api = {
  functions: {
    /**
     * Get all published functions
     */
    getAll: async (): Promise<FunctionType[]> => {
      const response = await fetch('/api/functions')
      if (!response.ok) {
        throw new Error('Failed to fetch functions')
      }
      return response.json()
    },

    /**
     * Get a single function by slug
     */
    getBySlug: async (slug: string): Promise<FunctionType> => {
      const response = await fetch(`/api/functions/${slug}`)
      if (!response.ok) {
        throw new Error('Function not found')
      }
      return response.json()
    },

    /**
     * Get all events for a function
     */
    getEvents: async (functionSlug: string): Promise<EventType[]> => {
      const response = await fetch(`/api/functions/${functionSlug}/events`)
      if (!response.ok) {
        throw new Error('Failed to fetch events')
      }
      return response.json()
    },

    /**
     * Get featured functions for homepage
     */
    getFeatured: async (): Promise<FunctionType[]> => {
      const response = await fetch('/api/functions?featured=true')
      if (!response.ok) {
        throw new Error('Failed to fetch featured functions')
      }
      return response.json()
    }
  },

  registrations: {
    /**
     * Create a new registration for a function
     */
    create: async (data: CreateRegistrationData): Promise<RegistrationResponse> => {
      const response = await fetch('/api/registrations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create registration')
      }
      
      return response.json()
    },

    /**
     * Get registration details
     */
    getById: async (registrationId: string): Promise<any> => {
      const response = await fetch(`/api/registrations/${registrationId}`)
      if (!response.ok) {
        throw new Error('Registration not found')
      }
      return response.json()
    },

    /**
     * Update registration (add attendees, update details, etc.)
     */
    update: async (registrationId: string, data: Partial<CreateRegistrationData>): Promise<any> => {
      const response = await fetch(`/api/registrations/${registrationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to update registration')
      }
      
      return response.json()
    },

    /**
     * Process payment for a registration
     */
    processPayment: async (registrationId: string, paymentData: any): Promise<any> => {
      const response = await fetch(`/api/registrations/${registrationId}/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentData)
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Payment processing failed')
      }
      
      return response.json()
    }
  },

  events: {
    /**
     * Get a single event by slug (requires function slug for context)
     */
    getBySlug: async (functionSlug: string, eventSlug: string): Promise<EventType> => {
      const response = await fetch(`/api/functions/${functionSlug}/functions/${eventSlug}`)
      if (!response.ok) {
        throw new Error('Event not found')
      }
      return response.json()
    }
  },

  packages: {
    /**
     * Get packages for a function
     */
    getForFunction: async (functionId: string): Promise<any[]> => {
      const response = await fetch(`/api/packages?functionId=${functionId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch packages')
      }
      return response.json()
    }
  }

  // REMOVED: 
  // - events.getParent
  // - events.getChildren
  // - events.getWithHierarchy
  // - Any parent/child API calls
  // - Any compatibility checking endpoints
}

// Export type-safe API client
export default api