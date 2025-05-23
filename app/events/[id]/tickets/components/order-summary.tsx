"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { getEventByIdOrSlug } from "@/lib/event-facade"
import type { Ticket } from "@/lib/event-utils"

export function OrderSummary() {
  const pathname = usePathname()
  const [selectedTickets, setSelectedTickets] = useState<Record<string, number>>({})
  const [tickets, setTickets] = useState<Ticket[]>([])
  
  // Extract event ID/slug from pathname
  const eventId = pathname.split('/')[2]
  
  useEffect(() => {
    if (!eventId) return
    
    const fetchEvent = async () => {
      const event = await getEventByIdOrSlug(eventId)
      if (event?.tickets) {
        setTickets(event.tickets)
      }
      
      // Poll session storage for selected tickets
      const checkStorage = () => {
        const stored = window.sessionStorage.getItem(`tickets-${event?.slug}`)
        if (stored) {
          setSelectedTickets(JSON.parse(stored))
        }
      }
      
      checkStorage()
      const interval = setInterval(checkStorage, 100)
      
      return () => clearInterval(interval)
    }
    
    fetchEvent()
  }, [eventId])

  const totalTickets = Object.values(selectedTickets).reduce((sum, qty) => sum + qty, 0)
  
  const totalPrice = tickets.reduce((sum, ticket) => {
    const quantity = selectedTickets[ticket.id] || 0
    return sum + ticket.price * quantity
  }, 0)

  return (
    <Card className="sticky top-20">
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(selectedTickets).map(([ticketId, quantity]) => {
          if (quantity === 0) return null
          const ticket = tickets.find((t) => t.id === ticketId)
          if (!ticket) return null

          return (
            <div key={ticketId} className="flex items-center justify-between">
              <div>
                <p className="font-medium">{ticket.name}</p>
                <p className="text-sm text-gray-500">x{quantity}</p>
              </div>
              <p className="font-medium">${(ticket.price * quantity).toFixed(2)}</p>
            </div>
          )
        })}

        {totalTickets > 0 && (
          <>
            <Separator />
            <div className="flex items-center justify-between font-bold">
              <p>Total</p>
              <p>${totalPrice.toFixed(2)}</p>
            </div>
          </>
        )}

        {totalTickets === 0 && <p className="text-center text-gray-500">No tickets selected</p>}
      </CardContent>
    </Card>
  )
}