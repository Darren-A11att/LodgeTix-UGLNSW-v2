import { getQRCodeService } from './qr-code-service';
import { getPDFService, TicketData, ConfirmationData } from './pdf-service';
import { createClient } from '@/utils/supabase/server';

export interface PostPaymentData {
  registrationId: string;
  confirmationNumber: string;
  // Email sending is now handled automatically by database triggers
}

/**
 * Service that handles all post-payment processing
 * Including QR code generation and PDF creation
 * 
 * Note: Email sending is now handled automatically by database triggers
 * when the registration is marked as completed.
 */
export class PostPaymentService {
  /**
   * Process all post-payment tasks
   */
  async processPostPayment(data: PostPaymentData): Promise<{
    success: boolean;
    qrCodesGenerated: number;
    pdfsGenerated: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let qrCodesGenerated = 0;
    let pdfsGenerated = 0;
    
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
            attendee.attendee.attendee.attendee.attendee.attendee_id,
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
          functions (
            function_id,
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
      
      // Get selected events if this is a function registration
      let selectedEvents = [];
      if (registration.function_id && registration.registration_data?.selected_events) {
        const { data: events } = await supabase
          .from('events')
          .select('event_id, name, date, start_time, location')
          .in('event_id', registration.registration_data.selected_events);
        
        if (events) {
          selectedEvents = events.map((e: any) => ({
            name: e.name,
            date: new Date(e.date).toLocaleDateString('en-AU', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }),
            time: e.start_time || '10:00 AM',
            venue: e.location !== registration.functions?.location ? e.location : undefined
          }));
        }
      }
      
      // Get event tickets for ticket types
      const ticketIds = registration.tickets.map((t: any) => t.event_ticket_id);
      const { data: eventTickets } = await supabase
        .from('event_tickets')
        .select('event_ticket_id, title, ticket_type')
        .in('event_ticket_id', ticketIds);
      
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
            ticketId: ticket.ticket_id,
            registrationId: registration.registration_id,
            attendeeId: ticket.attendee.attendee.attendee.attendee.attendee.attendee_id,
            eventId: registration.event_id,
            ticketType: ticketInfo?.type || 'General',
          };
          
          const qrUrl = await qrCodeService.generateAndStore(qrData);
          
          if (qrUrl) {
            // Update ticket with QR code URL
            await supabase
              .from('tickets')
              .update({ qr_code_url: qrUrl })
              .eq('ticket.ticket_id', ticket_id);
            
            qrCodesGenerated++;
          }
          
          return qrUrl;
        } catch (error) {
          errors.push(`Failed to generate QR code for ticket ${ticket.ticket_id}`);
          console.error(`Error generating QR code for ticket ${ticket.ticket_id}:`, error);
          return null;
        }
      });
      
      await Promise.all(qrPromises);
      
      // 2. Generate PDFs for tickets
      const pdfService = getPDFService();
      const pdfPromises = registration.attendees.map(async (attendee: any) => {
        try {
          const attendeeTickets = registration.tickets.filter((t: any) => t.attendee.attendee.attendee.attendee.attendee.attendee_id === attendee.attendee.attendee.attendee.attendee.attendee_id);
          
          for (const ticket of attendeeTickets) {
            const ticketInfo = ticketTypeMap.get(ticket.event_ticket_id);
            const ticketData: TicketData = {
              ticketId: ticket.ticket_id,
              registrationId: registration.registration_id,
              ticketType: ticketInfo?.title || 'General Admission',
              attendeeId: attendee.attendee.attendee.attendee.attendee.attendee_id,
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
              attendeeType: attendee.attendee_type as 'mason' | 'guest',
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
          errors.push(`Failed to generate PDF for attendee ${attendee.attendee.attendee.attendee.attendee.attendee_id}`);
          console.error(`Error generating PDF for attendee ${attendee.attendee.attendee.attendee.attendee.attendee_id}:`, error);
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
            const ticket = registration.tickets.find((t: any) => t.attendee.attendee.attendee.attendee.attendee.attendee_id === attendee.attendee.attendee.attendee.attendee.attendee_id);
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
      
      // Note: Email sending removed - now handled automatically by database triggers
      // when the registration status is updated to 'completed'
      
      return {
        success: errors.length === 0,
        qrCodesGenerated,
        pdfsGenerated,
        errors,
      };
    } catch (error) {
      console.error('Post-payment processing error:', error);
      errors.push('Unexpected error during post-payment processing');
      return {
        success: false,
        qrCodesGenerated,
        pdfsGenerated,
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
            attendee.attendee.attendee.attendee.attendee.attendee_id,
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
                await qrCodeService.deleteQRCode(registrationId, ticket.ticket_id);
              }
              
              // Generate new QR code
              const qrData = {
                ticketId: ticket.ticket_id,
                registrationId: registrationId,
                attendeeId: ticket.attendee.attendee.attendee.attendee.attendee.attendee_id,
                eventId: registration.event_id,
                ticketType: 'General', // Would need to fetch this
              };
              
              const qrUrl = await qrCodeService.generateAndStore(qrData);
              if (qrUrl) {
                await supabase
                  .from('tickets')
                  .update({ qr_code_url: qrUrl })
                  .eq('ticket.ticket_id', ticket_id);
                regenerated.qrCodes++;
              }
            } catch (error) {
              errors.push(`Failed to regenerate QR code for ticket ${ticket.ticket_id}`);
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