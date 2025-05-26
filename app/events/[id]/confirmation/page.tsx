import { notFound } from "next/navigation"
import { getEventById } from "@/lib/event-facade"
import ConfirmationPageClient from './client-page'


export default async function ConfirmationPage({ 
  params,
  searchParams 
}: { 
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { id } = await params
  const search = await searchParams
  
  // Fetch event from facade
  const event = await getEventById(id)
  
  if (!event) {
    notFound()
  }
  
  // Get registration ID from search params if available
  const registrationId = typeof search.registration_id === 'string' ? search.registration_id : undefined

  return <ConfirmationPageClient eventData={event} initialRegistrationId={registrationId} />
}
