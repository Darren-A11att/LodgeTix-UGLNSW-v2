import React, { useMemo } from 'react';
import { useRegistrationStore } from '@/lib/registrationStore';
import { SummaryColumn } from './SummaryColumn';
import { SummarySection } from './SummarySection';
import { SummaryItem } from './SummaryItem';
import { formatCurrency } from '@/lib/formatters';
import { CreditCard, ShieldCheck, Lock, Check } from 'lucide-react';

// Placeholder ticket definitions (should be imported from a shared source eventually)
const ticketTypesMinimal = [
  { id: "d5891f32-a57c-48f3-b71a-3832eb0c8f21", name: "Installation Ceremony", price: 75 },
  { id: "f2c9b7e1-d85a-4e03-9c53-4b7f62e8d9a3", name: "Grand Banquet", price: 150 },
  { id: "7ae31d05-6f8b-49ec-b2c8-18df3ef7d9b6", name: "Farewell Brunch", price: 45 },
  { id: "3c5b1e8d-947a-42f6-b837-0d72c614a53f", name: "City Tour", price: 60 },
];
const ticketPackagesMinimal = [
  { id: "a9e3d210-7f65-4c8b-9d1a-f5b83e92c615", name: "Complete Package", price: 250, includes: ["d5891f32-a57c-48f3-b71a-3832eb0c8f21", "f2c9b7e1-d85a-4e03-9c53-4b7f62e8d9a3", "7ae31d05-6f8b-49ec-b2c8-18df3ef7d9b6", "3c5b1e8d-947a-42f6-b837-0d72c614a53f"] },
  { id: "b821c7d5-3e5f-49a2-8d16-7e09bf432a87", name: "Ceremony & Banquet", price: 200, includes: ["d5891f32-a57c-48f3-b71a-3832eb0c8f21", "f2c9b7e1-d85a-4e03-9c53-4b7f62e8d9a3"] },
  { id: "c743e9f1-5a82-4d07-b6c3-8901fdae5243", name: "Social Package", price: 180, includes: ["f2c9b7e1-d85a-4e03-9c53-4b7f62e8d9a3", "7ae31d05-6f8b-49ec-b2c8-18df3ef7d9b6", "3c5b1e8d-947a-42f6-b837-0d72c614a53f"] },
];

/**
 * A simple payment summary component for the payment step
 */
export const SimplePaymentSummary: React.FC<{
  totalAmount: number;
  isPaymentValid?: boolean;
  showHeader?: boolean;
}> = ({ totalAmount, isPaymentValid = false, showHeader = false }) => {
  const { attendees } = useRegistrationStore();
  
  // Calculate ticket breakdown by attendee
  const attendeeBreakdowns = useMemo(() => {
    return attendees.map(attendee => {
      const tickets: Array<{ name: string; price: number; isPackage: boolean }> = [];
      let subtotal = 0;
      
      if (attendee.ticket) {
        const { ticketDefinitionId, selectedEvents } = attendee.ticket;
        
        if (ticketDefinitionId) {
          // Package selection
          const pkgInfo = ticketPackagesMinimal.find(p => p.id === ticketDefinitionId);
          if (pkgInfo) {
            tickets.push({ 
              name: pkgInfo.name, 
              price: pkgInfo.price, 
              isPackage: true
            });
            subtotal += pkgInfo.price;
          }
        } else if (selectedEvents) {
          // Individual ticket selections
          selectedEvents.forEach(eventId => {
            const eventInfo = ticketTypesMinimal.find(e => e.id === eventId);
            if (eventInfo) {
              tickets.push({ 
                name: eventInfo.name, 
                price: eventInfo.price, 
                isPackage: false
              });
              subtotal += eventInfo.price;
            }
          });
        }
      }
      
      return {
        attendee,
        tickets,
        subtotal
      };
    }).filter(breakdown => breakdown.tickets.length > 0);
  }, [attendees]);
  
  const totalTickets = attendeeBreakdowns.reduce((sum, b) => sum + b.tickets.length, 0);
  
  return (
    <SummaryColumn
      header={{
        title: 'Payment Summary',
        step: 5
      }}
      showHeader={showHeader}
    >
      {/* Attendee Breakdown */}
      {attendeeBreakdowns.length > 0 && (
        <SummarySection title="Order Details">
          <div className="space-y-4">
            {attendeeBreakdowns.map((breakdown, index) => (
              <div key={breakdown.attendee.attendeeId} className={index > 0 ? "pt-4 border-t border-gray-200" : ""}>
                <h4 className="font-medium text-sm mb-2">
                  {breakdown.attendee.firstName} {breakdown.attendee.lastName}
                  <span className="text-muted-foreground"> ({breakdown.attendee.attendeeType})</span>
                </h4>
                <div className="space-y-1 ml-4">
                  {breakdown.tickets.map((ticket, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {ticket.isPackage && "• "}
                        {ticket.name}
                        {ticket.isPackage && " Package"}
                      </span>
                      <span>{formatCurrency(ticket.price)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm font-medium pt-1">
                    <span>Subtotal</span>
                    <span>{formatCurrency(breakdown.subtotal)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SummarySection>
      )}
      
      {/* Order Total */}
      <SummarySection title="Order Total">
        <div className="py-4 text-center">
          <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
          <p className="text-2xl font-bold">{formatCurrency(totalAmount)}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {totalTickets} ticket{totalTickets !== 1 ? "s" : ""} for {attendees.length} attendee{attendees.length !== 1 ? "s" : ""}
          </p>
        </div>
      </SummarySection>
      
      {/* Payment Status */}
      <SummarySection title="Payment Status">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            {isPaymentValid ? (
              <div className="bg-green-100 p-2 rounded-full">
                <Check className="h-4 w-4 text-green-600" />
              </div>
            ) : (
              <div className="bg-amber-100 p-2 rounded-full">
                <CreditCard className="h-4 w-4 text-amber-600" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm">
              {isPaymentValid ? 'Payment Information Valid' : 'Payment Information Required'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {isPaymentValid 
                ? 'Your payment information has been validated. Click "Process Payment" to complete your order.' 
                : 'Please fill in your payment details to continue.'}
            </p>
          </div>
        </div>
      </SummarySection>
      
      {/* Secure Payment Notice */}
      <SummarySection title="Secure Payment">
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-3 w-3 text-green-600 flex-shrink-0" />
            <span>All payment information is encrypted</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-3 w-3 text-green-600 flex-shrink-0" />
            <span>Processed securely by Stripe</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-3 w-3 text-green-600 flex-shrink-0" />
            <span>Your card details are never stored on our servers</span>
          </div>
        </div>
      </SummarySection>
      
      <div className="text-xs text-muted-foreground mt-4 text-center">
        You will receive email confirmation after successful payment.
      </div>
    </SummaryColumn>
  );
};