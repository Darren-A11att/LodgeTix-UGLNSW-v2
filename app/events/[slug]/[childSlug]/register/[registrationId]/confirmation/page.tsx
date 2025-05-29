import { notFound } from "next/navigation"
import { getEventByIdOrSlug } from "@/lib/event-facade"
import ConfirmationPageClient from './client-page'


export default async function ConfirmationPage({ 
  params,
  searchParams 
}: { 
  params: Promise<{ slug: string; childSlug: string; registrationId: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { slug: parentSlug, childSlug, registrationId } = await params
  const search = await searchParams
  
  // Fetch event from facade using child slug
  const event = await getEventByIdOrSlug(childSlug)
  
  if (!event) {
    notFound()
  }
  
  // Use registration ID from URL params
  const regId = registrationId || (typeof search.registration_id === 'string' ? search.registration_id : undefined)

  return <ConfirmationPageClient 
    eventData={event} 
    initialRegistrationId={regId}
    parentSlug={parentSlug}
    childSlug={childSlug}
  />
}