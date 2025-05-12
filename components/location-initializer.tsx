'use client'

import { useLocationStore } from '../lib/locationStore'
import { useEffect } from 'react'

export function LocationInitializer() {
  const fetchIpData = useLocationStore(state => state.fetchIpData)
  
  useEffect(() => {
    // Fetch IP data when component mounts
    fetchIpData()
  }, [fetchIpData])
  
  return null
}