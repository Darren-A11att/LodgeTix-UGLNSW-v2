import React from 'react';
import { useRegistrationStore } from '@/lib/registrationStore';
import { SummaryColumn } from './SummaryColumn';
import { SummarySection } from './SummarySection';
import { SummaryItem } from './SummaryItem';
import { formatCurrency } from '@/lib/formatters';

/**
 * A simple order review summary component that displays key information about the order
 */
export const SimpleOrderReviewSummary: React.FC<{
  currentTickets: any[];
  orderTotalAmount: number;
  showHeader?: boolean;
}> = ({ currentTickets, orderTotalAmount, showHeader = false }) => {
  const { attendees, registrationType } = useRegistrationStore();
  
  // Count attendees by type
  const counts = {
    total: attendees.length,
    masons: attendees.filter(att => att.attendeeType?.toLowerCase() === 'mason').length,
    guests: attendees.filter(att => att.attendeeType?.toLowerCase() === 'guest').length,
    partners: attendees.filter(att => att.isPartner).length
  };
  
  // Count tickets by type
  const ticketCounts = currentTickets.reduce((acc, ticket) => {
    const name = ticket.name;
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return (
    <SummaryColumn
      header={{
        title: 'Order Review',
        step: 4
      }}
      showHeader={showHeader}
    >
      {/* Registration Summary */}
      <SummarySection title="Registration Details">
        <SummaryItem
          label="Registration Type"
          value={registrationType || 'Individual'}
          variant="default"
        />
        <SummaryItem
          label="Total Attendees"
          value={counts.total.toString()}
          variant="highlight"
        />
        {counts.masons > 0 && (
          <SummaryItem
            label="Masons"
            value={counts.masons.toString()}
          />
        )}
        {counts.guests > 0 && (
          <SummaryItem
            label="Guests"
            value={counts.guests.toString()}
          />
        )}
        {counts.partners > 0 && (
          <SummaryItem
            label="Partners"
            value={counts.partners.toString()}
          />
        )}
      </SummarySection>
      
      {/* Ticket Summary */}
      <SummarySection title="Ticket Details">
        <SummaryItem
          label="Total Tickets"
          value={currentTickets.length.toString()}
          variant="highlight"
        />
        {Object.entries(ticketCounts).map(([name, count]) => (
          <SummaryItem
            key={name}
            label={name}
            value={count.toString()}
          />
        ))}
      </SummarySection>
      
      {/* Payment Summary */}
      <SummarySection title="Payment Total">
        <SummaryItem
          label="Order Total"
          value={formatCurrency(orderTotalAmount)}
          variant="highlight"
        />
        <div className="text-xs text-muted-foreground mt-2">
          You will be asked to provide payment details in the next step.
        </div>
      </SummarySection>
      
      <div className="text-xs text-muted-foreground mt-4">
        Review all details carefully before proceeding to payment.
      </div>
    </SummaryColumn>
  );
};