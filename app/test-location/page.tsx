'use client'

import { useLocationStore } from '../../lib/locationStore'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'

export default function TestLocationPage() {
  const { 
    ipData, 
    isLoadingIpData, 
    ipDataError, 
    fetchIpData 
  } = useLocationStore(state => ({
    ipData: state.ipData,
    isLoadingIpData: state.isLoadingIpData,
    ipDataError: state.ipDataError,
    fetchIpData: state.fetchIpData
  }))

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div>Loading...</div>
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">IP Geolocation Test</h1>
      
      <Card className="p-6 mb-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Location Data</h2>
          <Button 
            onClick={() => fetchIpData()} 
            disabled={isLoadingIpData}
          >
            {isLoadingIpData ? 'Loading...' : 'Refresh Location Data'}
          </Button>
        </div>

        {ipDataError && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
            Error: {ipDataError}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium">Basic Info</h3>
            <ul className="space-y-2 mt-2">
              <li><strong>IP:</strong> {ipData.ip}</li>
              <li><strong>Version:</strong> {ipData.version}</li>
              <li><strong>Network:</strong> {ipData.network || 'N/A'}</li>
            </ul>
          </div>

          <div>
            <h3 className="font-medium">Location</h3>
            <ul className="space-y-2 mt-2">
              <li><strong>City:</strong> {ipData.city}</li>
              <li><strong>Region:</strong> {ipData.region} ({ipData.region_code})</li>
              <li><strong>Country:</strong> {ipData.country_name} ({ipData.country_code})</li>
              <li><strong>Postal Code:</strong> {ipData.postal || 'N/A'}</li>
            </ul>
          </div>

          <div>
            <h3 className="font-medium">Coordinates</h3>
            <ul className="space-y-2 mt-2">
              <li><strong>Latitude:</strong> {ipData.latitude}</li>
              <li><strong>Longitude:</strong> {ipData.longitude}</li>
              <li><strong>Timezone:</strong> {ipData.timezone || 'N/A'}</li>
            </ul>
          </div>

          <div>
            <h3 className="font-medium">Additional Information</h3>
            <ul className="space-y-2 mt-2">
              <li><strong>Currency:</strong> {ipData.currency || 'N/A'}</li>
              <li><strong>Languages:</strong> {ipData.languages || 'N/A'}</li>
              <li><strong>Organisation:</strong> {ipData.org || 'N/A'}</li>
            </ul>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Raw Data</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
          {JSON.stringify(ipData, null, 2)}
        </pre>
      </Card>
    </div>
  )
}