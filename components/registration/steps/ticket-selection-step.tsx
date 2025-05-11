"use client"

import { useState } from "react"
import { useRegistrationStore } from "@/lib/registration-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Package, Check, User, UserPlus, ShoppingCart, XCircle } from "lucide-react"
import type { Attendee, Ticket, MasonAttendee, GuestAttendee, PartnerAttendee } from "@/lib/registration-types"
import { v4 as uuidv4 } from "uuid"
import { SectionHeader } from "../SectionHeader"
import { AlertModal } from "@/components/ui/alert-modal"

// Define AttendeeType for eligibility checking, leveraging existing types
export type AttendeeType = Attendee['type'];

// Sample ticket types
const ticketTypes = [
  {
    id: "installation",
    name: "Installation Ceremony",
    price: 75,
    description: "Admission to the Grand Installation Ceremony",
    category: "ceremony",
    eligibleAttendeeTypes: ["mason"] as AttendeeType[],
  },
  {
    id: "banquet",
    name: "Grand Banquet",
    price: 150,
    description: "Formal dinner with wine at the venue",
    category: "dining",
    eligibleAttendeeTypes: ["mason", "guest", "partner"] as AttendeeType[],
  },
  {
    id: "brunch",
    name: "Farewell Brunch",
    price: 45,
    description: "Sunday morning brunch",
    category: "dining",
    eligibleAttendeeTypes: ["mason", "guest", "partner"] as AttendeeType[],
  },
  {
    id: "tour",
    name: "City Tour",
    price: 60,
    description: "Guided tour of local landmarks",
    category: "activity",
    eligibleAttendeeTypes: ["mason", "guest", "partner"] as AttendeeType[],
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
    eligibleAttendeeTypes: ["mason"] as AttendeeType[],
  },
  {
    id: "ceremony-banquet",
    name: "Ceremony & Banquet",
    price: 200,
    description: "Installation ceremony and formal dinner (save $25)",
    includes: ["installation", "banquet"],
    eligibleAttendeeTypes: ["mason"] as AttendeeType[],
  },
  {
    id: "social",
    name: "Social Package",
    price: 180,
    description: "All social events without the ceremony (save $75)",
    includes: ["banquet", "brunch", "tour"],
    eligibleAttendeeTypes: ["mason", "guest", "partner"] as AttendeeType[],
  },
]

export function TicketSelectionStep() {
  // Refactor to use individual selectors
  const primaryAttendee = useRegistrationStore((s) => s.attendeeDetails.primaryAttendee);
  const additionalAttendees = useRegistrationStore((s) => s.attendeeDetails.additionalAttendees);
  const currentTickets = useRegistrationStore((s) => s.ticketSelection.tickets);
  const addTicket = useRegistrationStore((s) => s.addTicket);
  const removeTicket = useRegistrationStore((s) => s.removeTicket);
  const goToNextStep = useRegistrationStore((s) => s.goToNextStep);
  const goToPrevStep = useRegistrationStore((s) => s.goToPrevStep);

  // Alert modal state
  const [alertModalOpen, setAlertModalOpen] = useState(false)
  const [alertModalData, setAlertModalData] = useState({
    title: "",
    description: "",
    variant: "default" as "default" | "destructive" | "success" | "warning"
  })

  console.log(
    "TicketSelectionStep RENDER - currentTickets from store hook:", 
    currentTickets, 
    "Length:", currentTickets.length
  );
  const localTotalAmount = currentTickets.reduce((sum, ticket) => sum + ticket.price, 0);
  console.log(
    "TicketSelectionStep RENDER - calculated localTotalAmount:", 
    localTotalAmount
  );

  const [expandedAttendee, setExpandedAttendee] = useState<string | null>(null)

  // Get all attendees in order
  const allAttendees: Attendee[] = [
    ...(primaryAttendee ? [primaryAttendee] : []),
    ...additionalAttendees,
  ]

  // Filter out partner attendees as they don't need separate tickets
  const eligibleAttendees = allAttendees;

  const showAlert = (title: string, description: string, variant: "default" | "destructive" | "success" | "warning" = "default") => {
    setAlertModalData({ title, description, variant })
    setAlertModalOpen(true)
  }

  const handlePrevious = () => {
    goToPrevStep();
  }

  const ensureAllAttendeesHaveTickets = (): boolean => {
    // If there are no attendees displayed on this step, the user shouldn't be able to proceed.
    // This also covers the case where currentTickets might be > 0 but somehow no eligible attendees are listed.
    if (eligibleAttendees.length === 0) {
      return false; 
    }
    // All attendees displayed must have at least one ticket.
    return eligibleAttendees.every(attendee => getAttendeeTickets(attendee.id).length > 0);
  };

  const handleContinue = () => {
    if (ensureAllAttendeesHaveTickets()) {
      goToNextStep();
    } else {
      showAlert(
        "Tickets Required", 
        "Please ensure each attendee has at least one ticket or a package selected before continuing.",
        "warning"
      );
    }
  }

  const getAttendeeTickets = (attendeeId: string) => {
    return currentTickets.filter((ticket) => ticket.attendeeId === attendeeId)
  }

  const getAttendeeTicketTotal = (attendeeId: string) => {
    return getAttendeeTickets(attendeeId).reduce((sum, ticket) => sum + ticket.price, 0)
  }

  const isIndividualTicketDirectlySelected = (attendeeId: string, ticketTypeId: string) => {
    const ticketType = ticketTypes.find((t) => t.id === ticketTypeId);
    if (!ticketType) return false;
    return currentTickets.some(
      (ticket) =>
        ticket.attendeeId === attendeeId &&
        !ticket.isPackage && // Must be an individual ticket
        ticket.name === ticketType.name
    );
  };
  
  const isTicketCoveredBySelectedPackage = (attendeeId: string, ticketTypeId: string): boolean => {
    const selectedPackage = currentTickets.find(
      (ticket) => ticket.attendeeId === attendeeId && ticket.isPackage
    );
    if (selectedPackage) {
      return selectedPackage.includedTicketTypes?.includes(ticketTypeId) || false;
    }
    return false;
  };

  const handleSelectPackage = (attendeeId: string, packageId: string) => {
    console.log(
      "handleSelectPackage BEGIN - currentTickets from store getState():", 
      useRegistrationStore.getState().ticketSelection.tickets,
      "Length:", useRegistrationStore.getState().ticketSelection.tickets.length
    );
    const selectedPackageInfo = ticketPackages.find((p) => p.id === packageId);
    if (!selectedPackageInfo) return;

    const previouslySelectedTicketsForAttendee = currentTickets.filter(
      (ticket) => ticket.attendeeId === attendeeId
    );

    let wasThisPackageAlreadySelected = false;
    
    // Remove all previous tickets for this attendee
    previouslySelectedTicketsForAttendee.forEach((ticket) => {
      if (ticket.isPackage && ticket.name === selectedPackageInfo.name) {
        wasThisPackageAlreadySelected = true;
      }
      removeTicket(ticket.id); 
    });

    // If the package wasn't already selected (i.e., we're selecting it now), then add it.
    // If it was already selected, the loop above removed it, so this effectively deselects it.
    if (!wasThisPackageAlreadySelected) {
      const newPackageTicket: Ticket = {
        id: uuidv4(),
        name: selectedPackageInfo.name,
        price: selectedPackageInfo.price,
        description: selectedPackageInfo.description,
        attendeeId: attendeeId,
        isPackage: true,
        includedTicketTypes: selectedPackageInfo.includes,
      };
      addTicket(newPackageTicket);
    }
  };

  const handleToggleIndividualTicket = (attendeeId: string, ticketTypeId: string) => {
    const ticketTypeInfo = ticketTypes.find((t) => t.id === ticketTypeId);
    if (!ticketTypeInfo) return;

    // If this action is to select a ticket, first remove any existing package for this attendee.
    // If it's to deselect, the package (if any) should remain untouched as it doesn't conflict.
    const existingPackageForAttendee = currentTickets.find(
      (ticket) => ticket.attendeeId === attendeeId && ticket.isPackage
    );

    const isCurrentlyIndividuallySelected = isIndividualTicketDirectlySelected(attendeeId, ticketTypeId);

    if (!isCurrentlyIndividuallySelected && existingPackageForAttendee) {
      // User is trying to select an individual ticket while a package is active.
      // Clear the package.
      removeTicket(existingPackageForAttendee.id);
    }
    
    // Now, toggle the individual ticket
    if (isCurrentlyIndividuallySelected) {
      // Find the specific individual ticket to remove
      const individualTicketToRemove = currentTickets.find(
        (ticket) =>
          ticket.attendeeId === attendeeId &&
          !ticket.isPackage &&
          ticket.name === ticketTypeInfo.name
      );
      if (individualTicketToRemove) {
        removeTicket(individualTicketToRemove.id);
      }
    } else {
      // Add the new individual ticket
      const newTicket: Ticket = {
        id: uuidv4(),
        name: ticketTypeInfo.name,
        price: ticketTypeInfo.price,
        description: ticketTypeInfo.description,
        attendeeId: attendeeId,
        isPackage: false, // Explicitly false
      };
      addTicket(newTicket);
    }
  };

  // Helper to check if a specific package (by name) is selected for an attendee
  // This is used for styling the selected package card
  const isPackageSelectedForAttendee = (attendeeId: string, packageName: string) => {
    return currentTickets.some(ticket => 
        ticket.attendeeId === attendeeId && 
        ticket.name === packageName && 
        ticket.isPackage
    );
  };

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

  return (
    <div className="space-y-6">
      <SectionHeader>
        <h1 className="text-2xl font-bold text-masonic-navy">Select Tickets</h1>
        <div className="masonic-divider"></div>
        <p className="text-gray-600">Please select tickets for each attendee</p>
      </SectionHeader>

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
                          {ticketPackages
                            .filter(pkg => pkg.eligibleAttendeeTypes.includes(attendee.type))
                            .map((pkg) => (
                            <Card
                              key={pkg.id}
                              className={`cursor-pointer border-2 transition-all ${
                                isPackageSelectedForAttendee(attendee.id, pkg.name)
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
                            {ticketTypes
                              .filter(ticket => ticket.eligibleAttendeeTypes.includes(attendee.type))
                              .map((ticket) => (
                              <TableRow key={ticket.id}>
                                <TableCell>
                                  <Checkbox
                                    id={`${attendee.id}-${ticket.id}`}
                                    checked={isIndividualTicketDirectlySelected(attendee.id, ticket.id)}
                                    onCheckedChange={() => handleToggleIndividualTicket(attendee.id, ticket.id)}
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
                                    onClick={() => removeTicket(ticket.id)}
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
                {currentTickets.length} ticket{currentTickets.length !== 1 ? "s" : ""} for {eligibleAttendees.length}{" "}
                attendee{eligibleAttendees.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="text-2xl font-bold text-masonic-navy">${localTotalAmount}</div>
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
          disabled={!ensureAllAttendeesHaveTickets() || currentTickets.length === 0}
          className="bg-masonic-navy hover:bg-masonic-blue"
        >
          Review Order
        </Button>
      </div>

      <AlertModal
        isOpen={alertModalOpen}
        onClose={() => setAlertModalOpen(false)}
        title={alertModalData.title}
        description={alertModalData.description}
        variant={alertModalData.variant}
        actionLabel="OK"
      />
    </div>
  )
}