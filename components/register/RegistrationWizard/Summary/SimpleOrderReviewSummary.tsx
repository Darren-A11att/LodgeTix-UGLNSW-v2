import React from 'react';
import { useRegistrationStore } from '@/lib/registrationStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { ClipboardList, Users, CreditCard, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * A simple order review summary component that displays key information about the order
 */
export const SimpleOrderReviewSummary: React.FC<{
  currentTickets: any[];
  orderTotalAmount: number;
}> = ({ currentTickets, orderTotalAmount }) => {
  const { attendees, registrationType } = useRegistrationStore();
  
  // Count attendees by type
  const counts = {
    total: attendees.length,
    masons: attendees.filter(att => att.attendeeType?.toLowerCase() === 'mason').length,
    guests: attendees.filter(att => att.attendeeType?.toLowerCase() === 'guest').length,
    partners: attendees.filter(att => att.isPartner).length
  };
  
  return (
    <Card className="border-masonic-gold">
      <CardHeader className="bg-masonic-gold/10">
        <CardTitle>Order Summary</CardTitle>
        <CardDescription>
          Please review your order details
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 py-4">
        {/* Registration Summary */}
        <div className="border-b pb-3">
          <h3 className="font-medium text-sm mb-2 flex items-center">
            <ClipboardList className="w-4 h-4 mr-2 text-masonic-navy" />
            Registration Summary
          </h3>
          <div className="text-sm space-y-1 pl-6">
            <div className="flex justify-between">
              <span>Registration Type:</span>
              <span className="font-medium capitalize">{registrationType}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Attendees:</span>
              <span className="font-medium">{counts.total}</span>
            </div>
            <div className="flex justify-between">
              <span>Masons:</span>
              <span>{counts.masons}</span>
            </div>
            <div className="flex justify-between">
              <span>Guests:</span>
              <span>{counts.guests}</span>
            </div>
            <div className="flex justify-between">
              <span>Partners:</span>
              <span>{counts.partners}</span>
            </div>
          </div>
        </div>
        
        {/* Ticket Summary */}
        <div className="border-b pb-3">
          <h3 className="font-medium text-sm mb-2 flex items-center">
            <ShoppingCart className="w-4 h-4 mr-2 text-masonic-navy" />
            Ticket Summary
          </h3>
          <div className="text-sm space-y-1 pl-6">
            <div className="flex justify-between">
              <span>Total Tickets:</span>
              <span className="font-medium">{currentTickets.length}</span>
            </div>
            {/* Count by ticket type */}
            {currentTickets.reduce((acc, ticket) => {
              const name = ticket.name;
              acc[name] = (acc[name] || 0) + 1;
              return acc;
            }, {} as Record<string, number>)
              && Object.entries(currentTickets.reduce((acc, ticket) => {
                const name = ticket.name;
                acc[name] = (acc[name] || 0) + 1;
                return acc;
              }, {} as Record<string, number>)).map(([name, count]) => (
                <div key={name} className="flex justify-between">
                  <span>{name}:</span>
                  <span>{count}</span>
                </div>
              ))
            }
          </div>
        </div>
        
        {/* Payment Summary */}
        <div>
          <h3 className="font-medium text-sm mb-2 flex items-center">
            <CreditCard className="w-4 h-4 mr-2 text-masonic-navy" />
            Payment Summary
          </h3>
          <div className="text-sm space-y-1 pl-6">
            <div className="flex justify-between font-bold">
              <span>Order Total:</span>
              <span>${orderTotalAmount}</span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              You will be asked to provide payment details in the next step.
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-gray-50 p-4 text-sm text-gray-600">
        <p>Review all details carefully before proceeding to payment.</p>
      </CardFooter>
    </Card>
  );
};