import React, { useCallback } from 'react';
import MasonForm from './MasonForm';
import PartnerToggle from '../guest/PartnerToggle';
import UnifiedGuestForm from '../guest/unified-guest-form';
import { useRegistrationStore, RegistrationState } from '../../../../lib/registrationStore';
import type { UnifiedAttendeeData } from '../../../../lib/registrationStore';

interface MasonWithPartnerProps {
  attendeeId: string;
  attendeeNumber: number;
  isPrimary?: boolean;
}

/**
 * Container component that orchestrates mason form with partner management
 * Structure:
 * 1. MasonForm - captures main mason attendee details
 * 2. PartnerToggle - handles adding a partner
 * 3. UnifiedGuestForm - captures partner details (if partner exists)
 */
const MasonWithPartner: React.FC<MasonWithPartnerProps> = ({
  attendeeId,
  attendeeNumber,
  isPrimary = false,
}) => {
  // Get store functions - use separate calls to avoid creating new objects
  const addPartnerAttendee = useRegistrationStore((state: RegistrationState) => state.addPartnerAttendee);
  const removeAttendee = useRegistrationStore((state: RegistrationState) => state.removeAttendee);
  
  // Find current mason using the store selector
  const currentMason = useRegistrationStore((state: RegistrationState) => 
    state.attendees.find(att => att.attendeeId === attendeeId && att.attendeeType.toLowerCase() === 'mason')
  ) as UnifiedAttendeeData | undefined;
  
  // Get partner with a stable selector
  const partnerId = currentMason?.partner;
  const partner = useRegistrationStore(useCallback(
    (state: RegistrationState) => partnerId ? state.attendees.find(att => att.attendeeId === partnerId) : null,
    [partnerId]
  ));
  
  if (!currentMason) {
    console.warn(`MasonWithPartner rendered for non-existent/non-mason attendeeId: ${attendeeId}`);
    return null;
  }
  
  const handlePartnerToggle = useCallback(() => {
    if (partner) {
      // Remove existing partner
      removeAttendee(partner.attendeeId);
    } else {
      // Add new partner
      addPartnerAttendee(currentMason.attendeeId);
    }
  }, [partner?.attendeeId, currentMason.attendeeId, addPartnerAttendee, removeAttendee]);
  
  return (
    <>
      {/* 1. Main mason form */}
      <MasonForm 
        attendeeId={attendeeId} 
        attendeeNumber={attendeeNumber}
        isPrimary={isPrimary}
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

export default MasonWithPartner;