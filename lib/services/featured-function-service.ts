/**
 * Featured Function Service
 * Service for working with the featured function using its UUID
 */

import type { FunctionType, EventType, PackageType } from '@/shared/types'

// Get the featured function ID from environment
const FEATURED_FUNCTION_ID = process.env.FEATURED_FUNCTION_ID || process.env.NEXT_PUBLIC_FEATURED_FUNCTION_ID || 'eebddef5-6833-43e3-8d32-700508b1c089'

export const featuredFunctionApi = {
  /**
   * Get the featured function details
   */
  getDetails: async (): Promise<FunctionType> => {
    const response = await fetch(`/api/functions/${FEATURED_FUNCTION_ID}`)
    if (!response.ok) {
      throw new Error('Failed to fetch featured function')
    }
    return response.json()
  },

  /**
   * Get all events for the featured function
   */
  getEvents: async (): Promise<EventType[]> => {
    const response = await fetch(`/api/functions/${FEATURED_FUNCTION_ID}/events`)
    if (!response.ok) {
      throw new Error('Failed to fetch events')
    }
    return response.json()
  },

  /**
   * Get all packages for the featured function
   */
  getPackages: async (): Promise<PackageType[]> => {
    const response = await fetch(`/api/functions/${FEATURED_FUNCTION_ID}/packages`)
    if (!response.ok) {
      throw new Error('Failed to fetch packages')
    }
    const data = await response.json()
    return data.packages || []
  },

  /**
   * Register for the featured function
   */
  register: async (registrationData: any): Promise<any> => {
    const response = await fetch(`/api/functions/${FEATURED_FUNCTION_ID}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...registrationData,
        functionId: FEATURED_FUNCTION_ID
      })
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to create registration')
    }
    
    return response.json()
  }
}

// Export the featured function ID for use in other services
export { FEATURED_FUNCTION_ID }