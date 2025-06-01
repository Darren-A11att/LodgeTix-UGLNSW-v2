import Link from "next/link"
import Image from "next/image"
import { CalendarDays, MapPin } from "lucide-react"
import { format } from "date-fns"

import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { EventType } from "@/shared/types"

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
  const id = props.id || event?.id || event?.event_id || ''
  const slug = props.slug || event?.slug || ''
  const title = props.title || event?.title || 'Untitled Event'
  const description = props.description || event?.description || ''
  const imageUrl = props.imageUrl || event?.imageUrl || '/placeholder.svg'
  const location = props.location || event?.location || ''
  
  // Format date from event object if available
  let date = props.date || ''
  if (!date && event?.eventStart) {
    try {
      date = format(new Date(event.eventStart), 'EEEE, d MMMM yyyy')
    } catch (e) {
      date = event.eventStart
    }
  }
  
  // Format price
  const price = props.price || event?.price || 'Price TBD'
  
  // Determine the correct link structure
  let detailsLink: string
  let registerLink: string
  
  if (props.functionSlug) {
    // Event is part of a function - use function-based routing
    detailsLink = `/functions/${props.functionSlug}/events/${slug}`
    registerLink = `/functions/${props.functionSlug}/register`
  } else {
    // Standalone event - use event-based routing
    detailsLink = `/events/${slug}`
    registerLink = `/events/${slug}/register`
  }
  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <div className="relative h-48 w-full">
        <Image src={imageUrl || "/placeholder.svg"} alt={title} fill className="object-cover" />
      </div>
      <CardContent className="p-4">
        <h3 className="mb-2 text-xl font-bold">{title}</h3>
        <p className="mb-4 text-sm text-gray-600 line-clamp-2">{description}</p>
        <div className="space-y-2">
          <div className="flex items-center text-sm text-gray-500">
            <CalendarDays className="mr-2 h-4 w-4" />
            <span>{date}</span>
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <MapPin className="mr-2 h-4 w-4" />
            <span>{location}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between border-t p-4">
        <span className="font-bold">{price}</span>
        <div className="flex gap-2">
          <Button asChild size="sm" variant="outline" className="border-masonic-navy text-masonic-navy">
            <Link href={detailsLink}>
              View Details
            </Link>
          </Button>
          <Button asChild size="sm" className="bg-masonic-navy hover:bg-masonic-blue">
            <Link href={registerLink}>
              Get Tickets
            </Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}