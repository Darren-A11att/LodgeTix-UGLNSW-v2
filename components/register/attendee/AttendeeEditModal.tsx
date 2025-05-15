import React from 'react';
import { X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useRegistrationStore, UnifiedAttendeeData } from '../../../lib/registrationStore';
import MasonForm from '../forms/mason/MasonForm';
import GuestForm from '../forms/guest/GuestForm';
import LadyPartnerForm from '../forms/mason/LadyPartnerForm';
import GuestPartnerForm from '../forms/guest/GuestPartnerForm';

interface AttendeeEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  attendeeData: UnifiedAttendeeData;
  attendeeNumber: number;
}

const AttendeeEditModal: React.FC<AttendeeEditModalProps> = ({
  isOpen,
  onClose,
  attendeeData,
  attendeeNumber
}) => {
  // Get primary attendee data for context (needed by some forms)
  const primaryAttendee = useRegistrationStore(state => 
    state.attendees.find(att => att.isPrimary)
  );

  // Get partner data if applicable
  const partnerData = useRegistrationStore(state => {
    if (attendeeData.partner) {
      return state.attendees.find(att => att.attendeeId === attendeeData.partner);
    }
    return null;
  });

  // Get the attendee that this partner belongs to (for partners)
  const relatedAttendee = useRegistrationStore(state => {
    if (attendeeData.partnerOf) {
      return state.attendees.find(att => att.attendeeId === attendeeData.partnerOf);
    }
    return null;
  });

  const updateAttendee = useRegistrationStore(state => state.updateAttendee);
  const removeAttendee = useRegistrationStore(state => state.removeAttendee);

  // Helper function to get the appropriate form based on attendee type
  const renderAttendeeForm = () => {
    const attendeeType = attendeeData.attendeeType.toLowerCase();
    
    // Handle Mason
    if (attendeeType === "mason") {
      return (
        <MasonForm
          attendeeId={attendeeData.attendeeId}
          attendeeNumber={attendeeNumber}
          isPrimary={attendeeData.isPrimary}
        />
      );
    }
    
    // Handle Guest  
    if (attendeeType === "guest") {
      return (
        <GuestForm
          attendeeId={attendeeData.attendeeId}
          attendeeNumber={attendeeNumber}
        />
      );
    }
    
    // Handle Lady Partner
    if (attendeeType === "ladypartner" || 
        (attendeeData.isPartner && attendeeData.partnerType === 'lady')) {
      
      const relatedMason = relatedAttendee;
      
      return (
        <LadyPartnerForm
          partner={{
            id: attendeeData.attendeeId,
            title: attendeeData.title || '',
            firstName: attendeeData.firstName || '',
            lastName: attendeeData.lastName || '',
            relationship: attendeeData.relationship || '',
            contactPreference: attendeeData.contactPreference,
            mobile: attendeeData.primaryPhone,
            email: attendeeData.primaryEmail,
            dietaryRequirements: attendeeData.dietaryRequirements,
            specialNeeds: attendeeData.specialNeeds
          }}
          id={attendeeData.attendeeId}
          updateField={(id: string, field: string, value: string | boolean) => {
            updateAttendee(id, { [field]: value });
          }}
          relatedMasonName={relatedMason ? `${relatedMason.firstName || ''} ${relatedMason.lastName || ''}`.trim() : ''}
          onRemove={() => {
            removeAttendee(attendeeData.attendeeId);
            onClose();
          }}
          primaryAttendeeData={primaryAttendee}
          relatedMasonContactPreference={relatedMason?.contactPreference || ''}
        />
      );
    }
    
    // Handle Guest Partner
    if (attendeeType === "guestpartner" || 
        (attendeeData.isPartner && attendeeData.partnerType === 'guest')) {
      
      const relatedGuest = relatedAttendee;
      
      return (
        <GuestPartnerForm
          partnerData={{
            id: attendeeData.attendeeId,
            title: attendeeData.title || '',
            firstName: attendeeData.firstName || '',
            lastName: attendeeData.lastName || '',
            relationship: attendeeData.relationship || '',
            contactPreference: attendeeData.contactPreference,
            mobile: attendeeData.primaryPhone,
            email: attendeeData.primaryEmail,
            dietaryRequirements: attendeeData.dietaryRequirements,
            specialNeeds: attendeeData.specialNeeds
          }}
          relatedGuestName={relatedGuest ? `${relatedGuest.firstName || ''} ${relatedGuest.lastName || ''}`.trim() : ''}
          primaryAttendeeData={primaryAttendee}
          updateField={(id: string, field: string, value: any) => {
            updateAttendee(id, { [field]: value });
          }}
          onRemove={() => {
            removeAttendee(attendeeData.attendeeId);
            onClose();
          }}
          relatedGuestContactPreference={relatedGuest?.contactPreference || undefined}
        />
      );
    }
    
    return <div className="text-center text-gray-500">Unknown attendee type</div>;
  };

  // Get the attendee type for the dialog title
  const getAttendeeTypeLabel = () => {
    if (attendeeData.isPrimary) return "Primary Attendee";
    
    const attendeeType = attendeeData.attendeeType.toLowerCase();
    
    if (attendeeType === 'mason') return "Mason";
    if (attendeeType === 'guest') return "Guest";
    
    if (attendeeData.isPartner) {
      // Determine partner type from attendeeType or partnerType field
      if (attendeeType === 'ladypartner' || attendeeData.partnerType === 'lady') {
        return "Lady Partner";
      }
      if (attendeeType === 'guestpartner' || attendeeData.partnerType === 'guest') {
        return "Guest Partner";
      }
    }
    
    return "Attendee";
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl md:max-w-3xl lg:max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="sticky top-0 z-10 bg-white p-6 pb-0 border-b">
          <DialogTitle className="text-xl font-bold text-masonic-navy">
            Edit {getAttendeeTypeLabel()}: {attendeeData.firstName} {attendeeData.lastName}
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Make changes to the attendee details below. All changes are saved automatically.
          </DialogDescription>
        </DialogHeader>
        <div className="p-6">
          {renderAttendeeForm()}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AttendeeEditModal;