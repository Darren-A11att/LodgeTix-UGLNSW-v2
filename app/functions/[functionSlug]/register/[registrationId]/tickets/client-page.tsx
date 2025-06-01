"use client"

import React from 'react'
import { RegistrationWizard } from "@/components/register/RegistrationWizard/registration-wizard"
import { useRegistrationStore } from '@/lib/registrationStore'
import ClientOnly from '@/components/register/RegistrationWizard/utils/ClientOnly'

interface TicketsPageClientProps {
  functionId: string
  functionSlug: string
  registrationId: string
}

export function TicketsPageClient({ functionId, functionSlug, registrationId }: TicketsPageClientProps) {
  const setFunctionId = useRegistrationStore((state) => state.setFunctionId)
  const draftId = useRegistrationStore((state) => state.draftId)
  const setDraftId = useRegistrationStore((state) => state.loadDraft)
  
  React.useEffect(() => {
    // Set the registration ID in the store if not already set
    if (registrationId && draftId !== registrationId) {
      setDraftId(registrationId)
    }
    
    // Set the function ID in the store
    setFunctionId(functionId)
  }, [registrationId, draftId, setDraftId, setFunctionId, functionId])
  
  return (
    <ClientOnly>
      <RegistrationWizard 
        functionSlug={functionSlug}
        registrationId={registrationId}
      />
    </ClientOnly>
  )
}