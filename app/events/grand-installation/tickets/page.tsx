"use client"

import { Textarea } from "@/components/ui/textarea"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, CreditCard, TicketIcon, Info } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function TicketsPage() {
  const router = useRouter()
  const [selectedTickets, setSelectedTickets] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(false)

  const tickets = [
    {
      id: "installation",
      name: "Installation Ceremony",
      price: 75,
      available: true,
      description: "Admission to the Grand Installation Ceremony at Sydney Masonic Centre",
    },
    {
      id: "banquet",
      name: "Grand Banquet",
      price: 150,
      available: true,
      description: "Formal dinner with wine at Hilton Sydney (Black Tie)",
    },
    {
      id: "brunch",
      name: "Farewell Brunch",
      price: 45,
      available: true,
      description: "Sunday morning brunch at Sydney Masonic Centre",
    },
    {
      id: "package",
      name: "Complete Package",
      price: 250,
      available: true,
      description: "Includes all events (save $20)",
    },
  ]

  const handleTicketChange = (ticketId: string, quantity: number) => {
    // If selecting the package, clear other selections
    if (ticketId === "package" && quantity > 0) {
      setSelectedTickets({ package: quantity })
      return
    }

    // If other tickets are selected, clear the package
    if (ticketId !== "package" && selectedTickets.package) {
      const newSelections = { ...selectedTickets }
      delete newSelections.package
      newSelections[ticketId] = quantity
      setSelectedTickets(newSelections)
      return
    }

    setSelectedTickets((prev) => ({
      ...prev,
      [ticketId]: quantity,
    }))
  }

  const totalTickets = Object.values(selectedTickets).reduce((sum, qty) => sum + qty, 0)

  const totalPrice = Object.entries(selectedTickets).reduce((sum, [ticketId, quantity]) => {
    const ticket = tickets.find((t) => t.id === ticketId)
    return sum + (ticket?.price || 0) * quantity
  }, 0)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate payment processing
    setTimeout(() => {
      setIsLoading(false)
      router.push("/events/grand-installation/confirmation")
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-white px-4 md:px-6">
        <Link href="/events/grand-installation" className="flex items-center">
          <ArrowLeft className="mr-2 h-5 w-5" />
          <span>Back to Event</span>
        </Link>
        <div className="flex items-center">
          <TicketIcon className="mr-2 h-5 w-5 text-masonic-navy" />
          <span className="font-bold">LodgeTix</span>
        </div>
      </header>

      <main className="container mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Grand Installation - Tickets</h1>
          <p className="text-gray-500">Saturday, 25 November 2023 • Sydney Masonic Centre</p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          <div className="md:col-span-2">
            <Card className="mb-6 border-masonic-navy">
              <CardHeader className="bg-masonic-navy text-white">
                <CardTitle>Select Tickets</CardTitle>
                <CardDescription className="text-gray-200">Choose the events you wish to attend</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                {tickets.map((ticket) => (
                  <div key={ticket.id} className="rounded-lg border border-masonic-lightgold p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{ticket.name}</h3>
                        <p className="text-sm text-gray-500">{ticket.description}</p>
                      </div>
                      <span className="font-bold text-masonic-navy">${ticket.price}</span>
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
                            className="border-masonic-navy text-masonic-navy"
                          >
                            -
                          </Button>
                          <span className="mx-3 min-w-[20px] text-center">{selectedTickets[ticket.id] || 0}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleTicketChange(ticket.id, (selectedTickets[ticket.id] || 0) + 1)}
                            className="border-masonic-navy text-masonic-navy"
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
              <form onSubmit={handleSubmit}>
                <Card className="mb-6 border-masonic-navy">
                  <CardHeader className="bg-masonic-navy text-white">
                    <CardTitle>Attendee Information</CardTitle>
                    <CardDescription className="text-gray-200">Please provide your Masonic details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input id="firstName" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input id="lastName" required />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" required />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input id="phone" type="tel" required />
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label htmlFor="lodge">Lodge Name and Number</Label>
                      <Input id="lodge" placeholder="e.g. Lodge Commonwealth No. 400" required />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="rank">Masonic Rank</Label>
                      <Select defaultValue="mm">
                        <SelectTrigger>
                          <SelectValue placeholder="Select your rank" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mm">Master Mason</SelectItem>
                          <SelectItem value="wm">Worshipful Master</SelectItem>
                          <SelectItem value="pwm">Past Master</SelectItem>
                          <SelectItem value="go">Grand Officer</SelectItem>
                          <SelectItem value="pgo">Past Grand Officer</SelectItem>
                          <SelectItem value="dgm">Deputy Grand Master</SelectItem>
                          <SelectItem value="pgm">Past Grand Master</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="jurisdiction">Grand Lodge Jurisdiction</Label>
                      <Select defaultValue="nsw">
                        <SelectTrigger>
                          <SelectValue placeholder="Select your jurisdiction" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="nsw">United Grand Lodge of NSW & ACT</SelectItem>
                          <SelectItem value="vic">United Grand Lodge of Victoria</SelectItem>
                          <SelectItem value="qld">United Grand Lodge of Queensland</SelectItem>
                          <SelectItem value="sa">Grand Lodge of South Australia and Northern Territory</SelectItem>
                          <SelectItem value="wa">Grand Lodge of Western Australia</SelectItem>
                          <SelectItem value="tas">Grand Lodge of Tasmania</SelectItem>
                          <SelectItem value="nz">Grand Lodge of New Zealand</SelectItem>
                          <SelectItem value="eng">United Grand Lodge of England</SelectItem>
                          <SelectItem value="sco">Grand Lodge of Scotland</SelectItem>
                          <SelectItem value="ire">Grand Lodge of Ireland</SelectItem>
                          <SelectItem value="other">Other (please specify)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Dietary Requirements</Label>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox id="none" />
                          <label htmlFor="none" className="text-sm">
                            None
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="vegetarian" />
                          <label htmlFor="vegetarian" className="text-sm">
                            Vegetarian
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="vegan" />
                          <label htmlFor="vegan" className="text-sm">
                            Vegan
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="gluten-free" />
                          <label htmlFor="gluten-free" className="text-sm">
                            Gluten Free
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="other-dietary" />
                          <label htmlFor="other-dietary" className="text-sm">
                            Other (please specify)
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">Additional Notes</Label>
                      <Textarea id="notes" placeholder="Any special requirements or information" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-masonic-navy">
                  <CardHeader className="bg-masonic-navy text-white">
                    <CardTitle>Payment Information</CardTitle>
                    <CardDescription className="text-gray-200">Enter your payment details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-6">
                    <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
                      <div className="flex">
                        <Info className="mr-2 h-5 w-5 flex-shrink-0" />
                        <p>Your card will be charged ${totalPrice.toFixed(2)} for the selected tickets.</p>
                      </div>
                    </div>

                    <RadioGroup defaultValue="card" className="space-y-3">
                      <div className="flex items-center space-x-2 rounded-lg border p-3">
                        <RadioGroupItem value="card" id="card" />
                        <Label htmlFor="card" className="flex-1">
                          Credit/Debit Card
                        </Label>
                        <div className="flex space-x-1">
                          <div className="h-6 w-10 rounded bg-gray-200"></div>
                          <div className="h-6 w-10 rounded bg-gray-200"></div>
                          <div className="h-6 w-10 rounded bg-gray-200"></div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 rounded-lg border p-3">
                        <RadioGroupItem value="paypal" id="paypal" />
                        <Label htmlFor="paypal" className="flex-1">
                          PayPal
                        </Label>
                        <div className="h-6 w-16 rounded bg-gray-200"></div>
                      </div>
                    </RadioGroup>

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

                    <div className="flex items-center space-x-2">
                      <Checkbox id="terms" required />
                      <label
                        htmlFor="terms"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        I agree to the{" "}
                        <Link href="/terms" className="text-blue-800 hover:underline">
                          terms of service
                        </Link>{" "}
                        and{" "}
                        <Link href="/privacy" className="text-blue-800 hover:underline">
                          privacy policy
                        </Link>
                      </label>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      type="submit"
                      className="w-full bg-masonic-gold text-masonic-navy hover:bg-masonic-lightgold"
                      disabled={isLoading}
                    >
                      {isLoading ? "Processing..." : `Pay $${totalPrice.toFixed(2)}`}
                    </Button>
                  </CardFooter>
                </Card>
              </form>
            )}
          </div>

          <div>
            <Card className="sticky top-20 border-masonic-navy">
              <CardHeader className="bg-masonic-navy text-white">
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
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

              {totalTickets > 0 && (
                <CardFooter>
                  <div className="rounded-lg bg-masonic-lightblue p-3 text-xs text-masonic-navy w-full">
                    <p className="font-medium">Important Information:</p>
                    <ul className="list-disc pl-4 mt-1 space-y-1">
                      <li>Tickets are non-refundable but transferable</li>
                      <li>Photo ID and proof of Masonic membership required</li>
                      <li>E-tickets will be emailed after purchase</li>
                    </ul>
                  </div>
                </CardFooter>
              )}
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
