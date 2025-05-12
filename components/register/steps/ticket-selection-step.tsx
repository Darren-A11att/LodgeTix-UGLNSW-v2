"use client"

import { useState } from "react"
import { useRegistrationStore } from '../../../lib/registrationStore'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Package, Check, User, UserPlus, ShoppingCart, XCircle } from "lucide-react"
import type { Attendee, Ticket, MasonAttendee, GuestAttendee, PartnerAttendee } from "@/lib/registration-types"
import { v4 as uuidv4 } from "uuid"
import { SectionHeader } from "../registration/SectionHeader"
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
  const allStoreAttendees = useRegistrationStore((s) => s.attendees);
  const updateAttendeeStore = useRegistrationStore((s) => s.updateAttendee);

  console.log("[TicketSelectionStep] Raw allStoreAttendees on render:", JSON.parse(JSON.stringify(allStoreAttendees)));

  const primaryAttendee = allStoreAttendees.find(a => a.isPrimary) as unknown as MasonAttendee | GuestAttendee | undefined;
  const additionalAttendees = allStoreAttendees.filter(a => !a.isPrimary) as unknown as (MasonAttendee | GuestAttendee | PartnerAttendee)[];

  // --- Derive currentTickets for UI display from store state ---
  const derivedCurrentTickets: Ticket[] = allStoreAttendees.flatMap(attendee => {
    const attendeeIdentifier = (attendee as any).attendeeId;
    if (!attendeeIdentifier) return [];

    const selection = attendee.ticket; 
    console.log(`[derivedCurrentTickets] Attendee: ${attendeeIdentifier}, Selection from store:`, JSON.parse(JSON.stringify(selection)));

    if (selection?.ticketDefinitionId) { 
      const packageInfo = ticketPackages.find(p => p.id === selection.ticketDefinitionId);
      if (packageInfo) {
        const derivedPackageTicket = {
          id: packageInfo.id, 
          name: packageInfo.name,
          price: packageInfo.price,
          description: packageInfo.description,
          attendeeId: attendeeIdentifier,
          isPackage: true,
          includedTicketTypes: packageInfo.includes,
        };
        console.log(`[derivedCurrentTickets] Attendee: ${attendeeIdentifier}, Derived Package Ticket:`, JSON.parse(JSON.stringify(derivedPackageTicket)));
        return [derivedPackageTicket];
      }
    } else if (selection?.selectedEvents && selection.selectedEvents.length > 0) { 
      const individualTickets = selection.selectedEvents.map(eventId => {
        const ticketTypeInfo = ticketTypes.find(t => t.id === eventId);
        if (ticketTypeInfo) {
          const derivedIndividualTicket = {
            id: `${attendeeIdentifier}-${ticketTypeInfo.id}`, 
            name: ticketTypeInfo.name,
            price: ticketTypeInfo.price,
            description: ticketTypeInfo.description,
            attendeeId: attendeeIdentifier,
            isPackage: false,
          };
          console.log(`[derivedCurrentTickets] Attendee: ${attendeeIdentifier}, Derived Individual Ticket for event ${eventId}:`, JSON.parse(JSON.stringify(derivedIndividualTicket)));
          return derivedIndividualTicket;
        }
        return null;
      }).filter(Boolean) as Ticket[];
      if (individualTickets.length > 0) {
        console.log(`[derivedCurrentTickets] Attendee: ${attendeeIdentifier}, All Derived Individual Tickets:`, JSON.parse(JSON.stringify(individualTickets)));
      }
      return individualTickets;
    }
    console.log(`[derivedCurrentTickets] Attendee: ${attendeeIdentifier}, No tickets derived.`);
    return [];
  });

  console.log("[TicketSelectionStep] Final derivedCurrentTickets for UI:", JSON.parse(JSON.stringify(derivedCurrentTickets)));

  const currentTickets = derivedCurrentTickets;

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
    "TicketSelectionStep RENDER - currentTickets (placeholder):", 
    currentTickets, 
    "Length:", currentTickets.length
  );
  const localTotalAmount = currentTickets.reduce((sum, ticket) => sum + ticket.price, 0);
  console.log(
    "TicketSelectionStep RENDER - calculated localTotalAmount (based on placeholder):", 
    localTotalAmount
  );

  const [expandedAttendee, setExpandedAttendee] = useState<string | null>(null)

  // Get all attendees in order
  const allAttendees: Attendee[] = [
    ...(primaryAttendee ? [primaryAttendee as Attendee] : []),
    ...(additionalAttendees as Attendee[]),
  ];

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
    if (eligibleAttendees.length === 0) {
      return false; 
    }
    return eligibleAttendees.every(attendee => getAttendeeTickets((attendee as any).attendeeId).length > 0);
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

  const getAttendeeTickets = (attendeeIdentifier: string) => {
    return currentTickets.filter((ticket) => ticket.attendeeId === attendeeIdentifier)
  }

  const getAttendeeTicketTotal = (attendeeIdentifier: string) => {
    return getAttendeeTickets(attendeeIdentifier).reduce((sum, ticket) => sum + ticket.price, 0)
  }

  const isIndividualTicketDirectlySelected = (attendeeIdentifier: string, ticketTypeId: string) => {
    const attendee = allStoreAttendees.find(a => (a as any).attendeeId === attendeeIdentifier);
    const isSelected = !attendee?.ticket?.ticketDefinitionId && (attendee?.ticket?.selectedEvents || []).includes(ticketTypeId);
    console.log(`[isIndividualTicketDirectlySelected] Attendee: ${attendeeIdentifier}, TicketTypeID: ${ticketTypeId}, StoreDefId: ${attendee?.ticket?.ticketDefinitionId}, StoreEvents: ${JSON.stringify(attendee?.ticket?.selectedEvents)}, IsSelected: ${isSelected}`);
    return isSelected;
  };
  
  const isTicketCoveredBySelectedPackage = (attendeeIdentifier: string, ticketTypeId: string): boolean => {
    const attendee = allStoreAttendees.find(a => (a as any).attendeeId === attendeeIdentifier);
    let isCovered = false;
    if (attendee?.ticket?.ticketDefinitionId) {
      const selectedPackageInfo = ticketPackages.find(p => p.id === attendee.ticket!.ticketDefinitionId);
      isCovered = selectedPackageInfo?.includes.includes(ticketTypeId) || false;
    }
    console.log(`[isTicketCoveredBySelectedPackage] Attendee: ${attendeeIdentifier}, TicketTypeID: ${ticketTypeId}, StoreDefId: ${attendee?.ticket?.ticketDefinitionId}, IsCovered: ${isCovered}`);
    return isCovered;
  };

  const handleSelectPackage = (attendeeIdentifier: string, packageId: string) => {
    const selectedPackageInfo = ticketPackages.find((p) => p.id === packageId);
    if (!selectedPackageInfo) return;

    const attendee = allStoreAttendees.find(a => (a as any).attendeeId === attendeeIdentifier);
    if (!attendee) return;

    const isCurrentlySelected = attendee.ticket?.ticketDefinitionId === packageId;

    if (isCurrentlySelected) {
      // Deselect package
      updateAttendeeStore(attendeeIdentifier, { 
        ticket: { ticketDefinitionId: null, selectedEvents: [] } 
      });
    } else {
      // Select package
      updateAttendeeStore(attendeeIdentifier, { 
        ticket: { 
          ticketDefinitionId: packageId, 
          selectedEvents: selectedPackageInfo.includes // Store included events for clarity/consistency
        }
      });
    }
  };

  const handleToggleIndividualTicket = (attendeeIdentifier: string, ticketTypeId: string) => {
    const ticketTypeInfo = ticketTypes.find((t) => t.id === ticketTypeId);
    if (!ticketTypeInfo) return;

    const attendee = allStoreAttendees.find(a => (a as any).attendeeId === attendeeIdentifier);
    if (!attendee) return;

    const currentSelection = attendee.ticket || { ticketDefinitionId: null, selectedEvents: [] };
    let newSelectedEvents = [...currentSelection.selectedEvents];

    const isCurrentlySelected = !currentSelection.ticketDefinitionId && newSelectedEvents.includes(ticketTypeId);

    if (isCurrentlySelected) {
      // Deselect individual ticket
      newSelectedEvents = newSelectedEvents.filter(id => id !== ticketTypeId);
    } else {
      // Select individual ticket
      if (!newSelectedEvents.includes(ticketTypeId)) {
        newSelectedEvents.push(ticketTypeId);
      }
    }
    // Selecting an individual ticket always clears any package
    updateAttendeeStore(attendeeIdentifier, { 
      ticket: { 
        ticketDefinitionId: null, 
        selectedEvents: newSelectedEvents 
      }
    });
  };

  const isPackageSelectedForAttendee = (attendeeIdentifier: string, packageName: string) => {
    const packageInfo = ticketPackages.find(p => p.name === packageName);
    if (!packageInfo) return false;
    const attendee = allStoreAttendees.find(a => (a as any).attendeeId === attendeeIdentifier);
    const isSelected = attendee?.ticket?.ticketDefinitionId === packageInfo.id;
    console.log(`[isPackageSelectedForAttendee] Attendee: ${attendeeIdentifier}, PackageName: ${packageName}, PackageID: ${packageInfo.id}, StoreDefId: ${attendee?.ticket?.ticketDefinitionId}, IsSelected: ${isSelected}`);
    return isSelected;
  };

  const renderAttendeeHeader = (attendee: any) => {
    if (attendee.attendeeType === "mason") {
      const mason = attendee as MasonAttendee
      return (
        <div className="flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-masonic-navy" />
          <span>
            {mason.title} {mason.firstName} {mason.lastName}
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
            {attendee.attendeeType === "partner" && <span className="ml-2 text-sm text-gray-500">(Partner)</span>}
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
        {eligibleAttendees.map((attendee: any) => (
          <Card key={attendee.attendeeId} className="border-masonic-navy overflow-hidden">
            <CardHeader className="bg-masonic-lightblue py-3 px-4">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">{renderAttendeeHeader(attendee)}</CardTitle>
                <Badge variant="outline" className="bg-white">
                  {getAttendeeTickets(attendee.attendeeId).length} tickets - ${getAttendeeTicketTotal(attendee.attendeeId)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Accordion
                type="single"
                collapsible
                value={expandedAttendee === attendee.attendeeId ? attendee.attendeeId : undefined}
                onValueChange={(value) => setExpandedAttendee(value)}
              >
                <AccordionItem value={attendee.attendeeId} className="border-0">
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
                            .filter(pkg => pkg.eligibleAttendeeTypes.includes(attendee.attendeeType as AttendeeType))
                            .map((pkg) => (
                            <Card
                              key={pkg.id}
                              className={`cursor-pointer border-2 transition-all ${
                                isPackageSelectedForAttendee(attendee.attendeeId, pkg.name)
                                  ? "border-masonic-gold bg-masonic-lightgold/10"
                                  : "border-gray-200 hover:border-masonic-lightgold"
                              }`}
                              onClick={() => handleSelectPackage(attendee.attendeeId, pkg.id)}
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
                              .filter(ticket => ticket.eligibleAttendeeTypes.includes(attendee.attendeeType as AttendeeType))
                              .map((ticket) => (
                              <TableRow key={ticket.id}>
                                <TableCell>
                                  <Checkbox
                                    id={`${attendee.attendeeId}-${ticket.id}`}
                                    checked={isIndividualTicketDirectlySelected(attendee.attendeeId, ticket.id)}
                                    onCheckedChange={() => handleToggleIndividualTicket(attendee.attendeeId, ticket.id)}
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
                        {getAttendeeTickets(attendee.attendeeId).length === 0 ? (
                          <p className="text-gray-500 italic">No tickets selected</p>
                        ) : (
                          <div className="space-y-2">
                            {getAttendeeTickets(attendee.attendeeId).map((ticket) => (
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
                                    onClick={() => {
                                      if (ticket.isPackage) {
                                        // Remove the whole package
                                        updateAttendeeStore(ticket.attendeeId, { ticket: { ticketDefinitionId: null, selectedEvents: [] } });
                                      } else {
                                        // Remove an individual ticket - find original ticketTypeId
                                        // The ticket.id for individual tickets is attendeeId-ticketTypeId
                                        const originalTicketTypeId = ticket.id.replace(`${ticket.attendeeId}-`, '');
                                        const existingAttendeeSelection = allStoreAttendees.find(a => (a as any).attendeeId === ticket.attendeeId)?.ticket;
                                        const updatedSelectedEvents = existingAttendeeSelection?.selectedEvents.filter(id => id !== originalTicketTypeId) || [];
                                        updateAttendeeStore(ticket.attendeeId, { 
                                          ticket: { 
                                            ticketDefinitionId: null, // Ensure package is cleared if removing last individual ticket
                                            selectedEvents: updatedSelectedEvents 
                                          }
                                        });
                                      }
                                    }}
                                  >
                                    ×
                                  </Button>
                                </div>
                              </div>
                            ))}
                            <div className="flex justify-between items-center p-2 border-t font-bold">
                              <span>Total</span>
                              <span>${getAttendeeTicketTotal(attendee.attendeeId)}</span>
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