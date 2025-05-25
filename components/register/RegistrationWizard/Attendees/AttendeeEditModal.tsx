import React, { useState, useEffect } from 'react';
import { Pencil, Users } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRegistrationStore, UnifiedAttendeeData, selectRegistrationType, selectAttendees } from '../../../../lib/registrationStore';
import { MasonForm } from '@/components/register/Forms/mason/Layouts/MasonForm';
import { GuestForm } from '@/components/register/Forms/guest/Layouts/GuestForm';
// Partner forms are now handled by the same GuestForm
// Partner forms are now handled by the same GuestForm

interface AttendeeEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  attendeeData: UnifiedAttendeeData;
}

const AttendeeEditModal: React.FC<AttendeeEditModalProps> = ({
  isOpen,
  onClose,
  attendeeData,
}) => {
  const [editableAttendeeData, setEditableAttendeeData] = useState<UnifiedAttendeeData>(attendeeData);

  useEffect(() => {
    setEditableAttendeeData(attendeeData);
  }, [attendeeData]);

  const registrationType = useRegistrationStore(selectRegistrationType);
  const allAttendees = useRegistrationStore(selectAttendees);
  const totalTickets = useRegistrationStore(state => 
    // @ts-expect-error Property 'ticket' does not exist on type 'UnifiedAttendeeData'.
    state.attendees.reduce((acc, att) => acc + (att.ticket?.selectedEvents?.length || 0) + (att.ticket?.ticketDefinitionId ? 1 : 0), 0)
  );
  const storeTotalTickets = useRegistrationStore(state => {
    return state.attendees.flatMap(attendee => {
        // @ts-expect-error Property 'ticket' does not exist on type 'UnifiedAttendeeData'.
        if (!attendee.ticket) return [];
        // @ts-expect-error Property 'ticket' does not exist on type 'UnifiedAttendeeData'.
        const { ticketDefinitionId, selectedEvents } = attendee.ticket;
        if (ticketDefinitionId) return [{ type: 'package' }];
        return selectedEvents?.map((eventId: string) => ({ type: 'event' })) || [];
    }).length;
  });

  const primaryAttendee = useRegistrationStore(state => 
    state.attendees.find(att => att.isPrimary)
  );

  const partnerData = useRegistrationStore(state => {
    if (editableAttendeeData.partner) {
      return state.attendees.find(att => att.attendeeId === editableAttendeeData.partner);
    }
    return null;
  });

  const relatedAttendee = useRegistrationStore(state => {
    if (editableAttendeeData.partnerOf) {
      return state.attendees.find(att => att.attendeeId === editableAttendeeData.partnerOf);
    }
    return null;
  });

  const updateAttendeeInStore = useRegistrationStore(state => state.updateAttendee);
  const removeAttendee = useRegistrationStore(state => state.removeAttendee);

  const handleLocalFormChange = (updatedFields: Partial<UnifiedAttendeeData>) => {
    setEditableAttendeeData(prev => ({ ...prev, ...updatedFields }));
  };

  const renderAttendeeForm = () => {
    const currentData = editableAttendeeData;
    const attendeeType = currentData.attendeeType.toLowerCase();
    
    if (attendeeType === "mason") {
      return (
        <MasonForm
          attendeeId={currentData.attendeeId}
          attendeeNumber={0}
          isPrimary={currentData.isPrimary}
        />
      );
    }
    
    // Handle all guest types (including legacy partner types)
    if (attendeeType === "guest" || attendeeType === "ladypartner" || attendeeType === "guestpartner") {
      return (
        <GuestForm
          attendeeId={currentData.attendeeId}
          attendeeNumber={0}
          isPrimary={currentData.isPrimary}
          isEditMode={true} // Always show all fields in edit modal
        />
      );
    }
    
    return <div className="text-center text-gray-500">Unknown attendee type: {currentData.attendeeType}</div>;
  };

  const getAttendeeTypeBadgeLabel = () => {
    const type = editableAttendeeData.attendeeType.toLowerCase();
    if (type === 'mason') return "Mason";
    
    // Handle legacy partner types
    if (type === 'ladypartner' || type === 'guestpartner') {
      return "Partner";
    }
    
    if (type === 'guest') {
      // Check if it's a partner
      if (editableAttendeeData.isPartner) {
        return "Partner";
      }
      return "Guest";
    }
    
    return editableAttendeeData.attendeeType;
  };

  const handleSaveChanges = () => {
    updateAttendeeInStore(editableAttendeeData.attendeeId, editableAttendeeData);
    onClose();
  };

  const handleDiscardChanges = () => {
    setEditableAttendeeData(attendeeData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        handleDiscardChanges();
      } else {
      }
    }}>
      <DialogContent className="sm:max-w-2xl md:max-w-3xl lg:max-w-4xl p-0 max-h-[90dvh] max-w-[95dvw] flex flex-col">
        <Card className="shadow-none border border-masonic-lightgold rounded-lg flex flex-col flex-1 min-h-0">
          <CardHeader className="bg-masonic-navy text-white rounded-t-lg p-3 sm:p-4 flex-shrink-0">
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-2">
                <Pencil className="h-5 w-5 sm:h-6 sm:w-6" />
                <div>
                  <DialogTitle asChild>
                    <CardTitle className="text-lg sm:text-xl font-semibold">Edit Attendee</CardTitle>
                  </DialogTitle>
                  <DialogDescription asChild>
                    <CardDescription className="text-xs sm:text-sm text-slate-300">
                      Please edit the details for the attendee below.
                    </CardDescription>
                  </DialogDescription>
                </div>
              </div>
              <Badge variant="outline" className="text-gray-200 border-gray-400 hover:bg-gray-700">
                {getAttendeeTypeBadgeLabel()}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="p-0 flex-1 flex flex-col min-h-0">
            <div className="flex justify-between items-center px-3 sm:px-4 py-2 bg-gray-50 border-b flex-shrink-0">
              <h3 className="text-base sm:text-lg font-semibold">
                {editableAttendeeData.isPartner ? "Partner Details" : "Your Details"}
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-2 sm:p-4 transform-origin-top scale-[0.95] sm:scale-100 min-h-0">
              {renderAttendeeForm()}
            </div>
          </CardContent>

          <CardFooter className="p-4 sm:p-6 flex justify-end space-x-3 bg-gray-50 border-t border-masonic-lightgold flex-shrink-0">
            <Button 
              variant="outline" 
              onClick={handleDiscardChanges}
              className="bg-white text-masonic-navy border-masonic-navy hover:bg-masonic-navy/5 w-28 sm:w-40 text-sm"
            >
              Discard
            </Button>
            <Button 
              variant="default" 
              onClick={handleSaveChanges} 
              className="bg-masonic-navy text-white hover:bg-masonic-navy/90 w-28 sm:w-40 text-sm"
            >
              Save & Close
            </Button>
          </CardFooter>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

export default AttendeeEditModal;