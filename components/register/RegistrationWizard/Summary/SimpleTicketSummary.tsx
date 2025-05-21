import React from 'react';
import { useRegistrationStore } from '@/lib/registrationStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { ShoppingCart, Banknote } from 'lucide-react';

/**
 * A simple order summary for the ticket selection step
 */
export const SimpleTicketSummary: React.FC<{
  currentTickets: any[];
  orderTotalAmount: number;
}> = ({ currentTickets, orderTotalAmount }) => {
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
    <Card className="bg-[#faf7f2] border-[#e9e2d9]">
      <CardHeader className="pb-2">
        <CardTitle>Order Summary</CardTitle>
        <CardDescription>
          {currentTickets.length} ticket{currentTickets.length !== 1 ? "s" : ""} for {attendees.length}{" "}
          attendee{attendees.length !== 1 ? "s" : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {/* Ticket summary by attendee */}
        {Object.keys(ticketsByAttendee).length > 0 ? (
          <div className="space-y-2">
            {Object.entries(ticketsByAttendee).map(([attendeeId, tickets]) => {
              if (!tickets.length) return null;
              
              const attendeeTotal = tickets.reduce((sum, ticket) => sum + ticket.price, 0);
              
              return (
                <div key={attendeeId} className="pb-2">
                  <h3 className="font-medium">{getAttendeeName(attendeeId)}</h3>
                  {tickets.map(ticket => (
                    <div key={ticket.id} className="flex justify-between items-center py-1">
                      <span>{ticket.name}</span>
                      <span>${ticket.price}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center font-medium pt-1">
                    <span>Subtotal</span>
                    <span>${attendeeTotal}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500 italic">No tickets selected yet</p>
        )}
        
        {/* Order total */}
        <div className="border-t pt-3 mt-2">
          <div className="flex justify-between items-center font-bold">
            <span>Order Total</span>
            <span>${orderTotalAmount}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="text-sm text-gray-600 pt-0">
        <p>Select tickets for each attendee before proceeding to the next step.</p>
      </CardFooter>
    </Card>
  );
};