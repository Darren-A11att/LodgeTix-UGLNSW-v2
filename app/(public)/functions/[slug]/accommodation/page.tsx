import { notFound } from "next/navigation"
import { Bed, MapPin, Phone, Globe, Star } from "lucide-react"
import { resolveFunctionSlug } from "@/lib/utils/function-slug-resolver"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export const dynamic = 'force-dynamic'

// Mock accommodation data - in production this would come from database
const accommodationOptions = [
  {
    id: 1,
    name: "Grand Hotel Sydney",
    type: "Hotel",
    rating: 4.5,
    distance: "0.5 km from venue",
    address: "123 Main Street, Sydney NSW 2000",
    phone: "+61 2 1234 5678",
    website: "https://grandhotelsydney.com.au",
    description: "Luxury accommodation with special rates for event attendees.",
    features: ["Free WiFi", "Breakfast included", "24-hour reception", "Parking available"],
    specialRate: "$180 per night"
  },
  {
    id: 2,
    name: "City Lodge Apartments",
    type: "Serviced Apartments",
    rating: 4.0,
    distance: "1.2 km from venue",
    address: "456 Park Avenue, Sydney NSW 2000",
    phone: "+61 2 8765 4321",
    website: "https://citylodgeapts.com.au",
    description: "Modern apartments suitable for families and extended stays.",
    features: ["Kitchen facilities", "Laundry", "Free WiFi", "Family friendly"],
    specialRate: "$160 per night"
  },
  {
    id: 3,
    name: "Budget Inn Sydney",
    type: "Budget Hotel",
    rating: 3.5,
    distance: "2.0 km from venue",
    address: "789 Queen Street, Sydney NSW 2001",
    phone: "+61 2 5555 1234",
    website: "https://budgetinnsydney.com.au",
    description: "Affordable accommodation with easy access to public transport.",
    features: ["Free WiFi", "24-hour reception", "Public transport nearby"],
    specialRate: "$95 per night"
  }
]

export default async function AccommodationPage({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  
  // Resolve slug to function ID (for consistency, though not used in this mock)
  const functionId = await resolveFunctionSlug(slug, true)
  
  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold mb-8">Accommodation</h1>
      
      <div className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Recommended Accommodation</CardTitle>
            <CardDescription>
              We have arranged special rates at the following hotels for event attendees. 
              Please mention the event when booking to receive the discounted rate.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
      
      <div className="grid gap-6">
        {accommodationOptions.map((hotel) => (
          <Card key={hotel.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {hotel.name}
                    <span className="text-sm font-normal text-gray-500">({hotel.type})</span>
                  </CardTitle>
                  <CardDescription className="flex items-center gap-4 mt-2">
                    <span className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      {hotel.rating}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {hotel.distance}
                    </span>
                  </CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-600">{hotel.specialRate}</p>
                  <p className="text-sm text-gray-500">Special event rate</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">{hotel.description}</p>
              
              <div className="flex flex-wrap gap-2">
                {hotel.features.map((feature, index) => (
                  <span 
                    key={index} 
                    className="px-3 py-1 bg-gray-100 text-sm rounded-full"
                  >
                    {feature}
                  </span>
                ))}
              </div>
              
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4" />
                  {hotel.address}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="h-4 w-4" />
                  <a href={`tel:${hotel.phone}`} className="hover:underline">
                    {hotel.phone}
                  </a>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Globe className="h-4 w-4" />
                  <a 
                    href={hotel.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    Visit website
                  </a>
                </div>
              </div>
              
              <div className="pt-4">
                <Button variant="outline" className="w-full sm:w-auto">
                  Contact Hotel
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Alternative Accommodation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            If the recommended hotels are fully booked, there are many other accommodation 
            options available in the area. We suggest checking:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-600">
            <li>Booking.com for a wide range of hotels and apartments</li>
            <li>Airbnb for short-term rentals</li>
            <li>Local bed & breakfast establishments</li>
            <li>Nearby suburbs with easy transport links to the venue</li>
          </ul>
          <p className="text-gray-600">
            For assistance with accommodation bookings, please contact the event organisers.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}