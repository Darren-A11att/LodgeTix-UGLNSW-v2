import { useCallback } from 'react';
import { useRegistrationStore } from '@/lib/registrationStore';
import { formatCurrency } from '@/lib/event-utils';

export const useOrderSummary = () => {
  const { 
    registrationType,
    attendees,
    tickets,
    event,
  } = useRegistrationStore();

  const generateSummaryEmail = useCallback(() => {
    const primaryAttendee = attendees.find(a => a.isPrimary);
    if (!primaryAttendee) return '';

    const summary = `
Order Summary
=============

Event: ${event?.name || 'Event'}
Date: ${event?.date || 'TBD'}
Location: ${event?.location || 'TBD'}

Registration Type: ${registrationType}
Primary Contact: ${primaryAttendee.firstName} ${primaryAttendee.lastName}

Attendees (${attendees.length}):
${attendees.map(a => `- ${a.firstName} ${a.lastName} (${a.attendeeType})`).join('\n')}

Total: ${formatCurrency(tickets?.total || 0)}
    `.trim();

    return summary;
  }, [registrationType, attendees, tickets, event]);

  const generateReceiptData = useCallback(() => {
    return {
      orderNumber: `ORD-${Date.now()}`,
      date: new Date().toISOString(),
      registrationType,
      attendeeCount: attendees.length,
      total: tickets?.total || 0,
      event: event?.name || 'Event',
    };
  }, [registrationType, attendees, tickets, event]);

  return {
    generateSummaryEmail,
    generateReceiptData,
  };
};