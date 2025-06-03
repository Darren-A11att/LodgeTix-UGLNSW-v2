import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { functionId: string } }
) {
  try {
    const supabase = await createClient();
    
    // Get all events for this function using the function ID directly
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select(`
        *,
        location:locations!location_id(*),
        tickets:event_tickets(
          event_ticket_id,
          name,
          description,
          price,
          eligibility_criteria
        )
      `)
      .eq('function_id', params.functionId)
      .eq('is_published', true)
      .order('event_start', { ascending: true });

    if (eventsError) {
      console.error('Error fetching events:', eventsError);
      return NextResponse.json(
        { error: 'Failed to fetch events' },
        { status: 500 }
      );
    }

    // Transform the events data
    const transformedEvents = events?.map(event => ({
      id: event.event_id,
      functionId: event.function_id,
      title: event.title,
      subtitle: event.subtitle,
      slug: event.slug,
      description: event.description,
      eventStart: event.event_start,
      eventEnd: event.event_end,
      locationId: event.location_id,
      location: event.location,
      tickets: event.tickets || [],
      metadata: event.metadata || {},
      isPublished: event.is_published,
      createdAt: event.created_at,
      updatedAt: event.updated_at
    }));

    return NextResponse.json(transformedEvents || []);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}