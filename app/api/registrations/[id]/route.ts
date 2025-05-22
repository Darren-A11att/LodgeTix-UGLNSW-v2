import { NextResponse } from "next/server";
import { table } from "@/lib/supabase";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const registrationId = params.id;
    
    console.group("📋 Fetch Registration Details");
    console.log("Registration ID:", registrationId);
    
    // Get registration data
    const { data: registration, error: registrationError } = await table("registrations")
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
    const { data: attendees, error: attendeesError } = await table("attendees")
      .select("*")
      .eq("registration_id", registrationId);
    
    if (attendeesError) {
      console.error("Error fetching attendees:", attendeesError);
    }
    
    // Get tickets
    const { data: tickets, error: ticketsError } = await table("tickets")
      .select("*")
      .in("attendee_id", attendees?.map(a => a.attendee_id) || []);
    
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