import { formatCurrency } from '@/lib/formatters';
import { UnifiedAttendeeData } from '@/lib/registrationStore';

interface OrderReviewSummaryDataProps {
  attendees: UnifiedAttendeeData[];
  registrationType?: string | null;
  ticketCount: number;
  totalAmount: number;
  ticketsByAttendee: Record<string, any[]>;
}

export function getOrderReviewSummaryData({ 
  attendees,
  registrationType,
  ticketCount,
  totalAmount,
  ticketsByAttendee
}: OrderReviewSummaryDataProps) {
  const sections = [];
  
  // Registration Info section
  const getFormattedRegistrationType = () => {
    if (registrationType === 'individual') return 'Myself & Others';
    if (registrationType === 'lodge') return 'Lodge';
    if (registrationType === 'delegation') return 'Official Delegation';
    return registrationType || 'Not selected';
  };
  
  sections.push({
    title: 'Registration Info',
    items: [
      {
        label: 'Type',
        value: getFormattedRegistrationType()
      },
      {
        label: 'Total Attendees',
        value: attendees.length.toString()
      }
    ]
  });
  
  // Ticket Summary section
  const ticketItems = [];
  
  // Count tickets by type
  const ticketCounts: Record<string, number> = {};
  Object.values(ticketsByAttendee).forEach(tickets => {
    tickets.forEach(ticket => {
      if (ticketCounts[ticket.name]) {
        ticketCounts[ticket.name]++;
      } else {
        ticketCounts[ticket.name] = 1;
      }
    });
  });
  
  // Add ticket counts to items
  Object.entries(ticketCounts).forEach(([ticketName, count]) => {
    ticketItems.push({
      label: ticketName,
      value: `${count} ticket${count !== 1 ? 's' : ''}`
    });
  });
  
  if (ticketItems.length > 0) {
    sections.push({
      title: 'Ticket Summary',
      items: [
        ...ticketItems,
        {
          label: 'Total Tickets',
          value: ticketCount.toString(),
          isHighlight: true
        }
      ]
    });
  }
  
  // Order Total section
  sections.push({
    title: 'Order Total',
    items: [
      {
        label: 'Amount Due',
        value: formatCurrency(totalAmount),
        isHighlight: true
      }
    ]
  });
  
  return {
    sections,
    footer: 'Review your order details before proceeding to payment',
    emptyMessage: 'No order details available'
  };
}