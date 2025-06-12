"use client"

import { useState, useMemo } from "react"
import { useRegistrationStore, UnifiedAttendeeData } from '../../../../lib/registrationStore'
// Removed unused import: useLocationStore
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { ChevronRight, CreditCard, Info, Users, Edit3, Trash2, AlertTriangle } from "lucide-react"
// Removed unused imports from registration-types
// Removed unused import: PhoneInput
// Removed unused import: ScrollArea
import { Alert, AlertDescription } from "@/components/ui/alert"
// Removed unused import: SectionHeader
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
import { getEnhancedTicketSummaryData } from '../Summary/summary-data/ticket-summary-data-enhanced';
import { SummaryRenderer } from '../Summary/SummaryRenderer';
import { ValidationModal } from '@/components/ui/validation-modal';
import type { OrderSummary } from '@/lib/registration-metadata-types';
import { formatCurrency } from '@/lib/formatters';

// Note: Using dynamic function_id from registration store instead of hardcoded parent event ID

function OrderReviewStep() {
  const registrationType = useRegistrationStore((s) => s.registrationType);
  const allStoreAttendees = useRegistrationStore((s) => s.attendees);
  const functionId = useRegistrationStore((s) => s.functionId);
  const attendeeSelections = useRegistrationStore((s) => s.attendeeSelections);
  const orderSummary = useRegistrationStore((s) => s.orderSummary);
  const lodgeBulkSelection = useRegistrationStore((s) => s.lodgeBulkSelection);
  
  // Remove the fetchTicketsAndPackages useEffect - no longer needed with enhanced data
  
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
  const removeAttendeeSelection = useRegistrationStore((s) => s.removeAttendeeSelection);

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

  // Use enhanced ticket summary data for rich package content display
  const enhancedSummaryData = useMemo(() => {
    console.log("[OrderReviewStep] Debug - attendeeSelections:", attendeeSelections);
    console.log("[OrderReviewStep] Debug - orderSummary:", orderSummary);
    
    return getEnhancedTicketSummaryData({
      attendeeSelections,
      orderSummary,
      lodgeBulkSelection,
      attendees: allStoreAttendees
    });
  }, [attendeeSelections, orderSummary, lodgeBulkSelection, allStoreAttendees]);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAttendee, setEditingAttendee] = useState<{ attendeeData: UnifiedAttendeeData; index: number } | null>(null);
  const [isRemoveConfirmOpen, setIsRemoveConfirmOpen] = useState(false);
  const [removingAttendeeId, setRemovingAttendeeId] = useState<string | null>(null);
  
  // Validation modal state
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ field: string; message: string }[]>([]);
  

  const getAttendeeTickets = (attendeeId: string) => {
    const selection = attendeeSelections[attendeeId];
    if (!selection) return [];
    
    // Combine packages and individual tickets for display
    const tickets = [];
    
    // Add packages with their included tickets
    selection.packages.forEach((pkg, index) => {
      tickets.push({
        id: pkg.packageRecordId,
        name: pkg.package.name,
        price: pkg.subtotal,
        attendeeId,
        isPackage: true,
        description: `Package including: ${pkg.package.includedTicketNames?.join(", ") || "No items"}`,
        packageRecordId: pkg.packageRecordId
      });
    });
    
    // Add individual tickets
    selection.individualTickets.forEach((ticket, index) => {
      tickets.push({
        id: ticket.ticketRecordId,
        name: ticket.ticket.name,
        price: ticket.subtotal,
        attendeeId,
        isPackage: false,
        description: ticket.ticket.description || 'Individual ticket',
        ticketRecordId: ticket.ticketRecordId
      });
    });
    
    return tickets;
  }

  const getAttendeeTotal = (attendeeId: string) => {
    const selection = attendeeSelections[attendeeId];
    return selection ? selection.attendeeSubtotal : 0;
  }

  const subtotal = orderSummary?.subtotal || 0
  const totalAmount = orderSummary?.totalAmount || 0
  const totalTickets = orderSummary?.totalTickets || 0
  
  // Order summary is maintained automatically by enhanced store actions
  // No manual update needed

  // Check if order is valid using enhanced data
  const isOrderValid = attendeesForDisplay.length > 0 && totalTickets > 0;
  
  const handleContinue = () => {
    const errors: { field: string; message: string }[] = [];
    
    if (attendeesForDisplay.length === 0) {
      errors.push({ field: "Attendees", message: "No attendees found in your order" });
    }
    
    if (totalTickets === 0) {
      errors.push({ field: "Tickets", message: "No tickets selected for any attendees" });
    }
    
    // Check for attendees without tickets using enhanced data
    const attendeesWithoutTickets = attendeesForDisplay.filter(attendee => {
      const selection = attendeeSelections[attendee.attendeeId];
      return !selection || (selection.packages.length === 0 && selection.individualTickets.length === 0);
    });
    
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
      return "Partner";
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

  const handleConfirmRemoveAttendee = () => {
    if (removingAttendeeId) {
      // Remove all attendee selections first, then remove attendee
      const selection = attendeeSelections[removingAttendeeId];
      if (selection) {
        // Remove all packages
        selection.packages.forEach(pkg => {
          removeAttendeeSelection(removingAttendeeId, pkg.packageRecordId, 'package');
        });
        // Remove all individual tickets
        selection.individualTickets.forEach(ticket => {
          removeAttendeeSelection(removingAttendeeId, ticket.ticketRecordId, 'ticket');
        });
      }
      removeAttendeeStore(removingAttendeeId);
    }
    setIsRemoveConfirmOpen(false);
    setRemovingAttendeeId(null);
    setEditingAttendee(null);
  }

  // Prepare summary content using enhanced data
  const renderSummaryContent = () => {
    return <SummaryRenderer {...enhancedSummaryData} />;
  };

  // No loading state needed - using enhanced data from store

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
                              <span>{formatCurrency(ticket.price)}</span>
                              <Button variant="ghost" size="icon" 
                                  onClick={() => {
                                    // Use enhanced removal function with proper item type detection
                                    const itemType = ticket.isPackage ? 'package' : 'ticket';
                                    const itemId = ticket.isPackage ? ticket.packageRecordId : ticket.ticketRecordId;
                                    
                                    if (itemId) {
                                      removeAttendeeSelection(ticket.attendeeId, itemId, itemType);
                                    }
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
                        <span>Attendee Subtotal: {formatCurrency(attendeeSubTotal)}</span>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 bg-gray-50 p-6">
            {/* Order Total */}
            <div className="w-full space-y-2 rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex justify-between items-center font-bold">
                <span>Order Total:</span>
                <span className="text-lg">{formatCurrency(totalAmount)}</span>
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
