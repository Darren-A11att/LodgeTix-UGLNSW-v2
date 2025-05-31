import { getQRCodeService } from './qr-code-service';
import { getPDFService, TicketData, ConfirmationData } from './pdf-service';
import { createClient } from '@/utils/supabase/server';

export interface PostPaymentData {
  registrationId: string;
  confirmationNumber: string;
  sendEmail?: boolean;
}

/**
 * Service that handles all post-payment processing
 * Including QR code generation, PDF creation, and email sending
 */
export class PostPaymentService {
  /**
   * Process all post-payment tasks
   */
  async processPostPayment(data: PostPaymentData): Promise<{
    success: boolean;
    qrCodesGenerated: number;
    pdfsGenerated: number;
    emailsSent: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let qrCodesGenerated = 0;
    let pdfsGenerated = 0;
    let emailsSent = 0;
    
    try {
      const supabase = await createClient();
      
      // Get registration with all related data
      const { data: registration, error: regError } = await supabase
        .from('registrations')
        .select(`
          *,
          attendees (
            id,
            first_name,
            last_name,
            attendee_type,
            title,
            primary_email,
            email,
            is_primary_contact
          ),
          tickets (
            id,
            attendee_id,
            event_ticket_id,
            price,
            status,
            qr_code_url
          ),
          events (
            id,
            name,
            date,
            start_time,
            location,
            address,
            dress_code,
            special_instructions
          ),
          lodge_registrations (
            id,
            lodges (
              id,
              name,
              number
            )
          )
        `)
        .eq('registration_id', data.registrationId)
        .single();
      
      if (regError || !registration) {
        errors.push('Registration not found');
        return { success: false, qrCodesGenerated, pdfsGenerated, emailsSent, errors };
      }
      
      // Get event tickets for ticket types
      const ticketIds = registration.tickets.map((t: any) => t.event_ticket_id);
      const { data: eventTickets } = await supabase
        .from('event_tickets')
        .select('id, title, ticket_type')
        .in('id', ticketIds);
      
      const ticketTypeMap = new Map(
        eventTickets?.map((et: any) => [et.id, { title: et.title, type: et.ticket_type }]) || []
      );
      
      // 1. Generate QR codes for all tickets
      const qrCodeService = getQRCodeService();
      const qrPromises = registration.tickets.map(async (ticket: any) => {
        try {
          // Skip if QR code already exists
          if (ticket.qr_code_url) {
            return ticket.qr_code_url;
          }
          
          const ticketInfo = ticketTypeMap.get(ticket.event_ticket_id);
          const qrData = {
            ticketId: ticket.id,
            registrationId: registration.registration_id,
            attendeeId: ticket.attendee_id,
            eventId: registration.event_id,
            ticketType: ticketInfo?.type || 'General',
          };
          
          const qrUrl = await qrCodeService.generateAndStore(qrData);
          
          if (qrUrl) {
            // Update ticket with QR code URL
            await supabase
              .from('tickets')
              .update({ qr_code_url: qrUrl })
              .eq('id', ticket.id);
            
            qrCodesGenerated++;
          }
          
          return qrUrl;
        } catch (error) {
          errors.push(`Failed to generate QR code for ticket ${ticket.id}`);
          console.error(`Error generating QR code for ticket ${ticket.id}:`, error);
          return null;
        }
      });
      
      await Promise.all(qrPromises);
      
      // 2. Generate PDFs for tickets
      const pdfService = getPDFService();
      const pdfPromises = registration.attendees.map(async (attendee: any) => {
        try {
          const attendeeTickets = registration.tickets.filter((t: any) => t.attendee_id === attendee.id);
          
          for (const ticket of attendeeTickets) {
            const ticketInfo = ticketTypeMap.get(ticket.event_ticket_id);
            const ticketData: TicketData = {
              ticketId: ticket.id,
              registrationId: registration.registration_id,
              ticketType: ticketInfo?.title || 'General Admission',
              attendeeId: attendee.id,
              eventId: registration.event_id,
              eventTitle: registration.events.name,
              eventDate: new Date(registration.events.date).toLocaleDateString('en-AU', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              }),
              eventTime: registration.events.start_time || '10:00 AM',
              eventVenue: registration.events.location,
              eventAddress: registration.events.address || '',
              attendeeName: `${attendee.first_name} ${attendee.last_name}`,
              attendeeType: attendee.attendee_type as 'Mason' | 'Guest',
              attendeeTitle: attendee.title,
              confirmationNumber: data.confirmationNumber,
              purchaseDate: new Date().toLocaleDateString('en-AU'),
              dressCode: registration.events.dress_code,
              specialInstructions: registration.events.special_instructions,
            };
            
            const pdfUrl = await pdfService.generateAndStoreTicket(ticketData);
            if (pdfUrl) {
              pdfsGenerated++;
            }
          }
        } catch (error) {
          errors.push(`Failed to generate PDF for attendee ${attendee.id}`);
          console.error(`Error generating PDF for attendee ${attendee.id}:`, error);
        }
      });
      
      await Promise.all(pdfPromises);
      
      // 3. Generate confirmation PDF
      try {
        const confirmationData: ConfirmationData = {
          registrationId: registration.registration_id,
          confirmationNumber: data.confirmationNumber,
          customerName: registration.contact_name || 'Customer',
          customerEmail: registration.contact_email || '',
          eventTitle: registration.events.name,
          eventDate: new Date(registration.events.date).toLocaleDateString('en-AU', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          eventTime: registration.events.start_time || '10:00 AM',
          eventVenue: registration.events.location,
          eventAddress: registration.events.address || '',
          attendees: registration.attendees.map((attendee: any) => {
            const ticket = registration.tickets.find((t: any) => t.attendee_id === attendee.id);
            const ticketInfo = ticketTypeMap.get(ticket?.event_ticket_id);
            return {
              name: `${attendee.first_name} ${attendee.last_name}`,
              type: attendee.attendee_type,
              ticketType: ticketInfo?.title || 'General',
              ticketPrice: ticket?.price || 0,
            };
          }),
          subtotal: registration.subtotal || 0,
          bookingFee: registration.booking_fee || 0,
          total: registration.total_amount || 0,
          purchaseDate: new Date().toLocaleDateString('en-AU'),
          dressCode: registration.events.dress_code,
          specialInstructions: registration.events.special_instructions,
        };
        
        const confirmationUrl = await pdfService.generateAndStoreConfirmation(confirmationData);
        if (confirmationUrl) {
          pdfsGenerated++;
          
          // Store confirmation URL in registration
          await supabase
            .from('registrations')
            .update({ confirmation_pdf_url: confirmationUrl })
            .eq('registration_id', data.registrationId);
        }
      } catch (error) {
        errors.push('Failed to generate confirmation PDF');
        console.error('Error generating confirmation PDF:', error);
      }
      
      // 4. Send confirmation emails (if requested)
      if (data.sendEmail) {
        try {
          // Call email API endpoint
          const response = await fetch('/api/send-confirmation-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              batch: true,
              attendees: registration.attendees,
              event: registration.events,
              registrationId: data.registrationId,
              primaryEmail: registration.contact_email,
              subtotal: registration.subtotal,
              bookingFee: registration.booking_fee,
              total: registration.total_amount,
              ticketAssignments: Object.fromEntries(
                registration.tickets.map((t: any) => {
                  const ticketInfo = ticketTypeMap.get(t.event_ticket_id);
                  return [t.attendee_id, ticketInfo?.title || 'General'];
                })
              ),
            }),
          });
          
          if (response.ok) {
            emailsSent = registration.attendees.filter((a: any) => a.email || a.primary_email).length;
            if (registration.contact_email) emailsSent++; // Primary contact email
          } else {
            errors.push('Failed to send confirmation emails');
          }
        } catch (error) {
          errors.push('Failed to send confirmation emails');
          console.error('Error sending emails:', error);
        }
      }
      
      return {
        success: errors.length === 0,
        qrCodesGenerated,
        pdfsGenerated,
        emailsSent,
        errors,
      };
    } catch (error) {
      console.error('Post-payment processing error:', error);
      errors.push('Unexpected error during post-payment processing');
      return {
        success: false,
        qrCodesGenerated,
        pdfsGenerated,
        emailsSent,
        errors,
      };
    }
  }

  /**
   * Regenerate assets for a registration
   */
  async regenerateAssets(registrationId: string, options: {
    qrCodes?: boolean;
    pdfs?: boolean;
    force?: boolean;
  } = {}): Promise<{
    success: boolean;
    regenerated: {
      qrCodes: number;
      pdfs: number;
    };
    errors: string[];
  }> {
    const { qrCodes = true, pdfs = true, force = false } = options;
    const errors: string[] = [];
    const regenerated = { qrCodes: 0, pdfs: 0 };
    
    try {
      const supabase = await createClient();
      
      // Get registration data
      const { data: registration, error } = await supabase
        .from('registrations')
        .select(`
          *,
          tickets (
            id,
            attendee_id,
            event_ticket_id,
            qr_code_url
          )
        `)
        .eq('registration_id', registrationId)
        .single();
      
      if (error || !registration) {
        errors.push('Registration not found');
        return { success: false, regenerated, errors };
      }
      
      if (qrCodes) {
        const qrCodeService = getQRCodeService();
        
        for (const ticket of registration.tickets) {
          if (force || !ticket.qr_code_url) {
            try {
              // Delete existing QR code if force regenerate
              if (force && ticket.qr_code_url) {
                await qrCodeService.deleteQRCode(registrationId, ticket.id);
              }
              
              // Generate new QR code
              const qrData = {
                ticketId: ticket.id,
                registrationId: registrationId,
                attendeeId: ticket.attendee_id,
                eventId: registration.event_id,
                ticketType: 'General', // Would need to fetch this
              };
              
              const qrUrl = await qrCodeService.generateAndStore(qrData);
              if (qrUrl) {
                await supabase
                  .from('tickets')
                  .update({ qr_code_url: qrUrl })
                  .eq('id', ticket.id);
                regenerated.qrCodes++;
              }
            } catch (error) {
              errors.push(`Failed to regenerate QR code for ticket ${ticket.id}`);
            }
          }
        }
      }
      
      // PDF regeneration would go here
      // Similar logic for PDFs
      
      return {
        success: errors.length === 0,
        regenerated,
        errors,
      };
    } catch (error) {
      console.error('Asset regeneration error:', error);
      errors.push('Unexpected error during asset regeneration');
      return {
        success: false,
        regenerated,
        errors,
      };
    }
  }
}

// Singleton instance
let postPaymentService: PostPaymentService | null = null;

export function getPostPaymentService(): PostPaymentService {
  if (!postPaymentService) {
    postPaymentService = new PostPaymentService();
  }
  return postPaymentService;
}