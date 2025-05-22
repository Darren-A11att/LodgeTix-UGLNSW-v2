import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { supabase, table } from "@/lib/supabase";
import { UnifiedAttendeeData } from "@/shared/types/supabase";
import { generateUUID } from "@/lib/uuid-slug-utils";
import { Tables, TablesInsert, Database } from "@/supabase/types";

export async function POST(request: Request) {
  // Use a single try/catch block to handle all errors
  try {
    const data = await request.json();
    console.group("📝 Registration API");
    console.log("Received registration data:", JSON.stringify(data, null, 2));
    
    // Extract data from the request
    const {
      registrationType: clientRegistrationType,
      primaryAttendee,
      additionalAttendees = [],
      tickets = [],
      totalAmount = 0,
      paymentIntentId = null,
      billingDetails,
      eventId,
      customerId
    } = data;
    
    if (!customerId) {
      console.error("CRITICAL: customerId (auth.uid()) not provided in registration request.");
      console.groupEnd();
      return NextResponse.json(
        { error: "User authentication token not provided or invalid." },
        { status: 401 } // Unauthorized
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
    
    // Always generate a proper UUID for registration_id on the server
    const newRegistrationId = uuidv4();
    console.log(`[Server] Generating new UUID for registration: ${newRegistrationId}`);
    
    // Determine finalRegistrationType (using snake_case for enum consistency if needed)
    const validRegistrationTypes: Database["public"]["Enums"]["registration_type"][] = ['individual', 'lodge', 'delegation', 'groups', 'individuals', 'officials']; // Expanded based on migration log
    let finalRegistrationType: Database["public"]["Enums"]["registration_type"] = "individual"; 

    if (clientRegistrationType && typeof clientRegistrationType === 'string' && clientRegistrationType.trim() !== '') {
        const lowerCaseClientType = clientRegistrationType.toLowerCase() as any;
        if (validRegistrationTypes.includes(lowerCaseClientType)) {
            finalRegistrationType = lowerCaseClientType;
            console.log(`Using client provided registration_type: ${finalRegistrationType}`);
        } else {
            console.warn(`Invalid registration_type '${clientRegistrationType}' received. Defaulting to '${finalRegistrationType}'.`);
        }
    } else {
        console.log(`No registration_type provided or empty. Defaulting to '${finalRegistrationType}'.`);
    }

    // Prepare registration record using snake_case for database columns
    const registrationRecord: TablesInsert<'registrations'> = {
      registration_id: newRegistrationId,
      event_id: eventId || (primaryAttendee?.event_id || primaryAttendee?.eventId || null),
      customer_id: customerId,
      registration_date: new Date().toISOString(),
      status: "unpaid",
      total_amount_paid: 0,
      total_price_paid: totalAmount, 
      payment_status: "pending", 
      agree_to_terms: data.agreeToTerms || true,
      stripe_payment_intent_id: paymentIntentId,
      primary_attendee_id: null, // Will be updated after primary attendee is created
      registration_type: finalRegistrationType as Tables<'registrations'>['Row']['registration_type'], // Cast to ensure type compatibility
      registration_data: data.registrationData || null,
    };
    
    console.log("Registration record to insert:", registrationRecord);
    
    const supabaseClient = supabase; 

    // Insert registration record
    const { data: savedRegistration, error: registrationError } = await supabaseClient
      .from("registrations")
      .insert(registrationRecord)
      .select()
      .single<Tables<'registrations'>['Row']>(); // Specify Row type for returned data
    
    if (registrationError) {
      console.error("Error saving registration:", registrationError);
      console.groupEnd();
      return NextResponse.json(
        { error: `Failed to save registration: ${registrationError.message}` },
        { status: 500 }
      );
    }
    
    console.log("Registration saved successfully:", savedRegistration);
    
    // Process attendees
    const allAttendeesToProcess = [primaryAttendee, ...additionalAttendees].filter(Boolean);
    const savedAttendeeRecords: Tables<'attendees'>['Row'][] = []; // Type the array
    
    for (const attendee of allAttendeesToProcess) {
      const newAttendeeId = attendee.attendee_id || attendee.attendeeId || uuidv4();
      // Ensure attendeetype is one of the valid enum values.
      // Assuming your enum in types.ts for attendeetype is named 'attendee_type_enum' or similar.
      // And its values are 'mason', 'guest', 'partner', 'official', 'staff'.
      // Adjust the enum name and values if they differ.
      let attendeeTypeForDb: Database["public"]["Enums"]["attendee_type"] = 'guest'; // Default
      const clientAttendeeType = attendee.attendeeType?.toLowerCase();
      if (clientAttendeeType === 'mason' || clientAttendeeType === 'partner' || clientAttendeeType === 'official' || clientAttendeeType === 'staff') {
        attendeeTypeForDb = clientAttendeeType;
      } else if (attendee.isPrimary) {
        attendeeTypeForDb = 'mason';
      }

      let contactPreferenceForDb: Database["public"]["Enums"]["attendee_contact_preference"] = 'directly';
      const clientContactPreference = attendee.contactPreference?.toLowerCase();
      if (clientContactPreference === 'directly' || clientContactPreference === 'primaryattendee' || clientContactPreference === 'mason' || clientContactPreference === 'guest' || clientContactPreference === 'providelater') {
        contactPreferenceForDb = clientContactPreference;
      }

      const attendeeRecord: TablesInsert<'attendees'> = {
        attendeeid: newAttendeeId,
        registrationid: newRegistrationId, 
        attendeetype: attendeeTypeForDb,
        eventtitle: data.eventTitle || undefined, // Match type (string | null)
        dietaryrequirements: attendee.dietaryRequirements || null,
        specialneeds: attendee.specialNeeds || null,
        contactpreference: contactPreferenceForDb,
        relationship: attendee.relationship || null,
        relatedattendeeid: attendee.partnerOf || attendee.related_attendee_id || null,
        // person_id is in the types.ts Insert type, should be null if not provided
        person_id: attendee.person_id || attendee.personId || null, 
        // createdat, updatedat are optional in Insert and handled by DB
      };
      
      console.log("Attendee record to insert:", attendeeRecord);
      
      const { data: savedAttendee, error: attendeeError } = await supabaseClient
        .from("attendees")
        .insert(attendeeRecord)
        .select()
        .single<Tables<'attendees'>['Row']>(); // Specify Row type
      
      if (attendeeError) {
        console.error("Error saving attendee:", attendeeError);
        console.groupEnd();
        return NextResponse.json(
          { error: `Failed to save attendee: ${attendeeError.message}` },
          { status: 500 }
        );
      }
      savedAttendeeRecords.push(savedAttendee!); // Add non-null assertion if confident
      
      if (attendee.isPrimary && savedAttendee) {
        const { error: updateRegError } = await supabaseClient
          .from("registrations")
          .update({ primary_attendee_id: savedAttendee.attendeeid }) 
          .eq("registration_id", newRegistrationId);
          
        if (updateRegError) {
          console.error("Error updating registration with primary_attendee_id:", updateRegError);
        }
      }
    }
    
    // Process tickets if available
    if (tickets.length > 0) {
      const savedTicketRecords: Tables<'tickets'>['Row'][] = []; // Type the array
      for (const ticket of tickets) {
        const attendeeForTicket = savedAttendeeRecords.find(a => a.attendeeid === (ticket.attendeeId || ticket.attendee_id));
        
        if (!attendeeForTicket) {
          console.warn(`No saved attendee found for ticket with attendeeId: ${ticket.attendeeId || ticket.attendee_id}. Skipping ticket.`);
          continue;
        }
        
        // Assuming ticket status enum in types.ts. Adjust if needed.
        let ticketStatusForDb: Database["public"]["Enums"]["payment_status"] = 'pending'; // Tickets.status uses payment_status enum
        const clientTicketStatus = ticket.status?.toLowerCase();
        if (clientTicketStatus === 'pending' || clientTicketStatus === 'completed' || clientTicketStatus === 'failed' || clientTicketStatus === 'refunded' || clientTicketStatus === 'partially_refunded' || clientTicketStatus === 'cancelled' || clientTicketStatus === 'expired') {
            ticketStatusForDb = clientTicketStatus;
        }

        const ticketRecord: TablesInsert<'tickets'> = {
          // ticketid is optional in Insert, created by DB default (uuid)
          attendeeid: attendeeForTicket.attendeeid!, 
          eventid: eventId || (primaryAttendee?.event_id || primaryAttendee?.eventId || null),
          pricepaid: ticket.price || 0,
          status: ticketStatusForDb, // This was 'payment_status' in types.ts for tickets table but used as 'status' here previously
          seatinfo: ticket.description || ticket.name || 'Event ticket',
          package_id: ticket.isPackage ? (ticket.id.split('-')[1] || ticket.package_id) : null,
          event_ticket_id: ticket.eventTicketId || ticket.event_ticket_id || null,
          // createdat, updatedat by DB. currency, original_price, payment_status (actual one), purchased_at, reservation_expires_at, reservation_id, ticketdefinitionid are optional
        };
        
        console.log("Ticket record to insert:", ticketRecord);
        
        const { data: savedTicket, error: ticketError } = await supabaseClient
          .from("tickets") // Table name is 'tickets'
          .insert(ticketRecord)
          .select()
          .single<Tables<'tickets'>['Row']>(); // Specify Row type
        
        if (ticketError) {
          console.error("Error saving ticket:", ticketError);
          continue;
        }
        savedTicketRecords.push(savedTicket!); // Add non-null assertion
      }
      console.log(`Saved ${savedTicketRecords.length} tickets`);
    }
    
    console.log("Registration process completed successfully on server.");
    console.log("Registration ID (server-generated):", newRegistrationId);
    console.groupEnd();
    
    return NextResponse.json({
      success: true,
      registrationId: newRegistrationId,
      confirmationNumber: `REG-${newRegistrationId.substring(0, 8).toUpperCase()}`,
      registrationData: savedRegistration,
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
