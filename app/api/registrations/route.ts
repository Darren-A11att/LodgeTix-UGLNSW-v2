import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { UnifiedAttendeeData } from "@/shared/types/supabase";
import { generateUUID } from "@/lib/uuid-slug-utils";
import { Tables, TablesInsert, Database } from "@/supabase/types";

export async function POST(request: Request) {
  // Use a single try/catch block to handle all errors
  try {
    const data = await request.json();
    console.group("📝 Registration API");
    console.log("Received registration data:", JSON.stringify(data, null, 2));
    
    // Extract the auth token from headers
    const authHeader = request.headers.get('authorization');
    console.log("Auth header present:", !!authHeader);
    
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

    // Handle eventId - it might be a slug or UUID
    let finalEventId = eventId || (primaryAttendee?.event_id || primaryAttendee?.eventId || null);
    
    // Special check for known problematic values
    if (finalEventId === 'error-event' || finalEventId === 'undefined' || finalEventId === 'null') {
      console.error(`Received invalid event ID value: '${finalEventId}'`);
      console.error('This typically indicates the event UUID was not properly passed from the tickets page.');
      console.groupEnd();
      return NextResponse.json(
        { error: `Invalid event ID received. Please refresh the page and try again. If the problem persists, please return to the event page and click "Get Tickets" again.` },
        { status: 400 }
      );
    }
    
    // Check if eventId is a slug (not a UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (finalEventId && !uuidRegex.test(finalEventId)) {
      console.log(`Event ID appears to be a slug: ${finalEventId}`);
      // For now, we'll need to look up the event by slug to get the UUID
      // This is a temporary solution - ideally the client should send the UUID
      try {
        const { getEventByIdOrSlug } = await import('@/lib/event-facade');
        const event = await getEventByIdOrSlug(finalEventId);
        if (event && event.id && uuidRegex.test(event.id)) {
          console.log(`Found event UUID for slug ${finalEventId}: ${event.id}`);
          finalEventId = event.id;
        } else {
          console.error(`Could not find valid event for slug: ${finalEventId}`);
          console.groupEnd();
          return NextResponse.json(
            { error: `Invalid event specified: ${finalEventId}. Please ensure you are registering for a valid event.` },
            { status: 400 }
          );
        }
      } catch (error) {
        console.error(`Error looking up event by slug: ${error}`);
        console.groupEnd();
        return NextResponse.json(
          { error: `Unable to validate event: ${finalEventId}. Please try again or contact support.` },
          { status: 400 }
        );
      }
    }
    
    // Final validation - ensure we have a valid UUID
    if (!finalEventId || !uuidRegex.test(finalEventId)) {
      console.error(`Invalid event ID after processing: ${finalEventId}`);
      console.groupEnd();
      return NextResponse.json(
        { error: "A valid event must be specified for registration." },
        { status: 400 }
      );
    }

    // Prepare registration record using snake_case for database columns
    const registrationRecord: TablesInsert<'registrations'> = {
      registration_id: newRegistrationId,
      event_id: finalEventId,
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
    
    // Use the official server client pattern for auth verification
    const supabase = await createClient();
    
    // First, verify the user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error("Authentication error:", authError);
      console.groupEnd();
      return NextResponse.json(
        { error: "User not authenticated. Please refresh the page and try again." },
        { status: 401 }
      );
    }
    
    // Verify the customerId matches the authenticated user
    if (user.id !== customerId) {
      console.error("Customer ID mismatch:", { userId: user.id, customerId });
      console.groupEnd();
      return NextResponse.json(
        { error: "Authentication mismatch. Please refresh the page and try again." },
        { status: 403 }
      );
    }
    
    // Use admin client for database operations to bypass RLS temporarily
    // This is a temporary solution until RLS policies are properly configured
    console.log("Using admin client for database operations (temporary RLS bypass)");
    const adminClient = createAdminClient();
    
    // Also keep a reference to the regular client for operations that need user context
    const userClient = supabase;
    
    // First, ensure customer exists or create one
    console.log("Checking if customer exists for user:", customerId);
    const { data: existingCustomer, error: customerCheckError } = await adminClient
      .from("customers")
      .select("id")
      .eq("id", customerId)
      .single();
    
    if (customerCheckError && customerCheckError.code === 'PGRST116') {
      // Customer doesn't exist, create one
      console.log("Customer doesn't exist, creating new customer record");
      const customerRecord = {
        id: customerId,
        user_id: customerId, // Link to auth user
        email: billingDetails?.emailAddress || primaryAttendee?.primaryEmail || null,
        first_name: billingDetails?.firstName || primaryAttendee?.firstName || null,
        last_name: billingDetails?.lastName || primaryAttendee?.lastName || null,
        phone: billingDetails?.mobileNumber || primaryAttendee?.primaryPhone || null,
        created_at: new Date().toISOString()
      };
      
      const { data: newCustomer, error: customerCreateError } = await adminClient
        .from("customers")
        .insert(customerRecord)
        .select()
        .single();
      
      if (customerCreateError) {
        console.error("Error creating customer:", customerCreateError);
        console.groupEnd();
        return NextResponse.json(
          { error: `Failed to create customer record: ${customerCreateError.message}` },
          { status: 500 }
        );
      }
      
      console.log("Customer created successfully:", newCustomer);
    } else if (customerCheckError) {
      console.error("Error checking customer:", customerCheckError);
      console.groupEnd();
      return NextResponse.json(
        { error: `Failed to check customer: ${customerCheckError.message}` },
        { status: 500 }
      );
    } else {
      console.log("Customer already exists");
    }

    // Insert registration record into BOTH tables to handle FK constraints
    // This is a temporary workaround for the table naming inconsistency
    console.log("Inserting registration into Registrations (capital R) table");
    const { data: savedRegistration, error: registrationError } = await adminClient
      .from("Registrations")
      .insert(registrationRecord)
      .select()
      .single<Tables<'Registrations'>>(); // Use capital R type
    
    if (!registrationError && savedRegistration) {
      // Also insert into lowercase table for tickets FK
      console.log("Also inserting into registrations (lowercase) table for consistency");
      const { error: lowerCaseError } = await adminClient
        .from("registrations")
        .insert(registrationRecord)
        .select()
        .single();
        
      if (lowerCaseError) {
        console.warn("Failed to insert into lowercase registrations:", lowerCaseError.message);
      }
    }
    
    if (registrationError) {
      console.error("Error saving registration:", registrationError);
      console.error("Registration record attempted:", registrationRecord);
      
      // Check if it's an RLS policy error
      if (registrationError.message.includes('row-level security policy')) {
        console.error("RLS Policy Error - User may not have permission to insert registrations");
        console.groupEnd();
        return NextResponse.json(
          { 
            error: "Database permission error. Please ensure you are properly authenticated. If this persists, please contact support.",
            details: registrationError.message 
          },
          { status: 403 }
        );
      }
      
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
    const attendeeIdMapping = new Map<string, string>(); // Map old IDs to new IDs for duplicate submissions
    
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
      
      // Check if attendee already exists (duplicate submission)
      const { data: existingAttendee } = await adminClient
        .from("attendees")
        .select()
        .eq("attendeeid", attendeeRecord.attendeeid)
        .single();
      
      let savedAttendee;
      
      if (existingAttendee) {
        console.log(`Attendee ${attendeeRecord.attendeeid} already exists from a previous registration`);
        // Generate a new attendee ID for this registration
        const newAttendeeId = uuidv4();
        console.log(`Generating new attendee ID: ${newAttendeeId}`);
        
        // Create new attendee record with new ID
        const updatedAttendeeRecord = {
          ...attendeeRecord,
          attendeeid: newAttendeeId
        };
        
        const { data: newAttendee, error: attendeeError } = await adminClient
          .from("attendees")
          .insert(updatedAttendeeRecord)
          .select()
          .single<Tables<'attendees'>>();
          
        if (attendeeError) {
          console.error("Error saving new attendee:", attendeeError);
          console.error("Attendee record attempted:", updatedAttendeeRecord);
          
          // Check if it's an RLS policy error
          if (attendeeError.message.includes('row-level security policy')) {
            console.error("RLS Policy Error - User may not have permission to insert attendees");
            console.error("This typically means the RLS policies need to be configured in Supabase");
            
            // TEMPORARY WORKAROUND: Continue without attendees for now
            // The registration is saved, which is the critical part
            console.warn("TEMPORARY: Continuing without attendee data due to RLS policies");
            console.warn("Please run the migration script: 20250523_temporary_registration_permissions.sql");
            
            // Skip this attendee and continue
            continue;
          }
          
          console.groupEnd();
          return NextResponse.json(
            { error: `Failed to save attendee: ${attendeeError.message}` },
            { status: 500 }
          );
        }
        
        savedAttendee = newAttendee;
        
        // Update the attendee ID mapping for tickets
        attendeeIdMapping.set(attendeeRecord.attendeeid, newAttendeeId);
      } else {
        // Insert new attendee as normal
        const { data: newAttendee, error: attendeeError } = await adminClient
          .from("attendees")
          .insert(attendeeRecord)
          .select()
          .single<Tables<'attendees'>>();
        
        if (attendeeError) {
          console.error("Error saving attendee:", attendeeError);
          console.error("Attendee record attempted:", attendeeRecord);
          
          // Check if it's an RLS policy error
          if (attendeeError.message.includes('row-level security policy')) {
            console.error("RLS Policy Error - User may not have permission to insert attendees");
            console.error("This typically means the RLS policies need to be configured in Supabase");
            
            // TEMPORARY WORKAROUND: Continue without attendees for now
            // The registration is saved, which is the critical part
            console.warn("TEMPORARY: Continuing without attendee data due to RLS policies");
            console.warn("Please run the migration script: 20250523_temporary_registration_permissions.sql");
            
            // Skip this attendee and continue
            continue;
          }
          
          console.groupEnd();
          return NextResponse.json(
            { error: `Failed to save attendee: ${attendeeError.message}` },
            { status: 500 }
          );
        }
        
        savedAttendee = newAttendee;
      }
      savedAttendeeRecords.push(savedAttendee!); 
      
      if (attendee.isPrimary && savedAttendee) {
        // Update both tables
        const { error: updateRegError } = await adminClient
          .from("Registrations")
          .update({ primary_attendee_id: savedAttendee.attendeeid }) 
          .eq("registration_id", newRegistrationId);
          
        if (updateRegError) {
          console.error("Error updating Registrations with primary_attendee_id:", updateRegError);
        }
        
        // Also update lowercase table
        const { error: updateLowerError } = await adminClient
          .from("registrations")
          .update({ primary_attendee_id: savedAttendee.attendeeid }) 
          .eq("registration_id", newRegistrationId);
          
        if (updateLowerError) {
          console.warn("Failed to update lowercase registrations:", updateLowerError.message);
        }
      }
    }
    
    // Process tickets if available
    if (tickets.length > 0) {
      const savedTicketRecords: Tables<'tickets'>[] = []; // Corrected Row type usage
      for (const ticket of tickets) {
        // Check if attendee ID was remapped due to duplicate
        const originalAttendeeId = ticket.attendeeId || ticket.attendee_id;
        const actualAttendeeId = attendeeIdMapping.get(originalAttendeeId) || originalAttendeeId;
        
        const attendeeForTicket = savedAttendeeRecords.find(a => a.attendeeid === actualAttendeeId);
        
        if (!attendeeForTicket) {
          console.warn(`No saved attendee found for ticket with attendeeId: ${originalAttendeeId} (mapped: ${actualAttendeeId}). Skipping ticket.`);
          continue;
        }
        
        // tickets.ticket_status column uses 'payment_status' enum from Database["public"]["Enums"]["payment_status"]
        let ticketStatusForDb: Database["public"]["Enums"]["payment_status"] = 'pending'; 
        const clientTicketStatus = ticket.status?.toLowerCase();
        if (clientTicketStatus === 'pending' || clientTicketStatus === 'completed' || clientTicketStatus === 'failed' || clientTicketStatus === 'refunded' || clientTicketStatus === 'partially_refunded' || clientTicketStatus === 'cancelled' || clientTicketStatus === 'expired') {
            ticketStatusForDb = clientTicketStatus as Database["public"]["Enums"]["payment_status"];
        }

        const ticketRecord: TablesInsert<'tickets'> = {
          // id is generated automatically by Supabase
          id: uuidv4(),
          attendee_id: attendeeForTicket.attendeeid!, 
          event_id: finalEventId, // Use the resolved event ID (UUID)
          ticket_price: ticket.price || 0, 
          ticket_status: ticketStatusForDb,
          registration_id: newRegistrationId,
          // For packages, use ticketDefinitionId; for individual tickets, use eventTicketId
          ticket_type_id: ticket.isPackage ? (ticket.ticketDefinitionId || ticket.package_id) : (ticket.eventTicketId || ticket.event_ticket_id),
          is_partner_ticket: false // Default to false, can be updated based on business logic
        };
        
        console.log("Ticket record to insert:", ticketRecord);
        
        const { data: savedTicket, error: ticketError } = await adminClient
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
    
    // Check if we had to skip attendees due to RLS
    const hasAttendeeWarnings = savedAttendeeRecords.length < allAttendeesToProcess.length;
    
    console.groupEnd();
    
    const response: any = {
      success: true,
      registrationId: newRegistrationId,
      confirmationNumber: `REG-${newRegistrationId.substring(0, 8).toUpperCase()}`,
      registrationData: savedRegistration,
    };
    
    // Add warning if attendees were skipped
    if (hasAttendeeWarnings) {
      response.warning = "Registration saved successfully, but attendee details could not be saved due to database permissions. This is a temporary issue that will be resolved soon.";
      response.partialSave = true;
      response.savedAttendees = savedAttendeeRecords.length;
      response.totalAttendees = allAttendeesToProcess.length;
    }
    
    return NextResponse.json(response);
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
