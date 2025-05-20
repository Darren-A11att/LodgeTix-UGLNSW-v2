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
import { OneColumnStepLayout } from "../Layouts/OneColumnStepLayout"

// Sample ticket types and packages - these should ideally be imported from a shared location
// For now, defining minimal versions here for type safety in ticket derivation logic
const ticketTypesMinimal = [
  { id: "installation", name: "Installation Ceremony", price: 75 },
  { id: "banquet", name: "Grand Banquet", price: 150 },
  { id: "brunch", name: "Farewell Brunch", price: 45 },
  { id: "tour", name: "City Tour", price: 60 },
];
const ticketPackagesMinimal = [
  { id: "complete", name: "Complete Package", price: 250, includes: ["installation", "banquet", "brunch", "tour"] },
  { id: "ceremony-banquet", name: "Ceremony & Banquet", price: 200, includes: ["installation", "banquet"] },
  { id: "social", name: "Social Package", price: 180, includes: ["banquet", "brunch", "tour"] },
];

function OrderReviewStep() {
  const registrationType = useRegistrationStore((s) => s.registrationType);
  const allStoreAttendees = useRegistrationStore((s) => s.attendees);
  
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

  const [currentTickets, setCurrentTickets] = useState<Array<any & { attendeeId: string; price: number; name: string; description?: string; isPackage?: boolean }>>([]);

  useEffect(() => {
    const derivedTickets = allStoreAttendees.flatMap(attendee => {
        if (!attendee.ticket) return [];
        const { ticketDefinitionId, selectedEvents } = attendee.ticket;
        const attendeeId = attendee.attendeeId;
        let tickets: Array<any & { attendeeId: string; price: number; name: string; description?: string; isPackage?: boolean }> = [];

        if (ticketDefinitionId) {
            const pkgInfo = ticketPackagesMinimal.find(p => p.id === ticketDefinitionId);
            if (pkgInfo) {
                tickets.push({ 
                    id: `${attendeeId}-${pkgInfo.id}`, 
                    name: pkgInfo.name, 
                    price: pkgInfo.price, 
                    attendeeId, 
                    isPackage: true,
                    description: `Package including: ${pkgInfo.includes.join(", ")}`
                });
            }
        } else {
            selectedEvents?.forEach(eventId => {
                const eventInfo = ticketTypesMinimal.find(e => e.id === eventId);
                if (eventInfo) {
                    tickets.push({ 
                        id: `${attendeeId}-${eventInfo.id}`, 
                        name: eventInfo.name, 
                        price: eventInfo.price, 
                        attendeeId, 
                        isPackage: false,
                        description: `Individual ticket for ${eventInfo.name}`
                    });
                }
            });
        }
        return tickets;
    });
    setCurrentTickets(derivedTickets);
    // console.log("[OrderReviewStep] Derived tickets for display:", derivedTickets);
  }, [allStoreAttendees]);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAttendee, setEditingAttendee] = useState<{ attendeeData: UnifiedAttendeeData; index: number } | null>(null);
  const [isRemoveConfirmOpen, setIsRemoveConfirmOpen] = useState(false);
  const [removingAttendeeId, setRemovingAttendeeId] = useState<string | null>(null);
  

  const getAttendeeTickets = (attendeeId: string) => {
    return currentTickets.filter((ticket) => ticket.attendeeId === attendeeId)
  }

  const getAttendeeTotal = (attendeeId: string) => {
    return getAttendeeTickets(attendeeId).reduce((sum, ticket) => sum + ticket.price, 0)
  }

  const totalAmount = currentTickets.reduce((sum, ticket) => sum + ticket.price, 0)
  const totalTickets = currentTickets.length

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

  const handleConfirmRemoveAttendee = () => {
    if (removingAttendeeId) {
      updateAttendeeStore(removingAttendeeId, { ticket: { ticketDefinitionId: null, selectedEvents: [] } });
      removeAttendeeStore(removingAttendeeId);
    }
    setIsRemoveConfirmOpen(false);
    setRemovingAttendeeId(null);
    setEditingAttendee(null);
  }

  return (
    <OneColumnStepLayout>
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
              {totalTickets === 1 ? "Ticket" : "Tickets"}
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
                                    const currentAttendeeTicketData = allStoreAttendees.find(a => a.attendeeId === ticket.attendeeId)?.ticket || { ticketDefinitionId: null, selectedEvents: [] };
                                    let updatedTicketSelection: PackageSelectionType;
                                    if (ticket.isPackage) {
                                      updatedTicketSelection = { ticketDefinitionId: null, selectedEvents: [] };
                                    } else {
                                      const originalTicketTypeId = ticket.id.substring(ticket.attendeeId.length + 1);
                                      updatedTicketSelection = {
                                        ticketDefinitionId: null,
                                        selectedEvents: currentAttendeeTicketData.selectedEvents.filter(id => id !== originalTicketTypeId)
                                      };
                                    }
                                    updateAttendeeStore(ticket.attendeeId, { ticket: updatedTicketSelection });
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
                onClick={goToPrevStep}
                className="border-masonic-navy text-masonic-navy hover:bg-masonic-lightblue"
              >
                Previous
              </Button>
              <Button 
                  onClick={goToNextStep} 
                  className="bg-masonic-gold text-masonic-navy hover:bg-masonic-lightgold"
                  disabled={attendeesForDisplay.length === 0 || totalTickets === 0}
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

      </div>
    </OneColumnStepLayout>
  )
}

export default OrderReviewStep;
