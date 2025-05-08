"use client"

import { useState } from "react"
import { useRegistration } from "@/contexts/registration-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Package, Check, User, UserPlus } from "lucide-react"
import type { Attendee, Ticket, MasonAttendee, GuestAttendee, PartnerAttendee } from "@/lib/registration-types"
import { v4 as uuidv4 } from "uuid"

// Sample ticket types
const ticketTypes = [
  {
    id: "installation",
    name: "Installation Ceremony",
    price: 75,
    description: "Admission to the Grand Installation Ceremony",
    category: "ceremony",
  },
  {
    id: "banquet",
    name: "Grand Banquet",
    price: 150,
    description: "Formal dinner with wine at the venue",
    category: "dining",
  },
  {
    id: "brunch",
    name: "Farewell Brunch",
    price: 45,
    description: "Sunday morning brunch",
    category: "dining",
  },
  {
    id: "tour",
    name: "City Tour",
    price: 60,
    description: "Guided tour of local landmarks",
    category: "activity",
  },
]

// Ticket packages
const ticketPackages = [
  {
    id: "complete",
    name: "Complete Package",
    price: 250,
    description: "Includes all events (save $80)",
    includes: ["installation", "banquet", "brunch", "tour"],
  },
  {
    id: "ceremony-banquet",
    name: "Ceremony & Banquet",
    price: 200,
    description: "Installation ceremony and formal dinner (save $25)",
    includes: ["installation", "banquet"],
  },
  {
    id: "social",
    name: "Social Package",
    price: 180,
    description: "All social events without the ceremony (save $75)",
    includes: ["banquet", "brunch", "tour"],
  },
]

export function TicketSelectionStep() {
  const { state, dispatch } = useRegistration()
  const [expandedAttendee, setExpandedAttendee] = useState<string | null>(null)

  // Get all attendees in order
  const allAttendees: Attendee[] = [
    ...(state.primaryAttendee ? [state.primaryAttendee] : []),
    ...state.additionalAttendees,
  ]

  // Filter out partner attendees as they don't need separate tickets
  const eligibleAttendees = allAttendees.filter((attendee) => attendee.type !== "partner")

  const handlePrevious = () => {
    dispatch({ type: "PREV_STEP" })
  }

  const handleContinue = () => {
    if (state.tickets.length > 0) {
      dispatch({ type: "NEXT_STEP" })
    } else {
      alert("Please add at least one ticket to continue")
    }
  }

  const getAttendeeTickets = (attendeeId: string) => {
    return state.tickets.filter((ticket) => ticket.attendeeId === attendeeId)
  }

  const getAttendeeTicketTotal = (attendeeId: string) => {
    return getAttendeeTickets(attendeeId).reduce((sum, ticket) => sum + ticket.price, 0)
  }

  const isTicketSelected = (attendeeId: string, ticketId: string) => {
    return state.tickets.some(
      (ticket) => ticket.attendeeId === attendeeId && ticket.name === ticketTypes.find((t) => t.id === ticketId)?.name,
    )
  }

  const handleToggleTicket = (attendeeId: string, ticketTypeId: string) => {
    const ticketType = ticketTypes.find((t) => t.id === ticketTypeId)
    if (!ticketType) return

    const existingTicket = state.tickets.find(
      (ticket) => ticket.attendeeId === attendeeId && ticket.name === ticketType.name,
    )

    if (existingTicket) {
      dispatch({ type: "REMOVE_TICKET", payload: existingTicket.id })
    } else {
      const newTicket: Ticket = {
        id: uuidv4(),
        name: ticketType.name,
        price: ticketType.price,
        description: ticketType.description,
        attendeeId: attendeeId,
      }
      dispatch({ type: "ADD_TICKET", payload: newTicket })
    }
  }

  const handleSelectPackage = (attendeeId: string, packageId: string) => {
    // First, remove any existing tickets for this attendee
    state.tickets
      .filter((ticket) => ticket.attendeeId === attendeeId)
      .forEach((ticket) => {
        dispatch({ type: "REMOVE_TICKET", payload: ticket.id })
      })

    // Then add the package tickets
    const selectedPackage = ticketPackages.find((p) => p.id === packageId)
    if (!selectedPackage) return

    // Add a special package ticket
    const packageTicket: Ticket = {
      id: uuidv4(),
      name: selectedPackage.name,
      price: selectedPackage.price,
      description: selectedPackage.description,
      attendeeId: attendeeId,
    }

    dispatch({ type: "ADD_TICKET", payload: packageTicket })
  }

  const renderAttendeeHeader = (attendee: Attendee) => {
    if (attendee.type === "mason") {
      const mason = attendee as MasonAttendee
      return (
        <div className="flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-masonic-navy" />
          <span>
            {mason.masonicTitle} {mason.firstName} {mason.lastName}
            <span className="ml-2 text-sm text-gray-500">{mason.grandRank || mason.rank}</span>
          </span>
        </div>
      )
    } else {
      const person = attendee as GuestAttendee | PartnerAttendee
      return (
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-masonic-navy" />
          <span>
            {person.title} {person.firstName} {person.lastName}
            {person.type === "partner" && <span className="ml-2 text-sm text-gray-500">(Partner)</span>}
          </span>
        </div>
      )
    }
  }

  const totalAmount = state.tickets.reduce((sum, ticket) => sum + ticket.price, 0)

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-masonic-navy">Select Tickets</h1>
        <div className="masonic-divider"></div>
        <p className="text-gray-600">Please select tickets for each attendee</p>
      </div>

      <div className="space-y-4">
        {eligibleAttendees.map((attendee) => (
          <Card key={attendee.id} className="border-masonic-navy overflow-hidden">
            <CardHeader className="bg-masonic-lightblue py-3 px-4">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">{renderAttendeeHeader(attendee)}</CardTitle>
                <Badge variant="outline" className="bg-white">
                  {getAttendeeTickets(attendee.id).length} tickets - ${getAttendeeTicketTotal(attendee.id)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Accordion
                type="single"
                collapsible
                value={expandedAttendee === attendee.id ? attendee.id : undefined}
                onValueChange={(value) => setExpandedAttendee(value)}
              >
                <AccordionItem value={attendee.id} className="border-0">
                  <AccordionTrigger className="px-4 py-3 hover:bg-gray-50">
                    Select tickets for this attendee
                  </AccordionTrigger>
                  <AccordionContent className="px-4 py-3 border-t">
                    <div className="space-y-6">
                      {/* Package options */}
                      <div>
                        <h3 className="font-semibold text-masonic-navy mb-3">Ticket Packages</h3>
                        <div className="grid gap-4 md:grid-cols-3">
                          {ticketPackages.map((pkg) => (
                            <Card
                              key={pkg.id}
                              className={`cursor-pointer border-2 transition-all ${
                                getAttendeeTickets(attendee.id).some((t) => t.name === pkg.name)
                                  ? "border-masonic-gold bg-masonic-lightgold/10"
                                  : "border-gray-200 hover:border-masonic-lightgold"
                              }`}
                              onClick={() => handleSelectPackage(attendee.id, pkg.id)}
                            >
                              <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                  <h4 className="font-medium">{pkg.name}</h4>
                                  <Badge className="bg-masonic-navy">${pkg.price}</Badge>
                                </div>
                                <p className="text-sm text-gray-600 mb-3">{pkg.description}</p>
                                <div className="text-xs text-gray-500">
                                  <div className="flex items-center gap-1 mb-1">
                                    <Package className="h-3 w-3" />
                                    <span>Includes:</span>
                                  </div>
                                  <ul className="space-y-1 pl-4">
                                    {pkg.includes.map((id) => {
                                      const ticket = ticketTypes.find((t) => t.id === id)
                                      return ticket ? (
                                        <li key={id} className="flex items-center gap-1">
                                          <Check className="h-3 w-3 text-green-600" />
                                          <span>{ticket.name}</span>
                                        </li>
                                      ) : null
                                    })}
                                  </ul>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>

                      {/* Individual tickets table */}
                      <div>
                        <h3 className="font-semibold text-masonic-navy mb-3">Individual Tickets</h3>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[50px]"></TableHead>
                              <TableHead>Ticket</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead className="text-right">Price</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {ticketTypes.map((ticket) => (
                              <TableRow key={ticket.id}>
                                <TableCell>
                                  <Checkbox
                                    checked={isTicketSelected(attendee.id, ticket.id)}
                                    onCheckedChange={() => handleToggleTicket(attendee.id, ticket.id)}
                                  />
                                </TableCell>
                                <TableCell className="font-medium">{ticket.name}</TableCell>
                                <TableCell>{ticket.description}</TableCell>
                                <TableCell className="text-right">${ticket.price}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Selected tickets summary */}
                      <div>
                        <h3 className="font-semibold text-masonic-navy mb-3">Selected Tickets</h3>
                        {getAttendeeTickets(attendee.id).length === 0 ? (
                          <p className="text-gray-500 italic">No tickets selected</p>
                        ) : (
                          <div className="space-y-2">
                            {getAttendeeTickets(attendee.id).map((ticket) => (
                              <div
                                key={ticket.id}
                                className="flex justify-between items-center p-2 border rounded-md bg-gray-50"
                              >
                                <div>
                                  <p className="font-medium">{ticket.name}</p>
                                  <p className="text-xs text-gray-500">{ticket.description}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="font-bold">${ticket.price}</span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => dispatch({ type: "REMOVE_TICKET", payload: ticket.id })}
                                  >
                                    ×
                                  </Button>
                                </div>
                              </div>
                            ))}
                            <div className="flex justify-between items-center p-2 border-t font-bold">
                              <span>Total</span>
                              <span>${getAttendeeTicketTotal(attendee.id)}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Order total */}
      <Card className="border-masonic-gold bg-masonic-lightgold/10">
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-lg">Order Total</h3>
              <p className="text-sm text-gray-600">
                {state.tickets.length} ticket{state.tickets.length !== 1 ? "s" : ""} for {eligibleAttendees.length}{" "}
                attendee{eligibleAttendees.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="text-2xl font-bold text-masonic-navy">${totalAmount}</div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          className="border-masonic-navy text-masonic-navy hover:bg-masonic-lightblue"
        >
          Previous
        </Button>
        <Button
          onClick={handleContinue}
          disabled={state.tickets.length === 0}
          className="bg-masonic-navy hover:bg-masonic-blue"
        >
          Review Order
        </Button>
      </div>
    </div>
  )
}
