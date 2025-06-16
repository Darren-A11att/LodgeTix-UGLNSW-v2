import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/utils/supabase/server';
import { calculateStripeFees } from '@/lib/utils/stripe-fee-calculator';
import { 
  buildPaymentIntentMetadata, 
  buildCustomerMetadata,
  truncateMetadataValue 
} from '@/lib/utils/stripe-metadata';
import { createOrUpdateStripeCustomer } from '@/lib/services/stripe-sync-service';
import { getAppVersion } from '@/lib/config/app-version';

// Initialize Stripe client lazily
function getStripeClient() {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  
  if (!stripeSecretKey) {
    throw new Error("STRIPE_SECRET_KEY environment variable is required");
  }
  
  return new Stripe(stripeSecretKey, {
    apiVersion: '2025-04-30.basil', // Using the version suggested by the linter for stripe@18.1.0
  });
}

export async function POST(request: Request) {
  try {
    // Log request details
    console.group("🔄 Stripe Payment Intent Request");

    // Parse request body
    const requestBody = await request.json();
    console.log("Request payload:", JSON.stringify(requestBody, null, 2));

    const { amount, currency, idempotencyKey, registrationId, eventId, metadata } = requestBody;

    if (!amount || !currency) {
      console.log("❌ Validation Error: Missing amount or currency");
      console.groupEnd();
      return NextResponse.json({ error: 'Missing amount or currency' }, { status: 400 });
    }

    if (typeof amount !== 'number' || amount <= 0) {
      console.log(`❌ Validation Error: Invalid amount: ${amount}`);
      console.groupEnd();
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    if (typeof currency !== 'string' ) {
      console.log(`❌ Validation Error: Invalid currency: ${currency}`);
      console.groupEnd();
      return NextResponse.json({ error: 'Invalid currency' }, { status: 400 });
    }

    console.log(`Creating payment intent for ${amount / 100} ${currency.toUpperCase()}`);

    // Create start time for measuring performance
    const startTime = performance.now();

    // Initialize variables for Stripe Connect and metadata
    let connectedAccountId = null;
    let organisationName = null;
    let organisationType = null;
    let organisationId = null;
    let applicationFeeAmount = 0;
    let eventTitle = '';
    let eventSlug = '';
    let functionId = '';
    let functionName = '';
    let registrationType = '';
    let confirmationNumber = '';
    let primaryAttendee: any = null;
    let attendeesList: any[] = [];
    let ticketsList: any[] = [];
    let lodgeInfo: any = null;
    // childEventsMetadata removed - no longer needed with functions architecture

    // Fetch organization data if registrationId or eventId is provided
    if (registrationId || eventId) {
      const supabase = await createClient();
      
      if (registrationId) {
        // Fetch comprehensive registration data
        const { data: registration } = await supabase
          .from('registrations')
          .select(`
            *,
            events!inner(
              event_id,
              title,
              slug,
              organiser_id,
              function_id,
              organisations!events_organiser_id_fkey(
                organisation_id,
                name,
                stripe_onbehalfof,
                organisation_type
              ),
              functions(
                function_id,
                name
              )
            ),
            attendees(
              attendee_id,
              attendee_type,
              is_primary_contact,
              first_name,
              last_name,
              email,
              phone_number,
              mason_type,
              lodge_name,
              lodge_number,
              grand_lodge,
              masonic_rank
            ),
            tickets(
              ticket_id,
              event_tickets(
                id,
                name,
                price
              )
            )
          `)
          .eq('registration_id', registrationId)
          .single();
          
        if (registration) {
          // Extract organization data
          if (registration.events?.organisations?.stripe_onbehalfof) {
            connectedAccountId = registration.events.organisations.stripe_onbehalfof;
            organisationName = registration.events.organisations.name;
            organisationType = registration.events.organisations.organisation_type;
            organisationId = registration.events.organisations.organisation_id;
          }
          
          // Extract event data
          eventTitle = registration.events.title;
          eventSlug = registration.events.slug;
          
          // Extract function data
          if (registration.events.function_id && registration.events.functions) {
            functionId = registration.events.function_id;
            functionName = registration.events.functions.name;
          }
          
          // Extract registration data
          registrationType = registration.registration_type || 'individuals';
          confirmationNumber = registration.confirmation_number || `REG-${registrationId.substring(0, 8).toUpperCase()}`;
          
          // Extract attendee data
          if (registration.attendees) {
            attendeesList = registration.attendees;
            primaryAttendee = attendeesList.find(a => a.is_primary_contact) || attendeesList[0];
            
            // Extract lodge info if available
            const lodgeAttendee = attendeesList.find(a => a.lodge_name);
            if (lodgeAttendee) {
              lodgeInfo = {
                lodgeName: lodgeAttendee.lodge_name,
                lodgeNumber: lodgeAttendee.lodge_number,
                grandLodge: lodgeAttendee.grand_lodge
              };
            }
          }
          
          // Extract ticket data
          if (registration.tickets) {
            ticketsList = registration.tickets;
          }
          
          // parent_event_id no longer used with functions architecture
          
          console.log(`Found connected account for registration: ${connectedAccountId}`);
        }
      } else if (eventId) {
        // Fetch from event directly
        const { data: event } = await supabase
          .from('events')
          .select(`
            event_id,
            title,
            slug,
            organiser_id,
            function_id,
            organisations!events_organiser_id_fkey(
              organisation_id,
              name,
              stripe_onbehalfof,
              organisation_type
            ),
            functions(
              function_id,
              name
            )
          `)
          .eq('event_id', eventId)
          .single();
          
        if (event) {
          if (event.organisations?.stripe_onbehalfof) {
            connectedAccountId = event.organisations.stripe_onbehalfof;
            organisationName = event.organisations.name;
            organisationType = event.organisations.organisation_type;
            organisationId = event.organisations.organisation_id;
          }
          eventTitle = event.title;
          eventSlug = event.slug;
          
          // Extract function data
          if (event.function_id && event.functions) {
            functionId = event.function_id;
            functionName = event.functions.name;
          }
          
          console.log(`Found connected account for event: ${connectedAccountId}`);
        }
      }
    }

    // NEW: Calculate fees using the correct formula and determine transfer amount
    let transferAmount = 0;
    let calculatedFees: any = null;
    
    if (connectedAccountId) {
      // Import the new fee calculator
      const { calculateFeesWithGeolocation } = await import('@/lib/utils/stripe-fee-calculator');
      
      // The 'amount' passed in should be the connectedAmount (subtotal)
      // We need to calculate what the customer should actually pay
      const connectedAmount = amount / 100; // Convert from cents to dollars
      
      // Get user's country from request headers or default to international
      const userCountry = request.headers.get('cf-ipcountry') || 
                         request.headers.get('x-vercel-ip-country') || 
                         metadata?.userCountry;
      
      // Calculate fees with the new formula
      calculatedFees = calculateFeesWithGeolocation(connectedAmount, userCountry);
      
      // Set transfer amount to exactly what connected account should receive
      transferAmount = Math.round(calculatedFees.connectedAmount * 100); // Convert to cents
      
      // Update the total amount to what customer should actually pay
      amount = Math.round(calculatedFees.customerPayment * 100); // Convert to cents
      
      // IMPORTANT: If there's nothing to transfer (free tickets), don't use Stripe Connect
      if (transferAmount === 0) {
        console.log('🆓 Free tickets detected - disabling Stripe Connect for this payment');
        connectedAccountId = null;
        transferAmount = 0;
      }
      
      console.log(`Fee calculation:`, {
        connectedAmount: calculatedFees.connectedAmount,
        platformFee: calculatedFees.platformFee,
        stripeFee: calculatedFees.stripeFee,
        customerPayment: calculatedFees.customerPayment,
        isDomestic: calculatedFees.isDomestic,
        userCountry
      });
    }

    // Get platform fee percentage for legacy metadata (when no connected account)
    const platformFeePercentage = parseFloat(process.env.STRIPE_PLATFORM_FEE_PERCENTAGE || '0.02');
    
    // Build comprehensive metadata
    let comprehensiveMetadata: Record<string, string> = {};
    
    if (registrationId) {
      // Count attendees by type
      const attendeeTypes: Record<string, number> = {};
      attendeesList.forEach(attendee => {
        const type = attendee.attendee_type || 'guest';
        attendeeTypes[type] = (attendeeTypes[type] || 0) + 1;
      });
      
      // Count tickets by type
      const ticketTypes: Record<string, number> = {};
      const ticketIds: string[] = [];
      ticketsList.forEach(ticket => {
        if (ticket.event_tickets) {
          const ticketName = ticket.event_tickets.name || 'standard';
          ticketTypes[ticketName] = (ticketTypes[ticketName] || 0) + 1;
          ticketIds.push(ticket.ticket_id);
        }
      });
      
      // Categorize tickets into packages and individual tickets
      const packages: Array<{ id: string; isPackage: boolean }> = [];
      const individualTickets: Array<{ id: string; isPackage: boolean }> = [];
      
      ticketsList.forEach(ticket => {
        if (ticket.event_tickets) {
          // Check if this is a package or individual ticket based on registration context
          // For now, we'll determine this based on the registration type and ticket structure
          const isPackageTicket = registrationType === 'lodge' || ticket.event_tickets.name?.toLowerCase().includes('package');
          
          if (isPackageTicket) {
            packages.push({
              id: ticket.ticket_id,
              isPackage: true
            });
          } else {
            individualTickets.push({
              id: ticket.ticket_id,
              isPackage: false
            });
          }
        }
      });

      comprehensiveMetadata = buildPaymentIntentMetadata({
        // Registration
        registrationId: registrationId,
        registrationType: registrationType as 'individuals' | 'lodge' | 'delegation',
        confirmationNumber: confirmationNumber,
        
        // Function (replaces Event)
        functionId: functionId,
        functionName: functionName,
        
        // Organization
        organisationId: organisationId || '',
        organisationName: organisationName || '',
        organisationType: organisationType || '',
        
        // Attendees
        totalAttendees: attendeesList.length,
        primaryAttendeeName: primaryAttendee ? `${primaryAttendee.first_name} ${primaryAttendee.last_name}` : '',
        primaryAttendeeEmail: primaryAttendee?.email || '',
        attendeeTypes: attendeeTypes,
        
        // Lodge (optional)
        lodgeId: lodgeInfo?.lodgeId,
        lodgeName: lodgeInfo?.lodgeName,
        lodgeNumber: lodgeInfo?.lodgeNumber,
        grandLodgeId: lodgeInfo?.grandLodge,
        
        // Tickets (Enhanced)
        ticketsCount: ticketsList.length,
        ticketTypes: ticketTypes,
        ticketIds: ticketIds,
        packages: packages.length > 0 ? packages : undefined,
        individualTickets: individualTickets.length > 0 ? individualTickets : undefined,
        
        // Financial (updated with new fee calculation)
        subtotal: calculatedFees?.connectedAmount || amount / 100,
        totalAmount: calculatedFees?.customerPayment || amount / 100,
        platformFee: calculatedFees?.platformFee || 0,
        stripeFee: calculatedFees?.stripeFee || 0,
        processingFees: calculatedFees?.processingFeesDisplay || 0,
        platformFeePercentage: calculatedFees?.breakdown.platformFeePercentage || platformFeePercentage,
        isDomestic: calculatedFees?.isDomestic || false,
        currency: currency,
        
        // Tracking
        sessionId: metadata?.sessionId,
        referrer: metadata?.referrer,
        deviceType: metadata?.deviceType,
        appVersion: getAppVersion(),
      });
      
      // No child events metadata to merge with functions architecture
    } else {
      // Minimal metadata when no registration ID (Simple Payments)
      comprehensiveMetadata = {
        // Function (replaces Event)
        function_id: functionId || '',
        function_name: truncateMetadataValue(functionName || ''),
        
        // Organization
        organisation_name: truncateMetadataValue(organisationName || ''),
        organisation_id: organisationId || '',
        
        // Financial
        subtotal: String(calculatedFees?.connectedAmount || amount / 100),
        total_amount: String(calculatedFees?.customerPayment || amount / 100),
        platform_fee: String(calculatedFees?.platformFee || 0),
        stripe_fee: String(calculatedFees?.stripeFee || 0),
        processing_fees: String(calculatedFees?.processingFeesDisplay || 0),
        is_domestic: String(calculatedFees?.isDomestic || false),
        
        // Payment type
        payment_type: 'simple_payment',
        
        // Tracking
        created_at: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
      };
    }
    
    // Prepare the options for the payment intent creation
    const paymentIntentOptions: Stripe.PaymentIntentCreateParams = {
      amount: Math.round(amount), // Amount in cents, ensure it's an integer
      currency: currency,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: comprehensiveMetadata,
    };
    
    // Add receipt email based on registration type - use billing contact, not attendee
    let receiptEmail = null;
    if (registrationId) {
      // For full registrations, we have registration data with billing details
      if (registrationType === 'individuals' || registrationType === 'individual') {
        // For individual registrations, use billing details email
        // This should come from the billing form the user filled out
        receiptEmail = metadata?.billingEmail || primaryAttendee?.email;
      } else if (registrationType === 'lodge') {
        // For lodge registrations, use lodge customer email from booking contact
        receiptEmail = metadata?.lodgeCustomerEmail || primaryAttendee?.email;
      } else if (registrationType === 'delegation') {
        // For delegation registrations, use primary contact email
        receiptEmail = primaryAttendee?.email;
      }
    } else {
      // For simple payments (no registration), use any provided email
      receiptEmail = metadata?.customerEmail || metadata?.email;
    }
    
    if (receiptEmail) {
      paymentIntentOptions.receipt_email = receiptEmail;
      console.log(`Setting receipt email to: ${receiptEmail} (${registrationType || 'simple'} payment)`);
    }
    
    // Create or update Stripe customer if we have primary attendee
    if (connectedAccountId && primaryAttendee) {
      try {
        const customer = await createOrUpdateStripeCustomer(primaryAttendee, connectedAccountId);
        if (customer) {
          paymentIntentOptions.customer = customer.id;
          console.log(`Using Stripe customer ${customer.id} for payment intent`);
        }
      } catch (error) {
        console.error('Error creating/updating Stripe customer:', error);
        // Continue without customer - not critical for payment
      }
    }

    // Add Stripe Connect parameters if connected account exists
    if (connectedAccountId) {
      // Validate connected account is active
      try {
        const stripe = getStripeClient();
        const account = await stripe.accounts.retrieve(connectedAccountId);
        if (!account.charges_enabled) {
          console.error(`Connected account ${connectedAccountId} cannot accept charges`);
          console.groupEnd();
          return NextResponse.json({
            error: 'The organization\'s payment account is not properly configured',
            code: 'account_not_ready'
          }, { status: 400 });
        }
      } catch (accountError: any) {
        console.error('Error retrieving connected account:', accountError);
        if (accountError.type === 'StripeInvalidRequestError' && accountError.code === 'account_invalid') {
          console.groupEnd();
          return NextResponse.json({
            error: 'The organization\'s payment account is invalid',
            code: 'account_invalid'
          }, { status: 400 });
        }
        // If account check fails, proceed without connected account
        connectedAccountId = null;
        transferAmount = 0;
        calculatedFees = null;
      }
    }

    // Only add Connect parameters if we have a valid connected account AND something to transfer
    if (connectedAccountId && transferAmount > 0) {
      // NEW: Use transfer_data instead of application_fee_amount for correct fee handling
      paymentIntentOptions.transfer_data = {
        amount: transferAmount, // Exact amount the connected account will receive
        destination: connectedAccountId,
      };
      
      // Add statement descriptor (max 22 chars) - use function name and registration type
      if (functionName) {
        const descriptorText = `${functionName} ${registrationType}`.trim();
        paymentIntentOptions.statement_descriptor_suffix = descriptorText
          .substring(0, 22)
          .replace(/[^a-zA-Z0-9 ]/g, '')
          .trim();
      }
      
      console.log(`Using transfer_data: ${transferAmount / 100} ${currency.toUpperCase()} to ${connectedAccountId}`);
    }

    // Options for the API call
    const apiOptions: Stripe.RequestOptions = {};
    
    // If idempotency key is provided, use it
    if (idempotencyKey) {
      console.log(`Using idempotency key: ${idempotencyKey.substring(0, 10)}...`);
      apiOptions.idempotencyKey = idempotencyKey;
    }

    // Create a PaymentIntent with the order amount and currency  
    const stripe = getStripeClient();
    const paymentIntent = await stripe.paymentIntents.create(
      paymentIntentOptions,
      apiOptions
    );

    // Calculate duration
    const duration = Math.round(performance.now() - startTime);

    // Log response
    console.log(`✅ Payment Intent created in ${duration}ms`);
    console.log("Payment Intent ID:", paymentIntent.id);
    console.log("Client Secret (partial):", paymentIntent.client_secret
      ? `${paymentIntent.client_secret.substring(0, 10)}...`
      : "null");
    console.log("Status:", paymentIntent.status);
    console.groupEnd();

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      id: paymentIntent.id,
      status: paymentIntent.status,
    });

  } catch (error: any) {
    console.group("❌ Stripe Payment Intent Error");
    console.error('Error creating PaymentIntent:', error);

    // Log additional details for debugging
    if (error instanceof Stripe.errors.StripeError) {
      console.log("Stripe Error Type:", error.type);
      console.log("Stripe Error Code:", error.code);
      console.log("Stripe Error Param:", error.param);
    }

    console.groupEnd();

    // Check for specific Stripe error types if needed
    if (error instanceof Stripe.errors.StripeError) {
        return NextResponse.json({
          error: error.message,
          type: error.type,
          code: error.code
        }, { status: error.statusCode || 500 });
    }

    return NextResponse.json({
      error: error.message || 'Failed to create PaymentIntent',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 