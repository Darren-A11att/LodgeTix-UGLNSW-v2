import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { getServerClient, table } from '@/lib/supabase-singleton';
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
    
    // Corrected validRegistrationTypes to match enum and default value from supabase/types.ts
    const validRegistrationTypes: Database["public"]["Enums"]["registration_type"][] = ['individuals', 'groups', 'officials', 'lodge', 'delegation'];
    let finalRegistrationType: Database["public"]["Enums"]["registration_type"] = "individuals"; // Default to a valid enum member

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
      registration_type: finalRegistrationType, // Already correctly typed
      registration_data: data.registrationData || null,
    };
    
    console.log("Registration record to insert:", registrationRecord);
    
    const supabaseClient = getServerClient(); 

    // Insert registration record
    const { data: savedRegistration, error: registrationError } = await supabaseClient
      .from("registrations")
      .insert(registrationRecord)
      .select()
      .single<Tables<'registrations'>>(); // Corrected Row type usage
    
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
    const savedAttendeeRecords: Tables<'attendees'>[] = []; // Corrected Row type usage
    
    for (const attendee of allAttendeesToProcess) {
      const newAttendeeId = attendee.attendee_id || attendee.attendeeId || uuidv4();
      
      let attendeeTypeForDb: Database["public"]["Enums"]["attendee_type"] = 'guest'; 
      const clientAttendeeType = attendee.attendeeType?.toLowerCase();
      if (clientAttendeeType === 'mason' || clientAttendeeType === 'guest' || clientAttendeeType === 'ladypartner' || clientAttendeeType === 'guestpartner') {
        attendeeTypeForDb = clientAttendeeType;
      } else if (attendee.isPrimary && clientAttendeeType !== 'ladypartner' && clientAttendeeType !== 'guestpartner') {
        attendeeTypeForDb = 'mason';
      } else if (attendee.isPrimary) {
        attendeeTypeForDb = 'mason'; 
        console.warn(`Primary attendee ${newAttendeeId} had type ${clientAttendeeType}, defaulting to 'mason'.`);
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
        eventtitle: data.eventTitle || undefined, 
        dietaryrequirements: attendee.dietaryRequirements || null,
        specialneeds: attendee.specialNeeds || null,
        contactpreference: contactPreferenceForDb,
        relationship: attendee.relationship || null,
        relatedattendeeid: attendee.partnerOf || attendee.related_attendee_id || null,
        person_id: attendee.person_id || attendee.personId || null, 
      };
      
      console.log("Attendee record to insert:", attendeeRecord);
      
      const { data: savedAttendee, error: attendeeError } = await supabaseClient
        .from("attendees")
        .insert(attendeeRecord)
        .select()
        .single<Tables<'attendees'>>(); // Corrected Row type usage
      
      if (attendeeError) {
        console.error("Error saving attendee:", attendeeError);
        console.groupEnd();
        return NextResponse.json(
          { error: `Failed to save attendee: ${attendeeError.message}` },
          { status: 500 }
        );
      }
      savedAttendeeRecords.push(savedAttendee!); 
      
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
      const savedTicketRecords: Tables<'tickets'>[] = []; // Corrected Row type usage
      for (const ticket of tickets) {
        const attendeeForTicket = savedAttendeeRecords.find(a => a.attendeeid === (ticket.attendeeId || ticket.attendee_id));
        
        if (!attendeeForTicket) {
          console.warn(`No saved attendee found for ticket with attendeeId: ${ticket.attendeeId || ticket.attendee_id}. Skipping ticket.`);
          continue;
        }
        
        // tickets.ticket_status column uses 'payment_status' enum from Database["public"]["Enums"]["payment_status"]
        let ticketStatusForDb: Database["public"]["Enums"]["payment_status"] = 'pending'; 
        const clientTicketStatus = ticket.status?.toLowerCase();
        if (clientTicketStatus === 'pending' || clientTicketStatus === 'completed' || clientTicketStatus === 'failed' || clientTicketStatus === 'refunded' || clientTicketStatus === 'partially_refunded' || clientTicketStatus === 'cancelled' || clientTicketStatus === 'expired') {
            ticketStatusForDb = clientTicketStatus as Database["public"]["Enums"]["payment_status"];
        }

        const ticketRecord: TablesInsert<'tickets'> = {
          // id is the primary key for tickets, and is auto-generated (optional in Insert)
          attendee_id: attendeeForTicket.attendeeid!, 
          event_id: eventId || (primaryAttendee?.event_id || primaryAttendee?.eventId || null),
          ticket_price: ticket.price || 0, 
          ticket_status: ticketStatusForDb, 
          package_id: ticket.isPackage ? (ticket.id.split('-')[1] || ticket.package_id) : null,
          event_ticket_id: ticket.eventTicketId || ticket.event_ticket_id || null,
          // Other optional fields from TablesInsert<'tickets'> like 'currency', 'original_price', 'purchased_at' etc. can be added if needed.
        };
        
        console.log("Ticket record to insert:", ticketRecord);
        
        const { data: savedTicket, error: ticketError } = await supabaseClient
          .from("tickets") 
          .insert(ticketRecord)
          .select()
          .single<Tables<'tickets'>>(); // Corrected Row type usage
        
        if (ticketError) {
          console.error("Error saving ticket:", ticketError);
          continue;
        }
        savedTicketRecords.push(savedTicket!); 
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
