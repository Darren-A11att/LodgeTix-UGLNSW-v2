"use client"

import { useState } from "react"
import { useRegistrationStore } from '../../../../lib/registrationStore'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Package, Check, User, UserPlus, ShoppingCart, XCircle } from "lucide-react"
import type { Attendee, Ticket, MasonAttendee, GuestAttendee, PartnerAttendee } from "@/lib/registration-types"
import { v4 as uuidv4 } from "uuid"
import { SectionHeader } from "../Shared/SectionHeader"
import { AlertModal } from "@/components/ui/alert-modal"
import { TwoColumnStepLayout } from "../Layouts/TwoColumnStepLayout"

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
    eligibleAttendeeTypes: ["mason", "guest"] as AttendeeType[],
  },
  {
    id: "brunch",
    name: "Farewell Brunch",
    price: 45,
    description: "Sunday morning brunch",
    category: "dining",
    eligibleAttendeeTypes: ["mason", "guest"] as AttendeeType[],
  },
  {
    id: "tour",
    name: "City Tour",
    price: 60,
    description: "Guided tour of local landmarks",
    category: "activity",
    eligibleAttendeeTypes: ["mason", "guest"] as AttendeeType[],
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
    eligibleAttendeeTypes: ["mason", "guest"] as AttendeeType[],
  },
]

function TicketSelectionStep() {
  const allStoreAttendees = useRegistrationStore((s) => s.attendees);
  const updateAttendeeStore = useRegistrationStore((s) => s.updateAttendee);

  // Main log for component input state, matching the desired format
  console.log("!!!!!!!!!!!! TICKET SELECTION STEP: ALL ATTENDEES INPUT !!!!!!!!!!!!", JSON.stringify(allStoreAttendees, null, 2));

  const primaryAttendee = allStoreAttendees.find(a => a.isPrimary) as unknown as MasonAttendee | GuestAttendee | undefined;
  const additionalAttendees = allStoreAttendees.filter(a => !a.isPrimary) as unknown as (MasonAttendee | GuestAttendee | PartnerAttendee)[];

  // --- Derive currentTickets for UI display from store state ---
  const derivedCurrentTickets: Ticket[] = allStoreAttendees.flatMap(attendee => {
    const attendeeIdentifier = (attendee as any).attendeeId;
    if (!attendeeIdentifier) return [];

    const selection = (attendee as any).ticket;

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
        return [derivedPackageTicket];
      }
    } else if (selection?.selectedEvents && selection.selectedEvents.length > 0) { 
      const individualTickets = selection.selectedEvents.map((eventId: string) => {
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
          return derivedIndividualTicket;
        }
        return null;
      }).filter(Boolean) as Ticket[];
      return individualTickets;
    }
    return [];
  });

  // Main log for the tickets processed for UI rendering
  console.log("!!!!!!!!!!!! TICKET SELECTION STEP: FINAL DERIVED TICKETS FOR UI !!!!!!!!!!!!", JSON.stringify(derivedCurrentTickets, null, 2));

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

  const [expandedAttendee, setExpandedAttendee] = useState<string | null>(null)

  // Create a helper function to order attendees so partners appear after their associated Mason or Guest
  const getOrderedAttendees = (primary: MasonAttendee | GuestAttendee | undefined, additional: (MasonAttendee | GuestAttendee | PartnerAttendee)[], all: any[]): Attendee[] => {
    const ordered: Attendee[] = [];
    
    // Add primary attendee first if it exists
    if (primary) {
      ordered.push(primary as Attendee);
      
      // If primary attendee has a partner, add it immediately after
      if (primary.partner) {
        const primaryPartner = additional.find(att => att.attendeeId === primary.partner);
        if (primaryPartner) {
          ordered.push(primaryPartner as Attendee);
        }
      }
    }
    
    // For remaining attendees, add each one followed by their partner if they have one
    const remainingAttendees = additional.filter(att => {
      // Skip attendees that are partners of others (they'll be added with their related attendee)
      if (att.isPartner && (att.attendeeId === primary?.partner || 
          additional.some(otherAtt => otherAtt.partner === att.attendeeId))) {
        return false;
      }
      // Skip primary's partner as it's already added
      if (primary && primary.partner === att.attendeeId) {
        return false;
      }
      return true;
    });
    
    // Add each remaining attendee followed by their partner
    for (const attendee of remainingAttendees) {
      ordered.push(attendee as Attendee);
      
      // If this attendee has a partner, add it immediately after
      if (attendee.partner) {
        const partner = all.find(att => att.attendeeId === attendee.partner);
        if (partner) {
          ordered.push(partner as Attendee);
        }
      }
    }
    
    return ordered;
  };
  
  // Use the helper function to order attendees
  const allAttendees: Attendee[] = getOrderedAttendees(primaryAttendee, additionalAttendees, allStoreAttendees);
  
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
    const isSelected = !(attendee as any)?.ticket?.ticketDefinitionId && ((attendee as any)?.ticket?.selectedEvents || []).includes(ticketTypeId);
    return isSelected;
  };
  
  const isTicketCoveredBySelectedPackage = (attendeeIdentifier: string, ticketTypeId: string): boolean => {
    const attendee = allStoreAttendees.find(a => (a as any).attendeeId === attendeeIdentifier);
    let isCovered = false;
    if ((attendee as any)?.ticket?.ticketDefinitionId) {
      const selectedPackageInfo = ticketPackages.find(p => p.id === (attendee as any).ticket!.ticketDefinitionId);
      isCovered = selectedPackageInfo?.includes.includes(ticketTypeId) || false;
    }
    return isCovered;
  };

  const handleSelectPackage = (attendeeIdentifier: string, packageId: string) => {
    const selectedPackageInfo = ticketPackages.find((p) => p.id === packageId);
    if (!selectedPackageInfo) return;

    const attendee = allStoreAttendees.find(a => (a as any).attendeeId === attendeeIdentifier);
    if (!attendee) return;

    const isCurrentlySelected = (attendee as any).ticket?.ticketDefinitionId === packageId;

    if (isCurrentlySelected) {
      // Deselect package
      updateAttendeeStore(attendeeIdentifier, { 
        ticket: { ticketDefinitionId: null, selectedEvents: [] } 
      } as any);
    } else {
      // Select package
      updateAttendeeStore(attendeeIdentifier, { 
        ticket: { 
          ticketDefinitionId: packageId, 
          selectedEvents: selectedPackageInfo.includes // Store included events for clarity/consistency
        }
      } as any);
    }
  };

  const handleToggleIndividualTicket = (attendeeIdentifier: string, ticketTypeId: string) => {
    const ticketTypeInfo = ticketTypes.find((t) => t.id === ticketTypeId);
    if (!ticketTypeInfo) return;

    const attendee = allStoreAttendees.find(a => (a as any).attendeeId === attendeeIdentifier);
    if (!attendee) return;

    const currentSelection = (attendee as any).ticket || { ticketDefinitionId: null, selectedEvents: [] };
    
    // If the attendee currently has a package selected, we need to start with an empty selection
    // Otherwise, copy the current individual selections
    let newSelectedEvents = currentSelection.ticketDefinitionId 
      ? [] // Start fresh with no selected events if switching from package to individual
      : [...currentSelection.selectedEvents];

    const isCurrentlySelected = !currentSelection.ticketDefinitionId && newSelectedEvents.includes(ticketTypeId);

    if (isCurrentlySelected) {
      // Deselect individual ticket
      newSelectedEvents = newSelectedEvents.filter(id => id !== ticketTypeId);
    } else {
      // If switching from package to individual, select only this ticket
      // Otherwise, add this ticket to existing selections
      if (currentSelection.ticketDefinitionId) {
        newSelectedEvents = [ticketTypeId]; // Only this ticket when switching from package
      } else if (!newSelectedEvents.includes(ticketTypeId)) {
        newSelectedEvents.push(ticketTypeId); // Add to existing individual selections
      }
    }
    
    // Selecting an individual ticket always clears any package
    updateAttendeeStore(attendeeIdentifier, { 
      ticket: { 
        ticketDefinitionId: null, 
        selectedEvents: newSelectedEvents 
      }
    } as any);
  };

  const isPackageSelectedForAttendee = (attendeeIdentifier: string, packageName: string) => {
    const packageInfo = ticketPackages.find(p => p.name === packageName);
    if (!packageInfo) return false;
    const attendee = allStoreAttendees.find(a => (a as any).attendeeId === attendeeIdentifier);
    const isSelected = (attendee as any)?.ticket?.ticketDefinitionId === packageInfo.id;
    return isSelected;
  };

  const renderAttendeeHeader = (attendee: any) => {
    const attendeeType = attendee.attendeeType?.toLowerCase() || '';
    
    if (attendeeType === "mason") {
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
            {/* Only show rank for Mason attendees, not for any partner types */}
          </span>
        </div>
      )
    }
  }

  // Calculate the total order amount
  const orderTotalAmount = currentTickets.reduce((sum, ticket) => sum + ticket.price, 0);

  // Render summary content for right column
  const renderSummaryContent = () => (
    <Card className="border-masonic-gold">
      <CardHeader className="bg-masonic-gold/10">
        <CardTitle>Order Summary</CardTitle>
        <CardDescription>
          {currentTickets.length} ticket{currentTickets.length !== 1 ? "s" : ""} for {eligibleAttendees.length}{" "}
          attendee{eligibleAttendees.length !== 1 ? "s" : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 py-4">
        {/* Ticket summary by attendee */}
        {eligibleAttendees.length > 0 ? (
          <div className="space-y-4">
            {eligibleAttendees.map((attendee: any) => {
              const attendeeTickets = getAttendeeTickets(attendee.attendeeId);
              const attendeeTotal = getAttendeeTicketTotal(attendee.attendeeId);
              
              if (attendeeTickets.length === 0) return null;
              
              return (
                <div key={attendee.attendeeId} className="border-b pb-2 last:border-b-0">
                  <h3 className="font-medium text-sm">
                    {attendee.title} {attendee.firstName} {attendee.lastName}
                  </h3>
                  {attendeeTickets.map(ticket => (
                    <div key={ticket.id} className="flex justify-between items-center text-sm py-1">
                      <span>{ticket.name}</span>
                      <span>${ticket.price}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center text-sm font-bold pt-1">
                    <span>Subtotal</span>
                    <span>${attendeeTotal}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-500 italic">No tickets selected yet</p>
        )}
        
        {/* Order total */}
        <div className="border-t pt-3 mt-2">
          <div className="flex justify-between items-center font-bold">
            <span>Order Total</span>
            <span>${orderTotalAmount}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-gray-50 p-4 text-sm text-gray-600">
        <p>Select tickets for each attendee before proceeding to the next step.</p>
      </CardFooter>
    </Card>
  );

  return (
    <TwoColumnStepLayout
      summaryContent={renderSummaryContent()}
      summaryTitle="Your Order"
    >
      <div className="space-y-6">
        <div className="space-y-4">
          {eligibleAttendees.map((attendee: any) => (
            <Card key={attendee.attendeeId} className="border-masonic-navy overflow-hidden">
              <CardHeader 
                className={`bg-masonic-lightblue py-3 px-4 cursor-pointer ${expandedAttendee === attendee.attendeeId ? "" : "hover:bg-masonic-lightblue/90"}`}
                onClick={() => setExpandedAttendee(expandedAttendee === attendee.attendeeId ? null : attendee.attendeeId)}
              >
                <table className="w-full">
                  <tbody>
                    <tr className="align-middle">
                      <td className="w-[80%]">
                        <CardTitle className="text-lg">{renderAttendeeHeader(attendee)}</CardTitle>
                      </td>
                      <td className="w-[10%]">
                        <div className="flex justify-end">
                          <Badge variant="outline" className="bg-white">
                            {attendee.attendeeType === "Mason" || attendee.attendeeType?.toLowerCase() === "mason" 
                              ? "Mason" 
                              : attendee.isPartner 
                                ? "Partner" 
                                : "Guest"}
                          </Badge>
                        </div>
                      </td>
                      <td className="w-[10%] pr-2">
                        <div className="flex justify-end">
                          <div className={expandedAttendee === attendee.attendeeId ? "" : "rotate-180 transform"}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M6 15L12 9L18 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </CardHeader>
              <CardContent className="p-0">
                {expandedAttendee === attendee.attendeeId ? (
                  /* Show the expanded accordion with ticket selection UI */
                  <div>
                    
                    {/* The ticket selection content */}
                    <div className="px-4 py-3 border-t">
                      <div className="space-y-6">
                        {/* Package options */}
                        <div>
                          <h3 className="font-semibold text-masonic-navy mb-3">Ticket Packages</h3>
                          <div className="grid gap-4 md:grid-cols-3">
                            {ticketPackages
                              .filter(pkg => {
                                // Normalize attendee type to lowercase for consistent comparison
                                const mappedType = attendee.attendeeType?.toLowerCase();
                                
                                // Use the correct mapping based on attendee type
                                if (mappedType === 'mason' || mappedType === 'Mason'.toLowerCase()) {
                                  return pkg.eligibleAttendeeTypes.includes('mason');
                                } else if (mappedType === 'guest' || mappedType === 'Guest'.toLowerCase() || 
                                          mappedType === 'ladypartner' || mappedType === 'LadyPartner'.toLowerCase() || 
                                          mappedType === 'guestpartner' || mappedType === 'GuestPartner'.toLowerCase()) {
                                  return pkg.eligibleAttendeeTypes.includes('guest');
                                }
                                return false;
                              })
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
                                .filter(ticket => {
                                  // Normalize attendee type to lowercase for consistent comparison
                                  const mappedType = attendee.attendeeType?.toLowerCase();
                                  
                                  // Use the correct mapping based on attendee type
                                  if (mappedType === 'mason' || mappedType === 'Mason'.toLowerCase()) {
                                    return ticket.eligibleAttendeeTypes.includes('mason');
                                  } else if (mappedType === 'guest' || mappedType === 'Guest'.toLowerCase() || 
                                            mappedType === 'ladypartner' || mappedType === 'LadyPartner'.toLowerCase() || 
                                            mappedType === 'guestpartner' || mappedType === 'GuestPartner'.toLowerCase()) {
                                    return ticket.eligibleAttendeeTypes.includes('guest');
                                  }
                                  return false;
                                })
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
                                          updateAttendeeStore(ticket.attendeeId, { ticket: { ticketDefinitionId: null, selectedEvents: [] } } as any);
                                        } else {
                                          // Remove an individual ticket - find original ticketTypeId
                                          // The ticket.id for individual tickets is attendeeId-ticketTypeId
                                          const originalTicketTypeId = ticket.id.replace(`${ticket.attendeeId}-`, '');
                                          const foundAttendee = allStoreAttendees.find(a => (a as any).attendeeId === ticket.attendeeId);
                                          const existingAttendeeSelection = (foundAttendee as any)?.ticket;
                                          const updatedSelectedEvents = existingAttendeeSelection?.selectedEvents.filter((id: string) => id !== originalTicketTypeId) || [];
                                          updateAttendeeStore(ticket.attendeeId, { 
                                            ticket: { 
                                              ticketDefinitionId: null, // Ensure package is cleared if removing last individual ticket
                                              selectedEvents: updatedSelectedEvents 
                                            }
                                          } as any);
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
                    </div>
                  </div>
                ) : (
                  /* Show the collapsed view with summary */
                  <div 
                    className="cursor-pointer"
                    onClick={() => setExpandedAttendee(attendee.attendeeId)}
                  >                  
                    {/* Show ticket summary for collapsed view */}
                    <div className="px-4 py-3 border-t">
                      {getAttendeeTickets(attendee.attendeeId).length === 0 ? (
                        <p className="text-gray-500 italic text-left py-2 text-sm">Click to expand and add tickets</p>
                      ) : (
                        <table className="w-full text-xs text-muted-foreground">
                          <tbody>
                            {getAttendeeTickets(attendee.attendeeId).map((ticket) => (
                              <tr key={ticket.id} className="align-middle">
                                <td className="font-medium py-1 align-middle w-[22.5%]">
                                  {ticket.name}
                                </td>
                                <td className="py-1 align-left w-[67.5%] text-left font-normal">
                                  {ticket.description}
                                </td>
                                <td className="text-right py-1 align-middle w-[10%]">${ticket.price}</td>
                              </tr>
                            ))}
                            <tr className="border-t align-left">
                              <td className="py-1 w-[22.5%]"></td>
                              <td className="py-1 w-[67.5%]">
                                <div className="flex justify-end pr-2">
                                  <span className="font-bold">TOTAL</span>
                                </div>
                              </td>
                              <td className="text-right font-bold py-1 align-middle w-[10%]">${getAttendeeTicketTotal(attendee.attendeeId)}</td>
                            </tr>
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

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
    </TwoColumnStepLayout>
  )
}

export default TicketSelectionStep;