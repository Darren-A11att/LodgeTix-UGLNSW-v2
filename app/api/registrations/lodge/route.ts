import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      eventId,
      customerData,
      lodgeDetails,
      tableOrder,
      paymentMethodId,
      amount,
      billingDetails,
    } = body;

    // Validate required fields
    if (!eventId || !customerData || !lodgeDetails || !tableOrder || !paymentMethodId || !amount) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = await createClient();

    // Get or create anonymous session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (!session) {
      // Create anonymous session
      const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously();
      if (anonError) {
        console.error('Failed to create anonymous session:', anonError);
        return NextResponse.json(
          { success: false, error: 'Authentication failed' },
          { status: 401 }
        );
      }
    }

    // Fetch event and organization data for Stripe Connect
    const { data: event } = await supabase
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
          stripe_onbehalfof
        )
      `)
      .eq('event_id', eventId)
      .single();
      
    if (!event) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }
    
    // Check for connected account
    const connectedAccountId = event.organisations?.stripe_onbehalfof;
    const organisationName = event.organisations?.name;
    
    // Calculate platform fee
    let applicationFeeAmount = 0;
    if (connectedAccountId) {
      const platformFeePercentage = parseFloat(process.env.STRIPE_PLATFORM_FEE_PERCENTAGE || '0.05');
      applicationFeeAmount = Math.round(amount * platformFeePercentage);
      console.log(`Platform fee (${platformFeePercentage * 100}%): $${applicationFeeAmount / 100}`);
    }
    
    // Prepare payment intent options
    const paymentIntentOptions: any = {
      amount,
      currency: 'aud',
      payment_method: paymentMethodId,
      confirmation_method: 'manual',
      confirm: true,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/events/${event.slug || eventId}/register/success`,
      metadata: {
        // Event details
        event_id: eventId,
        event_title: event.title?.substring(0, 100) || '',
        event_slug: event.slug || '',
        parent_event_id: event.parent_event_id || '',
        
        // Organization details
        organisation_id: event.organisations?.organisation_id || '',
        organisation_name: organisationName?.substring(0, 100) || '',
        
        // Registration type details
        registration_type: 'Lodge',
        lodge_name: lodgeDetails.lodgeName?.substring(0, 100) || '',
        lodge_id: lodgeDetails.lodge_id || '',
        
        // Order details
        table_count: tableOrder.tableCount.toString(),
        total_tickets: tableOrder.totalTickets.toString(),
        ceremony_tickets: (tableOrder.ceremonyTickets || 0).toString(),
        gala_dinner_tickets: (tableOrder.galaDinnerTickets || 0).toString(),
        
        // Financial details
        subtotal: String(amount / 100),
        platform_fee: String(applicationFeeAmount / 100),
        
        // Sub-event details
        sub_events: JSON.stringify({
          ceremony: tableOrder.ceremonyEventId || '',
          galaDinner: tableOrder.galaDinnerEventId || ''
        }).substring(0, 200),
        
        // Timestamps
        created_at: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
      },
    };
    
    // Add Stripe Connect parameters if connected account exists
    if (connectedAccountId) {
      // Validate connected account
      try {
        const account = await stripe.accounts.retrieve(connectedAccountId);
        if (!account.charges_enabled) {
          console.error(`Connected account ${connectedAccountId} cannot accept charges`);
          return NextResponse.json(
            { success: false, error: 'The organization\'s payment account is not properly configured' },
            { status: 400 }
          );
        }
        
        // Add Connect parameters
        paymentIntentOptions.on_behalf_of = connectedAccountId;
        paymentIntentOptions.application_fee_amount = applicationFeeAmount;
        
        // Add statement descriptor
        const statementDescriptor = event.title
          ?.substring(0, 22)
          .replace(/[^a-zA-Z0-9 ]/g, '')
          .trim();
        if (statementDescriptor) {
          paymentIntentOptions.statement_descriptor_suffix = statementDescriptor;
        }
      } catch (accountError: any) {
        console.error('Connected account validation failed:', accountError);
        // Continue without connected account but log the issue
      }
    }
    
    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create(paymentIntentOptions);

    if (paymentIntent.status !== 'succeeded' && paymentIntent.status !== 'processing') {
      return NextResponse.json(
        { success: false, error: 'Payment failed' },
        { status: 400 }
      );
    }

    // First, we need to get the lodge organisation ID and event ticket ID
    // Get the lodge organisation from the lodge details
    const { data: organisation, error: orgError } = await supabase
      .from('organisations')
      .select('id')
      .eq('lodge_id', lodgeDetails.lodge_id)
      .single();

    if (orgError || !organisation) {
      console.error('Failed to find lodge organisation:', orgError);
      // Refund payment
      if (paymentIntent.status === 'succeeded') {
        await stripe.refunds.create({
          payment_intent: paymentIntent.id,
          reason: 'requested_by_customer',
        });
      }
      return NextResponse.json(
        { success: false, error: 'Lodge organisation not found' },
        { status: 400 }
      );
    }

    // For Grand Proclamation lodge registrations, we need to get the package ticket
    // The main event (Grand Proclamation) should have a package ticket type
    const { data: eventTicket, error: ticketError } = await supabase
      .from('event_tickets')
      .select('id, price')
      .eq('event_id', eventId)
      .eq('ticket_type', 'package') // Package ticket for lodge tables
      .single();

    if (ticketError || !eventTicket) {
      console.error('Failed to find package event ticket:', ticketError);
      // Try to find a standard ticket as fallback
      const { data: standardTicket, error: standardError } = await supabase
        .from('event_tickets')
        .select('id, price')
        .eq('event_id', eventId)
        .eq('ticket_type', 'standard')
        .single();

      if (standardError || !standardTicket) {
        console.error('Failed to find any event ticket:', standardError);
        // Refund payment
        if (paymentIntent.status === 'succeeded') {
          await stripe.refunds.create({
            payment_intent: paymentIntent.id,
            reason: 'requested_by_customer',
          });
        }
        return NextResponse.json(
          { success: false, error: 'Event ticket not found' },
          { status: 400 }
        );
      }

      // Use standard ticket if no package ticket exists
      eventTicket = standardTicket;
    }

    // Calculate price per ticket (total amount / total tickets)
    const pricePerTicket = amount / tableOrder.totalTickets;

    // Call the create_lodge_registration_rpc with ALL available data
    const { data: registrationResult, error: registrationError } = await supabase
      .rpc('create_lodge_registration_rpc', {
        // Required fields
        lodge_organisation_id: organisation.id,
        event_id: eventId,
        event_ticket_id: eventTicket.id,
        ticket_count: tableOrder.totalTickets,
        price_per_ticket: pricePerTicket,
        
        // Contact person fields - send everything we have
        contact_title: customerData.title || null,
        contact_first_name: customerData.firstName || null,
        contact_last_name: customerData.lastName || null,
        contact_suffix: customerData.suffix || null,
        contact_primary_email: customerData.email || null,
        contact_primary_phone: customerData.mobile || null,
        contact_phone: customerData.phone || null,
        contact_dietary_requirements: customerData.dietaryRequirements || null,
        contact_special_needs: customerData.additionalInfo || null,
        
        // Masonic fields - send all if any rank is provided
        contact_rank: customerData.rank || null,
        contact_grand_officer_status: customerData.grandOfficerStatus || null,
        contact_present_grand_officer_role: customerData.presentGrandOfficerRole || null,
        contact_other_grand_officer_role: customerData.otherGrandOfficerRole || null,
        
        // Address fields from billing details if available
        contact_address_line1: billingDetails?.addressLine1 || null,
        contact_address_line2: billingDetails?.addressLine2 || null,
        contact_suburb: billingDetails?.suburb || null,
        contact_state: billingDetails?.stateTerritory?.name || null,
        contact_postcode: billingDetails?.postcode || null,
        contact_country: billingDetails?.country?.name || 'Australia',
        
        // Lodge representative fields
        lodge_rep_title: customerData.title || null,
        lodge_rep_first_name: customerData.firstName || null,
        lodge_rep_last_name: customerData.lastName || null,
        lodge_rep_primary_email: customerData.email || null,
        lodge_rep_primary_phone: customerData.mobile || null,
        
        // Payment info
        stripe_payment_intent_id: paymentIntent.id,
        stripe_payment_method_id: paymentMethodId,
        
        // Additional metadata including sub-event details
        metadata: JSON.stringify({
          tableOrder,
          lodgeDetails,
          tableCount: tableOrder.tableCount,
          billingDetails,
          // Include sub-event information for ticket creation
          subEvents: {
            galaDinner: {
              eventId: tableOrder.galaDinnerEventId,
              tickets: tableOrder.galaDinnerTickets,
            },
            ceremony: {
              eventId: tableOrder.ceremonyEventId,
              tickets: tableOrder.ceremonyTickets,
            },
          },
        }),
      });

    if (registrationError) {
      console.error('Registration error:', registrationError);
      
      // Refund the payment if registration fails
      if (paymentIntent.status === 'succeeded') {
        await stripe.refunds.create({
          payment_intent: paymentIntent.id,
          reason: 'requested_by_customer',
        });
      }

      return NextResponse.json(
        { success: false, error: registrationError.message },
        { status: 500 }
      );
    }

    // The new RPC returns the registration directly, not wrapped in success/error
    if (!registrationResult) {
      // Refund the payment if registration fails
      if (paymentIntent.status === 'succeeded') {
        await stripe.refunds.create({
          payment_intent: paymentIntent.id,
          reason: 'requested_by_customer',
        });
      }

      return NextResponse.json(
        { success: false, error: 'Registration failed' },
        { status: 500 }
      );
    }

    // Update registration with payment success
    const { error: updateError } = await supabase
      .from('registrations')
      .update({
        payment_status: 'paid',
        status: 'confirmed',
        stripe_payment_status: paymentIntent.status,
      })
      .eq('id', registrationResult.id);

    if (updateError) {
      console.error('Failed to update registration status:', updateError);
    }

    // The RPC creates tickets for the main event, but for Grand Proclamation packages,
    // we also need to create tickets for the sub-events (Gala Dinner and Ceremony)
    if (tableOrder.galaDinnerEventId && tableOrder.ceremonyEventId) {
      // Create tickets for Gala Dinner
      const galaDinnerTickets = [];
      for (let i = 0; i < tableOrder.galaDinnerTickets; i++) {
        galaDinnerTickets.push({
          registration_id: registrationResult.id,
          event_id: tableOrder.galaDinnerEventId,
          customer_id: registrationResult.customer_id,
          person_id: registrationResult.person_id,
          ticket_type: 'standard',
          status: 'confirmed',
          price: 14500, // $145.00 in cents
          currency: 'AUD',
          attendee_number: i + 1,
          is_primary: false,
          metadata: {
            lodgeRegistration: true,
            parentEventId: eventId,
            tableName: lodgeDetails.lodgeName,
            tableNumber: Math.ceil((i + 1) / 10),
          },
        });
      }

      if (galaDinnerTickets.length > 0) {
        const { error: galaDinnerError } = await supabase
          .from('tickets')
          .insert(galaDinnerTickets);

        if (galaDinnerError) {
          console.error('Failed to create Gala Dinner tickets:', galaDinnerError);
        }
      }

      // Create tickets for Ceremony
      const ceremonyTickets = [];
      for (let i = 0; i < tableOrder.ceremonyTickets; i++) {
        ceremonyTickets.push({
          registration_id: registrationResult.id,
          event_id: tableOrder.ceremonyEventId,
          customer_id: registrationResult.customer_id,
          person_id: registrationResult.person_id,
          ticket_type: 'standard',
          status: 'confirmed',
          price: 5000, // $50.00 in cents
          currency: 'AUD',
          attendee_number: i + 1,
          is_primary: false,
          metadata: {
            lodgeRegistration: true,
            parentEventId: eventId,
            tableName: lodgeDetails.lodgeName,
            tableNumber: Math.ceil((i + 1) / 10),
          },
        });
      }

      if (ceremonyTickets.length > 0) {
        const { error: ceremonyError } = await supabase
          .from('tickets')
          .insert(ceremonyTickets);

        if (ceremonyError) {
          console.error('Failed to create Ceremony tickets:', ceremonyError);
        }
      }
    }

    // Send confirmation email (optional - implement if needed)
    // await sendConfirmationEmail(registrationResult);

    return NextResponse.json({
      success: true,
      registrationId: registrationResult.id,
      confirmationNumber: registrationResult.confirmation_number,
      paymentIntentId: paymentIntent.id,
    });

  } catch (error: any) {
    console.error('Lodge registration error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}