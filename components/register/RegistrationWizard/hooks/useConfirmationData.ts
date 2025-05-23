import { useState, useEffect, useCallback } from 'react';
import { useRegistrationStore } from '@/lib/registrationStore';

export const useConfirmationData = (registrationId: string) => {
  const { attendees, event, tickets } = useRegistrationStore();
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  // Generate QR code for tickets
  useEffect(() => {
    const generateQrCode = async () => {
      try {
        const response = await fetch('/api/generate-qr-code', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ registrationId }),
        });
        
        const { qrCodeUrl } = await response.json();
        setQrCodeUrl(qrCodeUrl);
      } catch (error) {
        console.error('Failed to generate QR code:', error);
      }
    };

    generateQrCode();
  }, [registrationId]);

  // Format registration data for display
  const getRegistrationSummary = useCallback(() => {
    const primaryAttendee = attendees.find(a => a.isPrimary);
    const totalTickets = Object.values(tickets?.selectedTickets || {}).reduce(
      (sum, qty) => sum + qty, 
      0
    );

    return {
      registrationId,
      primaryContact: primaryAttendee,
      attendeeCount: attendees.length,
      ticketCount: totalTickets,
      eventName: event?.name,
      eventDate: event?.date,
      eventLocation: event?.location,
      totalAmount: tickets?.total || 0,
      qrCodeUrl,
    };
  }, [attendees, event, tickets, registrationId, qrCodeUrl]);

  return { getRegistrationSummary };
};