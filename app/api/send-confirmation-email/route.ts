import { NextRequest, NextResponse } from 'next/server';
import { 
  sendConfirmationEmail, 
  sendBatchConfirmationEmails,
  prepareTicketAttachment,
  BatchEmailRecipient 
} from '@/components/register/RegistrationWizard/utils/emailService';
import { EmailTemplateData } from '@/components/register/RegistrationWizard/utils/emailTemplate';
import { generateTicketPDF, TicketData } from '@/components/register/RegistrationWizard/utils/ticketPdfGenerator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Check if this is a batch request
    if (body.batch && body.attendees) {
      const { attendees, event, registrationId, primaryEmail } = body;
      
      // Prepare base template data (common for all emails)
      const baseTemplateData: Omit<EmailTemplateData, 'customerName' | 'customerEmail' | 'attendees'> = {
        confirmationNumber: registrationId,
        registrationDate: new Date().toLocaleDateString('en-AU'),
        eventTitle: event.name,
        eventDate: new Date(event.date).toLocaleDateString('en-AU', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        eventTime: event.time || '10:00 AM',
        eventVenue: event.location,
        eventAddress: event.address || '66 Goulburn Street, Sydney NSW 2000',
        subtotal: body.subtotal || 0,
        bookingFee: body.bookingFee || 0,
        total: body.total || 0,
        dressCode: event.dressCode,
        specialInstructions: event.specialInstructions,
        ticketDownloadUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/download-tickets/${registrationId}`,
        addToCalendarUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/calendar/${registrationId}`,
      };
      
      // Prepare recipients with individual tickets
      const recipients: BatchEmailRecipient[] = [];
      
      for (const attendee of attendees) {
        // Only send to attendees with email addresses
        if (attendee.primaryEmail || attendee.email) {
          const ticketData: TicketData = {
            ticketId: `TKT-${attendee.attendeeId}-${Date.now()}`,
            registrationId,
            ticketType: body.ticketAssignments?.[attendee.attendeeId] || 'General',
            attendeeId: attendee.attendeeId,
            eventId: event.id,
            eventTitle: event.name,
            eventDate: baseTemplateData.eventDate,
            eventTime: baseTemplateData.eventTime,
            eventVenue: baseTemplateData.eventVenue,
            eventAddress: baseTemplateData.eventAddress,
            attendeeName: `${attendee.firstName} ${attendee.lastName}`,
            attendeeType: attendee.type,
            attendeeTitle: attendee.title,
            confirmationNumber: registrationId,
            purchaseDate: new Date().toLocaleDateString('en-AU'),
            dressCode: event.dressCode,
            specialInstructions: event.specialInstructions,
          };
          
          const ticketPdf = await generateTicketPDF(ticketData);
          
          recipients.push({
            email: attendee.primaryEmail || attendee.email,
            attendeeId: attendee.attendeeId,
            attendeeName: `${attendee.firstName} ${attendee.lastName}`,
            ticketBlob: ticketPdf,
          });
        }
      }
      
      // Prepare attendees data for the email template
      const registrationAttendees: EmailTemplateData['attendees'] = attendees.map((att: any) => ({
        name: `${att.firstName} ${att.lastName}`,
        type: att.type,
        ticketType: body.ticketAssignments?.[att.attendeeId] || 'General',
        ticketPrice: 150, // TODO: Get actual price from ticket data
      }));
      
      // Send batch emails
      const result = await sendBatchConfirmationEmails({
        recipients,
        baseTemplateData,
        registrationAttendees,
      });
      
      // Also send a master confirmation to the primary contact if provided
      if (primaryEmail) {
        const primaryAttendee = attendees.find((a: any) => a.isPrimary);
        if (primaryAttendee) {
          const masterTemplateData: EmailTemplateData = {
            ...baseTemplateData,
            customerName: `${primaryAttendee.firstName} ${primaryAttendee.lastName}`,
            customerEmail: primaryEmail,
            attendees: registrationAttendees,
          };
          
          // Generate all tickets PDF for primary contact
          const allTicketsData: TicketData[] = attendees.map((attendee: any) => ({
            ticketId: `TKT-${attendee.attendeeId}-${Date.now()}`,
            registrationId,
            ticketType: body.ticketAssignments?.[attendee.attendeeId] || 'General',
            attendeeId: attendee.attendeeId,
            eventId: event.id,
            eventTitle: event.name,
            eventDate: baseTemplateData.eventDate,
            eventTime: baseTemplateData.eventTime,
            eventVenue: baseTemplateData.eventVenue,
            eventAddress: baseTemplateData.eventAddress,
            attendeeName: `${attendee.firstName} ${attendee.lastName}`,
            attendeeType: attendee.type,
            attendeeTitle: attendee.title,
            confirmationNumber: registrationId,
            purchaseDate: new Date().toLocaleDateString('en-AU'),
            dressCode: event.dressCode,
            specialInstructions: event.specialInstructions,
          }));
          
          const { generateAllTicketsPDF } = await import('@/components/register/RegistrationWizard/utils/ticketPdfGenerator');
          const allTicketsPdf = await generateAllTicketsPDF(allTicketsData);
          const allTicketsAttachment = await prepareTicketAttachment(allTicketsPdf, 'all-tickets.pdf');
          
          await sendConfirmationEmail({
            to: primaryEmail,
            templateData: masterTemplateData,
            attachments: [allTicketsAttachment],
          });
        }
      }
      
      return NextResponse.json({ success: true, batchResult: result });
    } else {
      // Single email logic (fallback)
      const { to, templateData, ticketPdf } = body;
      
      let attachments = [];
      if (ticketPdf) {
        const pdfBlob = new Blob([Buffer.from(ticketPdf, 'base64')], { type: 'application/pdf' });
        const ticketAttachment = await prepareTicketAttachment(pdfBlob, 'tickets.pdf');
        attachments.push(ticketAttachment);
      }

      const result = await sendConfirmationEmail({
        to,
        templateData: templateData as EmailTemplateData,
        attachments,
      });

      return NextResponse.json({ success: true, messageId: result.id });
    }
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    return NextResponse.json(
      { error: 'Failed to send confirmation email' },
      { status: 500 }
    );
  }
}