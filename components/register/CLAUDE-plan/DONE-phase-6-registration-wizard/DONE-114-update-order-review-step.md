# DONE Task 114: Update OrderReviewStep

## Objective
Update the OrderReviewStep to display the comprehensive registration summary using the new form architecture.

## Dependencies
- Task 113 (TicketSelectionStep)
- Task 092, 093, 094 (Form summary components)

## Reference Files
- `components/register/registration-wizard/steps/OrderReviewStep.tsx`
- `components/register/order/order-review-step.tsx`

## Steps

1. Update `components/register/registration-wizard/steps/OrderReviewStep.tsx`:
```typescript
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
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { IndividualsFormSummary } from '../../forms/attendee/IndividualsForm';
import { LodgeFormSummary } from '../../forms/attendee/LodgesForm';
import { DelegationFormSummary } from '../../forms/attendee/DelegationsForm';

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

  // Render appropriate summary based on registration type
  const renderRegistrationSummary = () => {
    switch (registrationType) {
      case 'individual':
        return <IndividualsFormSummary />;
      case 'lodge':
        return <LodgeFormSummary />;
      case 'delegation':
        return <DelegationFormSummary delegationType="GrandLodge" />;
      default:
        return null;
    }
  };

  // Get primary attendee
  const primaryAttendee = attendees.find(a => a.isPrimary);

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
                {event?.name || 'Event Name'}
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEditStep('event')}
              className="gap-2"
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Date</span>
              <span>{event?.date || 'Event Date'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Location</span>
              <span>{event?.location || 'Event Location'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Time</span>
              <span>{event?.time || 'Event Time'}</span>
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
                {registrationType === 'individual' && 'Individual Registration'}
                {registrationType === 'lodge' && 'Lodge Registration'}
                {registrationType === 'delegation' && 'Official Delegation'}
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
          {renderRegistrationSummary()}
        </CardContent>
      </Card>

      {/* Ticket summary */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Tickets</CardTitle>
              <CardDescription>
                {Object.values(tickets?.selectedTickets || {}).reduce((sum, qty) => sum + qty, 0)} tickets
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
                      {attendee.isPartner && (
                        <Badge variant="outline" className="ml-2">Partner</Badge>
                      )}
                    </span>
                  </div>
                  <Badge variant="secondary">{ticketName}</Badge>
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
```

2. Create order summary helper:
```typescript
// Helper for generating order summary data
export const useOrderSummary = () => {
  const { 
    registrationType,
    attendees,
    tickets,
    event,
  } = useRegistrationStore();

  const generateSummaryEmail = useCallback(() => {
    const primaryAttendee = attendees.find(a => a.isPrimary);
    if (!primaryAttendee) return '';

    const summary = `
Order Summary
=============

Event: ${event?.name || 'Event'}
Date: ${event?.date || 'TBD'}
Location: ${event?.location || 'TBD'}

Registration Type: ${registrationType}
Primary Contact: ${primaryAttendee.firstName} ${primaryAttendee.lastName}

Attendees (${attendees.length}):
${attendees.map(a => `- ${a.firstName} ${a.lastName} (${a.attendeeType})`).join('\n')}

Total: ${formatCurrency(tickets?.total || 0)}
    `.trim();

    return summary;
  }, [registrationType, attendees, tickets, event]);

  const generateReceiptData = useCallback(() => {
    return {
      orderNumber: `ORD-${Date.now()}`,
      date: new Date().toISOString(),
      registrationType,
      attendeeCount: attendees.length,
      total: tickets?.total || 0,
      event: event?.name || 'Event',
    };
  }, [registrationType, attendees, tickets, event]);

  return {
    generateSummaryEmail,
    generateReceiptData,
  };
};
```

## Deliverables
- Updated OrderReviewStep component
- Comprehensive order summary display
- Edit functionality for each section
- Order totals calculation
- Important information section

## Success Criteria
- All registration details clearly displayed
- Edit buttons work for each section
- Totals calculated correctly
- Primary contact information shown
- Clear call-to-action for payment