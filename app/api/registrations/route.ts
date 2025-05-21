import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { supabase, table } from "@/lib/supabase";
import { UnifiedAttendeeData } from "@/shared/types/supabase";
import { generateUUID } from "@/lib/uuid-slug-utils";

export async function POST(request: Request) {
  // Use a single try/catch block to handle all errors
  try {
    const data = await request.json();
    console.group("📝 Registration API");
    console.log("Received registration data:", JSON.stringify(data, null, 2));
    
    // Extract data from the request
    const {
      registrationId: draftId,  // Rename to draftId to clarify it's not used as is
      registrationType,
      primaryAttendee,
      additionalAttendees = [],
      tickets = [],
      totalAmount = 0,
      paymentIntentId = null,
      billingDetails,
      eventId
    } = data;
    
    // Validate required data
    if (!registrationType) {
      console.error("Missing registration type");
      console.groupEnd();
      return NextResponse.json(
        { error: "Registration type is required" },
        { status: 400 }
      );
    }
    
    if (!primaryAttendee) {
      console.error("Missing primary attendee data");
      console.groupEnd();
      return NextResponse.json(
        { error: "Primary attendee data is required" },
        { status: 400 }
      );
    }
    
    // Always generate a proper UUID, ignoring any draft ID that might be provided
    const registrationId = uuidv4();
    console.log(`[Server] Generating new UUID for registration: ${registrationId} (from draft: ${draftId || 'none'})`);
    
    // Add UUID regex for validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    // Todo: Ideally, we should use a database transaction here to ensure all operations succeed or fail together
    // For now we'll handle this with careful error handling and nested operations
    
    // Prepare registration record - using snake_case column names for database consistency
    const registrationRecord = {
      "registration_id": registrationId,  // Always use the newly generated UUID
      "event_id": eventId || (primaryAttendee?.eventId || null),
      "customer_id": data.customerId || null,
      "registration_date": new Date().toISOString(),
      "status": "unpaid",
      "total_amount_paid": 0,
      "total_price_paid": totalAmount,
      "payment_status": "pending",
      "agree_to_terms": true,
      "stripe_payment_intent_id": paymentIntentId,
      "primary_attendee_id": null, // Will be updated after attendee creation
      "registration_type": registrationType || "individual",
      "created_at": new Date().toISOString(),
      "updated_at": new Date().toISOString(),
      "registration_data": data.registrationData || null,
    };
    
    console.log("Registration record to insert:", registrationRecord);
    
    // Insert registration record
    const { data: registrationData, error: registrationError } = await table("Registrations")
      .insert(registrationRecord)
      .select()
      .single();
    
    if (registrationError) {
      console.error("Error saving registration:", registrationError);
      console.groupEnd();
      return NextResponse.json(
        { error: `Failed to save registration: ${registrationError.message}` },
        { status: 500 }
      );
    }
    
    console.log("Registration saved successfully:", registrationData);
    
    // Process attendees
    const allAttendees = [primaryAttendee, ...additionalAttendees].filter(Boolean);
    const attendeeRecords = [];
    
    for (const attendee of allAttendees) {
      // Create attendee record - using snake_case column names as per schema
      const attendeeRecord = {
        attendee_id: attendee.attendeeId || uuidv4(),
        registration_id: registrationId,  // snake_case as per schema
        attendee_type: attendee.attendeeType?.toLowerCase() || (attendee.isPrimary ? 'mason' : 'guest'),
        event_title: data.eventTitle || '',
        dietary_requirements: attendee.dietaryRequirements || null,
        special_needs: attendee.specialNeeds || null,
        contact_preference: attendee.contactPreference || 'Directly',
        relationship: attendee.relationship || null,
        related_attendee_id: attendee.partnerOf || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // We don't have people table integration yet, so person_id is null
        person_id: null
      };
      
      console.log("Attendee record to insert:", attendeeRecord);
      
      const { data: attendeeData, error: attendeeError } = await table("Attendees")
        .insert(attendeeRecord)
        .select()
        .single();
      
      if (attendeeError) {
        console.error("Error saving attendee:", attendeeError);
        console.groupEnd();
        return NextResponse.json(
          { error: `Failed to save attendee: ${attendeeError.message}` },
          { status: 500 }
        );
      }
      
      attendeeRecords.push(attendeeData);
      
      // If this is the primary attendee, update the registration record
      if (attendee.isPrimary) {
        const { error: updateError } = await table("Registrations")
          .update({ "primary_attendee_id": attendeeData.attendeeid })
          .eq("registration_id", registrationId);  // snake_case column names
          
        if (updateError) {
          console.error("Error updating registration with primary attendee:", updateError);
        }
      }
    }
    
    // Process tickets if available
    if (tickets.length > 0) {
      const ticketRecords = [];
      
      for (const ticket of tickets) {
        // Determine which attendee this ticket belongs to
        const attendeeRecord = attendeeRecords.find(a => a.attendeeid === ticket.attendeeId);
        
        if (!attendeeRecord) {
          console.warn(`No attendee found for ticket with attendeeId: ${ticket.attendeeId}`);
          continue;
        }
        
        // Create ticket record - using lowercase field names as per schema
        const ticketRecord = {
          ticketid: uuidv4(),
          attendeeid: attendeeRecord.attendeeid,
          registrationid: registrationId,  // lowercase as per schema
          eventid: eventId || (primaryAttendee?.eventId || null),
          pricepaid: ticket.price || 0,
          status: 'reserved',
          description: ticket.description || ticket.name || 'Event ticket',
          ticket_name: ticket.name || 'Ticket',
          createdat: new Date().toISOString(),
          updatedat: new Date().toISOString(),
          packageid: ticket.isPackage ? ticket.id.split('-')[1] : null,
          eventticketid: ticket.eventTicketId || null,
        };
        
        console.log("Ticket record to insert:", ticketRecord);
        
        const { data: ticketData, error: ticketError } = await table("Tickets")
          .insert(ticketRecord)
          .select()
          .single();
        
        if (ticketError) {
          console.error("Error saving ticket:", ticketError);
          continue;
        }
        
        ticketRecords.push(ticketData);
      }
      
      console.log(`Saved ${ticketRecords.length} tickets`);
    }
    
    // Return the registration info with confirmation
    console.log("Registration process completed successfully");
    console.log("Registration ID:", registrationId);
    console.log("UUID validation:", uuidRegex.test(registrationId) ? "Valid UUID format" : "Invalid UUID format");
    console.log("Confirmation number:", `REG-${registrationId.substring(0, 8).toUpperCase()}`);
    console.groupEnd();
    
    return NextResponse.json({
      success: true,
      registrationId,
      confirmationNumber: `REG-${registrationId.substring(0, 8).toUpperCase()}`,
      registrationData: registrationData, // Return the full registration data for reference
    });
  } catch (error: any) {
    console.error("Error in registration API:", error);
    console.error("Stack trace:", error.stack);
    console.groupEnd();
    return NextResponse.json(
      { error: `Failed to process registration: ${error.message}` },
      { status: 500 }
    );
  }
}
