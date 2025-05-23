import { formatCurrency } from '@/lib/formatters';

interface TicketSummaryDataProps {
  currentTickets: any[];
  orderTotalAmount: number;
  attendees: any[];
}

export function getTicketSummaryData({ 
  currentTickets, 
  orderTotalAmount, 
  attendees 
}: TicketSummaryDataProps) {
  // Group tickets by attendee
  const ticketsByAttendee = attendees.reduce((acc, attendee) => {
    const attendeeId = attendee.attendeeId;
    acc[attendeeId] = currentTickets.filter(ticket => ticket.attendeeId === attendeeId);
    return acc;
  }, {} as Record<string, any[]>);
  
  // Get attendee name by ID
  const getAttendeeName = (attendeeId: string) => {
    const attendee = attendees.find(a => a.attendeeId === attendeeId);
    return attendee ? `${attendee.firstName} ${attendee.lastName}` : 'Unknown Attendee';
  };
  
  // Build summary sections
  const sections = [];
  
  // Add attendee sections
  Object.entries(ticketsByAttendee).forEach(([attendeeId, tickets]) => {
    if (tickets.length > 0) {
      const attendeeTotal = tickets.reduce((sum, ticket) => sum + ticket.price, 0);
      
      sections.push({
        title: getAttendeeName(attendeeId),
        items: [
          ...tickets.map(ticket => ({
            label: ticket.name,
            value: formatCurrency(ticket.price)
          })),
          {
            label: 'Subtotal',
            value: formatCurrency(attendeeTotal),
            isHighlight: true
          }
        ]
      });
    }
  });
  
  // Add order total section
  if (sections.length > 0) {
    sections.push({
      title: 'Order Total',
      items: [
        {
          label: 'Total Amount',
          value: formatCurrency(orderTotalAmount),
          isHighlight: true
        }
      ]
    });
  }
  
  // Add summary footer
  const footer = currentTickets.length > 0 
    ? `${currentTickets.length} ticket${currentTickets.length !== 1 ? "s" : ""} for ${attendees.length} attendee${attendees.length !== 1 ? "s" : ""}`
    : null;
  
  return {
    sections,
    footer,
    emptyMessage: 'No tickets selected yet'
  };
}