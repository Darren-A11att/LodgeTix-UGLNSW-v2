import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ functionId: string }> }
) {
  try {
    // Await params as required in Next.js 15
    const { functionId } = await params;
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const registrationType = searchParams.get('registrationType');
    
    // Use server client - let RLS handle access control
    const supabase = await createClient();
    
    console.log('[API] Fetching tickets for function_id:', functionId, 'registrationType:', registrationType);
    
    // Build query
    let query = supabase
      .from('function_event_tickets_view')
      .select('*')
      .eq('function_id', functionId)
      .order('event_start', { ascending: true })
      .order('ticket_name', { ascending: true });
    
    // Filter by registration type if provided
    if (registrationType) {
      // The registration_types column is an array, so we use contains
      query = query.contains('registration_types', [registrationType]);
    }
    
    const { data: tickets, error } = await query;

    if (error) {
      console.error('[API] Error fetching tickets:', error);
      return NextResponse.json(
        { error: 'Failed to fetch tickets', details: error.message },
        { status: 500 }
      );
    }

    console.log(`[API] Found ${tickets?.length || 0} tickets for function ${functionId}`);
    
    // Transform the view data to match the expected format
    const transformedTickets = (tickets || []).map((ticket: any) => ({
      event_ticket_id: ticket.event_ticket_id,
      ticket_name: ticket.ticket_name,
      ticket_description: ticket.ticket_description,
      ticket_price: ticket.ticket_price,
      event_id: ticket.event_id,
      event_title: ticket.event_title,
      event_slug: ticket.event_slug,
      function_id: ticket.function_id,
      is_active: ticket.is_active,
      total_capacity: ticket.total_capacity,
      available_count: ticket.available_count,
      reserved_count: ticket.reserved_count,
      sold_count: ticket.sold_count,
      status: ticket.status,
      eligibility_criteria: ticket.eligibility_criteria,
      registration_types: ticket.registration_types,
      created_at: ticket.ticket_created_at,
      updated_at: ticket.ticket_updated_at
    }));

    return NextResponse.json({ 
      tickets: transformedTickets,
      count: transformedTickets.length 
    });
  } catch (error) {
    console.error('[API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}