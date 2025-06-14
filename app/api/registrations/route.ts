import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { createClient } from '@/utils/supabase/server';
import { Tables, TablesInsert, Database } from "@/shared/types/database";
// Removed deprecated RPC registration imports

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
      subtotal = 0,
      stripeFee = 0,
      paymentIntentId = null,
      billingDetails,
      eventId,
      functionId,
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
    
    if (!functionId) {
      console.error("Missing function ID in registration request");
      console.groupEnd();
      return NextResponse.json(
        { error: "Function ID is required for registration" },
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
    
    // Fetch event details to get title and validate ID
    let eventData: any = null;
    let eventTitle: string | null = null;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    try {
      const { getEventByIdOrSlug } = await import('@/lib/event-facade');
      
      if (finalEventId && !uuidRegex.test(finalEventId)) {
        console.log(`Event ID appears to be a slug: ${finalEventId}`);
        // Look up by slug
        eventData = await getEventByIdOrSlug(finalEventId);
        if (eventData && eventData.id && uuidRegex.test(eventData.id)) {
          console.log(`Found event UUID for slug ${finalEventId}: ${eventData.id}`);
          finalEventId = eventData.id;
          eventTitle = eventData.name || eventData.title || null;
        } else {
          console.error(`Could not find valid event for slug: ${finalEventId}`);
          console.groupEnd();
          return NextResponse.json(
            { error: `Invalid event specified: ${finalEventId}. Please ensure you are registering for a valid event.` },
            { status: 400 }
          );
        }
      } else if (finalEventId && uuidRegex.test(finalEventId)) {
        // Already have UUID, still fetch to get title
        eventData = await getEventByIdOrSlug(finalEventId);
        if (eventData) {
          eventTitle = eventData.name || eventData.title || null;
          console.log(`Found event title: ${eventTitle}`);
        }
      }
    } catch (error) {
      console.error(`Error looking up event: ${error}`);
      // Don't fail if we can't get the title, it's not critical
      console.log(`Continuing without event title`);
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

    // Try to authenticate using multiple methods
    let user = null;
    let supabase = null;
    
    // First try: Use Authorization header if present
    if (authHeader) {
      console.log("[API] Attempting authentication with Authorization header");
      try {
        const { createClientWithToken } = await import('@/utils/supabase/server-with-token');
        const result = await createClientWithToken(authHeader);
        supabase = result.supabase;
        user = result.user;
        console.log("[API] Successfully authenticated with Authorization header:", user.id);
      } catch (headerAuthError) {
        console.log("[API] Authorization header auth failed:", headerAuthError);
        // Fall through to cookie-based auth
      }
    }
    
    // Second try: Use cookie-based auth
    if (!user) {
      console.log("[API] Attempting cookie-based authentication");
      supabase = await createClient();
      
      // Log cookie information
      console.log("[API] Request cookies:", request.headers.get('cookie'));
      
      // Try to get user from cookies
      const { data: { user: cookieUser }, error: authError } = await supabase.auth.getUser();
      console.log("[API] Cookie auth result:", { user: cookieUser?.id, error: authError?.message });
      
      if (!authError && cookieUser) {
        user = cookieUser;
      }
    }
    
    // If still no user, authentication failed
    if (!user) {
      console.error("Authentication failed: No valid session found");
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
    
    // Use the authenticated client - RLS policies will handle permissions
    console.log("Using authenticated client with RLS policies");
    const userClient = supabase;
    
    if (!userClient) {
      console.error("Failed to create Supabase client");
      console.groupEnd();
      return NextResponse.json(
        { error: "Database connection error. Please try again." },
        { status: 500 }
      );
    }
    
    // For individuals registration, redirect to dedicated endpoint
    if (finalRegistrationType === 'individuals') {
      console.log("Individuals registration should use /api/registrations/individuals endpoint");
      console.groupEnd();
      return NextResponse.json(
        { error: "Please use /api/registrations/individuals endpoint for individual registrations" },
        { status: 400 }
      );
    }
    
    // For lodge registration, redirect to dedicated endpoint
    if (finalRegistrationType === 'lodge') {
      console.log("Lodge registration should use /api/registrations/lodge endpoint");
      console.groupEnd();
      return NextResponse.json(
        { error: "Please use /api/registrations/lodge endpoint for lodge registrations" },
        { status: 400 }
      );
    }
    
    // For delegation registration, redirect to dedicated endpoint
    if (finalRegistrationType === 'delegation') {
      console.log("Delegation registration should use /api/registrations/delegation endpoint");
      console.groupEnd();
      return NextResponse.json(
        { error: "Please use /api/registrations/delegation endpoint for delegation registrations" },
        { status: 400 }
      );
    }
    
    // For non-individuals registrations, continue with existing logic
    // Always generate a proper UUID for registration_id on the server
    const newRegistrationId = uuidv4();
    console.log(`[Server] Generating new UUID for registration: ${newRegistrationId}`);
    
    // First, ensure customer exists or create/update one
    console.log("Checking if customer exists for user:", customerId);
    const { error: customerCheckError } = await userClient
      .from("customers")
      .select("customer_id")
      .eq("customer_id", customerId)
      .single();
    
    if (customerCheckError && customerCheckError.code === 'PGRST116') {
      // Customer doesn't exist, create one
      console.log("Customer doesn't exist, creating new customer record");
      const customerRecord = {
        customer_id: customerId, // This is the primary key
        
        // Basic contact info from booking contact
        email: billingDetails?.emailAddress || primaryAttendee?.primaryEmail || null,
        first_name: billingDetails?.firstName || primaryAttendee?.firstName || null,
        last_name: billingDetails?.lastName || primaryAttendee?.lastName || null,
        phone: billingDetails?.mobileNumber || primaryAttendee?.primaryPhone || null,
        business_name: billingDetails?.businessName || null,
        
        // Physical address from booking contact
        address_line1: billingDetails?.addressLine1 || null,
        address_line2: billingDetails?.addressLine2 || null,
        city: billingDetails?.suburb || null,
        state: billingDetails?.stateTerritory?.name || null,
        postal_code: billingDetails?.postcode || null,
        country: billingDetails?.country?.name || null,
        
        // Billing address (same as physical for now)
        billing_organisation_name: billingDetails?.businessName || null,
        billing_email: billingDetails?.emailAddress || null,
        billing_phone: billingDetails?.mobileNumber || null,
        billing_street_address: billingDetails?.addressLine1 || null,
        billing_city: billingDetails?.suburb || null,
        billing_state: billingDetails?.stateTerritory?.name || null,
        billing_postal_code: billingDetails?.postcode || null,
        billing_country: billingDetails?.country?.name || null,
        
        // Customer type - all registrations are booking contacts
        customer_type: 'booking_contact' as Database["public"]["Enums"]["customer_type"],
        
        created_at: new Date().toISOString()
      };
      
      const { data: newCustomer, error: customerCreateError } = await userClient
        .from("customers")
        .insert(customerRecord)
        .select()
        .single();
      
      if (customerCreateError) {
        // Check if it's a duplicate key error - this can happen in race conditions
        if (customerCreateError.code === '23505' && customerCreateError.message.includes('customers_consolidated_pkey')) {
          console.warn("Customer was created by another process, continuing...");
          // Try to fetch the customer that was just created
          const { error: refetchError } = await userClient
            .from("customers")
            .select("customer_id")
            .eq("customer_id", customerId)
            .single();
          
          if (refetchError) {
            console.error("Error fetching recently created customer:", refetchError);
            console.groupEnd();
            return NextResponse.json(
              { error: `Failed to verify customer record: ${refetchError.message}` },
              { status: 500 }
            );
          }
          console.log("Customer verified after race condition");
        } else {
          console.error("Error creating customer:", customerCreateError);
          console.groupEnd();
          return NextResponse.json(
            { error: `Failed to create customer record: ${customerCreateError.message}` },
            { status: 500 }
          );
        }
      } else {
        console.log("Customer created successfully:", newCustomer);
      }
    } else if (customerCheckError) {
      console.error("Error checking customer:", customerCheckError);
      console.groupEnd();
      return NextResponse.json(
        { error: `Failed to check customer: ${customerCheckError.message}` },
        { status: 500 }
      );
    } else {
      console.log("Customer already exists");
      
      // Update customer with latest booking contact details if provided
      if (billingDetails && (billingDetails.emailAddress || billingDetails.firstName || billingDetails.lastName || billingDetails.mobileNumber)) {
        console.log("Updating existing customer with latest booking contact details");
        const updateData: any = {};
        
        // Basic contact info
        if (billingDetails.emailAddress) updateData.email = billingDetails.emailAddress;
        if (billingDetails.firstName) updateData.first_name = billingDetails.firstName;
        if (billingDetails.lastName) updateData.last_name = billingDetails.lastName;
        if (billingDetails.mobileNumber) updateData.phone = billingDetails.mobileNumber;
        if (billingDetails.businessName) updateData.business_name = billingDetails.businessName;
        
        // Physical address
        if (billingDetails.addressLine1) updateData.address_line1 = billingDetails.addressLine1;
        if (billingDetails.addressLine2) updateData.address_line2 = billingDetails.addressLine2;
        if (billingDetails.suburb) updateData.city = billingDetails.suburb;
        if (billingDetails.postcode) updateData.postal_code = billingDetails.postcode;
        if (billingDetails.stateTerritory?.name) updateData.state = billingDetails.stateTerritory.name;
        if (billingDetails.country?.name) updateData.country = billingDetails.country.name;
        
        // Also update billing address fields
        if (billingDetails.businessName) updateData.billing_organisation_name = billingDetails.businessName;
        if (billingDetails.emailAddress) updateData.billing_email = billingDetails.emailAddress;
        if (billingDetails.mobileNumber) updateData.billing_phone = billingDetails.mobileNumber;
        if (billingDetails.addressLine1) updateData.billing_street_address = billingDetails.addressLine1;
        if (billingDetails.suburb) updateData.billing_city = billingDetails.suburb;
        if (billingDetails.stateTerritory?.name) updateData.billing_state = billingDetails.stateTerritory.name;
        if (billingDetails.postcode) updateData.billing_postal_code = billingDetails.postcode;
        if (billingDetails.country?.name) updateData.billing_country = billingDetails.country.name;
        
        updateData.updated_at = new Date().toISOString();
        
        const { error: updateError } = await userClient
          .from("customers")
          .update(updateData)
          .eq("customer_id", customerId);
        
        if (updateError) {
          console.warn("Failed to update customer booking contact details:", updateError);
          // Don't fail the registration if update fails
        }
      }
    }

    // Removed deprecated RPC registration code
    // Always use direct database inserts

    // Prepare registration record using snake_case for database columns
    const registrationRecord: TablesInsert<'registrations'> = {
      registration_id: newRegistrationId,
      function_id: functionId, // Use function_id from request
      customer_id: customerId, // Use customer_id which is auth.uid()
      auth_user_id: user.id, // Link to authenticated user for RLS policies
      registration_date: new Date().toISOString(),
      status: "unpaid",
      total_amount_paid: 0,
      total_price_paid: totalAmount, 
      subtotal: subtotal || null,
      stripe_fee: stripeFee || null,
      includes_processing_fee: stripeFee > 0,
      payment_status: "pending", 
      agree_to_terms: data.agreeToTerms || true,
      stripe_payment_intent_id: paymentIntentId,
      primary_attendee_id: null, // Will be updated after primary attendee is created
      registration_type: finalRegistrationType, // Already correctly typed
      registration_data: [data], // Store the complete raw request payload as backup (as array)
    };
    
    console.log("Registration record to insert:", registrationRecord);

    // Original direct insert logic continues here...
    // Insert registration record
    console.log("Inserting registration into registrations table");
    const { data: savedRegistration, error: registrationError } = await userClient
      .from('registrations')
      .insert(registrationRecord)
      .select()
      .single<Tables<'registrations'>>();
    
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

      // Determine if contact details should be included based on preference
      const includeContactDetails = attendee.isPrimary || 
        attendee.contactPreference?.toLowerCase() === 'directly';
      
      // Handle useSameLodge - inherit from primary attendee
      let finalGrandLodgeId = attendee.grand_lodge_id;
      let finalLodgeId = attendee.lodge_id;
      let finalLodgeNameNumber = attendee.lodgeNameNumber;
      
      if (attendee.useSameLodge && primaryAttendee && !attendee.isPrimary) {
        finalGrandLodgeId = primaryAttendee.grand_lodge_id || finalGrandLodgeId;
        finalLodgeId = primaryAttendee.lodge_id || finalLodgeId;
        finalLodgeNameNumber = primaryAttendee.lodgeNameNumber || finalLodgeNameNumber;
      }
      
      // For Mason: title is masonicTitle, suffix is rank or grand rank
      // For Guest: title is regular title, no suffix
      const isMason = attendeeTypeForDb === 'mason';
      const personTitle = isMason ? attendee.masonicTitle : attendee.title;
      const personSuffix = isMason ? (attendee.grandOfficerStatus === 'Past' ? attendee.presentGrandOfficerRole : attendee.rank) : attendee.suffix;
      
      // The attendees table uses snake_case column names
      const attendeeRecord: TablesInsert<'attendees'> = {
        attendee_id: newAttendeeId,
        registration_id: newRegistrationId, 
        attendee_type: attendeeTypeForDb,
        event_title: eventTitle || null, 
        dietary_requirements: attendee.dietaryRequirements || null,
        special_needs: attendee.specialNeeds || null,
        contact_preference: contactPreferenceForDb,
        relationship: attendee.relationship || null,
        related_attendee_id: attendee.partnerOf || attendee.related_attendee_id || null,
        person_id: attendee.person_id || attendee.personId || null,
        // Additional fields from database schema
        title: personTitle || null,
        first_name: includeContactDetails ? (attendee.firstName || attendee.first_name || null) : null,
        last_name: includeContactDetails ? (attendee.lastName || attendee.last_name || null) : null,
        suffix: personSuffix || null,
        email: includeContactDetails ? (attendee.email || attendee.primaryEmail || null) : null,
        phone: includeContactDetails ? (attendee.phone || attendee.primaryPhone || null) : null,
        is_primary: attendee.isPrimary || false,
        has_partner: attendee.hasPartner || false,
        is_partner: attendee.isPartner ? 'true' : null,
        contact_id: null // Will be set if we create a contact record
      };
      
      console.log("Attendee record to insert:", attendeeRecord);
      
      // Check if attendee already exists (duplicate submission)
      const { data: existingAttendee } = await userClient
        .from("attendees")
        .select()
        .eq("attendee_id", attendeeRecord.attendee_id!)
        .single();
      
      let savedAttendee;
      
      if (existingAttendee) {
        console.log(`Attendee ${attendeeRecord.attendee_id} already exists from a previous registration`);
        // Generate a new attendee ID for this registration
        const newGeneratedAttendeeId = uuidv4();
        console.log(`Generating new attendee ID: ${newGeneratedAttendeeId}`);
        
        // Create new attendee record with new ID
        const updatedAttendeeRecord = {
          ...attendeeRecord,
          attendee_id: newGeneratedAttendeeId
        };
        
        const { data: newAttendee, error: attendeeError } = await userClient
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
        attendeeIdMapping.set(attendeeRecord.attendee_id!, newGeneratedAttendeeId);
      } else {
        // Insert new attendee as normal
        const { data: newAttendee, error: attendeeError } = await userClient
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
        const { error: updateRegError } = await userClient
          .from('registrations')
          .update({ primary_attendee_id: savedAttendee.attendee_id }) 
          .eq("registration_id", newRegistrationId);
          
        if (updateRegError) {
          console.error("Error updating Registrations with primary_attendee_id:", updateRegError);
        }
        
        // Also update lowercase table
        const { error: updateLowerError } = await userClient
          .from("registrations")
          .update({ primary_attendee_id: savedAttendee.attendee_id }) 
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
        
        const attendeeForTicket = savedAttendeeRecords.find(a => a.attendee_id === actualAttendeeId);
        
        if (!attendeeForTicket) {
          console.warn(`No saved attendee found for ticket with attendeeId: ${originalAttendeeId} (mapped: ${actualAttendeeId}). Skipping ticket.`);
          continue;
        }
        
        // The 'status' column is what has the check constraint, not 'ticket_status'
        // Valid values: 'available', 'reserved', 'sold', 'used', 'cancelled'
        let statusForDb = 'reserved'; // Default to 'reserved' for new registrations
        
        const ticketRecord: TablesInsert<'tickets'> = {
          // ticket_id is generated automatically by Supabase
          ticket_id: uuidv4(),
          attendee_id: attendeeForTicket.attendee_id!, 
          event_id: finalEventId, // Use the resolved event ID (UUID)
          ticket_price: ticket.price || 0, 
          price_paid: ticket.price || 0, // Required field - using ticket_price value
          status: statusForDb, // Use 'status' not 'ticket_status'
          payment_status: 'unpaid', // This is a separate column
          registration_id: newRegistrationId,
          // Always use the actual ticket type ID (packages are already expanded)
          ticket_type_id: ticket.ticketTypeId || ticket.eventTicketId || ticket.event_ticket_id,
          is_partner_ticket: false, // Default to false, can be updated based on business logic
          // Store package info if ticket came from a package
          ...(ticket.isFromPackage && {
            package_id: ticket.packageId
            // Note: package_name doesn't exist in tickets table - only package_id
          })
        };
        
        console.log("Ticket record to insert:", ticketRecord);
        
        const { data: savedTicket, error: ticketError } = await userClient
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
