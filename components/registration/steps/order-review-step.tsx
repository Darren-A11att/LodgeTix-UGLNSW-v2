"use client"

import { useRegistration } from "@/contexts/registration-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Check, ChevronRight, CreditCard, Info, Ticket, User, Users } from "lucide-react"
import type { Attendee } from "@/lib/registration-types"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { SectionHeader } from "../SectionHeader"

export function OrderReviewStep() {
  const { state, dispatch } = useRegistration()

  const allAttendees: Attendee[] = [
    ...(state.primaryAttendee ? [state.primaryAttendee] : []),
    ...state.additionalAttendees,
  ]

  const handlePrevious = () => {
    dispatch({ type: "PREV_STEP" })
  }

  const handleContinue = () => {
    dispatch({ type: "NEXT_STEP" })
  }

  const getAttendeeTickets = (attendeeId: string) => {
    return state.tickets.filter((ticket) => ticket.attendeeId === attendeeId)
  }

  const getAttendeeTotal = (attendeeId: string) => {
    return getAttendeeTickets(attendeeId).reduce((sum, ticket) => sum + ticket.price, 0)
  }

  const totalAmount = state.tickets.reduce((sum, ticket) => sum + ticket.price, 0)
  const totalTickets = state.tickets.length

  const getMasonicTitle = (attendee: Attendee) => {
    if (attendee.type === "mason") {
      return attendee.masonicTitle
    }
    return attendee.title || ""
  }

  const getAttendeeTypeLabel = (attendee: Attendee) => {
    if (attendee.type === "mason") {
      return attendee.grandRank || attendee.rank
    }
    if (attendee.type === "guest") {
      return "Guest"
    }
    if (attendee.type === "partner") {
      return "Partner"
    }
    return ""
  }

  return (
    <div className="space-y-6">
      <SectionHeader>
        <h1 className="text-2xl font-bold text-masonic-navy">Review Your Order</h1>
        <div className="masonic-divider"></div>
        <p className="text-gray-600">Please review your registration details before proceeding to payment</p>
      </SectionHeader>

      <Card className="border-masonic-navy">
        <CardHeader className="bg-masonic-navy text-white">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5" /> Registration Details
            </CardTitle>
            <Badge variant="outline" className="bg-white/10 text-white">
              {state.registrationType?.replace("-", " ")}
            </Badge>
          </div>
          <CardDescription className="text-gray-200">
            {allAttendees.length} {allAttendees.length === 1 ? "Attendee" : "Attendees"} • {totalTickets}{" "}
            {totalTickets === 1 ? "Ticket" : "Tickets"}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="max-h-[400px]">
            <Accordion type="multiple" className="w-full" defaultValue={["attendees"]}>
              <AccordionItem value="attendees" className="border-0">
                <AccordionTrigger className="px-6 py-4 hover:bg-gray-50">
                  <span className="flex items-center font-medium">
                    <User className="mr-2 h-4 w-4" /> Attendee Information
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-0">
                  <div className="space-y-4 px-6">
                    {allAttendees.map((attendee, index) => (
                      <Card key={attendee.id} className="border-masonic-lightgold">
                        <CardHeader className="bg-masonic-lightgold/20 pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">
                              {index === 0 ? "Primary Attendee" : `Additional Attendee ${index}`}
                            </CardTitle>
                            <Badge variant="outline" className="bg-masonic-navy/10 text-masonic-navy">
                              {getAttendeeTypeLabel(attendee)}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                              <p className="font-medium">
                                {getMasonicTitle(attendee)} {attendee.firstName} {attendee.lastName}
                              </p>
                              <Badge className="mt-1 w-fit bg-masonic-gold text-masonic-navy sm:mt-0">
                                ${getAttendeeTotal(attendee.id).toFixed(2)}
                              </Badge>
                            </div>

                            {attendee.type === "mason" && (
                              <p className="text-sm text-gray-500">
                                {attendee.lodgeName}
                                {attendee.lodgeNumber && ` No. ${attendee.lodgeNumber}`}
                              </p>
                            )}

                            {attendee.dietaryRequirements && (
                              <div className="mt-2 text-sm">
                                <span className="font-medium">Dietary Requirements:</span>{" "}
                                {attendee.dietaryRequirements}
                              </div>
                            )}

                            {attendee.specialNeeds && (
                              <div className="mt-2 text-sm">
                                <span className="font-medium">Special Needs:</span> {attendee.specialNeeds}
                              </div>
                            )}

                            {attendee.type !== "partner" && attendee.hasPartner && attendee.partner && (
                              <div className="mt-3 rounded-md bg-gray-50 p-3">
                                <p className="text-sm font-medium">
                                  Partner: {attendee.partner.title} {attendee.partner.firstName}{" "}
                                  {attendee.partner.lastName}
                                </p>
                                {attendee.partner.dietaryRequirements && (
                                  <p className="text-xs text-gray-500">
                                    Dietary Requirements: {attendee.partner.dietaryRequirements}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="tickets" className="border-0">
                <AccordionTrigger className="px-6 py-4 hover:bg-gray-50">
                  <span className="flex items-center font-medium">
                    <Ticket className="mr-2 h-4 w-4" /> Ticket Information
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 px-6">
                    {allAttendees.map((attendee) => {
                      const tickets = getAttendeeTickets(attendee.id)
                      if (tickets.length === 0) return null

                      return (
                        <Card key={`tickets-${attendee.id}`} className="border-masonic-lightblue">
                          <CardHeader className="bg-masonic-lightblue/20 pb-2">
                            <CardTitle className="text-base">
                              {getMasonicTitle(attendee)} {attendee.firstName} {attendee.lastName}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-4">
                            <div className="space-y-3">
                              {tickets.map((ticket) => (
                                <div key={ticket.id} className="flex items-center justify-between">
                                  <div className="flex items-center">
                                    <Check className="mr-2 h-4 w-4 text-green-500" />
                                    <div>
                                      <p className="font-medium">{ticket.name}</p>
                                      {ticket.description && (
                                        <p className="text-sm text-gray-500">{ticket.description}</p>
                                      )}
                                    </div>
                                  </div>
                                  <span className="font-medium">${ticket.price.toFixed(2)}</span>
                                </div>
                              ))}

                              <Separator />

                              <div className="flex items-center justify-between font-bold">
                                <span>Subtotal</span>
                                <span>${getAttendeeTotal(attendee.id).toFixed(2)}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </ScrollArea>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 bg-gray-50 p-6">
          <div className="flex w-full items-center justify-between rounded-lg bg-masonic-navy p-4 text-white">
            <span className="text-lg font-bold">Total Amount</span>
            <span className="text-xl font-bold">${totalAmount.toFixed(2)}</span>
          </div>

          <Alert className="border-masonic-gold bg-masonic-gold/10">
            <Info className="h-4 w-4 text-masonic-navy" />
            <AlertDescription className="text-masonic-navy">
              Please review all details carefully. You will be asked to provide payment information in the next step.
            </AlertDescription>
          </Alert>

          <div className="flex w-full justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              className="border-masonic-navy text-masonic-navy hover:bg-masonic-lightblue"
            >
              Previous
            </Button>
            <Button onClick={handleContinue} className="bg-masonic-gold text-masonic-navy hover:bg-masonic-lightgold">
              <CreditCard className="mr-2 h-4 w-4" />
              Proceed to Payment
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
