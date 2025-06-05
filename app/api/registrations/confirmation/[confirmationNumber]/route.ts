import { NextResponse } from "next/server";
import { createClient } from '@/utils/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ confirmationNumber: string }> }
) {
  try {
    const { confirmationNumber } = await params;
    
    console.group("📋 Fetch Registration by Confirmation Number");
    console.log("Confirmation Number:", confirmationNumber);
    
    // Create client (public access for confirmation page)
    const supabase = await createClient();
    
    // First, determine the registration type using the unified view
    const { data: registrationInfo, error: infoError } = await supabase
      .from("registration_confirmation_unified_view")
      .select("registration_id, registration_type, payment_status, status")
      .eq("confirmation_number", confirmationNumber)
      .single();
    
    if (infoError || !registrationInfo) {
      console.error("Error fetching registration info:", infoError);
      console.groupEnd();
      return NextResponse.json(
        { error: "Registration not found" },
        { status: 404 }
      );
    }
    
    // Ensure payment is completed before showing confirmation
    if (registrationInfo.payment_status !== 'completed' || registrationInfo.status !== 'completed') {
      console.error("Registration payment not completed");
      console.groupEnd();
      return NextResponse.json(
        { error: "Payment not completed" },
        { status: 400 }
      );
    }
    
    // Fetch from the appropriate view based on registration type
    let viewName: string;
    switch (registrationInfo.registration_type) {
      case 'individuals':
        viewName = 'individuals_registration_confirmation_view';
        break;
      case 'lodge':
        viewName = 'lodge_registration_confirmation_view';
        break;
      case 'delegation':
        viewName = 'delegation_registration_confirmation_view';
        break;
      default:
        console.error("Unknown registration type:", registrationInfo.registration_type);
        console.groupEnd();
        return NextResponse.json(
          { error: "Invalid registration type" },
          { status: 400 }
        );
    }
    
    // Fetch full registration data from the appropriate view
    const { data: registration, error: registrationError } = await supabase
      .from(viewName)
      .select("*")
      .eq("confirmation_number", confirmationNumber)
      .single();
    
    if (registrationError || !registration) {
      console.error("Error fetching registration details:", registrationError);
      console.groupEnd();
      return NextResponse.json(
        { error: "Failed to fetch registration details" },
        { status: 500 }
      );
    }
    
    console.log("Registration data fetched successfully", {
      registrationId: registration.registration_id,
      registrationType: registrationInfo.registration_type,
      attendeeCount: registration.total_attendees || registration.total_members || registration.total_delegates
    });
    console.groupEnd();
    
    return NextResponse.json({
      success: true,
      data: registration,
      registrationType: registrationInfo.registration_type
    });
    
  } catch (error) {
    console.error("Error in fetch registration by confirmation API:", error);
    console.groupEnd();
    return NextResponse.json(
      { error: "Failed to fetch registration details" },
      { status: 500 }
    );
  }
}