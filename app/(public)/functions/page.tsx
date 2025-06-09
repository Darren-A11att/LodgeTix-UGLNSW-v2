import Link from "next/link"
import { EventCard } from "@/components/event-card"
import { EventsPageHeader } from "@/components/events-page-header"
import { createServerFunctionService } from "@/lib/services/function-service-server"
import { FEATURED_FUNCTION_ID, getFeaturedFunctionInfo } from "@/lib/utils/function-slug-resolver"

// Mark as dynamic since it uses server-side authentication
export const dynamic = 'force-dynamic'

export default async function FunctionsPage() {
  // Initialize function service with server-side client
  const functionService = await createServerFunctionService()
  
  try {
    // Check if featured function ID is configured
    if (!FEATURED_FUNCTION_ID) {
      console.warn('No featured function ID configured in environment variables')
      throw new Error('No featured function configured')
    }
    
    // Get featured function info
    const featuredFunction = await getFeaturedFunctionInfo(true)
    
    // Fetch the featured function details
    const functionData = await functionService.getFunctionById(FEATURED_FUNCTION_ID)
    
    if (!functionData) {
      console.error('Featured function not found in database:', FEATURED_FUNCTION_ID)
      throw new Error('Featured function not found')
    }
    
    // Get events for the featured function
    const events = await functionService.getEventsForFunction(FEATURED_FUNCTION_ID)
    
    return (
      <div className="min-h-screen bg-white relative">
        {/* New Events Page Header */}
        <EventsPageHeader functionData={functionData} />
        
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Events Grid */}
          <div className="py-16">
            <h2 className="text-2xl font-bold text-masonic-navy mb-8">Select Your Events</h2>
            {events.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-500 text-lg">No events are currently scheduled for this function.</p>
                <p className="text-gray-500 mt-2">Please check back later for updates.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:gap-x-8">
                {events.map((event) => (
                  <EventCard 
                    key={event.event_id} 
                    event={event}
                    functionSlug={featuredFunction.slug}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Failed to load events:', error)
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error')
    
    // Error fallback
    return (
      <div className="min-h-screen bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="pt-12 pb-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold mb-2 text-masonic-navy">Upcoming Functions</h1>
              <div className="masonic-divider mx-auto w-24 h-1 bg-masonic-gold my-4"></div>
              <p className="text-gray-600 text-lg">
                Explore our upcoming Masonic functions and register for the events that interest you
              </p>
            </div>
          </div>
          
          <div className="text-center py-16">
            <p className="text-red-600 text-lg">Unable to load functions at this time.</p>
            <p className="text-gray-500 mt-2">Please try again later or contact support.</p>
            <Link 
              href="/" 
              className="mt-4 inline-block px-6 py-2 bg-masonic-navy text-white rounded hover:bg-masonic-blue transition-colors"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    )
  }
}