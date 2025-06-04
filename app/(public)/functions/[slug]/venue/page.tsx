import { notFound } from "next/navigation"
import { MapPin, Phone, Globe, Mail, Clock, Car } from "lucide-react"
import { resolveFunctionSlug } from "@/lib/utils/function-slug-resolver"
import { createClient } from "@/utils/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const dynamic = 'force-dynamic'

export default async function VenuePage({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  
  // Resolve slug to function ID
  const functionId = await resolveFunctionSlug(slug, true)
  
  // Get function details with location
  const supabase = await createClient()
  
  const { data: functionData, error: functionError } = await supabase
    .from('functions')
    .select(`
      id,
      name,
      location_id,
      locations (
        id,
        name,
        address,
        suburb,
        state,
        postcode,
        country,
        phone,
        email,
        website,
        description,
        parking_info,
        public_transport_info,
        accessibility_info
      )
    `)
    .eq('id', functionId)
    .single()
  
  if (functionError || !functionData) {
    return notFound()
  }
  
  const location = functionData.locations
  
  if (!location) {
    return (
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold mb-8">Venue Information</h1>
        <p className="text-gray-600">Venue information will be announced soon.</p>
      </div>
    )
  }
  
  const fullAddress = `${location.address || ''}, ${location.suburb || ''} ${location.state || ''} ${location.postcode || ''}, ${location.country || 'Australia'}`
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`
  
  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold mb-8">Venue Information</h1>
      
      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{location.name}</CardTitle>
            <CardDescription>Event Venue</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-gray-500 mt-0.5" />
              <div>
                <p className="font-medium">Address</p>
                <p className="text-gray-600">{location.address}</p>
                <p className="text-gray-600">{location.suburb} {location.state} {location.postcode}</p>
                <p className="text-gray-600">{location.country || 'Australia'}</p>
                <a
                  href={mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-sm mt-2 inline-block"
                >
                  View on Google Maps
                </a>
              </div>
            </div>
            
            {location.phone && (
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-gray-500 mt-0.5" />
                <div>
                  <p className="font-medium">Phone</p>
                  <a href={`tel:${location.phone}`} className="text-gray-600 hover:underline">
                    {location.phone}
                  </a>
                </div>
              </div>
            )}
            
            {location.email && (
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-gray-500 mt-0.5" />
                <div>
                  <p className="font-medium">Email</p>
                  <a href={`mailto:${location.email}`} className="text-gray-600 hover:underline">
                    {location.email}
                  </a>
                </div>
              </div>
            )}
            
            {location.website && (
              <div className="flex items-start gap-3">
                <Globe className="h-5 w-5 text-gray-500 mt-0.5" />
                <div>
                  <p className="font-medium">Website</p>
                  <a 
                    href={location.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:underline"
                  >
                    {location.website}
                  </a>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        <div className="space-y-6">
          {location.description && (
            <Card>
              <CardHeader>
                <CardTitle>About the Venue</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{location.description}</p>
              </CardContent>
            </Card>
          )}
          
          {location.parking_info && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  Parking Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{location.parking_info}</p>
              </CardContent>
            </Card>
          )}
          
          {location.public_transport_info && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Public Transport
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{location.public_transport_info}</p>
              </CardContent>
            </Card>
          )}
          
          {location.accessibility_info && (
            <Card>
              <CardHeader>
                <CardTitle>Accessibility</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{location.accessibility_info}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}