# DONE Task 116: Update ConfirmationStep

## Objective
Update the ConfirmationStep to display a comprehensive registration confirmation with all relevant details.

## Dependencies
- Task 115 (PaymentStep)
- Email integration
- PDF generation for tickets

## Reference Files
- `components/register/registration-wizard/steps/ConfirmationStep.tsx`
- `components/register/order/confirmation-step.tsx`

## Steps

1. Update `components/register/registration-wizard/steps/ConfirmationStep.tsx`:
```typescript
import React, { useEffect, useCallback, useState } from 'react';
import { useRegistrationStore } from '@/lib/registrationStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  Download, 
  Mail, 
  Calendar,
  MapPin,
  Clock,
  Users,
  Ticket,
  Share2,
  Printer
} from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import confetti from 'canvas-confetti';

interface ConfirmationStepProps {
  registrationId?: string;
}

export const ConfirmationStep: React.FC<ConfirmationStepProps> = ({
  registrationId,
}) => {
  const { 
    attendees,
    tickets,
    event,
    registrationType,
    paymentStatus,
    clearRegistration,
  } = useRegistrationStore();

  const [emailSent, setEmailSent] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Fire confetti on mount
  useEffect(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  }, []);

  // Send confirmation email
  const sendConfirmationEmail = useCallback(async () => {
    try {
      const primaryAttendee = attendees.find(a => a.isPrimary);
      if (!primaryAttendee) return;

      await fetch('/api/send-confirmation-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: primaryAttendee.primaryEmail,
          registrationId,
          attendees,
          event,
          tickets,
        }),
      });

      setEmailSent(true);
    } catch (error) {
      console.error('Failed to send confirmation email:', error);
    }
  }, [attendees, event, tickets, registrationId]);

  // Download tickets as PDF
  const downloadTickets = useCallback(async () => {
    setIsDownloading(true);
    try {
      const response = await fetch('/api/generate-tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          registrationId,
          attendees,
          event,
          tickets,
        }),
      });

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tickets-${registrationId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download tickets:', error);
    } finally {
      setIsDownloading(false);
    }
  }, [attendees, event, tickets, registrationId]);

  // Add to calendar
  const addToCalendar = useCallback(() => {
    if (!event) return;

    const startDate = new Date(event.date);
    const endDate = new Date(startDate.getTime() + 4 * 60 * 60 * 1000); // 4 hours

    const icsContent = `
BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:${startDate.toISOString().replace(/[-:]/g, '').replace('.000', '')}
DTEND:${endDate.toISOString().replace(/[-:]/g, '').replace('.000', '')}
SUMMARY:${event.name}
LOCATION:${event.location}
DESCRIPTION:Registration ID: ${registrationId}
END:VEVENT
END:VCALENDAR
`.trim();

    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `event-${registrationId}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, [event, registrationId]);

  // Share functionality
  const shareRegistration = useCallback(() => {
    if (navigator.share) {
      navigator.share({
        title: `${event?.name} Registration`,
        text: `I'm registered for ${event?.name}!`,
        url: window.location.href,
      });
    }
  }, [event]);

  const primaryAttendee = attendees.find(a => a.isPrimary);
  const totalAmount = paymentStatus?.amount || tickets?.total || 0;

  return (
    <div className="space-y-8">
      {/* Success header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        
        <div>
          <h1 className="text-3xl font-bold text-green-600">Registration Complete!</h1>
          <p className="text-gray-600 mt-2">
            Your registration has been successfully processed
          </p>
        </div>

        <div className="flex items-center justify-center gap-2">
          <Badge variant="success" className="text-lg px-4 py-2">
            Registration ID: {registrationId || 'REG-' + Date.now()}
          </Badge>
        </div>
      </div>

      {/* Primary actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={downloadTickets}
              disabled={isDownloading}
              className="gap-2"
              size="lg"
            >
              <Download className="w-4 h-4" />
              {isDownloading ? 'Downloading...' : 'Download Tickets'}
            </Button>
            
            <Button
              onClick={sendConfirmationEmail}
              disabled={emailSent}
              variant="secondary"
              className="gap-2"
              size="lg"
            >
              <Mail className="w-4 h-4" />
              {emailSent ? 'Email Sent' : 'Email Confirmation'}
            </Button>
            
            <Button
              onClick={addToCalendar}
              variant="outline"
              className="gap-2"
              size="lg"
            >
              <Calendar className="w-4 h-4" />
              Add to Calendar
            </Button>
            
            <Button
              onClick={shareRegistration}
              variant="outline"
              className="gap-2"
              size="lg"
            >
              <Share2 className="w-4 h-4" />
              Share
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Event details */}
      <Card>
        <CardHeader>
          <CardTitle>Event Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="font-medium">{event?.date}</p>
                <p className="text-sm text-gray-600">Date</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="font-medium">{event?.time}</p>
                <p className="text-sm text-gray-600">Time</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="font-medium">{event?.location}</p>
                <p className="text-sm text-gray-600">Location</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="font-medium">{attendees.length} Attendees</p>
                <p className="text-sm text-gray-600">Registration</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Registration summary */}
      <Card>
        <CardHeader>
          <CardTitle>Registration Summary</CardTitle>
          <CardDescription>
            {registrationType === 'individual' && 'Individual Registration'}
            {registrationType === 'lodge' && 'Lodge Registration'}
            {registrationType === 'delegation' && 'Official Delegation'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Primary contact */}
            {primaryAttendee && (
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Primary Contact</p>
                <p className="font-medium">
                  {primaryAttendee.title} {primaryAttendee.firstName} {primaryAttendee.lastName}
                </p>
                <p className="text-sm text-gray-600">{primaryAttendee.primaryEmail}</p>
                <p className="text-sm text-gray-600">{primaryAttendee.primaryPhone}</p>
              </div>
            )}

            <Separator />

            {/* Attendee list */}
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">All Attendees</p>
              <div className="space-y-2">
                {attendees.map((attendee, index) => (
                  <div key={attendee.attendeeId} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {index + 1}
                      </Badge>
                      <span className="text-sm">
                        {attendee.firstName} {attendee.lastName}
                      </span>
                      {attendee.isPartner && (
                        <Badge variant="secondary" className="text-xs">Partner</Badge>
                      )}
                    </div>
                    <Badge className="text-xs">
                      <Ticket className="w-3 h-3 mr-1" />
                      {tickets?.ticketAssignments?.[attendee.attendeeId] || 'Ticket'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Payment summary */}
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">Payment Summary</p>
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium">Total Paid</span>
                <span className="text-lg font-bold text-green-600">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Important information */}
      <Alert>
        <AlertDescription>
          <ul className="space-y-2">
            <li>• A confirmation email has been sent to {primaryAttendee?.primaryEmail}</li>
            <li>• Please bring your tickets (digital or printed) to the event</li>
            <li>• Arrive 30 minutes before the event starts for check-in</li>
            <li>• For questions, contact support@lodgetix.com</li>
          </ul>
        </AlertDescription>
      </Alert>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button
          onClick={() => window.print()}
          variant="outline"
          className="gap-2"
        >
          <Printer className="w-4 h-4" />
          Print Confirmation
        </Button>
        
        <Button
          onClick={() => {
            clearRegistration();
            window.location.href = '/';
          }}
          className="gap-2"
        >
          Register Another Person
        </Button>
      </div>
    </div>
  );
};
```

2. Create confirmation utilities:
```typescript
// Utilities for confirmation page
export const useConfirmationData = (registrationId: string) => {
  const { attendees, event, tickets } = useRegistrationStore();
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  // Generate QR code for tickets
  useEffect(() => {
    const generateQrCode = async () => {
      try {
        const response = await fetch('/api/generate-qr-code', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ registrationId }),
        });
        
        const { qrCodeUrl } = await response.json();
        setQrCodeUrl(qrCodeUrl);
      } catch (error) {
        console.error('Failed to generate QR code:', error);
      }
    };

    generateQrCode();
  }, [registrationId]);

  // Format registration data for display
  const getRegistrationSummary = useCallback(() => {
    const primaryAttendee = attendees.find(a => a.isPrimary);
    const totalTickets = Object.values(tickets?.selectedTickets || {}).reduce(
      (sum, qty) => sum + qty, 
      0
    );

    return {
      registrationId,
      primaryContact: primaryAttendee,
      attendeeCount: attendees.length,
      ticketCount: totalTickets,
      eventName: event?.name,
      eventDate: event?.date,
      eventLocation: event?.location,
      totalAmount: tickets?.total || 0,
      qrCodeUrl,
    };
  }, [attendees, event, tickets, registrationId, qrCodeUrl]);

  return { getRegistrationSummary };
};
```

## Deliverables
- Updated ConfirmationStep component
- Download tickets functionality
- Email confirmation sending
- Calendar integration
- Share functionality
- Print-friendly layout

## Success Criteria
- Clear success message with confetti
- All actions work correctly
- Registration details displayed
- QR code generated for tickets
- Mobile-friendly design