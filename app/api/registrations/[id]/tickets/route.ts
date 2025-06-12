import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@/utils/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.group("🎫 Registration Ticket Persistence API");
    
    const { id: registrationId } = await params;
    const { tickets, attendeeUpdates } = await request.json();
    console.log("Received ticket persistence request:", {
      registrationId,
      ticketCount: tickets?.length || 0,
      attendeeCount: attendeeUpdates?.length || 0
    });
    
    // Validate required fields
    if (!registrationId) {
      console.error("Missing registration ID");
      console.groupEnd();
      return NextResponse.json(
        { error: "Registration ID is required" },
        { status: 400 }
      );
    }
    
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("Authentication failed:", authError);
      console.groupEnd();
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }
    
    // Call our enhanced RPC function to persist tickets and update attendee data
    const { data: result, error: rpcError } = await supabase.rpc('upsert_individual_registration', {
      p_registration_data: {
        registrationId: params.id,
        authUserId: user.id,
        tickets: tickets || [],
        ticketSelections: attendeeUpdates?.reduce((acc: any, update: any) => {
          acc[update.attendee_id] = update.selected_tickets;
          return acc;
        }, {}) || {},
        // Include minimal required fields for the RPC
        functionId: 'placeholder-function-id', // This would be passed from the frontend
        billingDetails: {
          firstName: 'Test',
          lastName: 'User',
          emailAddress: 'test@example.com',
          mobileNumber: '+61400000000'
        },
        totalAmount: 0,
        subtotal: 0,
        stripeFee: 0,
        paymentCompleted: false
      }
    });
    
    if (rpcError) {
      console.error("RPC Error:", rpcError);
      console.groupEnd();
      return NextResponse.json(
        { error: `Failed to persist tickets: ${rpcError.message}` },
        { status: 500 }
      );
    }
    
    console.log("✅ Tickets persisted successfully:", result);
    console.groupEnd();
    
    return NextResponse.json({
      success: true,
      tickets_created: result?.ticketsCreated || tickets?.length || 0,
      attendees_updated: result?.attendeesCreated || attendeeUpdates?.length || 0,
      registration_id: params.id
    });
    
  } catch (error: any) {
    console.error("Error in ticket persistence API:", error);
    console.groupEnd();
    return NextResponse.json(
      { error: `Failed to process ticket persistence: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: registrationId } = await params;
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }
    
    // Fetch tickets for the registration
    const { data: tickets, error: ticketsError } = await supabase
      .from('tickets')
      .select(`
        ticket_id,
        attendee_id,
        event_id,
        ticket_type_id,
        package_id,
        price_paid,
        original_price,
        status,
        payment_status,
        is_partner_ticket
      `)
      .eq('registration_id', registrationId);
    
    if (ticketsError) {
      console.error("Error fetching tickets:", ticketsError);
      return NextResponse.json(
        { error: "Failed to fetch tickets" },
        { status: 500 }
      );
    }
    
    // Fetch attendee data with ticket selections
    const { data: attendees, error: attendeesError } = await supabase
      .from('attendees')
      .select('attendee_id, attendee_data')
      .eq('registration_id', registrationId);
    
    if (attendeesError) {
      console.error("Error fetching attendees:", attendeesError);
      return NextResponse.json(
        { error: "Failed to fetch attendees" },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      tickets: tickets || [],
      attendees: attendees || [],
      registration_id: registrationId
    });
    
  } catch (error: any) {
    console.error("Error fetching registration tickets:", error);
    return NextResponse.json(
      { error: `Failed to fetch tickets: ${error.message}` },
      { status: 500 }
    );
  }
}