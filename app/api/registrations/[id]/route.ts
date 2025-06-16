import { NextResponse } from "next/server";
import { createClient } from '@/utils/supabase/server';
import { createClientWithToken } from '@/utils/supabase/server-with-token';

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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: registrationId } = await params;
    const updateData = await request.json();
    
    console.group("📝 Update Registration Status");
    console.log("Registration ID:", registrationId);
    console.log("Update data:", updateData);
    
    // Authenticate user using same dual pattern as confirmation API
    const authHeader = request.headers.get('authorization');
    console.log("Update API - Auth header present:", !!authHeader);

    let user = null;
    let supabase = null;

    // Try auth header first (matches payment API pattern)
    if (authHeader) {
      console.log("Update API - Attempting authentication with Authorization header");
      try {
        const result = await createClientWithToken(authHeader);
        supabase = result.supabase;
        user = result.user;
        console.log("Update API - Successfully authenticated with Authorization header:", user.id);
      } catch (headerAuthError) {
        console.log("Update API - Authorization header auth failed:", headerAuthError);
      }
    }

    // Fall back to cookie auth (matches payment API pattern)
    if (!user) {
      console.log("Update API - Attempting cookie-based authentication");
      supabase = await createClient();
      
      const { data: { user: cookieUser }, error: authError } = await supabase.auth.getUser();
      console.log("Update API - Cookie auth result:", { user: cookieUser?.id, error: authError?.message });
      
      if (!authError && cookieUser) {
        user = cookieUser;
      }
    }

    if (!user) {
      console.error("No authenticated user found");
      console.groupEnd();
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }
    
    console.log("Update API - Authenticated user:", user.id);
    
    // Verify registration exists and user owns it
    const { data: registration, error: fetchError } = await supabase
      .from("registrations")
      .select("auth_user_id, registration_id")
      .eq("registration_id", registrationId)
      .single();
    
    if (fetchError || !registration) {
      console.error("Error fetching registration:", fetchError);
      console.groupEnd();
      return NextResponse.json(
        { error: "Registration not found" },
        { status: 404 }
      );
    }
    
    // Check ownership (allow if registration belongs to user or is anonymous)
    if (registration.auth_user_id && registration.auth_user_id !== user.id) {
      console.error("User does not own this registration");
      console.groupEnd();
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }
    
    // If this is a completion update, fetch additional organization data
    let enhancedUpdateData = { ...updateData };
    
    if (updateData.status === 'completed' || updateData.payment_status === 'completed') {
      console.log("Fetching organization data for completion update");
      
      // Get function and organization data to add connected_account_id
      const { data: regWithFunction, error: funcError } = await supabase
        .from("registrations")
        .select(`
          function_id,
          functions!inner (
            organiser_id,
            organisations!inner (
              stripe_onbehalfof
            )
          )
        `)
        .eq("registration_id", registrationId)
        .single();
      
      if (!funcError && regWithFunction?.functions?.organisations?.stripe_onbehalfof) {
        enhancedUpdateData.connected_account_id = regWithFunction.functions.organisations.stripe_onbehalfof;
        console.log("Added connected_account_id:", regWithFunction.functions.organisations.stripe_onbehalfof);
      } else {
        console.warn("Could not fetch connected account ID:", funcError);
      }
    }
    
    // Update registration with enhanced data
    const { data: updatedRegistration, error: updateError } = await supabase
      .from("registrations")
      .update({
        ...enhancedUpdateData,
        updated_at: new Date().toISOString()
      })
      .eq("registration_id", registrationId)
      .select()
      .single();
    
    if (updateError) {
      console.error("Error updating registration:", updateError);
      console.groupEnd();
      return NextResponse.json(
        { error: "Failed to update registration" },
        { status: 500 }
      );
    }
    
    console.log("Registration updated successfully");
    console.groupEnd();
    
    return NextResponse.json({
      success: true,
      registration: updatedRegistration
    });
    
  } catch (error) {
    console.error("Error in update registration API:", error);
    console.groupEnd();
    return NextResponse.json(
      { error: "Failed to update registration" },
      { status: 500 }
    );
  }
}