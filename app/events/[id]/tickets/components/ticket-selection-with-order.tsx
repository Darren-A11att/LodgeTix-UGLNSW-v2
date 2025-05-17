"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { CreditCard } from "lucide-react"
import { Ticket } from "@/lib/services/event-service"

interface TicketSelectionWithOrderProps {
  tickets: Ticket[]
  eventId: string
  eventSlug: string
}

export function TicketSelectionWithOrder({ tickets, eventId, eventSlug }: TicketSelectionWithOrderProps) {
  const router = useRouter()
  const [selectedTickets, setSelectedTickets] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(false)

  const handleTicketChange = (ticketId: string, quantity: number) => {
    setSelectedTickets((prev) => ({
      ...prev,
      [ticketId]: quantity,
    }))
  }

  const totalTickets = Object.values(selectedTickets).reduce((sum, qty) => sum + qty, 0)
  
  const totalPrice = tickets.reduce((sum, ticket) => {
    const quantity = selectedTickets[ticket.id] || 0
    return sum + ticket.price * quantity
  }, 0)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate payment processing
    setTimeout(() => {
      setIsLoading(false)
      router.push(`/events/${eventSlug}/confirmation`)
    }, 1500)
  }

  return (
    <div className="grid gap-8 md:grid-cols-3">
      <div className="md:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Select Tickets</CardTitle>
            <CardDescription>Choose the number of tickets you need</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
          </CardContent>
        </Card>

        {totalTickets > 0 && (
          <form onSubmit={handleSubmit} className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Information</CardTitle>
                <CardDescription>Enter your payment details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cardName">Name on Card</Label>
                  <Input id="cardName" placeholder="John Doe" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                    <Input id="cardNumber" placeholder="1234 5678 9012 3456" className="pl-10" required />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiry">Expiry Date</Label>
                    <Input id="expiry" placeholder="MM/YY" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cvc">CVC</Label>
                    <Input id="cvc" placeholder="123" required />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="your@email.com" required />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Processing..." : `Pay $${totalPrice.toFixed(2)}`}
                </Button>
              </CardFooter>
            </Card>
          </form>
        )}
      </div>

      <div>
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
      </div>
    </div>
  )
}