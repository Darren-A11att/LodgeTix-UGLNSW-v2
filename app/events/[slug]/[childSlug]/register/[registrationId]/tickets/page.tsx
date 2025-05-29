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
  const childSlug = params.childSlug as string
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
        const event = await getEventByIdOrSlug(childSlug)
        if (event) {
          setEventData(event)
          setEventId(event.id)
        } else {
          // Event not found, redirect to parent event page
          router.push(`/events/${parentSlug}`)
        }
      } catch (error) {
        console.error("Failed to fetch event data:", error)
        router.push(`/events/${parentSlug}`)
      } finally {
        setLoading(false)
      }
    }
    
    fetchEventData()
  }, [childSlug, parentSlug, registrationId, draftId, setDraftId, setEventId, router])
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading event details...</p>
        </div>
      </div>
    )
  }
  
  if (!eventData) {
    return null // Will redirect in useEffect
  }
  
  return (
    <ClientOnly>
      <RegistrationWizard 
        eventId={eventData.id} 
        eventSlug={childSlug}
        parentSlug={parentSlug}
        registrationId={registrationId}
      />
    </ClientOnly>
  )
}