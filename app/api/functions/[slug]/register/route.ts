import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-singleton';
import type { Database } from '@/shared/types/database';

interface CreateFunctionRegistrationRequest {
  functionId: string;
  attendees: Array<{
    attendee_type: Database['public']['Enums']['attendee_type'];
    title?: string;
    first_name: string;
    last_name: string;
    suffix?: string;
    email?: string;
    phone?: string;
    dietary_requirements?: string;
    special_needs?: string;
    contact_preference: Database['public']['Enums']['attendee_contact_preference'];
    is_primary?: boolean;
    is_partner?: boolean;
    has_partner?: boolean;
    related_attendee_id?: string;
    relationship?: string;
    event_title?: string;
    masonic_profile?: {
      grand_lodge_id?: string;
      lodge_id?: string;
      rank?: string;
      masonic_title?: string;
      grand_rank?: string;
      grand_office?: string;
      grand_officer?: string;
    };
  }>;
  selectedEvents: string[]; // Event IDs within the function
  packages?: Array<{
    package_id: string;
    attendee_index: number;
  }>;
  contactInfo: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    business_name?: string;
    billing_street_address?: string;
    billing_city?: string;
    billing_state?: string;
    billing_postal_code?: string;
    billing_country?: string;
  };
  registrationType: Database['public']['Enums']['registration_type'];
}

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const supabase = getSupabaseClient(true);
    const body: CreateFunctionRegistrationRequest = await request.json();

    // First, verify the function exists and matches the slug
    const { data: functionData, error: functionError } = await supabase
      .from('functions')
      .select('function_id, name, slug')
      .eq('slug', params.slug)
      .single();

    if (functionError || !functionData) {
      return NextResponse.json(
        { error: 'Function not found' },
        { status: 404 }
      );
    }

    // Validate that the provided functionId matches the slug
    if (body.functionId !== functionData.function_id) {
      return NextResponse.json(
        { error: 'Function ID mismatch' },
        { status: 400 }
      );
    }

    // Validate selected events belong to the function
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('event_id')
      .eq('function_id', body.functionId)
      .in('event_id', body.selectedEvents);

    if (eventsError || events?.length !== body.selectedEvents.length) {
      return NextResponse.json(
        { error: 'Invalid events for function' },
        { status: 400 }
      );
    }

    // Prepare tickets array based on selected events and packages
    const tickets: Array<{
      ticket_type_id?: string;
      package_id?: string;
      attendee_index: number;
      is_partner_ticket?: boolean;
    }> = [];

    // Add package tickets if any
    if (body.packages) {
      body.packages.forEach(pkg => {
        tickets.push({
          package_id: pkg.package_id,
          attendee_index: pkg.attendee_index
        });
      });
    }

    // Create the registration using the RPC
    const { data, error } = await supabase.rpc('create_function_registration', {
      p_function_id: body.functionId,
      p_registration: {
        function_id: body.functionId,
        registration_type: body.registrationType,
        agree_to_terms: true,
        registration_data: {
          selected_events: body.selectedEvents,
          function_name: functionData.name,
          function_slug: functionData.slug
        }
      },
      p_customer: body.contactInfo,
      p_attendees: body.attendees,
      p_tickets: tickets,
      p_selected_events: body.selectedEvents
    });

    if (error) {
      console.error('Error creating registration:', error);
      return NextResponse.json(
        { error: 'Failed to create registration' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      registrationId: data.registration_id,
      confirmationNumber: data.confirmation_number,
      totalAmount: data.total_amount,
      customerId: data.customer_id,
      attendeeIds: data.attendee_ids
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}