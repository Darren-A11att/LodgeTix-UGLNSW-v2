import { useCallback } from 'react';
import { useRegistrationStore } from '@/lib/registrationStore';

export const usePaymentValidation = () => {
  const { attendees, tickets } = useRegistrationStore();

  const validatePaymentData = useCallback(() => {
    const errors: string[] = [];

    // Validate attendees
    if (attendees.length === 0) {
      errors.push('No attendees found');
    }

    // Validate tickets
    if (!tickets || Object.keys(tickets.selectedTickets).length === 0) {
      errors.push('No tickets selected');
    }

    // Validate primary attendee
    const primaryAttendee = attendees.find(a => a.isPrimary);
    if (!primaryAttendee) {
      errors.push('No primary contact found');
    }

    // Validate ticket assignments
    const unassignedAttendees = attendees.filter(
      a => !tickets?.ticketAssignments?.[a.attendeeId]
    );
    if (unassignedAttendees.length > 0) {
      errors.push('Some attendees have no tickets assigned');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }, [attendees, tickets]);

  return { validatePaymentData };
};