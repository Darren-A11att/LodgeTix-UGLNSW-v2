import React, { useState, useEffect, useMemo } from 'react';
import {
  PlusCircle,
  Trash2,
  ChevronUp,
  ChevronDown,
  Minus,
  Plus
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useRegistrationStore, RegistrationState } from '../../../lib/registrationStore';
import type { UnifiedAttendeeData } from '../../../lib/registrationStore';
import type { Attendee as StoreAttendeeType, MasonAttendee as StoreMasonAttendeeType, GuestAttendee as StoreGuestAttendeeType } from '../../../lib/registration-types';
import { default as MasonForm } from '../forms/mason/MasonForm';
import { default as GuestForm } from '../forms/guest/GuestForm';
import TermsAndConditions from '../functions/TermsAndConditions';
import AddRemoveControl from '../functions/AddRemoveControl';
import { SectionHeader } from '../registration/SectionHeader';
import { Button } from "@/components/ui/button";

interface AttendeeDetailsProps {
  agreeToTerms: boolean;
  onAgreeToTermsChange: (checked: boolean) => void;
  nextStep: () => void;
  prevStep: () => void;
  validationErrors: string[];
}

const AttendeeDetails: React.FC<AttendeeDetailsProps> = ({
  agreeToTerms,
  onAgreeToTermsChange,
  nextStep,
  prevStep,
  validationErrors,
}) => {
  const allAttendees = useRegistrationStore((state: RegistrationState) => state.attendees);
  const addPrimaryAttendeeStore = useRegistrationStore((state: RegistrationState) => state.addPrimaryAttendee);
  const addAttendeeStore = useRegistrationStore((state: RegistrationState) => state.addAttendee);
  const removeAttendeeStore = useRegistrationStore((state: RegistrationState) => state.removeAttendee);
  const registrationType = useRegistrationStore((state: RegistrationState) => state.registrationType);
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    console.log("[AttendeeDetails] Initial agreeToTerms prop:", agreeToTerms);
    // Ensure a primary attendee (mason) exists for individual registrations when the step loads
    if (registrationType === 'individual' && !allAttendees.some(att => att.isPrimary)) {
      addPrimaryAttendeeStore();
    }
  }, [registrationType, allAttendees, addPrimaryAttendeeStore]);

  const primaryAttendee = useMemo((): UnifiedAttendeeData | undefined => allAttendees.find(att => att.isPrimary), [allAttendees]);
  
  const masons = useMemo(() => 
    allAttendees.filter((att): att is UnifiedAttendeeData & { attendeeType: 'mason' } => att.attendeeType === 'mason'), 
    [allAttendees]
  );

  const guests = useMemo(() => 
    allAttendees.filter((att): att is UnifiedAttendeeData & { attendeeType: 'guest' } => att.attendeeType === 'guest'), 
    [allAttendees]
  );

  const canAddMason = useMemo(() => {
    const masonCount = masons.length;
    if (registrationType === 'individual') return masonCount < 1;
    return masonCount < 10;
  }, [masons, registrationType]);

  const canAddGuest = useMemo(() => {
    return guests.length < 10; 
  }, [guests]);

  const addMasonButtonLabel = useMemo(() => {
    return masons.length === 0 ? 'Add Primary Mason' : 'Add Additional Mason';
  }, [masons]);

  const handleAddMason = () => {
    if (registrationType === 'individual' && masons.length === 0) {
      addPrimaryAttendeeStore(); 
    } else {
      const newMasonData: Omit<UnifiedAttendeeData, 'attendeeId'> = {
        attendeeType: 'mason',
        title: 'Bro',
        firstName: '',
        lastName: '',
        rank: 'MM',
        ticket: { ticketDefinitionId: null, selectedEvents: [] }
      };
      addAttendeeStore(newMasonData);
    }
  };

  const handleAddGuest = () => {
    const newGuestData: Omit<UnifiedAttendeeData, 'attendeeId'> = {
      attendeeType: 'guest',
      title: 'Mr',
      firstName: '',
      lastName: '',
      contactPreference: 'Directly',
      ticket: { ticketDefinitionId: null, selectedEvents: [] }
    };
    addAttendeeStore(newGuestData);
  };

  const handleContinue = () => {
    setShowErrors(true);
    if (validationErrors.length === 0 && agreeToTerms) {
      nextStep();
    } else {
      console.log("Validation errors or terms not agreed:", validationErrors);
    }
  };

  return (
    <React.Fragment>
      <SectionHeader>
        <h1 className="text-2xl font-bold text-masonic-navy">Attendee Details</h1>
        <div className="masonic-divider"></div>
        <p className="text-gray-600">Please enter the details for each attendee below.</p>
      </SectionHeader>

      {/* Primary Mason (Render if primaryAttendee exists and is a mason) */}
      {primaryAttendee && primaryAttendee.attendeeType === 'mason' && (
        <MasonForm
          key={primaryAttendee.attendeeId}
          attendeeId={primaryAttendee.attendeeId}
          attendeeNumber={1}
          isPrimary={true}
        />
      )}

      {/* Additional Masons (filter out the primary if already rendered) */}
      {masons.filter(mason => !(primaryAttendee && mason.attendeeId === primaryAttendee.attendeeId)).map((mason, idx) => (
        <MasonForm
          key={mason.attendeeId}
          attendeeId={mason.attendeeId}
          attendeeNumber={primaryAttendee && primaryAttendee.attendeeType === 'mason' ? idx + 2 : idx + 1}
          isPrimary={false}
        />
      ))}

      {/* Guests */}
      {guests.map((guest, idx) => (
        <GuestForm
          key={guest.attendeeId}
          attendeeId={guest.attendeeId}
          attendeeNumber={idx + 1}
        />
      ))}

      <div className="mt-8 pt-6 border-t border-slate-200 space-y-6">
        {/* Add/Remove Controls */}
        <div className="flex items-center gap-4">
          <AddRemoveControl
            label="Mason"
            count={masons.length}
            onAdd={handleAddMason}
            onRemove={() => {
              const nonPrimaryMasons = masons.filter(m => !m.isPrimary);
              if (nonPrimaryMasons.length > 0) {
                removeAttendeeStore(nonPrimaryMasons[nonPrimaryMasons.length - 1].attendeeId);
              } else if (masons.length > 0 && masons[0].isPrimary && registrationType !== 'individual' ) {
                removeAttendeeStore(masons[0].attendeeId);
              }
            }}
            min={1}
            max={10}
          />
          <AddRemoveControl
            label="Guest"
            count={guests.length}
            onAdd={handleAddGuest}
            onRemove={() => {
              if (guests.length > 0) {
                removeAttendeeStore(guests[guests.length - 1].attendeeId);
              }
            }}
            min={0}
            max={10}
          />
        </div>
      </div>

      <div className="mt-8 border border-slate-200 rounded-md bg-slate-50">
          <TermsAndConditions
              checked={agreeToTerms}
              onChange={onAgreeToTermsChange}
          />
      </div>

      {showErrors && validationErrors.length > 0 && (
        <div className="mt-6 bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
          <h3 className="font-bold text-lg mb-2">Please address the following errors:</h3>
          <ul className="list-disc list-inside space-y-1">
            {validationErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8 flex justify-between">
        <Button
          variant="outline"
          onClick={prevStep}
          className="border-masonic-navy text-masonic-navy hover:bg-masonic-lightblue"
        >
          Previous
        </Button>
        <Button
          onClick={handleContinue}
          disabled={!agreeToTerms || validationErrors.length > 0}
          className="bg-masonic-navy hover:bg-masonic-blue"
        >
          Continue to Select Tickets
        </Button>
      </div>
    </React.Fragment>
  );
};

export default AttendeeDetails;