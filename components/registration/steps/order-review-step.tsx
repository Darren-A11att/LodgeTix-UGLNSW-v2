"use client"

import { useState } from "react"
import { useRegistrationStore } from "@/lib/registration-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Check, ChevronRight, CreditCard, Info, Ticket, User, Users, Edit3, Trash2, AlertTriangle } from "lucide-react"
import type { Attendee, MasonAttendee, GuestAttendee, PartnerAttendee } from "@/lib/registration-types"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { SectionHeader } from "../SectionHeader"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter,
  DialogTrigger 
} from "@/components/ui/dialog"
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
import { MasonForm } from "../forms/mason-form"
import { GuestForm } from "../forms/guest-form"
import { PartnerForm } from "../forms/partner-form"

export function OrderReviewStep() {
  const registrationType = useRegistrationStore((s) => s.registrationType);
  const primaryAttendee = useRegistrationStore((s) => s.attendeeDetails.primaryAttendee);
  const additionalAttendees = useRegistrationStore((s) => s.attendeeDetails.additionalAttendees);
  const currentTickets = useRegistrationStore((s) => s.ticketSelection.tickets);
  const setPrimaryAttendee = useRegistrationStore((s) => s.setPrimaryAttendee);
  const updateAdditionalAttendee = useRegistrationStore((s) => s.updateAdditionalAttendee);
  const removeAdditionalAttendee = useRegistrationStore((s) => s.removeAdditionalAttendee);
  const removeTicket = useRegistrationStore((s) => s.removeTicket);
  const goToNextStep = useRegistrationStore((s) => s.goToNextStep);
  const goToPrevStep = useRegistrationStore((s) => s.goToPrevStep);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAttendee, setEditingAttendee] = useState<Attendee | null>(null);
  const [isRemoveConfirmOpen, setIsRemoveConfirmOpen] = useState(false);
  const [removingAttendeeId, setRemovingAttendeeId] = useState<string | null>(null);

  const allAttendees: Attendee[] = [
    ...(primaryAttendee ? [primaryAttendee] : []),
    ...additionalAttendees,
  ]

  const handlePrevious = () => {
    goToPrevStep();
  }

  const handleContinue = () => {
    goToNextStep();
  }

  const getAttendeeTickets = (attendeeId: string) => {
    return currentTickets.filter((ticket) => ticket.attendeeId === attendeeId)
  }

  const getAttendeeTotal = (attendeeId: string) => {
    return getAttendeeTickets(attendeeId).reduce((sum, ticket) => sum + ticket.price, 0)
  }

  const totalAmount = currentTickets.reduce((sum, ticket) => sum + ticket.price, 0)
  const totalTickets = currentTickets.length

  const getMasonicTitle = (attendee: Attendee) => {
    if (attendee.type === "mason") {
      return (attendee as MasonAttendee).masonicTitle
    }
    return (attendee as GuestAttendee | PartnerAttendee).title || ""
  }

  const getAttendeeTypeLabel = (attendee: Attendee) => {
    if (attendee.type === "mason") {
      const mason = attendee as MasonAttendee;
      return mason.grandRank || mason.rank
    }
    if (attendee.type === "guest") {
      return "Guest"
    }
    if (attendee.type === "partner") {
      return "Partner"
    }
    return ""
  }

  const openEditModal = (attendee: Attendee) => {
    setEditingAttendee(attendee);
    setIsEditModalOpen(true);
  }

  const handleUpdateAttendee = (updatedData: Attendee) => {
    if (primaryAttendee && updatedData.id === primaryAttendee.id) {
      setPrimaryAttendee(updatedData as MasonAttendee);
    } else {
      updateAdditionalAttendee(updatedData.id, updatedData);
    }
    setIsEditModalOpen(false);
    setEditingAttendee(null);
  };

  const openRemoveConfirm = (attendeeId: string) => {
    setRemovingAttendeeId(attendeeId);
    setIsRemoveConfirmOpen(true);
  }

  const handleConfirmRemoveAttendee = () => {
    if (removingAttendeeId) {
      currentTickets
        .filter(ticket => ticket.attendeeId === removingAttendeeId)
        .forEach(ticket => removeTicket(ticket.id));
      removeAdditionalAttendee(removingAttendeeId);
    }
    setIsRemoveConfirmOpen(false);
    setRemovingAttendeeId(null);
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
            {registrationType && (
                <Badge variant="outline" className="bg-white/10 text-white">
                {registrationType.replace("-", " ")}
                </Badge>
            )}
          </div>
          <CardDescription className="text-gray-200">
            {allAttendees.length} {allAttendees.length === 1 ? "Attendee" : "Attendees"} • {totalTickets}{" "}
            {totalTickets === 1 ? "Ticket" : "Tickets"}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {allAttendees.length === 0 && (
            <Alert className="border-yellow-500 bg-yellow-50">
                <AlertTriangle className="h-4 w-4 text-yellow-700" />
                <AlertDescription className="text-yellow-700">
                    No attendees have been added to this registration yet.
                </AlertDescription>
            </Alert>
          )}
          {allAttendees.map((attendee, index) => {
            const ticketsForThisAttendee = getAttendeeTickets(attendee.id);
            const attendeeSubTotal = getAttendeeTotal(attendee.id);

            return (
              <Card key={attendee.id} className="border-masonic-lightgold overflow-hidden">
                <CardHeader className="bg-masonic-lightgold/10 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg text-masonic-navy">
                        {getMasonicTitle(attendee)} {attendee.firstName} {attendee.lastName}
                        </CardTitle>
                        <CardDescription>
                        {index === 0 ? "Primary Attendee" : `Additional Attendee ${index + 1}`} - ({getAttendeeTypeLabel(attendee)})
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEditModal(attendee)} className="h-8 px-2">
                            <Edit3 className="mr-1 h-3 w-3" /> Edit
                        </Button>
                        {index > 0 && (
                            <Button variant="destructive" size="sm" onClick={() => openRemoveConfirm(attendee.id)} className="h-8 px-2">
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
                  {attendee.type === "mason" && (attendee as MasonAttendee).lodgeName && (
                     <p className="text-sm"><span className="font-medium">Lodge:</span> {(attendee as MasonAttendee).lodgeName} {(attendee as MasonAttendee).lodgeNumber && `No. ${(attendee as MasonAttendee).lodgeNumber}`}</p>
                  )}
                  {(attendee.type === "mason" || attendee.type === "guest") && (attendee as MasonAttendee | GuestAttendee).hasPartner && (attendee as MasonAttendee | GuestAttendee).partner && (
                      <div className="mt-2 p-2 border rounded-md bg-slate-50 text-sm">
                          <p><span className="font-medium">Linked Partner:</span> {(attendee as MasonAttendee | GuestAttendee).partner?.title} {(attendee as MasonAttendee | GuestAttendee).partner?.firstName} {(attendee as MasonAttendee | GuestAttendee).partner?.lastName}</p>
                      </div>
                  )}
                  
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
                            <Button variant="ghost" size="icon" onClick={() => removeTicket(ticket.id)} className="h-7 w-7 text-red-500 hover:text-red-700">
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
              onClick={handlePrevious}
              className="border-masonic-navy text-masonic-navy hover:bg-masonic-lightblue"
            >
              Previous
            </Button>
            <Button 
                onClick={handleContinue} 
                className="bg-masonic-gold text-masonic-navy hover:bg-masonic-lightgold"
                disabled={allAttendees.length === 0 || totalTickets === 0}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Proceed to Payment
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      </Card>

      {editingAttendee && (
        <Dialog open={isEditModalOpen} onOpenChange={(isOpen) => { if (!isOpen) { setEditingAttendee(null); } setIsEditModalOpen(isOpen); }}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Edit Attendee Details</DialogTitle>
                    <DialogDescription>
                        Update the details for {getMasonicTitle(editingAttendee)} {editingAttendee.firstName} {editingAttendee.lastName}.
                    </DialogDescription>
                </DialogHeader>
                
                {editingAttendee.type === "mason" && (
                    <MasonForm 
                        attendeeType="primary"
                        initialData={editingAttendee as MasonAttendee} 
                        onSubmit={handleUpdateAttendee} 
                        onFormClose={() => { setIsEditModalOpen(false); setEditingAttendee(null); }}
                        isDialog={true}
                    />
                )}
                {editingAttendee.type === "guest" && (
                    <GuestForm 
                        initialData={editingAttendee as GuestAttendee} 
                        onSubmit={handleUpdateAttendee} 
                        onFormClose={() => { setIsEditModalOpen(false); setEditingAttendee(null); }}
                        isDialog={true}
                    />
                )}
                {editingAttendee.type === "partner" && (
                    <PartnerForm 
                        initialData={editingAttendee as PartnerAttendee} 
                        onSubmit={handleUpdateAttendee} 
                        onFormClose={() => { setIsEditModalOpen(false); setEditingAttendee(null); }}
                        relatedAttendeeId={(editingAttendee as PartnerAttendee).relatedAttendeeId}
                        isDialog={true}
                    />
                )}
            </DialogContent>
        </Dialog>
      )}

      <AlertDialog open={isRemoveConfirmOpen} onOpenChange={setIsRemoveConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will remove the attendee and all their selected tickets. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRemovingAttendeeId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmRemoveAttendee} className="bg-red-600 hover:bg-red-700">
              Remove Attendee
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  )
}
