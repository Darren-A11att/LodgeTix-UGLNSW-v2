import { useCallback, useMemo } from 'react';
import { useRegistrationStore } from '@/lib/registrationStore';
import { AttendeeData } from '../types';
import { useShallow } from 'zustand/react/shallow';
import { useAttendeeData } from './useAttendeeData';

export const usePartnerManager = (attendeeId: string) => {
  const { 
    attendees, 
    addPartnerAttendee, 
    removeAttendee,
    updateAttendee
  } = useRegistrationStore(
    useShallow((state) => ({
      attendees: state.attendees,
      addPartnerAttendee: state.addPartnerAttendee,
      removeAttendee: state.removeAttendee,
      updateAttendee: state.updateAttendee,
    }))
  );

  const attendee = useMemo(
    () => attendees.find((a) => a.attendeeId === attendeeId),
    [attendees, attendeeId]
  );

  const partner = useMemo(() => {
    if (!attendee?.partner) return null;
    return attendees.find((a) => a.attendeeId === attendee.partner);
  }, [attendees, attendee]);

  const hasPartner = !!attendee?.partner;

  const togglePartner = useCallback(() => {
    if (partner) {
      // Remove partner
      removeAttendee(partner.attendeeId);
      updateAttendee(attendeeId, { partner: null });
    } else {
      // Add partner
      const newPartnerId = addPartnerAttendee(attendeeId);
      if (newPartnerId) {
        updateAttendee(attendeeId, { partner: newPartnerId });
      }
    }
  }, [partner, attendeeId, addPartnerAttendee, removeAttendee, updateAttendee]);

  const updatePartnerRelationship = useCallback(
    (relationship: AttendeeData['relationship']) => {
      if (partner) {
        updateAttendee(partner.attendeeId, { relationship });
      }
    },
    [partner, updateAttendee]
  );

  return {
    attendee,
    partner,
    hasPartner,
    togglePartner,
    updatePartnerRelationship,
  };
};

// Partner data synchronization utility
export const usePartnerDataSync = (attendeeId: string) => {
  const { attendee, partner } = usePartnerManager(attendeeId);
  const { updateMultipleFields } = useAttendeeData(partner?.attendeeId || '');

  const syncPartnerData = useCallback(
    (fields: string[]) => {
      if (!attendee || !partner) return;
      
      const updates: Partial<AttendeeData> = {};
      fields.forEach(field => {
        updates[field] = attendee[field];
      });
      
      updateMultipleFields(updates);
    },
    [attendee, partner, updateMultipleFields]
  );

  return { syncPartnerData };
};