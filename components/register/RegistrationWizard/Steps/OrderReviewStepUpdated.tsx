import React, { useCallback } from 'react';
import { useRegistrationStore } from '@/lib/registrationStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft, 
  ChevronRight, 
  User, 
  Ticket, 
  CreditCard,
  Edit2,
  Check
} from 'lucide-react';
import { formatCurrency } from '@/lib/event-utils';
import { cn } from '@/lib/utils';

interface OrderReviewStepProps {
  onNext: () => void;
  onBack: () => void;
  onEditStep: (step: string) => void;
}

export const OrderReviewStep: React.FC<OrderReviewStepProps> = ({
  onNext,
  onBack,
  onEditStep,
}) => {
  const { 
    registrationType,
    attendees,
    tickets,
    event,
  } = useRegistrationStore();

  // Calculate order totals
  const calculateTotals = useCallback(() => {
    const ticketTotal = tickets?.total || 0;
    const fees = ticketTotal * 0.03; // 3% processing fee
    const total = ticketTotal + fees;

    return {
      subtotal: ticketTotal,
      fees,
      total,
    };
  }, [tickets]);

  const totals = calculateTotals();

  // Get primary attendee
  const primaryAttendee = attendees.find(a => a.isPrimary);

  // Get registration type display name
  const getRegistrationTypeDisplay = () => {
    switch (registrationType) {
      case 'individual':
        return 'Individual Registration';
      case 'lodge':
        return 'Lodge Registration';
      case 'delegation':
        return 'Official Delegation';
      default:
        return 'Registration';
    }
  };

  // Get attendee summary
  const getAttendeeSummary = () => {
    const masonCount = attendees.filter(a => a.attendeeType === 'Mason').length;
    const guestCount = attendees.filter(a => a.attendeeType === 'Guest').length;
    const partnerCount = attendees.filter(a => a.isPartner).length;
    
    const parts = [];
    if (masonCount > 0) parts.push(`${masonCount} Mason${masonCount > 1 ? 's' : ''}`);
    if (guestCount > 0) parts.push(`${guestCount} Guest${guestCount > 1 ? 's' : ''}`);
    if (partnerCount > 0) parts.push(`${partnerCount} Partner${partnerCount > 1 ? 's' : ''}`);
    
    return parts.join(', ');
  };

  return (
    <div className="space-y-8">
      {/* Step header */}
      <div>
        <h2 className="text-2xl font-bold">Review Your Order</h2>
        <p className="text-gray-600 mt-1">
          Please review all details before proceeding to payment
        </p>
      </div>

      {/* Event details */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Event Details</CardTitle>
              <CardDescription>
                {event?.name || 'Grand Installation'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Date</span>
              <span>{event?.date || 'Saturday, November 25, 2024'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Location</span>
              <span>{event?.location || 'Masonic Centre, Sydney'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Time</span>
              <span>{event?.time || '10:00 AM'}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Registration details */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Registration Details</CardTitle>
              <CardDescription>
                {getRegistrationTypeDisplay()} • {attendees.length} attendee{attendees.length > 1 ? 's' : ''}
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEditStep('attendees')}
              className="gap-2"
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="text-sm text-gray-600">
              {getAttendeeSummary()}
            </div>
            <Separator />
            {attendees.map((attendee, index) => (
              <div key={attendee.attendeeId} className="space-y-1">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {attendee.title} {attendee.firstName} {attendee.lastName}
                      </span>
                      {attendee.isPrimary && (
                        <Badge variant="secondary" className="text-xs">Primary</Badge>
                      )}
                      {attendee.isPartner && (
                        <Badge variant="outline" className="text-xs">Partner</Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      {attendee.attendeeType}
                      {attendee.attendeeType === 'Mason' && attendee.rank && ` • ${attendee.rank}`}
                      {attendee.attendeeType === 'Mason' && attendee.lodgeNameNumber && (
                        <span> • {attendee.lodgeNameNumber}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Ticket summary */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Tickets</CardTitle>
              <CardDescription>
                {Object.values(tickets?.selectedTickets || {}).reduce((sum, qty) => sum + qty, 0)} ticket{Object.values(tickets?.selectedTickets || {}).reduce((sum, qty) => sum + qty, 0) !== 1 ? 's' : ''} selected
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEditStep('tickets')}
              className="gap-2"
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {attendees.map(attendee => {
              const ticketId = tickets?.ticketAssignments?.[attendee.attendeeId];
              const ticketName = ticketId || 'No ticket assigned';
              
              return (
                <div key={attendee.attendeeId} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">
                      {attendee.firstName} {attendee.lastName}
                    </span>
                  </div>
                  <Badge variant={ticketId ? "secondary" : "outline"}>
                    {ticketName}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Contact information */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
          <CardDescription>
            Primary contact for this registration
          </CardDescription>
        </CardHeader>
        <CardContent>
          {primaryAttendee && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Name</span>
                <span>
                  {primaryAttendee.title} {primaryAttendee.firstName} {primaryAttendee.lastName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Email</span>
                <span>{primaryAttendee.primaryEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Phone</span>
                <span>{primaryAttendee.primaryPhone}</span>
              </div>
              {primaryAttendee.attendeeType === 'Mason' && primaryAttendee.lodgeNameNumber && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Lodge</span>
                  <span>{primaryAttendee.lodgeNameNumber}</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order total */}
      <Card>
        <CardHeader>
          <CardTitle>Order Total</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Tickets</span>
              <span>{formatCurrency(totals.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Processing Fees</span>
              <span>{formatCurrency(totals.fees)}</span>
            </div>
            
            <Separator />
            
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>{formatCurrency(totals.total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Important information */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">Important Information</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-blue-900">
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 mt-0.5 text-blue-600" />
              <span>All ticket sales are final</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 mt-0.5 text-blue-600" />
              <span>Tickets will be emailed to the primary contact</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 mt-0.5 text-blue-600" />
              <span>Please arrive 30 minutes before the event starts</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 mt-0.5 text-blue-600" />
              <span>Dress code: {event?.dressCode || 'Formal attire'}</span>
            </li>
          </ul>
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
          onClick={onNext}
          className="gap-2"
        >
          <CreditCard className="w-4 h-4" />
          Proceed to Payment
        </Button>
      </div>
    </div>
  );
};