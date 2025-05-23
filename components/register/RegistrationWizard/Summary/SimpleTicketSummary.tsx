import React from 'react';
import { useRegistrationStore } from '@/lib/registrationStore';
import { SummaryColumn } from './SummaryColumn';
import { SummarySection } from './SummarySection';
import { SummaryItem } from './SummaryItem';
import { formatCurrency } from '@/lib/formatters';

/**
 * A simple order summary for the ticket selection step
 */
export const SimpleTicketSummary: React.FC<{
  currentTickets: any[];
  orderTotalAmount: number;
  showHeader?: boolean;
}> = ({ currentTickets, orderTotalAmount, showHeader = false }) => {
  const { attendees } = useRegistrationStore();
  
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
  
  return (
    <SummaryColumn
      header={{
        title: 'Order Summary',
        step: 3
      }}
      showHeader={showHeader}
    >
      {Object.keys(ticketsByAttendee).length > 0 ? (
        <>
          {/* Tickets by attendee */}
          {Object.entries(ticketsByAttendee).map(([attendeeId, tickets]) => {
            if (!tickets.length) return null;
            
            const attendeeTotal = tickets.reduce((sum, ticket) => sum + ticket.price, 0);
            
            return (
              <SummarySection key={attendeeId} title={getAttendeeName(attendeeId)}>
                {tickets.map(ticket => (
                  <SummaryItem
                    key={ticket.id}
                    label={ticket.name}
                    value={formatCurrency(ticket.price)}
                  />
                ))}
                <SummaryItem
                  label="Subtotal"
                  value={formatCurrency(attendeeTotal)}
                  variant="highlight"
                />
              </SummarySection>
            );
          })}
          
          {/* Order total */}
          <SummarySection title="Order Total">
            <SummaryItem
              label="Total Amount"
              value={formatCurrency(orderTotalAmount)}
              variant="highlight"
            />
          </SummarySection>
        </>
      ) : (
        <SummarySection title="Tickets">
          <div className="text-sm text-muted-foreground italic">
            No tickets selected yet
          </div>
        </SummarySection>
      )}
      
      <div className="text-xs text-muted-foreground mt-4">
        {currentTickets.length} ticket{currentTickets.length !== 1 ? "s" : ""} for {attendees.length}{" "}
        attendee{attendees.length !== 1 ? "s" : ""}
      </div>
    </SummaryColumn>
  );
};