'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { FEATURED_FUNCTION_ID } from '@/lib/utils/function-slug-resolver-client'
import { featuredFunctionApi } from '@/lib/services/featured-function-service'
import type { FunctionType, EventType, PackageType } from '@/shared/types'

interface FeaturedFunctionContextType {
  function: FunctionType | null
  events: EventType[]
  packages: PackageType[]
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

const FeaturedFunctionContext = createContext<FeaturedFunctionContextType | undefined>(undefined)

interface FeaturedFunctionProviderProps {
  children: ReactNode
}

export function FeaturedFunctionProvider({ children }: FeaturedFunctionProviderProps) {
  const [functionData, setFunctionData] = useState<FunctionType | null>(null)
  const [events, setEvents] = useState<EventType[]>([])
  const [packages, setPackages] = useState<PackageType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchFeaturedFunction = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Fetch function details, events, and packages in parallel
      const [functionDetails, functionEvents, functionPackages] = await Promise.all([
        featuredFunctionApi.getDetails(),
        featuredFunctionApi.getEvents(),
        featuredFunctionApi.getPackages()
      ])

      setFunctionData(functionDetails)
      setEvents(functionEvents)
      setPackages(functionPackages)
    } catch (err) {
      console.error('Failed to fetch featured function:', err)
      setError(err instanceof Error ? err : new Error('Failed to fetch featured function'))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchFeaturedFunction()
  }, [])

  const value: FeaturedFunctionContextType = {
    function: functionData,
    events,
    packages,
    isLoading,
    error,
    refetch: fetchFeaturedFunction
  }

  return (
    <FeaturedFunctionContext.Provider value={value}>
      {children}
    </FeaturedFunctionContext.Provider>
  )
}

export function useFeaturedFunction() {
  const context = useContext(FeaturedFunctionContext)
  if (context === undefined) {
    throw new Error('useFeaturedFunction must be used within a FeaturedFunctionProvider')
  }
  return context
}

// Convenience hooks for specific data
export function useFeaturedFunctionDetails() {
  const { function: fn, isLoading, error } = useFeaturedFunction()
  return { function: fn, isLoading, error }
}

export function useFeaturedEvents() {
  const { events, isLoading, error } = useFeaturedFunction()
  return { events, isLoading, error }
}

export function useFeaturedPackages() {
  const { packages, isLoading, error } = useFeaturedFunction()
  return { packages, isLoading, error }
}

// Export the featured function ID for direct use when needed
export { FEATURED_FUNCTION_ID }