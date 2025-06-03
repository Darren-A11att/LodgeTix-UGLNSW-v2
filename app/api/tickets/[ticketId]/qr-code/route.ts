import { NextRequest, NextResponse } from 'next/server';
import { getQRCodeService } from '@/lib/services/qr-code-service';
import { createClient } from '@/utils/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const supabase = await createClient();
    const { ticketId } = await params;
    
    // Get ticket details
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select(`
        *,
        attendees (
          id,
          first_name,
          last_name
        ),
        registrations (
          id,
          confirmation_number
        ),
        event_tickets (
          event_id,
          ticket_type
        )
      `)
      .eq('ticket_id', ticketId)
      .single();
    
    if (ticketError || !ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }
    
    // Generate QR code data
    const qrData = {
      ticketId: ticket_id,
      registrationId: ticket.registration_id,
      attendeeId: ticket.attendee_id,
      eventId: ticket.event_tickets?.event_id,
      ticketType: ticket.event_tickets?.ticket_type,
    };
    
    const qrCodeService = getQRCodeService();
    
    // Check if we need to store it or just return data URL
    const { searchParams } = new URL(request.url);
    const store = searchParams.get('store') === 'true';
    
    if (store) {
      // Generate and store in Supabase
      const url = await qrCodeService.generateAndStore(qrData);
      
      if (!url) {
        return NextResponse.json(
          { error: 'Failed to generate QR code' },
          { status: 500 }
        );
      }
      
      // Update ticket with QR code URL
      await supabase
        .from('tickets')
        .update({ qr_code_url: url })
        .eq('ticket_id', ticketId);
      
      return NextResponse.json({ 
        url,
        stored: true,
        ticketId 
      });
    } else {
      // Just return data URL
      const dataUrl = await qrCodeService.generateDataUrl(qrData);
      
      return NextResponse.json({ 
        dataUrl,
        stored: false,
        ticketId 
      });
    }
  } catch (error) {
    console.error('Error generating QR code:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const supabase = await createClient();
    const { ticketId } = await params;
    
    // Get ticket details
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select(`
        *,
        event_tickets (
          event_id,
          ticket_type
        )
      `)
      .eq('ticket_id', ticketId)
      .single();
    
    if (ticketError || !ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }
    
    // Check if QR code already exists
    if (ticket.qr_code_url) {
      return NextResponse.json({ 
        url: ticket.qr_code_url,
        stored: true,
        ticketId 
      });
    }
    
    // Generate QR code data
    const qrData = {
      ticketId: ticket_id,
      registrationId: ticket.registration_id,
      attendeeId: ticket.attendee_id,
      eventId: ticket.event_tickets?.event_id,
      ticketType: ticket.event_tickets?.ticket_type,
    };
    
    const qrCodeService = getQRCodeService();
    
    // Try to get or generate stored QR code
    const url = await qrCodeService.getOrGenerateQRCode(qrData);
    
    if (url) {
      // Update ticket with QR code URL
      await supabase
        .from('tickets')
        .update({ qr_code_url: url })
        .eq('ticket_id', ticketId);
      
      return NextResponse.json({ 
        url,
        stored: true,
        ticketId 
      });
    }
    
    // Fallback to data URL if storage fails
    const dataUrl = await qrCodeService.generateDataUrl(qrData);
    
    return NextResponse.json({ 
      dataUrl,
      stored: false,
      ticketId 
    });
  } catch (error) {
    console.error('Error retrieving QR code:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}