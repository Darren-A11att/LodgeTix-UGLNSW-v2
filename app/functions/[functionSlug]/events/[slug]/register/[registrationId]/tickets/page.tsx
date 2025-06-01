import { getEventByIdOrSlug } from "@/lib/event-facade"
import { redirect } from 'next/navigation'
import { TicketsPageClient } from "./client-page"

interface TicketsPageProps {
  params: Promise<{
    slug: string
    registrationId: string
  }>
}

export default async function TicketsPage({ params }: TicketsPageProps) {
  const { slug: parentSlug, registrationId } = await params
  
  // Fetch event data on the server
  const eventData = await getEventByIdOrSlug(parentSlug)
  
  if (!eventData) {
    redirect('/events')
  }
  
  return (
    <TicketsPageClient 
      eventId={eventData.id}
      eventSlug={parentSlug}
      registrationId={registrationId}
    />
  )
}