import React from "react"
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
      function_id,
      name,
      location_id,
      locations (
        location_id,
        place_name,
        street_address,
        suburb,
        state,
        postal_code,
        country,
        phone,
        email,
        website,
        description,
        parking_info,
        public_transport_info,
        accessibility_info,
        image_urls,
        google_maps_embed_url,
        latitude,
        longitude
      )
    `)
    .eq('function_id', functionId)
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
  
  const fullAddress = `${location.street_address || ''}, ${location.suburb || ''} ${location.state || ''} ${location.postal_code || ''}, ${location.country || 'Australia'}`
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`
  const googleMapsApiKey = "AIzaSyBC_Dpa_lXoIYDdzHtYHpFDMmfyEswMbp8"
  
  // Generate Google Maps embed URL
  const embedMapUrl = location.google_maps_embed_url || 
    `https://www.google.com/maps/embed/v1/place?key=${googleMapsApiKey}&q=${encodeURIComponent(fullAddress)}`

  // Default venue image if none provided
  const defaultVenueImage = "https://images.unsplash.com/photo-1559136555-9303baea8ebd?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&crop=focalpoint&fp-x=.4&w=2560&h=3413&&q=80"
  
  return (
    <div className="relative bg-white">
      <div className="mx-auto max-w-7xl lg:flex lg:justify-between lg:px-8 xl:justify-end">
        {/* Image Section - Left Side */}
        <div className="lg:flex lg:w-1/2 lg:shrink lg:grow-0 xl:absolute xl:inset-y-0 xl:right-1/2 xl:w-1/2">
          <div className="relative h-80 lg:-ml-8 lg:h-auto lg:w-full lg:grow xl:ml-0">
            <img
              alt={`${location.place_name} venue`}
              src={location.image_urls && location.image_urls.length > 0 ? location.image_urls[0] : defaultVenueImage}
              className="absolute inset-0 size-full bg-gray-50 object-cover"
            />
          </div>
        </div>

        {/* Content Section - Right Side */}
        <div className="px-6 lg:contents">
          <div className="mx-auto max-w-2xl pt-16 pb-24 sm:pt-20 sm:pb-32 lg:mr-0 lg:ml-8 lg:w-full lg:max-w-lg lg:flex-none lg:pt-32 xl:w-1/2">
            <p className="text-base/7 font-semibold text-masonic-navy">Venue Information</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight text-pretty text-gray-900 sm:text-5xl">
              {location.place_name}
            </h1>
            
            {location.description && (
              <p className="mt-6 text-xl/8 text-gray-700">
                {location.description}
              </p>
            )}

            <div className="mt-10 max-w-xl text-base/7 text-gray-700 lg:max-w-none">
              {/* Address Information */}
              <div className="mb-8">
                <div className="flex items-start gap-3 mb-4">
                  <MapPin className="mt-1 h-5 w-5 flex-none text-masonic-navy" />
                  <div>
                    <p className="font-semibold text-gray-900">Address</p>
                    <p className="text-gray-600">{location.street_address}</p>
                    <p className="text-gray-600">{location.suburb} {location.state} {location.postal_code}</p>
                    <p className="text-gray-600">{location.country || 'Australia'}</p>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <ul role="list" className="mt-8 space-y-8 text-gray-600">
                {location.phone && (
                  <li className="flex gap-x-3">
                    <Phone aria-hidden="true" className="mt-1 h-5 w-5 flex-none text-masonic-navy" />
                    <span>
                      <strong className="font-semibold text-gray-900">Phone:</strong>{' '}
                      <a href={`tel:${location.phone}`} className="text-masonic-navy hover:underline">
                        {location.phone}
                      </a>
                    </span>
                  </li>
                )}
                
                {location.email && (
                  <li className="flex gap-x-3">
                    <Mail aria-hidden="true" className="mt-1 h-5 w-5 flex-none text-masonic-navy" />
                    <span>
                      <strong className="font-semibold text-gray-900">Email:</strong>{' '}
                      <a href={`mailto:${location.email}`} className="text-masonic-navy hover:underline">
                        {location.email}
                      </a>
                    </span>
                  </li>
                )}
                
                {location.website && (
                  <li className="flex gap-x-3">
                    <Globe aria-hidden="true" className="mt-1 h-5 w-5 flex-none text-masonic-navy" />
                    <span>
                      <strong className="font-semibold text-gray-900">Website:</strong>{' '}
                      <a 
                        href={location.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-masonic-navy hover:underline"
                      >
                        Visit Website
                      </a>
                    </span>
                  </li>
                )}
              </ul>

              {/* Google Maps Embed */}
              <div className="mt-8">
                <iframe
                  width="100%"
                  height="250"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  src={embedMapUrl}
                  className="rounded-lg shadow-sm"
                ></iframe>
                <div className="mt-4 text-center">
                  <a
                    href={mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-md bg-masonic-navy px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-masonic-navy/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-masonic-navy"
                  >
                    <MapPin className="h-4 w-4" />
                    View on Google Maps
                  </a>
                </div>
              </div>

              {/* Additional Information */}
              {(location.parking_info || location.public_transport_info || location.accessibility_info) && (
                <>
                  <h2 className="mt-16 text-2xl font-bold tracking-tight text-gray-900">Additional Information</h2>
                  
                  {location.parking_info && (
                    <div className="mt-6">
                      <div className="flex gap-x-3">
                        <Car aria-hidden="true" className="mt-1 h-5 w-5 flex-none text-masonic-navy" />
                        <div>
                          <strong className="font-semibold text-gray-900">Parking:</strong>
                          <p className="mt-2">{location.parking_info}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {location.public_transport_info && (
                    <div className="mt-6">
                      <div className="flex gap-x-3">
                        <Clock aria-hidden="true" className="mt-1 h-5 w-5 flex-none text-masonic-navy" />
                        <div>
                          <strong className="font-semibold text-gray-900">Public Transport:</strong>
                          <p className="mt-2">{location.public_transport_info}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {location.accessibility_info && (
                    <div className="mt-6">
                      <div className="flex gap-x-3">
                        <div className="mt-1 h-5 w-5 flex-none">
                          <svg className="h-5 w-5 text-masonic-navy" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m0 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h3.75" />
                          </svg>
                        </div>
                        <div>
                          <strong className="font-semibold text-gray-900">Accessibility:</strong>
                          <p className="mt-2">{location.accessibility_info}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}