import { formatCurrency } from '@/lib/formatters';

interface TicketSummaryDataProps {
  currentTickets: any[];
  orderTotalAmount: number;
  attendees: any[];
  lodgeTicketOrder?: any; // Optional lodge ticket order info
}

export function getTicketSummaryData({ 
  currentTickets, 
  orderTotalAmount, 
  attendees,
  lodgeTicketOrder 
}: TicketSummaryDataProps) {
  // Group tickets by attendee
  const ticketsByAttendee = attendees.reduce((acc, attendee) => {
    const attendeeId = attendee.attendeeId;
    acc[attendeeId] = currentTickets.filter(ticket => ticket.attendeeId === attendeeId);
    return acc;
  }, {} as Record<string, Array<{name: string; price: number}>>);
  
  // Get attendee name by ID
  const getAttendeeName = (attendeeId: string) => {
    const attendee = attendees.find(a => a.attendeeId === attendeeId);
    return attendee ? `${attendee.firstName} ${attendee.lastName}` : 'Unknown Attendee';
  };
  
  // Build summary sections
  const sections = [];
  
  // Handle lodge bulk orders differently
  if (lodgeTicketOrder && currentTickets.some(t => t.attendeeId === 'lodge-bulk')) {
    const lodgeTickets = currentTickets.filter(t => t.attendeeId === 'lodge-bulk');
    
    sections.push({
      title: `Lodge Order (${lodgeTicketOrder.tableCount} table${lodgeTicketOrder.tableCount > 1 ? 's' : ''})`,
      items: [
        {
          label: `Total Attendees`,
          value: `${lodgeTicketOrder.totalTickets} people`
        },
        ...lodgeTickets.map(ticket => ({
          label: ticket.name,
          value: formatCurrency(ticket.price)
        })),
        {
          label: 'Total',
          value: formatCurrency(orderTotalAmount),
          isHighlight: true
        }
      ]
    });
  } else {
    // Add attendee sections for individual selections
    Object.entries(ticketsByAttendee).forEach(([attendeeId, tickets]) => {
      if (tickets.length > 0) {
        const attendeeTotal = tickets.reduce((sum: number, ticket: {name: string; price: number}) => sum + ticket.price, 0);
        
        sections.push({
          title: getAttendeeName(attendeeId),
          items: [
            ...tickets.map((ticket: {name: string; price: number}) => ({
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
  }
  
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
  const footer = lodgeTicketOrder && currentTickets.some(t => t.attendeeId === 'lodge-bulk')
    ? `Tickets for ${lodgeTicketOrder.totalTickets} attendees`
    : currentTickets.length > 0 
      ? `${currentTickets.length} ticket${currentTickets.length !== 1 ? "s" : ""} for ${attendees.length} attendee${attendees.length !== 1 ? "s" : ""}`
      : null;
  
  return {
    sections,
    footer,
    emptyMessage: 'No tickets selected yet'
  };
}