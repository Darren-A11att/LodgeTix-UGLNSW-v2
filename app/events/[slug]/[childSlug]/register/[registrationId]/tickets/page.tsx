import { getEventByIdOrSlug } from "@/lib/event-facade"
import { redirect } from 'next/navigation'
import { ChildTicketsPageClient } from "./client-page"

interface TicketsPageProps {
  params: {
    slug: string
    childSlug: string
    registrationId: string
  }
}

export default async function TicketsPage({ params }: TicketsPageProps) {
  const { slug: parentSlug, childSlug, registrationId } = await params
  
  // Fetch event data on the server
  const eventData = await getEventByIdOrSlug(childSlug)
  
  if (!eventData) {
    redirect(`/events/${parentSlug}`)
  }
  
  return (
    <ChildTicketsPageClient 
      eventId={eventData.id}
      eventSlug={childSlug}
      parentSlug={parentSlug}
      registrationId={registrationId}
    />
  )
}