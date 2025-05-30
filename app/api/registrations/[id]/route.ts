import { NextResponse } from "next/server";
import { createClient } from '@/utils/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: registrationId } = await params;
    
    console.group("📋 Fetch Registration Details");
    console.log("Registration ID:", registrationId);
    
    // Create authenticated client
    const supabase = await createClient();
    
    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("Authentication error:", authError);
      console.groupEnd();
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }
    
    // Get registration data - RLS will ensure user owns this registration
    const { data: registration, error: registrationError } = await supabase
      .from("registrations")
      .select("*")
      .eq("registration_id", registrationId)
      .single();
    
    if (registrationError) {
      console.error("Error fetching registration:", registrationError);
      console.groupEnd();
      return NextResponse.json(
        { error: "Registration not found" },
        { status: 404 }
      );
    }
    
    // Get attendees
    const { data: attendees, error: attendeesError } = await supabase
      .from("attendees")
      .select("*")
      .eq("registrationid", registrationId);
    
    if (attendeesError) {
      console.error("Error fetching attendees:", attendeesError);
    }
    
    // Get tickets
    const { data: tickets, error: ticketsError } = await supabase
      .from("tickets")
      .select("*")
      .in("attendee_id", attendees?.map(a => a.attendeeid) || []);
    
    if (ticketsError) {
      console.error("Error fetching tickets:", ticketsError);
    }
    
    // Return combined data
    const responseData = {
      registration,
      attendees: attendees || [],
      tickets: tickets || [],
    };
    
    console.log("Registration data fetched successfully");
    console.groupEnd();
    
    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Error in fetch registration API:", error);
    console.groupEnd();
    return NextResponse.json(
      { error: "Failed to fetch registration details" },
      { status: 500 }
    );
  }
} 