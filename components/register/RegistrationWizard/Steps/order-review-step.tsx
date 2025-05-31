"use client"

import { useState, useMemo, useEffect } from "react"
import { useRegistrationStore, UnifiedAttendeeData, PackageSelectionType } from '../../../../lib/registrationStore'
import { useLocationStore } from '../../../../lib/locationStore'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Check, ChevronRight, CreditCard, Info, Ticket, User, Users, Edit3, Trash2, AlertTriangle, HelpCircle } from "lucide-react"
import type { Attendee, MasonAttendee, GuestAttendee, PartnerAttendee, PARTNER_RELATIONSHIP_OPTIONS } from "@/lib/registration-types"
import { PhoneInput } from '@/components/ui/phone-input'
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { SectionHeader } from "../Shared/SectionHeader"
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog"
import AttendeeEditModal from "../Attendees/AttendeeEditModal"
import { TwoColumnStepLayout } from "../Layouts/TwoColumnStepLayout"
import { getOrderReviewSummaryData } from '../Summary/summary-data/order-review-summary-data';
import { SummaryRenderer } from '../Summary/SummaryRenderer';
import { ticketService, EventTicket, TicketPackage } from '@/lib/api/ticketService';
import { getEventTicketsService, type TicketDefinition, type EventPackage } from '@/lib/services/event-tickets-service';
import { api } from '@/lib/api-logger';
import { ValidationModal } from '@/components/ui/validation-modal';
import { calculateStripeFees, getFeeDisclaimer, getFeeModeFromEnv, STRIPE_FEE_CONFIG } from '@/lib/utils/stripe-fee-calculator';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Define the parent event ID for Grand Proclamation 2025
const GRAND_PROCLAMATION_PARENT_ID = "307c2d85-72d5-48cf-ac94-082ca2a5d23d";

function OrderReviewStep() {
  const registrationType = useRegistrationStore((s) => s.registrationType);
  const allStoreAttendees = useRegistrationStore((s) => s.attendees);
  const eventId = useRegistrationStore((s) => s.eventId);
  
  // State for dynamic ticket and package data
  const [ticketTypesMinimal, setTicketTypesMinimal] = useState<TicketDefinition[]>([]);
  const [ticketPackagesMinimal, setTicketPackagesMinimal] = useState<EventPackage[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(true);
  
  // Fetch tickets and packages on component mount
  useEffect(() => {
    async function fetchTicketsAndPackages() {
      try {
        setIsLoadingTickets(true);
        
        const service = getEventTicketsService();
        const targetEventId = eventId || GRAND_PROCLAMATION_PARENT_ID;
        
        api.debug(`[OrderReviewStep] Fetching tickets for event: ${targetEventId}`);
        
        if (targetEventId === GRAND_PROCLAMATION_PARENT_ID) {
          const childEventsData = await service.getChildEventsWithTicketsAndPackages(targetEventId);
          
          const allTickets: TicketDefinition[] = [];
          childEventsData.forEach(eventData => {
            allTickets.push(...eventData.tickets);
          });
          
          if (childEventsData.length > 0) {
            setTicketTypesMinimal(allTickets);
            setTicketPackagesMinimal(childEventsData[0].packages);
            api.debug(`[OrderReviewStep] Loaded ${allTickets.length} tickets and ${childEventsData[0].packages.length} packages`);
          }
        } else {
          const { tickets, packages } = await service.getEventTicketsAndPackages(targetEventId);
          setTicketTypesMinimal(tickets);
          setTicketPackagesMinimal(packages);
          api.debug(`[OrderReviewStep] Loaded ${tickets.length} tickets and ${packages.length} packages`);
        }
      } catch (error) {
        api.error('[OrderReviewStep] Error fetching tickets and packages:', error);
        console.error('[OrderReviewStep] Error fetching tickets and packages:', error);
      } finally {
        setIsLoadingTickets(false);
      }
    }
    
    fetchTicketsAndPackages();
  }, [eventId]);
  
  const primaryAttendee = useMemo(() => 
    allStoreAttendees.find(att => att.isPrimary) as UnifiedAttendeeData | undefined, 
    [allStoreAttendees]
  );
  const otherAttendees = useMemo(() => 
    allStoreAttendees.filter(att => !att.isPrimary) as UnifiedAttendeeData[], 
    [allStoreAttendees]
  );

  const removeAttendeeStore = useRegistrationStore((s) => s.removeAttendee);
  const goToNextStep = useRegistrationStore((s) => s.goToNextStep);
  const goToPrevStep = useRegistrationStore((s) => s.goToPrevStep);
  const updateAttendeeStore = useRegistrationStore((s) => s.updateAttendee);

  // Create an ordering helper outside of any hooks to avoid conditional hook execution
  const getOrderedAttendees = (primary: UnifiedAttendeeData | undefined, others: UnifiedAttendeeData[], allAttendees: UnifiedAttendeeData[]): UnifiedAttendeeData[] => {
    const orderedAttendees: UnifiedAttendeeData[] = [];
    
    // Add primary attendee first if it exists
    if (primary) {
      orderedAttendees.push(primary);
      
      // If primary attendee has a partner, add it immediately after
      if (primary.partner) {
        const primaryPartner = others.find(att => att.attendeeId === primary.partner);
        if (primaryPartner) {
          orderedAttendees.push(primaryPartner);
        }
      }
    }
    
    // For remaining attendees, add each one followed by their partner if they have one
    const remainingAttendees = others.filter(att => {
      // Skip attendees that are partners of others (they'll be added with their related attendee)
      if (att.isPartner && (att.attendeeId === primary?.partner || 
          others.some(otherAtt => otherAtt.partner === att.attendeeId))) {
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
      orderedAttendees.push(attendee);
      
      // If this attendee has a partner, add it immediately after
      if (attendee.partner) {
        const partner = allAttendees.find(att => att.attendeeId === attendee.partner);
        if (partner) {
          orderedAttendees.push(partner);
        }
      }
    }
    
    return orderedAttendees;
  };
  
  // Now use the helper function inside useMemo to maintain proper hook ordering
  const attendeesForDisplay: UnifiedAttendeeData[] = useMemo(() => 
    getOrderedAttendees(primaryAttendee, otherAttendees, allStoreAttendees)
  , [primaryAttendee, otherAttendees, allStoreAttendees]);

  const packages = useRegistrationStore((s) => s.packages);
  const [currentTickets, setCurrentTickets] = useState<Array<any & { attendeeId: string; price: number; name: string; description?: string; isPackage?: boolean }>>([]);

  useEffect(() => {
    console.log("[OrderReviewStep] Debug - allStoreAttendees:", allStoreAttendees);
    console.log("[OrderReviewStep] Debug - packages:", packages);
    console.log("[OrderReviewStep] Debug - ticketTypesMinimal:", ticketTypesMinimal);
    console.log("[OrderReviewStep] Debug - ticketPackagesMinimal:", ticketPackagesMinimal);
    
    const derivedTickets = allStoreAttendees.flatMap(attendee => {
        const attendeePackage = packages[attendee.attendeeId];
        console.log(`[OrderReviewStep] Debug - Attendee ${attendee.attendeeId} package:`, attendeePackage);
        
        if (!attendeePackage) {
            console.log(`[OrderReviewStep] No package found for attendee ${attendee.attendeeId}`);
            return [];
        }
        
        const { ticketDefinitionId, selectedEvents } = attendeePackage;
        const attendeeId = attendee.attendeeId;
        let tickets: Array<any & { attendeeId: string; price: number; name: string; description?: string; isPackage?: boolean }> = [];

        if (ticketDefinitionId) {
            console.log(`[OrderReviewStep] Looking for package ${ticketDefinitionId}`);
            const pkgInfo = ticketPackagesMinimal.find(p => p.id === ticketDefinitionId);
            if (pkgInfo) {
                tickets.push({ 
                    id: `${attendeeId}-${pkgInfo.id}`, 
                    name: pkgInfo.name, 
                    price: pkgInfo.price, 
                    attendeeId, 
                    isPackage: true,
                    description: `Package including: ${pkgInfo.includes.map(ticketId => {
                        const ticket = ticketTypesMinimal.find(t => t.id === ticketId);
                        return ticket ? ticket.name : ticketId;
                    }).join(", ")}`
                });
            } else {
                console.log(`[OrderReviewStep] Package ${ticketDefinitionId} not found in ticketPackagesMinimal`);
            }
        } else if (selectedEvents && selectedEvents.length > 0) {
            console.log(`[OrderReviewStep] Processing selected tickets:`, selectedEvents);
            selectedEvents.forEach(ticketId => {
                const ticketInfo = ticketTypesMinimal.find(t => t.id === ticketId);
                if (ticketInfo) {
                    tickets.push({ 
                        id: `${attendeeId}-${ticketInfo.id}`, 
                        name: ticketInfo.name, 
                        price: ticketInfo.price, 
                        attendeeId, 
                        isPackage: false,
                        description: ticketInfo.description || `Individual ticket`
                    });
                } else {
                    console.log(`[OrderReviewStep] Ticket ${ticketId} not found in ticketTypesMinimal`);
                }
            });
        } else {
            console.log(`[OrderReviewStep] No tickets selected for attendee ${attendee.attendeeId}`);
        }
        return tickets;
    });
    setCurrentTickets(derivedTickets);
    console.log("[OrderReviewStep] Final derived tickets:", derivedTickets);
  }, [allStoreAttendees, packages, ticketTypesMinimal, ticketPackagesMinimal]);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAttendee, setEditingAttendee] = useState<{ attendeeData: UnifiedAttendeeData; index: number } | null>(null);
  const [isRemoveConfirmOpen, setIsRemoveConfirmOpen] = useState(false);
  const [removingAttendeeId, setRemovingAttendeeId] = useState<string | null>(null);
  
  // Validation modal state
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ field: string; message: string }[]>([]);
  

  const getAttendeeTickets = (attendeeId: string) => {
    return currentTickets.filter((ticket) => ticket.attendeeId === attendeeId)
  }

  const getAttendeeTotal = (attendeeId: string) => {
    return getAttendeeTickets(attendeeId).reduce((sum, ticket) => sum + ticket.price, 0)
  }

  const subtotal = currentTickets.reduce((sum, ticket) => sum + ticket.price, 0)
  const feeCalculation = calculateStripeFees(subtotal)
  const totalAmount = feeCalculation.total
  const totalTickets = currentTickets.length

  // Check if order is valid
  const isOrderValid = attendeesForDisplay.length > 0 && totalTickets > 0;
  
  const handleContinue = () => {
    const errors: { field: string; message: string }[] = [];
    
    if (attendeesForDisplay.length === 0) {
      errors.push({ field: "Attendees", message: "No attendees found in your order" });
    }
    
    if (totalTickets === 0) {
      errors.push({ field: "Tickets", message: "No tickets selected for any attendees" });
    }
    
    // Check for attendees without tickets
    const attendeesWithoutTickets = attendeesForDisplay.filter(attendee => 
      getAttendeeTickets(attendee.attendeeId).length === 0
    );
    
    if (attendeesWithoutTickets.length > 0) {
      attendeesWithoutTickets.forEach(attendee => {
        errors.push({
          field: `${attendee.firstName} ${attendee.lastName}`,
          message: "Has no tickets selected"
        });
      });
    }
    
    if (errors.length > 0) {
      setValidationErrors(errors);
      setShowValidationModal(true);
    } else {
      goToNextStep();
    }
  };

  const getMasonicTitle = (attendee: UnifiedAttendeeData) => {
    return attendee.title || "";
  }

  const getAttendeeTypeLabel = (attendee: UnifiedAttendeeData): string => {
    if (attendee.isPrimary) return "Primary";
    if (attendee.attendeeType === 'mason') return "Mason";
    if (attendee.isPartner) {
      return attendee.partnerType === 'lady' ? "Lady Partner" : "Guest Partner";
    }
    if (attendee.attendeeType === 'guest') return "Guest";
    return "Attendee";
  };

  const openEditModal = (attendeeData: UnifiedAttendeeData, index: number) => {
    setEditingAttendee({ attendeeData, index });
    setIsEditModalOpen(true);
  };

  const openRemoveConfirm = (attendeeId: string) => {
    setRemovingAttendeeId(attendeeId);
    setIsRemoveConfirmOpen(true);
  }

  const updatePackageSelection = useRegistrationStore((s) => s.updatePackageSelection);
  
  const handleConfirmRemoveAttendee = () => {
    if (removingAttendeeId) {
      updatePackageSelection(removingAttendeeId, { ticketDefinitionId: null, selectedEvents: [] });
      removeAttendeeStore(removingAttendeeId);
    }
    setIsRemoveConfirmOpen(false);
    setRemovingAttendeeId(null);
    setEditingAttendee(null);
  }

  // Group tickets by attendee for summary
  const allTicketsByAttendee = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    currentTickets.forEach(ticket => {
      if (!grouped[ticket.attendeeId]) {
        grouped[ticket.attendeeId] = [];
      }
      grouped[ticket.attendeeId].push(ticket);
    });
    return grouped;
  }, [currentTickets]);

  // Prepare summary content
  const renderSummaryContent = () => {
    const summaryData = getOrderReviewSummaryData({
      attendees: attendeesForDisplay,
      registrationType,
      ticketCount: totalTickets,
      totalAmount,
      ticketsByAttendee: allTicketsByAttendee
    });
    
    return <SummaryRenderer {...summaryData} />;
  };

  // Show loading state while tickets are being fetched
  if (isLoadingTickets) {
    return (
      <TwoColumnStepLayout
        summaryContent={<div className="text-center py-8">Loading ticket information...</div>}
        summaryTitle="Step Summary"
        currentStep={4}
        totalSteps={6}
        stepName="Order Review"
      >
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-masonic-gold mx-auto mb-4"></div>
            <p className="text-gray-600">Loading ticket information...</p>
          </div>
        </div>
      </TwoColumnStepLayout>
    );
  }

  return (
    <TwoColumnStepLayout
      summaryContent={renderSummaryContent()}
      summaryTitle="Step Summary"
      currentStep={4}
      totalSteps={6}
      stepName="Order Review"
    >
      <div className="space-y-6">
        <Card className="border-masonic-navy">
          <CardHeader className="bg-masonic-navy text-white">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5" /> Registration Details
              </CardTitle>
              {registrationType && (
                  <Badge variant="outline" className="bg-white/10 text-white">
                    {registrationType.charAt(0).toUpperCase() + registrationType.slice(1)}
                  </Badge>
              )}
            </div>
            <CardDescription className="text-gray-200">
              {attendeesForDisplay.length} {attendeesForDisplay.length === 1 ? "Attendee" : "Attendees"} • {totalTickets}{" "}
              {totalTickets === 1 ? "Ticket" : 'tickets'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {attendeesForDisplay.length === 0 && (
              <Alert className="border-yellow-500 bg-yellow-50">
                  <AlertTriangle className="h-4 w-4 text-yellow-700" />
                  <AlertDescription className="text-yellow-700">
                      No attendees have been added to this registration yet.
                  </AlertDescription>
              </Alert>
            )}
            {attendeesForDisplay.map((attendee, index) => {
              const ticketsForThisAttendee = getAttendeeTickets(attendee.attendeeId);
              const attendeeSubTotal = getAttendeeTotal(attendee.attendeeId);

              return (
                <Card key={attendee.attendeeId} className="border-masonic-lightgold overflow-hidden">
                  <CardHeader className="bg-masonic-lightgold/10 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                          <CardTitle className="text-lg text-masonic-navy">
                          {getMasonicTitle(attendee)} {attendee.firstName} {attendee.lastName}
                          </CardTitle>
                          <CardDescription>
                          {attendee.isPrimary ? "Primary Attendee" : `Additional Attendee`}
                           - ({getAttendeeTypeLabel(attendee)})
                          </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => openEditModal(attendee, index)} className="h-8 px-2">
                              <Edit3 className="mr-1 h-3 w-3" /> Edit
                          </Button>
                          {!attendee.isPrimary && (
                              <Button variant="destructive" size="sm" onClick={() => openRemoveConfirm(attendee.attendeeId)} className="h-8 px-2">
                                  <Trash2 className="mr-1 h-3 w-3" /> Remove
                              </Button>
                          )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3">
                    {attendee.dietaryRequirements && (
                      <p className="text-sm"><span className="font-medium">Dietary:</span> {attendee.dietaryRequirements}</p>
                    )}
                    {attendee.specialNeeds && (
                      <p className="text-sm"><span className="font-medium">Special Needs:</span> {attendee.specialNeeds}</p>
                    )}
                    {attendee.attendeeType === "mason" && attendee.lodgeNameNumber && (
                       <p className="text-sm"><span className="font-medium">Lodge:</span> {attendee.lodgeNameNumber}</p>
                    )}
                    {/* Commenting out linked partner display to avoid type errors for now 
                    {(attendee.attendeeType === "mason" || attendee.attendeeType === "guest") && attendee.relatedAttendeeId && (
                       // Logic to find and display related partner based on relatedAttendeeId would go here
                       // This requires a re-evaluation of how partner data is structured and accessed.
                       // <div className="mt-2 p-2 border rounded-md bg-slate-50 text-sm">
                       //     <p><span className="font-medium">Linked Partner:</span> ... </p>
                       // </div>
                    )} */}
                    
                    <Separator className="my-3"/>

                    <h4 className="font-medium text-masonic-navy">Tickets for this Attendee:</h4>
                    {ticketsForThisAttendee.length === 0 ? (
                      <p className="text-sm text-gray-500 italic">No tickets selected for this attendee.</p>
                    ) : (
                      <ul className="space-y-2">
                        {ticketsForThisAttendee.map(ticket => (
                          <li key={ticket.id} className="flex justify-between items-center text-sm p-2 rounded-md border bg-white">
                            <div>
                              <p className="font-medium">{ticket.name}</p>
                              {ticket.description && <p className="text-xs text-gray-500">{ticket.description}</p>}
                            </div>
                            <div className="flex items-center gap-2">
                              <span>${ticket.price.toFixed(2)}</span>
                              <Button variant="ghost" size="icon" 
                                  onClick={() => {                                  
                                    const currentPackage = packages[ticket.attendeeId] || { ticketDefinitionId: null, selectedEvents: [] };
                                    let updatedTicketSelection: PackageSelectionType;
                                    if (ticket.isPackage) {
                                      updatedTicketSelection = { ticketDefinitionId: null, selectedEvents: [] };
                                    } else {
                                      const originalTicketTypeId = ticket.id.substring(ticket.attendeeId.length + 1);
                                      updatedTicketSelection = {
                                        ticketDefinitionId: null,
                                        selectedEvents: currentPackage.selectedEvents.filter(id => id !== originalTicketTypeId)
                                      };
                                    }
                                    updatePackageSelection(ticket.attendeeId, updatedTicketSelection);
                                  }}
                                  className="h-7 w-7 text-red-500 hover:text-red-700">
                                  <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                    <Separator className="my-3"/>
                    <div className="flex justify-end items-center font-bold text-masonic-navy">
                        <span>Attendee Subtotal: ${attendeeSubTotal.toFixed(2)}</span>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 bg-gray-50 p-6">
            {/* Fee Breakdown */}
            <div className="w-full space-y-2 rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 flex items-center gap-1">
                  Processing Fee
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3 w-3 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-sm">{getFeeDisclaimer()}</p>
                        <div className="mt-2 text-xs space-y-1">
                          <p>• Australian cards: {STRIPE_FEE_CONFIG.domestic.description}</p>
                          <p>• International cards: {STRIPE_FEE_CONFIG.international.description}</p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </span>
                <span className="font-medium">${feeCalculation.stripeFee.toFixed(2)}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between items-center font-bold">
                <span>Total Amount:</span>
                <span className="text-lg">${totalAmount.toFixed(2)}</span>
              </div>
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
                onClick={goToPrevStep}
                className="border-masonic-navy text-masonic-navy hover:bg-masonic-lightblue"
              >
                Previous
              </Button>
              <Button 
                  onClick={handleContinue} 
                  variant={isOrderValid ? "default" : "outline"}
                  className={`${
                    isOrderValid 
                      ? "bg-masonic-gold text-masonic-navy hover:bg-masonic-lightgold" 
                      : "border-masonic-navy text-masonic-navy hover:bg-masonic-lightblue"
                  }`}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Proceed to Payment
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        </Card>

        
        {/* Using the new AttendeeEditModal component */}
        {isEditModalOpen && editingAttendee && (
          <AttendeeEditModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setEditingAttendee(null);
            }}
            attendeeData={editingAttendee.attendeeData}
            attendeeNumber={editingAttendee.index + 1}
          />
        )}

        <AlertDialog open={isRemoveConfirmOpen} onOpenChange={setIsRemoveConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action will remove {editingAttendee ? `${editingAttendee.attendeeData.firstName} ${editingAttendee.attendeeData.lastName}` : (removingAttendeeId ? `the selected attendee` : 'this attendee')} and their selected tickets. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmRemoveAttendee} className="bg-red-600 hover:bg-red-700">
                Remove Attendee
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        
        <ValidationModal
          isOpen={showValidationModal}
          onClose={() => setShowValidationModal(false)}
          errors={validationErrors}
          title="Order Review Required"
          description="Please address the following issues before proceeding to payment:"
        />

      </div>
    </TwoColumnStepLayout>
  )
}

export default OrderReviewStep;
