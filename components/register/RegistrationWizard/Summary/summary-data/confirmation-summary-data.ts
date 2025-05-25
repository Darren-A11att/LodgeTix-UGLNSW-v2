import { formatCurrency } from '@/lib/formatters';

interface ConfirmationSummaryDataProps {
  registrationId?: string;
  paymentStatus?: string;
  totalAmount: number;
  attendeeCount: number;
  ticketCount: number;
  confirmationNumber?: string;
  email?: string;
}

export function getConfirmationSummaryData({ 
  registrationId,
  paymentStatus = 'completed',
  totalAmount,
  attendeeCount,
  ticketCount,
  confirmationNumber,
  email
}: ConfirmationSummaryDataProps) {
  const sections = [];
  
  // Confirmation Details section
  sections.push({
    title: 'Confirmation Details',
    items: [
      {
        label: 'Status',
        value: '✓ Registration Complete',
        isHighlight: true
      },
      ...(confirmationNumber ? [{
        label: 'Confirmation #',
        value: confirmationNumber
      }] : []),
      ...(registrationId ? [{
        label: 'Registration ID',
        value: registrationId.slice(0, 8) + '...'
      }] : [])
    ]
  });
  
  // Order Summary section
  sections.push({
    title: 'Order Summary',
    items: [
      {
        label: 'Total Paid',
        value: formatCurrency(totalAmount),
        isHighlight: true
      },
      {
        label: 'Attendees',
        value: `${attendeeCount} attendee${attendeeCount !== 1 ? 's' : ''}`
      },
      {
        label: 'tickets',
        value: `${ticketCount} ticket${ticketCount !== 1 ? 's' : ''}`
      }
    ]
  });
  
  // Next Steps section
  sections.push({
    title: 'Next Steps',
    items: [
      {
        label: '1.',
        value: 'Check your email for confirmation'
      },
      {
        label: '2.',
        value: 'Save or print your tickets'
      },
      {
        label: '3.',
        value: 'Add event to your calendar'
      }
    ]
  });
  
  // Contact section
  if (email) {
    sections.push({
      title: 'Contact',
      items: [
        {
          label: 'Email sent to',
          value: email
        }
      ]
    });
  }
  
  return {
    sections,
    footer: 'Thank you for your registration!',
    emptyMessage: 'No confirmation details available'
  };
}