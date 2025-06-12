import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

interface RouteParams {
  params: {
    functionId: string;
  };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { functionId } = params;
    const body = await request.json();
    const {
      attendees,
      selectedTickets,
      bookingContact,
      paymentMethodId,
      totalAmount,
      subtotal,
      stripeFee,
      registrationId, // Optional, for updates
    } = body;

    // Validate required fields
    if (!attendees || attendees.length === 0 || !bookingContact) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = await createClient();

    // Get or verify authenticated session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // If payment method provided, process payment first
    let paymentIntent = null;
    let paymentStatus = 'pending';
    
    if (paymentMethodId && totalAmount > 0) {
      // Fetch function for Stripe Connect details
      const { data: functionData } = await supabase
        .from('functions')
        .select(`
          function_id,
          name,
          slug,
          organiser_id,
          organisations!functions_organiser_id_fkey(
            organisation_id,
            name,
            stripe_onbehalfof
          )
        `)
        .eq('function_id', functionId)
        .single();
        
      if (!functionData) {
        return NextResponse.json(
          { success: false, error: 'Function not found' },
          { status: 404 }
        );
      }
      
      // Check for connected account
      const connectedAccountId = functionData.organisations?.stripe_onbehalfof;
      const organisationName = functionData.organisations?.name;
      
      // Calculate platform fee
      let applicationFeeAmount = 0;
      if (connectedAccountId) {
        const platformFeePercentage = parseFloat(process.env.STRIPE_PLATFORM_FEE_PERCENTAGE || '0.05');
        applicationFeeAmount = Math.round(totalAmount * 100 * platformFeePercentage);
      }
      
      // Build metadata for payment intent
      const primaryAttendee = attendees.find((a: any) => a.isPrimary) || attendees[0];
      const attendeeTypes: Record<string, number> = {};
      attendees.forEach((a: any) => {
        const type = a.attendeeType || 'guest';
        attendeeTypes[type] = (attendeeTypes[type] || 0) + 1;
      });
      
      // Prepare payment intent options
      const paymentIntentOptions: any = {
        amount: Math.round(totalAmount * 100), // Convert to cents
        currency: 'aud',
        payment_method: paymentMethodId,
        confirmation_method: 'manual',
        confirm: true,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/functions/${functionData.slug || functionId}/register/success`,
        receipt_email: bookingContact?.email || primaryAttendee?.email, // Use billing email, not attendee email
        metadata: {
          // Function (consistent with create-payment-intent)
          function_id: functionId,
          function_name: functionData.name?.substring(0, 100) || '',
          
          // Registration details
          registration_type: 'individual',
          total_attendees: attendees.length.toString(),
          primary_attendee_name: primaryAttendee ? `${primaryAttendee.firstName} ${primaryAttendee.lastName}`.substring(0, 100) : '',
          attendee_types: JSON.stringify(attendeeTypes).substring(0, 200),
          
          // Financial
          subtotal: String(subtotal),
          stripe_fee: String(stripeFee),
          platform_fee: String(applicationFeeAmount / 100),
          
          // Organization
          organisation_name: organisationName?.substring(0, 100) || '',
          
          // Tracking
          created_at: new Date().toISOString(),
          environment: process.env.NODE_ENV || 'development'
        },
      };
      
      // Add Stripe Connect parameters if connected account exists
      if (connectedAccountId) {
        try {
          const account = await stripe.accounts.retrieve(connectedAccountId);
          if (!account.charges_enabled) {
            return NextResponse.json(
              { success: false, error: 'The organization\'s payment account is not properly configured' },
              { status: 400 }
            );
          }
          
          paymentIntentOptions.on_behalf_of = connectedAccountId;
          paymentIntentOptions.application_fee_amount = applicationFeeAmount;
          
          // Add statement descriptor with function name and registration type
          const descriptorText = `${functionData.name} individual`.trim();
          const statementDescriptor = descriptorText
            ?.substring(0, 22)
            .replace(/[^a-zA-Z0-9 ]/g, '')
            .trim();
          if (statementDescriptor) {
            paymentIntentOptions.statement_descriptor_suffix = statementDescriptor;
          }
        } catch (accountError: any) {
          console.error('Connected account validation failed:', accountError);
        }
      }
      
      // Create payment intent
      paymentIntent = await stripe.paymentIntents.create(paymentIntentOptions);

      if (paymentIntent.status !== 'succeeded' && paymentIntent.status !== 'processing') {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Payment failed', 
            requiresAction: paymentIntent.status === 'requires_action',
            clientSecret: paymentIntent.client_secret
          },
          { status: 400 }
        );
      }
      
      paymentStatus = 'completed';
    }

    // Call the upsert RPC with multiple parameters (second function signature)
    const { data: registrationResult, error: registrationError } = await supabase
      .rpc('upsert_individual_registration', {
        p_function_id: functionId,
        p_attendees: attendees,
        p_selected_tickets: selectedTickets,
        p_booking_contact: bookingContact,
        p_payment_status: paymentStatus,
        p_stripe_payment_intent_id: paymentIntent?.id || null,
        p_registration_id: registrationId || null,
        p_total_amount: totalAmount || 0,
        p_subtotal: subtotal || 0,
        p_stripe_fee: stripeFee || 0,
        p_metadata: {
          source: 'individual-registration-api',
          created_at: new Date().toISOString()
        }
      });

    if (registrationError) {
      console.error('Registration error:', registrationError);
      
      // Refund the payment if registration fails and payment was made
      if (paymentIntent && paymentIntent.status === 'succeeded') {
        console.log('[Individual Registration API] Creating refund due to registration failure:', registrationError.message);
        await stripe.refunds.create({
          payment_intent: paymentIntent.id,
          reason: 'duplicate',
          metadata: {
            refund_reason: 'registration_database_failure',
            original_error: registrationError.message,
            registration_type: 'individual',
            refund_timestamp: new Date().toISOString()
          }
        });
      }

      return NextResponse.json(
        { success: false, error: registrationError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      registrationId: registrationResult.registration_id,
      confirmationNumber: registrationResult.confirmation_number,
      customerId: registrationResult.contact_id,
      paymentIntentId: paymentIntent?.id,
      totalAttendees: registrationResult.total_attendees,
      totalTickets: registrationResult.total_tickets,
      requiresAction: false
    });

  } catch (error: any) {
    console.error('Individual registration error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT endpoint for updating registration after payment
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { functionId } = params;
    const body = await request.json();
    const {
      registrationId,
      paymentStatus,
      stripePaymentIntentId,
      totalAmount,
      subtotal,
      stripeFee
    } = body;

    if (!registrationId || !paymentStatus) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Call the upsert RPC to update status with multiple parameters
    const { data: registrationResult, error: registrationError } = await supabase
      .rpc('upsert_individual_registration', {
        p_function_id: functionId,
        p_attendees: [], // Empty, not updating attendees
        p_selected_tickets: [], // Empty, not updating tickets
        p_booking_contact: {}, // Empty, not updating contact
        p_payment_status: paymentStatus,
        p_stripe_payment_intent_id: stripePaymentIntentId,
        p_registration_id: registrationId,
        p_total_amount: totalAmount || 0,
        p_subtotal: subtotal || 0,
        p_stripe_fee: stripeFee || 0
      });

    if (registrationError) {
      console.error('Registration update error:', registrationError);
      return NextResponse.json(
        { success: false, error: registrationError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      registrationId: registrationResult.registration_id,
      status: registrationResult.status,
      paymentStatus: registrationResult.payment_status,
    });

  } catch (error: any) {
    console.error('Individual registration update error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}