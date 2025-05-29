"use client"

import React from 'react'
import { RegistrationWizard } from "@/components/register/RegistrationWizard/registration-wizard"
import { getEventByIdOrSlug } from "@/lib/event-facade"
import { useRegistrationStore } from '@/lib/registrationStore'
import ClientOnly from '@/components/register/RegistrationWizard/utils/ClientOnly'
import { useParams, useRouter } from 'next/navigation'

export default function TicketsPage() {
  const params = useParams()
  const router = useRouter()
  const parentSlug = params.slug as string
  const registrationId = params.registrationId as string
  
  const setEventId = useRegistrationStore((state) => state.setEventId)
  const draftId = useRegistrationStore((state) => state.draftId)
  const setDraftId = useRegistrationStore((state) => state.loadDraft)
  
  const [eventData, setEventData] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)
  
  React.useEffect(() => {
    // Set the registration ID in the store if not already set
    if (registrationId && draftId !== registrationId) {
      setDraftId(registrationId)
    }
    
    // Fetch event data
    async function fetchEventData() {
      try {
        setLoading(true)
        const event = await getEventByIdOrSlug(parentSlug)
        if (event) {
          setEventData(event)
          setEventId(event.id)
        } else {
          // Event not found, redirect to events page
          router.push('/events')
        }
      } catch (error) {
        console.error("Failed to fetch event data:", error)
        router.push('/events')
      } finally {
        setLoading(false)
      }
    }
    
    fetchEventData()
  }, [parentSlug, registrationId, draftId, setDraftId, setEventId, router])
  
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4">Loading event details...</div>
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-masonic-gold border-t-transparent"></div>
        </div>
      </div>
    )
  }
  
  if (!eventData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="mb-4 text-2xl font-bold">Event not found</h2>
          <p>The event you're looking for doesn't exist.</p>
        </div>
      </div>
    )
  }
  
  return (
    <ClientOnly>
      <RegistrationWizard 
        eventId={eventData.id}
        eventSlug={parentSlug}
        registrationId={registrationId}
      />
    </ClientOnly>
  )
}