import { NextRequest, NextResponse } from 'next/server';
import { getPDFService } from '@/lib/services/pdf-service';
import { createClient } from '@/utils/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: registrationId } = await params;
    
    // Get registration details
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
          primary_email
        ),
        tickets (
          id,
          attendee_id,
          event_ticket_id,
          price,
          status
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
        )
      `)
      .eq('id', registrationId)
      .single();
    
    if (regError || !registration) {
      return NextResponse.json(
        { error: 'Registration not found' },
        { status: 404 }
      );
    }
    
    // Get event tickets for ticket types
    const ticketIds = registration.tickets.map((t: any) => t.event_ticket_id);
    const { data: eventTickets } = await supabase
      .from('event_tickets')
      .select('id, ticket_type')
      .in('id', ticketIds);
    
    const ticketTypeMap = new Map(
      eventTickets?.map((et: any) => [et.id, et.ticket_type]) || []
    );
    
    // Format data for PDF
    const confirmationData = {
      registrationId: registration.id,
      confirmationNumber: registration.confirmation_number,
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
        return {
          name: `${attendee.first_name} ${attendee.last_name}`,
          type: attendee.attendee_type,
          ticketType: ticketTypeMap.get(ticket?.event_ticket_id) || 'General',
          ticketPrice: ticket?.price || 0,
        };
      }),
      subtotal: registration.subtotal || 0,
      bookingFee: registration.booking_fee || 0,
      total: registration.total_amount || 0,
      purchaseDate: new Date(registration.created_at).toLocaleDateString('en-AU'),
      dressCode: registration.events.dress_code,
      specialInstructions: registration.events.special_instructions,
    };
    
    const pdfService = getPDFService();
    
    // Check if we should store or just return
    const { searchParams } = new URL(request.url);
    const store = searchParams.get('store') === 'true';
    
    if (store) {
      // Generate and store
      const url = await pdfService.generateAndStoreConfirmation(confirmationData);
      
      if (!url) {
        return NextResponse.json(
          { error: 'Failed to generate confirmation PDF' },
          { status: 500 }
        );
      }
      
      return NextResponse.json({ 
        url,
        stored: true,
        registrationId 
      });
    } else {
      // Generate and return as download
      const pdfBlob = await pdfService.generateConfirmationPDF(confirmationData);
      const buffer = await pdfBlob.arrayBuffer();
      
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="confirmation-${registration.confirmation_number}.pdf"`,
        },
      });
    }
  } catch (error) {
    console.error('Error generating confirmation PDF:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}