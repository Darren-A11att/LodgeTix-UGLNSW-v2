import React, { useCallback, useEffect, useState } from 'react';
import { useRegistrationStore } from '@/lib/registrationStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { ChevronLeft, ChevronRight, Ticket, Plus, Minus } from 'lucide-react';
import { formatCurrency } from '@/lib/event-utils';
import { cn } from '@/lib/utils';

interface TicketSelectionStepProps {
  onNext: () => void;
  onBack: () => void;
  eventId: string;
}

interface TicketType {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'standard' | 'vip' | 'group';
  eligibility: 'all' | 'mason' | 'guest';
  maxPerOrder: number;
  available: number;
}

// Ticket counter component
const TicketCounter: React.FC<{
  ticketCount: number;
  onAdd: () => void;
  onRemove: () => void;
  maxTickets: number;
  ticketType: string;
}> = ({ ticketCount, onAdd, onRemove, maxTickets, ticketType }) => {
  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={onRemove}
        disabled={ticketCount === 0}
        className="h-8 w-8 p-0"
      >
        <Minus className="h-4 w-4" />
      </Button>
      <span className="w-8 text-center font-medium">{ticketCount}</span>
      <Button
        size="sm"
        variant="outline"
        onClick={onAdd}
        disabled={ticketCount >= maxTickets}
        className="h-8 w-8 p-0"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
};

export const TicketSelectionStep: React.FC<TicketSelectionStepProps> = ({
  onNext,
  onBack,
  eventId,
}) => {
  const { 
    attendees,
    tickets,
    setTickets,
    registrationType,
  } = useRegistrationStore();

  const [availableTickets, setAvailableTickets] = useState<TicketType[]>([]);
  const [selectedTickets, setSelectedTickets] = useState<Record<string, number>>({});
  const [ticketAssignments, setTicketAssignments] = useState<Record<string, string>>({});

  // Load available tickets
  useEffect(() => {
    // This would typically fetch from an API
    const mockTickets: TicketType[] = [
      {
        id: 'standard',
        name: 'Standard Ticket',
        description: 'General admission to the event',
        price: 150,
        category: 'standard',
        eligibility: 'all',
        maxPerOrder: 10,
        available: 100,
      },
      {
        id: 'vip',
        name: 'VIP Ticket',
        description: 'Premium seating with dinner included',
        price: 300,
        category: 'vip',
        eligibility: 'mason',
        maxPerOrder: 5,
        available: 20,
      },
      {
        id: 'group',
        name: 'Group Ticket (10+)',
        description: 'Discounted rate for groups of 10 or more',
        price: 120,
        category: 'group',
        eligibility: 'all',
        maxPerOrder: 50,
        available: 200,
      },
    ];

    setAvailableTickets(mockTickets);
  }, [eventId]);

  // Filter tickets based on eligibility
  const getEligibleTickets = useCallback(() => {
    return availableTickets.filter(ticket => {
      if (ticket.eligibility === 'all') return true;
      
      // Check if we have attendees matching the eligibility
      const hasEligibleAttendees = attendees.some(attendee => {
        if (ticket.eligibility === 'mason') {
          return attendee.attendeeType === 'Mason';
        }
        if (ticket.eligibility === 'guest') {
          return attendee.attendeeType === 'Guest';
        }
        return false;
      });
      
      return hasEligibleAttendees;
    });
  }, [availableTickets, attendees]);

  // Get attendees that can use a specific ticket type
  const getEligibleAttendees = useCallback((ticket: TicketType) => {
    return attendees.filter(attendee => {
      if (ticket.eligibility === 'all') return true;
      if (ticket.eligibility === 'mason') return attendee.attendeeType === 'Mason';
      if (ticket.eligibility === 'guest') return attendee.attendeeType === 'Guest';
      return false;
    });
  }, [attendees]);

  // Handle ticket quantity change
  const handleTicketQuantityChange = useCallback((ticketId: string, quantity: number) => {
    setSelectedTickets(prev => ({
      ...prev,
      [ticketId]: quantity,
    }));

    // Auto-assign tickets to attendees
    const ticket = availableTickets.find(t => t.id === ticketId);
    if (!ticket) return;

    const eligibleAttendees = getEligibleAttendees(ticket);
    const newAssignments = { ...ticketAssignments };

    // Remove previous assignments for this ticket type
    Object.keys(newAssignments).forEach(attendeeId => {
      if (newAssignments[attendeeId] === ticketId) {
        delete newAssignments[attendeeId];
      }
    });

    // Assign to first N eligible attendees
    eligibleAttendees.slice(0, quantity).forEach(attendee => {
      newAssignments[attendee.attendeeId] = ticketId;
    });

    setTicketAssignments(newAssignments);
  }, [availableTickets, getEligibleAttendees, ticketAssignments]);

  // Handle manual ticket assignment
  const handleTicketAssignment = useCallback((attendeeId: string, ticketId: string) => {
    setTicketAssignments(prev => ({
      ...prev,
      [attendeeId]: ticketId,
    }));
  }, []);

  // Calculate total price
  const calculateTotal = useCallback(() => {
    return Object.entries(selectedTickets).reduce((total, [ticketId, quantity]) => {
      const ticket = availableTickets.find(t => t.id === ticketId);
      return total + (ticket?.price || 0) * quantity;
    }, 0);
  }, [selectedTickets, availableTickets]);

  // Validate and continue
  const handleContinue = useCallback(() => {
    // Check all attendees have tickets
    const unassignedAttendees = attendees.filter(
      attendee => !ticketAssignments[attendee.attendeeId]
    );

    if (unassignedAttendees.length > 0) {
      alert(`Please assign tickets to all attendees (${unassignedAttendees.length} unassigned)`);
      return;
    }

    // Save ticket data to store
    setTickets({
      selectedTickets,
      ticketAssignments,
      total: calculateTotal(),
    });

    onNext();
  }, [attendees, ticketAssignments, selectedTickets, calculateTotal, setTickets, onNext]);

  const eligibleTickets = getEligibleTickets();
  const totalTickets = Object.values(selectedTickets).reduce((sum, qty) => sum + qty, 0);

  return (
    <div className="space-y-8">
      {/* Step header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Ticket className="w-6 h-6" />
          Select Tickets
        </h2>
        <p className="text-gray-600 mt-1">
          Choose tickets for {attendees.length} attendee{attendees.length > 1 ? 's' : ''}
        </p>
      </div>

      {/* Ticket selection */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Available Tickets</h3>
        
        {eligibleTickets.map(ticket => {
          const quantity = selectedTickets[ticket.id] || 0;
          const eligibleCount = getEligibleAttendees(ticket).length;
          
          return (
            <Card key={ticket.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{ticket.name}</CardTitle>
                    <CardDescription>{ticket.description}</CardDescription>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-2xl font-bold">
                        {formatCurrency(ticket.price)}
                      </span>
                      <Badge variant="secondary">
                        {ticket.available} available
                      </Badge>
                      {ticket.eligibility !== 'all' && (
                        <Badge variant="outline">
                          {ticket.eligibility} only
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <TicketCounter
                    ticketCount={quantity}
                    onAdd={() => handleTicketQuantityChange(ticket.id, quantity + 1)}
                    onRemove={() => handleTicketQuantityChange(ticket.id, Math.max(0, quantity - 1))}
                    maxTickets={Math.min(ticket.maxPerOrder, eligibleCount)}
                    ticketType={ticket.name}
                  />
                </div>
              </CardHeader>
              
              {quantity > 0 && (
                <CardContent>
                  <p className="text-sm text-gray-600 mb-2">
                    Assign to attendees:
                  </p>
                  <div className="space-y-2">
                    {getEligibleAttendees(ticket).map(attendee => (
                      <label
                        key={attendee.attendeeId}
                        className="flex items-center gap-2"
                      >
                        <input
                          type="checkbox"
                          checked={ticketAssignments[attendee.attendeeId] === ticket.id}
                          onChange={(e) => {
                            if (e.target.checked) {
                              handleTicketAssignment(attendee.attendeeId, ticket.id);
                            } else {
                              handleTicketAssignment(attendee.attendeeId, '');
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">
                          {attendee.firstName} {attendee.lastName}
                          {attendee.attendeeType === 'Mason' && attendee.rank && 
                            ` (${attendee.rank})`
                          }
                        </span>
                      </label>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(selectedTickets).map(([ticketId, quantity]) => {
              const ticket = availableTickets.find(t => t.id === ticketId);
              if (!ticket || quantity === 0) return null;
              
              return (
                <div key={ticketId} className="flex justify-between">
                  <span>
                    {ticket.name} × {quantity}
                  </span>
                  <span className="font-medium">
                    {formatCurrency(ticket.price * quantity)}
                  </span>
                </div>
              );
            })}
            
            <Separator />
            
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>{formatCurrency(calculateTotal())}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendee assignment status */}
      <Card>
        <CardHeader>
          <CardTitle>Attendee Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {attendees.map(attendee => {
              const assignedTicketId = ticketAssignments[attendee.attendeeId];
              const assignedTicket = availableTickets.find(t => t.id === assignedTicketId);
              
              return (
                <div key={attendee.attendeeId} className="flex items-center justify-between">
                  <span className="text-sm">
                    {attendee.firstName} {attendee.lastName}
                  </span>
                  {assignedTicket ? (
                    <Badge variant="success">{assignedTicket.name}</Badge>
                  ) : (
                    <Badge variant="outline">No ticket</Badge>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t">
        <Button
          variant="outline"
          onClick={onBack}
          className="gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </Button>
        
        <Button
          onClick={handleContinue}
          disabled={totalTickets === 0 || totalTickets !== attendees.length}
          className="gap-2"
        >
          Continue to Review
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};