"use client"

import { useEffect } from "react"
import { RegistrationWizard } from "@/components/register/RegistrationWizard/registration-wizard"
import { useRegistrationStore } from "@/lib/registrationStore"
import { Ticket } from "@/lib/services/event-service"

interface TicketSelectionWithOrderProps {
  tickets: Ticket[]
  eventId: string
  eventSlug: string
}

export function TicketSelectionWithOrder({ tickets, eventId, eventSlug }: TicketSelectionWithOrderProps) {
  const startNewRegistration = useRegistrationStore((s) => s.startNewRegistration)
  const setEventId = useRegistrationStore((s) => s.setEventId)
  
  // Initialize registration flow when component mounts
  useEffect(() => {
    // Clear any existing registration and start a new one
    startNewRegistration('individual')
    
    // Set the event ID for this registration - this will be used by the ticket selection step
    if (eventId) {
      console.log(`Setting event ID in store from TicketSelectionWithOrder: ${eventId}`)
      setEventId(eventId)
    } else {
      console.log('No event ID provided, using default parent event ID')
      // The RegistrationWizard will use the default parent event ID if none is provided
    }
  }, [eventId, startNewRegistration, setEventId])

  return (
    <div className="w-full">
      <RegistrationWizard eventId={eventId} />
    </div>
  )
}