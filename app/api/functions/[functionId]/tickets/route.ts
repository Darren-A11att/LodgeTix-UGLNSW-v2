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
    
    // Note: registration_types filtering will be done in application layer
    // as the column doesn't exist in the database view
    
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
    let transformedTickets = (tickets || []).map((ticket: any) => {
      // Extract registration types from eligibility criteria if present
      let registrationTypes: string[] = ['individuals', 'lodge', 'delegation']; // Default to all types
      
      // If ticket has eligibility criteria, parse it to determine allowed registration types
      if (ticket.ticket_eligibility_criteria && typeof ticket.ticket_eligibility_criteria === 'object') {
        const criteria = ticket.ticket_eligibility_criteria;
        
        // Check if there's a specific registration_types field in the criteria
        if (criteria.registration_types && Array.isArray(criteria.registration_types)) {
          registrationTypes = criteria.registration_types;
        }
        // Otherwise, infer from attendee_type rules if present
        else if (criteria.rules && Array.isArray(criteria.rules)) {
          // This is a simplified inference - adjust based on actual business logic
          const hasAttendeeTypeRule = criteria.rules.some((rule: any) => 
            rule.type === 'attendee_type' || rule.type === 'registration_type'
          );
          if (hasAttendeeTypeRule) {
            // Keep default for now - would need more complex logic to infer
          }
        }
      }
      
      return {
        event_ticket_id: ticket.event_ticket_id,
        ticket_name: ticket.ticket_name,
        ticket_description: ticket.ticket_description,
        ticket_price: ticket.ticket_price,
        event_id: ticket.event_id,
        event_title: ticket.event_title,
        event_subtitle: ticket.event_subtitle,
        event_slug: ticket.event_slug,
        function_id: ticket.function_id,
        is_active: ticket.ticket_is_active,
        total_capacity: ticket.total_capacity,
        available_count: ticket.available_count,
        reserved_count: ticket.reserved_count,
        sold_count: ticket.sold_count,
        status: ticket.ticket_status,
        eligibility_criteria: ticket.ticket_eligibility_criteria,
        registration_types: registrationTypes,
        created_at: ticket.ticket_created_at,
        updated_at: ticket.ticket_updated_at
      };
    });

    // Filter out inactive tickets
    transformedTickets = transformedTickets.filter(ticket => ticket.is_active === true);
    console.log(`[API] Filtered to ${transformedTickets.length} active tickets`);

    // Filter by registration type if requested
    if (registrationType) {
      transformedTickets = transformedTickets.filter(ticket => 
        ticket.registration_types.includes(registrationType)
      );
      console.log(`[API] Filtered to ${transformedTickets.length} tickets for registration type: ${registrationType}`);
    }

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