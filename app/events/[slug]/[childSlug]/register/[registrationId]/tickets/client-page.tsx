"use client"

import React from 'react'
import { RegistrationWizard } from "@/components/register/RegistrationWizard/registration-wizard"
import { useRegistrationStore } from '@/lib/registrationStore'
import ClientOnly from '@/components/register/RegistrationWizard/utils/ClientOnly'

interface ChildTicketsPageClientProps {
  eventId: string
  eventSlug: string
  parentSlug: string
  registrationId: string
}

export function ChildTicketsPageClient({ eventId, eventSlug, parentSlug, registrationId }: ChildTicketsPageClientProps) {
  const setEventId = useRegistrationStore((state) => state.setEventId)
  const draftId = useRegistrationStore((state) => state.draftId)
  const setDraftId = useRegistrationStore((state) => state.loadDraft)
  
  React.useEffect(() => {
    // Set the registration ID in the store if not already set
    if (registrationId && draftId !== registrationId) {
      setDraftId(registrationId)
    }
    
    // Set the event ID in the store
    setEventId(eventId)
  }, [registrationId, draftId, setDraftId, setEventId, eventId])
  
  return (
    <ClientOnly>
      <RegistrationWizard 
        eventId={eventId} 
        eventSlug={eventSlug}
        parentSlug={parentSlug}
        registrationId={registrationId}
      />
    </ClientOnly>
  )
}