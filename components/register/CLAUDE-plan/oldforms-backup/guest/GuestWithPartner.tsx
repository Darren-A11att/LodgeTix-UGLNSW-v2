import React, { useCallback } from 'react';
import UnifiedGuestForm from './unified-guest-form';
import PartnerToggle from './PartnerToggle';
import { useRegistrationStore, RegistrationState } from '../../../../lib/registrationStore';
import type { UnifiedAttendeeData } from '../../../../lib/registrationStore';

interface GuestWithPartnerProps {
  attendeeId: string;
  attendeeNumber: number;
}

/**
 * Container component that orchestrates guest form with partner management
 * Structure:
 * 1. UnifiedGuestForm - captures main guest attendee details
 * 2. PartnerToggle - handles adding a partner
 * 3. UnifiedGuestForm - captures partner details (if partner exists)
 */
const GuestWithPartner: React.FC<GuestWithPartnerProps> = ({
  attendeeId,
  attendeeNumber,
}) => {
  // Get store functions - use separate calls to avoid creating new objects
  const addPartnerAttendee = useRegistrationStore((state: RegistrationState) => state.addPartnerAttendee);
  const removeAttendee = useRegistrationStore((state: RegistrationState) => state.removeAttendee);
  const attendees = useRegistrationStore((state: RegistrationState) => state.attendees);
  
  // Find current attendee and partner directly
  const currentAttendee = attendees.find(att => att.attendeeId === attendeeId) as UnifiedAttendeeData | undefined;
  const partner = currentAttendee?.partner ? attendees.find(att => att.attendeeId === currentAttendee.partner) : null;
  
  if (!currentAttendee || currentAttendee.attendeeType !== 'Guest') {
    console.warn(`GuestWithPartner rendered for non-guest attendee: ${attendeeId}`);
    return null;
  }
  
  const handlePartnerToggle = useCallback(() => {
    if (partner) {
      // Remove existing partner
      removeAttendee(partner.attendeeId);
    } else {
      // Add new partner
      addPartnerAttendee(currentAttendee.attendeeId);
    }
  }, [partner?.attendeeId, currentAttendee.attendeeId, addPartnerAttendee, removeAttendee]);
  
  // Don't render container for partners - they should use UnifiedGuestForm directly
  if (currentAttendee.isPartner) {
    return <UnifiedGuestForm attendeeId={attendeeId} attendeeNumber={attendeeNumber} />;
  }
  
  return (
    <>
      {/* 1. Main guest form */}
      <UnifiedGuestForm 
        attendeeId={attendeeId} 
        attendeeNumber={attendeeNumber} 
      />
      
      {/* 2. Partner toggle */}
      {!partner && (
        <div className="mb-8 text-center">
          <PartnerToggle 
            hasPartner={false}
            onToggle={handlePartnerToggle}
          />
        </div>
      )}
      
      {/* 3. Partner form (reusing UnifiedGuestForm) */}
      {partner && (
        <UnifiedGuestForm
          attendeeId={partner.attendeeId}
          attendeeNumber={attendeeNumber + 1}
        />
      )}
    </>
  );
};

export default GuestWithPartner;