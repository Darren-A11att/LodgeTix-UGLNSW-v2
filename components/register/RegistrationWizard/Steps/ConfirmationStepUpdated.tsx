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
  Printer,
  FileText
} from 'lucide-react';
import { formatCurrency } from '@/lib/event-utils';
import confetti from 'canvas-confetti';
import { TicketData, generateAllTicketsPDF } from '../utils/ticketPdfGenerator';
import { EmailTemplateData } from '../utils/emailTemplate';
import { sendConfirmationEmail, prepareTicketAttachment } from '../utils/emailService';

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
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Fire confetti on mount
  useEffect(() => {
    // Check if confetti is available (might be missing on server-side)
    if (typeof window !== 'undefined' && confetti) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, []);

  // Generate ticket data for PDF
  const generateTicketData = useCallback((): TicketData[] => {
    return attendees.map(attendee => {
      const ticketType = tickets?.ticketAssignments?.[attendee.attendeeId] || 'General';
      return {
        ticketId: `TKT-${attendee.attendeeId}-${Date.now()}`,
        registrationId: registrationId || `REG-${Date.now()}`,
        ticketType,
        attendeeId: attendee.attendeeId,
        eventId: event?.id || 'event-id',
        eventTitle: event?.name || 'Grand Installation',
        eventDate: new Date(event?.date || new Date()).toLocaleDateString('en-AU', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        eventTime: event?.time || '10:00 AM',
        eventVenue: event?.location || 'Masonic Centre, Sydney',
        eventAddress: event?.address || '66 Goulburn Street, Sydney NSW 2000',
        attendeeName: `${attendee.firstName} ${attendee.lastName}`,
        attendeeType: attendee.type,
        attendeeTitle: attendee.title,
        confirmationNumber: registrationId || `REG-${Date.now()}`,
        purchaseDate: new Date().toLocaleDateString('en-AU'),
        dressCode: event?.dressCode || 'Formal attire required',
        specialInstructions: event?.specialInstructions,
      };
    });
  }, [attendees, tickets, event, registrationId]);

  // Send confirmation email using batch functionality
  const handleSendConfirmationEmail = useCallback(async () => {
    try {
      setIsSendingEmail(true);
      const primaryAttendee = attendees.find(a => a.isPrimary);
      if (!primaryAttendee) return;

      // Send batch request to API
      const response = await fetch('/api/send-confirmation-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          batch: true,
          attendees,
          event,
          registrationId: registrationId || `REG-${Date.now()}`,
          primaryEmail: primaryAttendee.primaryEmail,
          subtotal: tickets?.subtotal || 0,
          bookingFee: tickets?.bookingFee || 0,
          total: tickets?.total || 0,
          ticketAssignments: tickets?.ticketAssignments || {},
        }),
      });

      if (response.ok) {
        setEmailSent(true);
      }
    } catch (error) {
      console.error('Failed to send confirmation email:', error);
    } finally {
      setIsSendingEmail(false);
    }
  }, [attendees, event, tickets, registrationId]);

  // Download tickets as PDF
  const downloadTickets = useCallback(async () => {
    setIsDownloading(true);
    try {
      const ticketData = generateTicketData();
      const pdfBlob = await generateAllTicketsPDF(ticketData);
      
      const url = window.URL.createObjectURL(pdfBlob);
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
  }, [generateTicketData, registrationId]);

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
              <FileText className="w-4 h-4" />
              {isDownloading ? 'Generating PDF...' : 'Download Tickets'}
            </Button>
            
            <Button
              onClick={handleSendConfirmationEmail}
              disabled={emailSent || isSendingEmail}
              variant="secondary"
              className="gap-2"
              size="lg"
            >
              <Mail className="w-4 h-4" />
              {isSendingEmail ? 'Sending...' : emailSent ? 'Emails Sent' : 'Email Tickets'}
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
                <p className="font-medium">{event?.date || 'Saturday, November 25, 2024'}</p>
                <p className="text-sm text-gray-600">Date</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="font-medium">{event?.time || '10:00 AM'}</p>
                <p className="text-sm text-gray-600">Time</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="font-medium">{event?.location || 'Masonic Centre, Sydney'}</p>
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
            <li>• Individual confirmation emails have been sent to all attendees with email addresses</li>
            <li>• The primary contact receives a master confirmation with all tickets</li>
            <li>• Each ticket contains a unique QR code for entry</li>
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