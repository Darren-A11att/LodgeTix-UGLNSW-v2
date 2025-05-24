"use client"

import { useEffect } from "react"
import { RegistrationWizard } from "@/components/register/RegistrationWizard/registration-wizard"
import { useRegistrationStore } from "@/lib/registrationStore"
import { Ticket } from "@/lib/services/event-service"

interface TicketSelectionWithOrderProps {
  tickets: Ticket[]
  eventId: string // This should be the UUID
  eventSlug: string
}

export function TicketSelectionWithOrder({ tickets, eventId, eventSlug }: TicketSelectionWithOrderProps) {
  const startNewRegistration = useRegistrationStore((s) => s.startNewRegistration)
  const setEventId = useRegistrationStore((s) => s.setEventId)
  
  // Initialize registration flow when component mounts
  useEffect(() => {
    // Clear any existing registration and start a new one
    startNewRegistration('individual')
    
    // Set the event ID for this registration - this should be a UUID
    if (eventId) {
      // Validate that eventId looks like a UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (uuidRegex.test(eventId)) {
        console.log(`Setting event UUID in store: ${eventId}`)
        setEventId(eventId)
      } else {
        console.error(`Invalid event ID format - expected UUID, got: ${eventId}`)
        console.warn('This may cause registration to fail. Event ID should be a UUID, not a slug.')
      }
    } else {
      console.log('No event ID provided')
    }
  }, [eventId, startNewRegistration, setEventId])

  return (
    <div className="w-full">
      <RegistrationWizard eventId={eventId} />
    </div>
  )
}