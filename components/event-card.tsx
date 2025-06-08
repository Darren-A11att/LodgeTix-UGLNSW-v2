import Link from "next/link"
import { format } from "date-fns"
import type { EventType } from "@/shared/types"
import { formatCurrency } from "@/lib/formatters"
import { Button } from "@/components/ui/button"

interface EventCardProps {
  id?: string      // UUID
  slug?: string    // URL-friendly identifier
  title?: string
  description?: string
  date?: string
  location?: string
  imageUrl?: string
  price?: string
  parentEventId?: string | null    // Kept for compatibility but not used
  parentEventSlug?: string | null  // Kept for compatibility but not used
  event?: EventType
  functionSlug?: string
}

export function EventCard(props: EventCardProps) {
  // Support both old prop interface and new event object
  const event = props.event
  const id = props.id || event?.event_id || ''
  const slug = props.slug || event?.slug || ''
  const title = props.title || event?.title || 'Untitled Event'
  const description = props.description || event?.description || ''
  const imageUrl = props.imageUrl || event?.image_url || '/placeholder.svg'
  const location = props.location || ''
  const functionSlug = props.functionSlug || event?.functionSlug || ''
  
  // Format date from event object if available
  let date = props.date || ''
  if (!date && (event?.event_start || event?.eventStart)) {
    try {
      const eventDate = new Date(event.event_start || event.eventStart!)
      date = format(eventDate, 'EEEE, d MMMM yyyy')
    } catch (e) {
      date = 'Date TBD'
    }
  }
  
  // Format time if available
  let timeDisplay = ''
  if (event?.event_start || event?.eventStart) {
    try {
      const eventDate = new Date(event.event_start || event.eventStart!)
      timeDisplay = format(eventDate, 'h:mm a')
    } catch (e) {
      // Skip time display if invalid
    }
  }
  
  // Format price
  const priceDisplay = props.price || (event?.minPrice && event.minPrice > 0 
    ? `From ${formatCurrency(event.minPrice)}`
    : 'View pricing')
  
  // Links - Get tickets goes to function registration, View Details goes to event details page
  const registerLink = functionSlug ? `/functions/${functionSlug}/register` : `/functions/${slug}/register`
  const detailsLink = functionSlug ? `/functions/${functionSlug}/events/${slug}` : `/functions/${slug}/events/${slug}`
  
  return (
    <div className="group block border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200">
      <div className="space-y-4">
        {/* Image */}
        <div className="aspect-[4/3] w-full overflow-hidden bg-gray-100">
          <img
            src={imageUrl}
            alt={title}
            className="h-full w-full object-cover object-center group-hover:opacity-95 transition-opacity duration-200"
            style={{
              clipPath: 'inset(0 0 0 0)',
              maskImage: 'none'
            }}
          />
        </div>
        
        {/* Content */}
        <div className="px-4 pb-4">
          <h3 className="text-lg font-medium text-masonic-navy">
            {title}
          </h3>
          <p className="mt-1 text-sm italic text-gray-500">
            {date}
            {timeDisplay && ` • ${timeDisplay}`}
            {location && ` • ${location}`}
          </p>
          <p className="mt-2 text-base font-medium text-masonic-navy">
            {priceDisplay}
          </p>
          {description && (
            <p className="mt-2 text-sm text-gray-600 line-clamp-2">
              {description}
            </p>
          )}
          
          {/* Buttons */}
          <div className="mt-4 flex gap-2">
            <Button 
              asChild 
              variant="outline" 
              size="sm"
              className="flex-1 border-masonic-navy text-masonic-navy hover:bg-masonic-navy hover:text-white"
            >
              <Link href={detailsLink}>
                View Details
              </Link>
            </Button>
            <Button 
              asChild 
              size="sm"
              className="flex-1 bg-masonic-navy hover:bg-masonic-blue text-white"
            >
              <Link href={registerLink}>
                Get Tickets
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}