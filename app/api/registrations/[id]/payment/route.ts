import { NextResponse } from "next/server";
import { createClient } from '@/utils/supabase/server';
import { buildPaymentIntentMetadata, buildCustomerMetadata } from '@/lib/utils/stripe-metadata';
import { createOrUpdateStripeCustomer } from '@/lib/services/stripe-sync-service';
import { getDeviceTypeFromRequest, generateSessionId } from '@/lib/utils/device-detection';
import { getAppVersion } from '@/lib/config/app-version';
import { getPaymentProcessingData, getPrimaryAttendeeDetails } from '@/lib/api/stripe-queries';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: registrationId } = await params;
    console.group("💲 Update Registration Payment Status");
    console.log("Raw Request URL:", request.url);
    console.log("Registration ID from params:", registrationId);
    
    // Validate registration ID format - should be a UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(registrationId)) {
      console.error(`Invalid registration ID format: ${registrationId}`);
      console.error(`Expected UUID format (e.g. '123e4567-e89b-12d3-a456-426614174000')`);
      console.groupEnd();
      return NextResponse.json(
        { error: `Invalid registration ID format. Expected UUID, received: ${registrationId}` },
        { status: 400 }
      );
    }
    
    const data = await request.json();
    console.log("Payment data:", JSON.stringify(data, null, 2));
    
    const {
      paymentMethodId,
      totalAmount,
      subtotal,
      stripeFee,
      billingDetails
    } = data;
    
    // Add more validation for required data
    if (!paymentMethodId) {
      console.error("Missing payment method ID");
      console.groupEnd();
      return NextResponse.json(
        { error: "Payment method ID is required" },
        { status: 400 }
      );
    }
    
    if (typeof totalAmount !== 'number' || totalAmount < 0) {
      console.error(`Invalid totalAmount: ${totalAmount}`);
      console.groupEnd();
      return NextResponse.json(
        { error: "Total amount must be a non-negative number" },
        { status: 400 }
      );
    }
    
    // Log the exact database query we're about to perform for debugging
    console.log("DB Operation: Looking up registration with exact query:");
    console.log(`from('registrations').select("*").eq("registration_id", "${registrationId}").single()`);
    
    // Check if registration exists - query with tracing
    console.log("Looking up registration with ID:", registrationId);
    console.log("Executing Supabase query: from('registrations').select('*').eq('registration_id', registrationId).single()");
    
    const supabase = await createClient();
    const { data: existingRegistration, error: findError } = await supabase
      .from('registrations')
      .select("*")
      .eq("registration_id", registrationId)
      .single();
    
    if (findError) {
      console.error("Database error when looking for registration:", findError);
      console.log("Error details:", JSON.stringify(findError, null, 2));
      console.log("Hint: Make sure the registration ID exists and matches exactly");
      console.groupEnd();
      return NextResponse.json(
        { error: `Registration not found: ${findError.message}` },
        { status: 404 }
      );
    }
    
    if (!existingRegistration) {
      console.error("Registration not found in database - no error but empty result");
      console.groupEnd();
      return NextResponse.json(
        { error: "Registration not found - record does not exist" },
        { status: 404 }
      );
    }
    
    console.log("Found registration:", JSON.stringify(existingRegistration, null, 2));
    
    let finalPaymentIntentId;
    let requiresAction = false;
    let clientSecret = null;
    
    // Always use two-step flow: create payment intent from payment method
    console.log("💳 Creating payment intent from payment method");
    
    try {
      // Import Stripe dynamically to avoid circular dependencies
      const Stripe = (await import('stripe')).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: '2024-11-20.acacia',
      });
      
      // Fetch complete registration data using optimized query
      const paymentData = await getPaymentProcessingData(registrationId);
      
      if (!paymentData) {
        throw new Error('Failed to fetch registration details for payment');
      }
      
      // Check for connected account
      const connectedAccountId = paymentData.organization.stripe_onbehalfof;
      const organisationName = paymentData.organization.name;
      
      // Platform fee is now 0%
      let applicationFeeAmount = 0;
      const platformFeePercentage = parseFloat(process.env.STRIPE_PLATFORM_FEE_PERCENTAGE || '0');
      console.log(`Platform fee: ${platformFeePercentage * 100}% = $${applicationFeeAmount / 100}`);
      
      // Determine if card is domestic based on billing country
      const isDomesticCard = billingDetails?.address?.country?.toUpperCase() === 'AU';
      console.log(`Card type: ${isDomesticCard ? 'Domestic (AU)' : 'International'} - Country: ${billingDetails?.address?.country}`);
      console.log(`Stripe fee rate: ${isDomesticCard ? '1.7% + $0.30' : '3.5% + $0.30'}`);
      
      // Calculate expected Stripe fee for logging
      const stripeRate = isDomesticCard ? 0.017 : 0.035;
      const expectedStripeFee = (totalAmount * stripeRate) + 0.30;
      console.log(`Expected Stripe processing fee: $${expectedStripeFee.toFixed(2)}`);
      console.log(`Connected account will receive: $${subtotal.toFixed(2)}`);
      console.log(`Platform will receive: $${platformFeePercentage * subtotal} (after Stripe takes their fee)`);
      
      // Get device type from request
      const deviceType = getDeviceTypeFromRequest(request);
      
      // Generate or extract session ID
      const sessionId = data.sessionId || generateSessionId();
      
      // Remove child events metadata - no longer needed with functions architecture
      
      // Count attendees by type
      const attendeeTypes: Record<string, number> = {};
      paymentData.attendees.forEach(attendee => {
        const type = attendee.attendee_type || 'guest';
        attendeeTypes[type] = (attendeeTypes[type] || 0) + 1;
      });
      
      // Count tickets by type
      const ticketTypes: Record<string, number> = {};
      const ticketIds: string[] = [];
      paymentData.tickets.forEach(ticket => {
        const ticketName = ticket.event_tickets.title || 'standard';
        ticketTypes[ticketName] = (ticketTypes[ticketName] || 0) + 1;
        ticketIds.push(ticket.ticket_id);
      });
      
      // Get primary attendee
      const primaryAttendee = paymentData.attendees.find(a => a.is_primary_contact) || paymentData.attendees[0];
      
      // Build comprehensive metadata
      const comprehensiveMetadata = buildPaymentIntentMetadata({
        // Registration
        registrationId: registrationId,
        registrationType: (paymentData.registration.registration_type || 'individual') as 'individual' | 'lodge' | 'delegation',
        confirmationNumber: paymentData.registration.confirmation_number || `REG-${registrationId.substring(0, 8).toUpperCase()}`,
        
        // Event (updated for functions architecture)
        eventId: paymentData.event.event_id || '',
        eventTitle: paymentData.event.title || '',
        eventSlug: paymentData.event.slug || '',
        functionId: paymentData.event.function_id || '',
        
        // Organization
        organisationId: paymentData.organization.organisation_id || '',
        organisationName: paymentData.organization.name || '',
        organisationType: paymentData.organization.type,
        
        // Attendees
        totalAttendees: paymentData.registration.attendee_count || 0,
        primaryAttendeeName: primaryAttendee ? `${primaryAttendee.first_name} ${primaryAttendee.last_name}` : '',
        primaryAttendeeEmail: primaryAttendee?.email || '',
        attendeeTypes: attendeeTypes,
        
        // Lodge (optional)
        lodgeId: paymentData.lodge_registration?.lodges?.lodge_id,
        lodgeName: paymentData.lodge_registration?.lodges?.name,
        lodgeNumber: paymentData.lodge_registration?.lodges?.number,
        grandLodgeId: paymentData.lodge_registration?.lodges?.grand_lodges?.grand_lodge_id,
        
        // Tickets
        ticketsCount: paymentData.tickets.length || 0,
        ticketTypes: ticketTypes,
        ticketIds: ticketIds,
        
        // Financial
        subtotal: subtotal || paymentData.registration.subtotal || 0,
        stripeFee: stripeFee || 0,
        totalAmount: totalAmount,
        platformFee: 0,
        platformFeePercentage: 0,
        currency: 'aud',
        cardCountry: billingDetails?.address?.country || 'unknown',
        isDomesticCard: isDomesticCard,
        
        // Tracking
        sessionId: sessionId,
        referrer: data.referrer,
        deviceType: deviceType,
        appVersion: getAppVersion(),
      });
      
      // Use comprehensive metadata directly (no child events metadata needed)
      const finalMetadata = comprehensiveMetadata;
      
      // Create payment intent options
      const paymentIntentOptions: any = {
        amount: Math.round(totalAmount * 100), // Convert to cents
        currency: 'aud',
        payment_method: paymentMethodId,
        confirmation_method: 'manual',
        confirm: false, // Don't confirm immediately
        metadata: finalMetadata,
      };
      
      // Create or update Stripe customer if we have primary attendee with full details
      // Note: This would require fetching full attendee details with email, phone, etc.
      // For now, we'll skip customer creation here as it requires more data
      
      // Add Stripe Connect parameters if connected account exists
      if (connectedAccountId) {
        // Validate connected account
        try {
          const account = await stripe.accounts.retrieve(connectedAccountId);
          if (!account.charges_enabled) {
            console.error(`Connected account ${connectedAccountId} cannot accept charges`);
            throw new Error('The organization\'s payment account is not properly configured');
          }
          
          // For destination charges with Stripe Connect:
          // - Customer pays the total (subtotal + platform fee + stripe fee)
          // - Connected account receives the subtotal
          // - Platform keeps the platform fee
          // - Stripe takes their processing fee from the platform
          paymentIntentOptions.transfer_data = {
            destination: connectedAccountId,
            amount: Math.round(subtotal * 100), // Transfer the subtotal to connected account
          };
          
          // Add statement descriptor
          const statementDescriptor = paymentData.event.title
            ?.substring(0, 22)
            .replace(/[^a-zA-Z0-9 ]/g, '')
            .trim();
          if (statementDescriptor) {
            paymentIntentOptions.statement_descriptor_suffix = statementDescriptor;
          }
        } catch (accountError: any) {
          console.error('Connected account validation failed:', accountError);
          // Continue without connected account
        }
      }
      
      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create(paymentIntentOptions);
      
      console.log("Created payment intent:", paymentIntent.id);
      console.log("Payment intent status:", paymentIntent.status);
      
      // Now confirm the payment intent with return URL for 3D Secure
      const confirmOptions: any = {
        return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/events/${paymentData.event.slug || existingRegistration.event_id}/register/${registrationId}/confirmation`,
      };
      
      // When using transfer_data, the payment intent is on the platform account
      // so we don't need to specify stripeAccount
      const confirmedIntent = await stripe.paymentIntents.confirm(
        paymentIntent.id, 
        confirmOptions
      );
      
      finalPaymentIntentId = confirmedIntent.id;
      
      if (confirmedIntent.status === 'requires_action' || confirmedIntent.status === 'requires_source_action') {
        console.log("🔐 Payment requires additional authentication (3D Secure)");
        requiresAction = true;
        clientSecret = confirmedIntent.client_secret;
      } else if (confirmedIntent.status !== 'succeeded') {
        console.error("Unexpected payment status:", confirmedIntent.status);
        throw new Error(`Payment failed with status: ${confirmedIntent.status}`);
      }
      
    } catch (stripeError: any) {
      console.error("Stripe error:", stripeError);
      console.groupEnd();
      return NextResponse.json(
        { error: `Payment processing failed: ${stripeError.message}` },
        { status: 500 }
      );
    }
    
    // Always use direct update approach (RPC function update_payment_status_and_complete not available)
    const updateData = {
      status: requiresAction ? "pending_payment" : "completed",
      payment_status: requiresAction ? "pending" : "completed",
      total_amount_paid: totalAmount,
      subtotal: subtotal || null,
      stripe_fee: stripeFee || null,
      includes_processing_fee: stripeFee ? true : false,
      stripe_payment_intent_id: finalPaymentIntentId,
      updated_at: new Date().toISOString()
    };
    
    console.log("Update data:", JSON.stringify(updateData, null, 2));
    
    // Update registration record
    console.log("Executing update query: from('registrations').update(updateData).eq('registration_id', registrationId)");
    const { data: updatedRegistration, error: updateError } = await supabase
      .from('registrations')
      .update(updateData)
      .eq("registration_id", registrationId)
      .select()
      .single();
    
    if (updateError) {
      console.error("Error updating registration:", updateError);
      console.log("Error details:", JSON.stringify(updateError, null, 2));
      console.groupEnd();
      return NextResponse.json(
        { error: `Failed to update registration: ${updateError.message}` },
        { status: 500 }
      );
    }
    
    // Check if this is an individuals registration and payment is successful
    if (!requiresAction && existingRegistration.registration_type === 'individuals') {
      console.log("Processing completed payment for individuals registration");
      
      // Use the same upsert RPC function with payment completion flag
      const rpcData = {
        registrationId: registrationId,
        functionId: existingRegistration.function_id,
        totalAmountPaid: totalAmount,
        paymentIntentId: finalPaymentIntentId,
        paymentCompleted: true,
        confirmationNumber: confirmationNumber,
        subtotal: subtotal,
        stripeFee: stripeFee,
        authUserId: existingRegistration.auth_user_id // Pass the auth_user_id from existing registration
      };
      
      const { data: completeResult, error: completeError } = await supabase
        .rpc('upsert_individual_registration', {
          p_registration_data: rpcData
        });
      
      if (completeError) {
        console.error("Error completing individual payment via upsert:", completeError);
        // Continue with fallback update
      } else {
        console.log("Individual payment completed successfully via upsert RPC:", completeResult);
      }
    } else {
      // For other registration types or pending payments, update tickets normally
      console.log("Updating tickets for registration:", registrationId);
      const { data: updatedTickets, error: ticketUpdateError } = await supabase
        .from("tickets") 
        .update({ 
          ticket_status: requiresAction ? "pending" : "completed",
          updated_at: new Date().toISOString()
        })
        .eq("registration_id", registrationId)
        .select();
      
      if (ticketUpdateError) {
        console.error("Error updating tickets:", ticketUpdateError);
        console.log("Error details:", JSON.stringify(ticketUpdateError, null, 2));
        // Don't fail the whole request if tickets can't be updated
        // The registration is already marked as paid which is the critical part
      } else {
        console.log(`Successfully updated ${updatedTickets?.length || 0} tickets to completed status`);
      }
    }
    
    // Note: Attendees table doesn't have payment_status column
    // Payment status is tracked at registration level only
    console.log("Payment status updated at registration level (attendees inherit from registration)");
    
    // Note: Stripe FDW verification removed - function doesn't exist in current schema
    console.log("Stripe payment intent created:", finalPaymentIntentId);
    
    console.log("Registration payment updated successfully");
    
    // Generate a confirmation number
    const confirmationNumber = `REG-${registrationId.substring(0, 8).toUpperCase()}`;
    console.log("Generated confirmation number:", confirmationNumber);
    console.groupEnd();
    
    return NextResponse.json({
      success: true,
      registrationId,
      confirmationNumber,
      registration_data: updatedRegistration,
      requiresAction,
      clientSecret,
      paymentIntentId: finalPaymentIntentId
    });
  } catch (error: any) {
    console.error("Error updating registration payment:", error);
    console.log("Error stack:", error.stack);
    console.groupEnd();
    return NextResponse.json(
      { error: `Failed to update registration payment: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: registrationId } = await params;
    console.group("💲 Check Registration Payment Status");
    console.log("Request URL:", request.url);
    console.log("Registration ID:", registrationId);
    
    // First, check if registration exists
    const supabase = await createClient();
    const { data: existingRegistrationData, error: findError } = await supabase
      .from('registrations')
      .select("*")
      .eq("registration_id", registrationId)
      .single();
    
    if (findError) {
      console.error("Database error when looking for registration (GET):", findError);
      console.groupEnd();
      return NextResponse.json(
        { error: `Registration not found: ${findError.message}` },
        { status: 404 }
      );
    }

    if (!existingRegistrationData) {
      console.error("Registration not found in database (GET) - no error but empty result");
      console.groupEnd();
      return NextResponse.json(
        { error: "Registration not found - record does not exist (GET)" },
        { status: 404 }
      );
    }
    
    console.log("Found registration (GET):", JSON.stringify(existingRegistrationData, null, 2));

    // Store the fetched registration data to use its fields
    const currentRegistration = existingRegistrationData;

    // Note: Stripe FDW verification removed - function doesn't exist in current schema
    console.log("Registration found with payment status:", currentRegistration.payment_status);
    console.log("Stripe payment intent ID:", currentRegistration.stripe_payment_intent_id || 'Not set');
    
    console.log("Registration status check complete (GET)");
    console.groupEnd();
    
    return NextResponse.json({
      success: true,
      registrationId,
      payment_status: currentRegistration.payment_status,
      status: currentRegistration.status,
      stripe_payment_intent_id: currentRegistration.stripe_payment_intent_id,
      total_amount_paid: currentRegistration.total_amount_paid
    });
  } catch (error: any) {
    console.error("Error checking registration payment status (GET):", error);
    console.groupEnd();
    return NextResponse.json(
      { error: `Failed to check registration: ${error.message}` },
      { status: 500 }
    );
  }
} 