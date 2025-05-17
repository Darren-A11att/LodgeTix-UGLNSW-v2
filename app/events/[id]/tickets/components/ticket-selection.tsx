"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Ticket } from "@/lib/event-utils"

interface TicketSelectionProps {
  tickets: Ticket[]
  eventId: string
  eventSlug: string
}

export function TicketSelection({ tickets, eventId, eventSlug }: TicketSelectionProps) {
  const [selectedTickets, setSelectedTickets] = useState<Record<string, number>>({})

  const handleTicketChange = (ticketId: string, quantity: number) => {
    setSelectedTickets((prev) => ({
      ...prev,
      [ticketId]: quantity,
    }))
  }

  // Store selected tickets in session storage for other components to access
  if (typeof window !== 'undefined') {
    window.sessionStorage.setItem(`tickets-${eventSlug}`, JSON.stringify(selectedTickets))
  }

  return (
    <div className="space-y-4">
      {tickets.map((ticket) => (
        <div key={ticket.id} className="rounded-lg border p-4">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <h3 className="font-medium">{ticket.name}</h3>
              <p className="text-sm text-gray-500">{ticket.description}</p>
            </div>
            <span className="font-bold">${ticket.price}</span>
          </div>
          <div className="flex items-center justify-between">
            {ticket.available ? (
              <div className="flex items-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handleTicketChange(ticket.id, Math.max(0, (selectedTickets[ticket.id] || 0) - 1))
                  }
                  disabled={!selectedTickets[ticket.id]}
                >
                  -
                </Button>
                <span className="mx-3 min-w-[20px] text-center">{selectedTickets[ticket.id] || 0}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTicketChange(ticket.id, (selectedTickets[ticket.id] || 0) + 1)}
                >
                  +
                </Button>
              </div>
            ) : (
              <span className="text-sm font-medium text-red-500">Sold Out</span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}