import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '@/utils/supabase/admin';
import { calculateStripeFees } from '@/lib/utils/stripe-fee-calculator';
import { 
  buildPaymentIntentMetadata, 
  buildCustomerMetadata,
  truncateMetadataValue 
} from '@/lib/utils/stripe-metadata';
import { createOrUpdateStripeCustomer, getChildEventsMetadata } from '@/lib/services/stripe-sync-service';
import { getAppVersion } from '@/lib/config/app-version';

// Validate environment variable exists at the module scope
if (!process.env.STRIPE_SECRET_KEY) {
  // This error will be thrown when the serverless function initializes if the key is missing
  console.error("FATAL ERROR: STRIPE_SECRET_KEY is not set in environment variables.");
}

// Initialize Stripe with your secret key
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY environment variable is required");
}

// Stripe key validation successful

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-04-30.basil', // Using the version suggested by the linter for stripe@18.1.0
});

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
    let parentEventId = '';
    let registrationType = '';
    let confirmationNumber = '';
    let primaryAttendee: any = null;
    let attendeesList: any[] = [];
    let ticketsList: any[] = [];
    let lodgeInfo: any = null;
    let childEventsMetadata: Record<string, string> = {};

    // Fetch organization data if registrationId or eventId is provided
    if (registrationId || eventId) {
      const adminClient = createAdminClient();
      
      if (registrationId) {
        // Fetch comprehensive registration data
        const { data: registration } = await adminClient
          .from('registrations')
          .select(`
            *,
            events!inner(
              event_id,
              title,
              slug,
              organiser_id,
              parent_event_id,
              organisations!events_organiser_id_fkey(
                organisation_id,
                name,
                stripe_onbehalfof,
                organisation_type
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
          parentEventId = registration.events.parent_event_id || registration.events.event_id;
          
          // Extract registration data
          registrationType = registration.registration_type || 'individual';
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
          
          // Get child events metadata
          if (registration.events.parent_event_id) {
            childEventsMetadata = await getChildEventsMetadata(registration.events.parent_event_id);
          }
          
          console.log(`Found connected account for registration: ${connectedAccountId}`);
        }
      } else if (eventId) {
        // Fetch from event directly
        const { data: event } = await adminClient
          .from('events')
          .select(`
            event_id,
            title,
            slug,
            organiser_id,
            parent_event_id,
            organisations!events_organiser_id_fkey(
              organisation_id,
              name,
              stripe_onbehalfof,
              organisation_type
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
          parentEventId = event.parent_event_id || event.event_id;
          
          // Get child events metadata
          if (event.parent_event_id) {
            childEventsMetadata = await getChildEventsMetadata(event.parent_event_id);
          }
          
          console.log(`Found connected account for event: ${connectedAccountId}`);
        }
      }
    }

    // Calculate platform fee if connected account exists
    if (connectedAccountId) {
      const platformFeePercentage = parseFloat(process.env.STRIPE_PLATFORM_FEE_PERCENTAGE || '0.05');
      applicationFeeAmount = Math.round(amount * platformFeePercentage);
      console.log(`Platform fee (${platformFeePercentage * 100}%): ${applicationFeeAmount / 100} ${currency.toUpperCase()}`);
    }

    // Calculate platform fee percentage
    const platformFeePercentage = parseFloat(process.env.STRIPE_PLATFORM_FEE_PERCENTAGE || '0.05');
    
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
      
      comprehensiveMetadata = buildPaymentIntentMetadata({
        // Registration
        registrationId: registrationId,
        registrationType: registrationType as 'individual' | 'lodge' | 'delegation',
        confirmationNumber: confirmationNumber,
        
        // Event
        parentEventId: parentEventId,
        parentEventTitle: eventTitle,
        parentEventSlug: eventSlug,
        childEventCount: parseInt(childEventsMetadata.child_event_count || '0'),
        
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
        
        // Tickets
        ticketsCount: ticketsList.length,
        ticketTypes: ticketTypes,
        ticketIds: ticketIds,
        
        // Financial
        subtotal: amount / 100,
        totalAmount: amount / 100,
        platformFee: applicationFeeAmount / 100,
        platformFeePercentage: platformFeePercentage,
        currency: currency,
        
        // Tracking
        sessionId: metadata?.sessionId,
        referrer: metadata?.referrer,
        deviceType: metadata?.deviceType,
        appVersion: getAppVersion(),
      });
      
      // Merge child events metadata
      comprehensiveMetadata = {
        ...comprehensiveMetadata,
        ...childEventsMetadata
      };
    } else {
      // Minimal metadata when no registration ID
      comprehensiveMetadata = {
        event_id: eventId || '',
        event_title: truncateMetadataValue(eventTitle),
        event_slug: eventSlug,
        organisation_name: truncateMetadataValue(organisationName || ''),
        organisation_id: organisationId || '',
        subtotal: String(amount / 100),
        platform_fee: String(applicationFeeAmount / 100),
        created_at: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        ...childEventsMetadata
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
        applicationFeeAmount = 0;
      }
    }

    // Only add Connect parameters if we have a valid connected account
    if (connectedAccountId) {
      paymentIntentOptions.on_behalf_of = connectedAccountId;
      paymentIntentOptions.application_fee_amount = applicationFeeAmount;
      
      // Add statement descriptor (max 22 chars)
      if (eventTitle) {
        paymentIntentOptions.statement_descriptor_suffix = eventTitle
          .substring(0, 22)
          .replace(/[^a-zA-Z0-9 ]/g, '')
          .trim();
      }
    }

    // Options for the API call
    const apiOptions: Stripe.RequestOptions = {};
    
    // If idempotency key is provided, use it
    if (idempotencyKey) {
      console.log(`Using idempotency key: ${idempotencyKey.substring(0, 10)}...`);
      apiOptions.idempotencyKey = idempotencyKey;
    }

    // Create a PaymentIntent with the order amount and currency
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