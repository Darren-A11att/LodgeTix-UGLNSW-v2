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
    // Handle both direct attendeeId and nested attendeeId properties
    const attendeeId = (attendee as any).attendeeId || attendee.attendeeId;
    if (attendeeId) {
      acc[attendeeId] = currentTickets.filter(ticket => ticket.attendeeId === attendeeId);
    }
    return acc;
  }, {} as Record<string, Array<{name: string; price: number; attendeeId?: string}>>);
  
  // Get attendee name by ID
  const getAttendeeName = (attendeeId: string) => {
    const attendee = attendees.find(a => {
      const id = (a as any).attendeeId || a.attendeeId;
      return id === attendeeId;
    });
    return attendee ? `${attendee.firstName} ${attendee.lastName}` : 'Unknown Attendee';
  };
  
  // Build summary sections
  const sections = [];
  
  // First show attendee information if available but no tickets selected
  if (attendees.length > 0 && currentTickets.length === 0) {
    // Show attendees who need tickets
    const attendeeItems = attendees.map(attendee => {
      const name = `${attendee.firstName || ''} ${attendee.lastName || ''}`.trim() || 'Unnamed Attendee';
      const type = attendee.attendeeType || 'Guest';
      return {
        label: name,
        value: `${type} - No tickets selected`
      };
    });
    
    sections.push({
      title: 'Attendees Requiring Tickets',
      items: attendeeItems
    });
  }
  
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
        const attendeeTotal = tickets.reduce((sum: number, ticket: any) => sum + (ticket.price || 0), 0);
        
        sections.push({
          title: getAttendeeName(attendeeId),
          items: [
            ...tickets.map((ticket: any) => ({
              label: ticket.name || 'Unknown Ticket',
              value: formatCurrency(ticket.price || 0)
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
    emptyMessage: attendees.length === 0 ? 'No attendees added yet' : 'No tickets selected yet'
  };
}