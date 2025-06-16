import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import Stripe from 'stripe';

// Initialize Stripe client lazily with proper error handling
function getStripeClient() {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  
  if (!stripeSecretKey) {
    throw new Error('STRIPE_SECRET_KEY environment variable is not configured');
  }
  
  if (!stripeSecretKey.startsWith('sk_')) {
    throw new Error('Invalid STRIPE_SECRET_KEY format');
  }
  
  return new Stripe(stripeSecretKey, {
    apiVersion: '2024-12-18.acacia',
  });
}

interface RouteParams {
  params: {
    functionId: string;
    packageId: string;
  };
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ functionId: string; packageId: string }> }
) {
  try {
    const params = await context.params;
    const { functionId, packageId } = params;
    console.log('[Lodge Registration API] Received request:', { functionId, packageId });
    
    const body = await request.json();
    console.log('[Lodge Registration API] Request body:', body);
    
    const {
      tableCount,
      bookingContact,
      lodgeDetails,
      paymentMethodId,
      amount,
      subtotal,
      stripeFee,
      billingDetails,
      registrationId, // Optional, for updates
    } = body;

    // Validate required fields
    if (!tableCount || !bookingContact || !lodgeDetails || !amount) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = await createClient();

    // Log raw payload as first operation
    console.log('[Lodge Registration API] Logging raw payload');
    try {
      const { error: rawPayloadError } = await supabase
        .from('raw_payloads')
        .insert({
          raw_data: {
            endpoint: `/api/functions/${functionId}/packages/${packageId}/lodge-registration`,
            method: 'POST',
            timestamp: new Date().toISOString(),
            payload: body
          },
          created_at: new Date().toISOString()
        });

      if (rawPayloadError) {
        console.error('[Lodge Registration API] Error logging raw payload:', rawPayloadError);
        // Don't fail the request, just log the error
      } else {
        console.log('[Lodge Registration API] Raw payload logged successfully');
      }
    } catch (logError) {
      console.error('[Lodge Registration API] Failed to log raw payload:', logError);
      // Don't fail the request, just log the error
    }

    // Get or create anonymous session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (!session) {
      const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously();
      if (anonError) {
        console.error('Failed to create anonymous session:', anonError);
        return NextResponse.json(
          { success: false, error: 'Authentication failed' },
          { status: 401 }
        );
      }
    }

    // Round all amounts to ensure they're whole numbers (Stripe expects integers in cents)
    const roundedAmount = Math.round(amount);
    const roundedSubtotal = Math.round(subtotal);
    const roundedStripeFee = Math.round(stripeFee);
    
    // Calculate platform fee: total amount - subtotal - stripe fee
    const platformFeeAmount = roundedAmount - roundedSubtotal - roundedStripeFee;
    
    console.log('[Lodge Registration API] Amount calculation and rounding:', {
      original: { amount, subtotal, stripeFee },
      rounded: { amount: roundedAmount, subtotal: roundedSubtotal, stripeFee: roundedStripeFee },
      calculated: { platformFeeAmount }
    });

    // Fetch function for Stripe Connect details (needed for both payment and registration)
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
    
    // Check for connected account (define outside payment block so it's accessible later)
    const connectedAccountId = functionData.organisations?.stripe_onbehalfof;
    const organisationName = functionData.organisations?.name;

    // If payment method provided, process payment first
    let paymentIntent = null;
    let paymentStatus = 'pending';
    
    if (paymentMethodId) {
      
      // Platform fee is handled by the difference between customer payment and transfer amount
      // Customer pays: amount (includes all fees)
      // Connected account receives: subtotal
      // Platform keeps: amount - subtotal - stripe_processing_fee
      
      // Get base URL with fallback - use production URL for return URL
      const baseUrl = process.env.NODE_ENV === 'production' ? 'https://lodgetix.io' : 'http://localhost:3000';
      console.log('[Lodge Registration API] Base URL:', baseUrl);
      
      // Determine receipt email
      const receiptEmail = bookingContact?.email || lodgeDetails?.contactEmail;
      console.log('[Lodge Registration API] Setting receipt email to:', receiptEmail);
      
      // Prepare payment intent options
      const paymentIntentOptions: any = {
        amount: roundedAmount,
        currency: 'aud',
        payment_method: paymentMethodId,
        confirmation_method: 'manual',
        confirm: true,
        // Use functionId in return URL to avoid issues with undefined slug
        return_url: `${baseUrl}/api/functions/${functionId}/register/success`,
        // Send receipt to booking contact email (the person making the payment)
        receipt_email: receiptEmail,
        metadata: {
          function_id: functionId,
          function_name: functionData.name?.substring(0, 100) || '',
          package_id: packageId,
          registration_type: 'lodge',
          lodge_name: lodgeDetails.lodgeName?.substring(0, 100) || '',
          table_count: tableCount.toString(),
          subtotal: String(roundedSubtotal / 100),
          stripe_fee: String(roundedStripeFee / 100),
          platform_fee: String((roundedAmount - roundedSubtotal - roundedStripeFee) / 100),
          created_at: new Date().toISOString(),
          environment: process.env.NODE_ENV || 'development'
        },
      };
      
      // Add Stripe Connect parameters if connected account exists
      if (connectedAccountId) {
        try {
          const stripe = getStripeClient();
          const account = await stripe.accounts.retrieve(connectedAccountId);
          if (!account.charges_enabled) {
            return NextResponse.json(
              { success: false, error: 'The organization\'s payment account is not properly configured' },
              { status: 400 }
            );
          }
          
          // For destination charges with Stripe Connect:
          // - Customer pays the total (subtotal + platform fee + stripe fee)
          // - Connected account receives exactly the subtotal
          // - Platform keeps the difference minus Stripe's processing fee
          paymentIntentOptions.transfer_data = {
            destination: connectedAccountId,
            amount: roundedSubtotal, // Transfer exactly the rounded subtotal to connected account
          };
          
          // Add statement descriptor with function slug and registration type
          const descriptorText = `${functionData.slug} lodge`.trim();
          const statementDescriptor = descriptorText
            ?.substring(0, 22)
            .replace(/[^a-zA-Z0-9 ]/g, '')
            .trim();
          if (statementDescriptor) {
            paymentIntentOptions.statement_descriptor_suffix = statementDescriptor;
          }
        } catch (accountError: any) {
          console.error('Connected account validation failed:', accountError);
          // Continue without connected account features
          console.log('Processing payment without connected account features');
        }
      }
      
      // Create payment intent
      const stripe = getStripeClient();
      paymentIntent = await stripe.paymentIntents.create(paymentIntentOptions);

      if (paymentIntent.status !== 'succeeded' && paymentIntent.status !== 'processing') {
        return NextResponse.json(
          { success: false, error: 'Payment failed', requires_action: paymentIntent.status === 'requires_action' },
          { status: 400 }
        );
      }
      
      paymentStatus = 'completed';
    }

    // Call the upsert RPC - it has SECURITY DEFINER so it bypasses RLS
    console.log('[Lodge Registration API] Calling upsert_lodge_registration RPC with financial parameters including platform fee');
    const { data: registrationResult, error: registrationError } = await supabase
      .rpc('upsert_lodge_registration', {
        p_function_id: functionId,
        p_package_id: packageId,
        p_table_count: tableCount,
        p_booking_contact: bookingContact,
        p_lodge_details: lodgeDetails,
        p_payment_status: paymentStatus,
        p_stripe_payment_intent_id: paymentIntent?.id || null,
        p_registration_id: registrationId || null,
        p_total_amount: parseFloat((roundedAmount / 100).toFixed(2)),        // Total charged to customer (including all fees)
        p_total_price_paid: parseFloat((roundedSubtotal / 100).toFixed(2)),  // Subtotal (amount without fees)
        p_platform_fee_amount: parseFloat((platformFeeAmount / 100).toFixed(2)), // Platform commission
        p_stripe_fee: parseFloat((roundedStripeFee / 100).toFixed(2)),       // Stripe processing fee only
        p_metadata: {
          billingDetails,
          originalAmountCents: amount,
          originalSubtotalCents: subtotal,
          originalStripFeeCents: stripeFee,
          roundedAmountCents: roundedAmount,
          roundedSubtotalCents: roundedSubtotal,
          roundedStripFeeCents: roundedStripeFee,
          platformFeeAmountCents: platformFeeAmount,
        },
        p_connected_account_id: connectedAccountId || null  // Add the missing parameter
      });

    console.log('[Lodge Registration API] RPC Result:', {
      data: registrationResult,
      error: registrationError
    });

    if (registrationError) {
      console.error('[Lodge Registration API] Registration error:', registrationError);
      
      // Refund the payment if registration fails and payment was made
      if (paymentIntent && paymentIntent.status === 'succeeded') {
        console.log('[Lodge Registration API] Creating refund due to registration failure:', registrationError.message);
        const stripe = getStripeClient();
        await stripe.refunds.create({
          payment_intent: paymentIntent.id,
          reason: 'duplicate',
          metadata: {
            refund_reason: 'registration_database_failure',
            original_error: registrationError.message,
            registration_type: 'lodge',
            refund_timestamp: new Date().toISOString()
          }
        });
      }

      return NextResponse.json(
        { success: false, error: registrationError.message },
        { status: 500 }
      );
    }

    // Extract confirmation number and registration ID from result
    let confirmationNumber = registrationResult?.[0]?.confirmation_number || registrationResult?.confirmationNumber || registrationResult?.confirmation_number;
    const finalRegistrationId = registrationResult?.[0]?.registration_id || registrationResult?.registrationId || registrationResult?.registration_id || registrationId;
    
    console.log('[Lodge Registration API] Extracted values:', {
      confirmationNumber,
      finalRegistrationId,
      registrationResult: registrationResult?.[0] || registrationResult
    });
    
    if (paymentStatus === 'completed' && !confirmationNumber) {
      console.log('[Lodge Registration API] Generating confirmation number directly...');
      
      try {
        // Use the database function directly instead of edge function
        const { data: confirmationData, error: confirmationError } = await supabase
          .rpc('generate_confirmation_number', {
            registration_type: 'lodge',
            registration_id: finalRegistrationId
          });

        if (confirmationError) {
          console.error('[Lodge Registration API] Confirmation generation error:', confirmationError);
          throw new Error(confirmationError.message);
        }

        if (confirmationData) {
          confirmationNumber = confirmationData;
          console.log('[Lodge Registration API] Confirmation number generated:', confirmationNumber);
        } else {
          throw new Error('No confirmation number returned from database function');
        }
      } catch (confirmationError) {
        console.error('[Lodge Registration API] Failed to generate confirmation number:', confirmationError);
        return NextResponse.json(
          { 
            success: false, 
            error: 'Failed to generate confirmation number. Registration was successful but confirmation is pending.',
            registrationId: finalRegistrationId
          },
          { status: 500 }
        );
      }
    }

    // Send lodge confirmation email
    console.log('[Lodge Registration API] Sending lodge confirmation email');
    try {
      // Fetch complete function data for email
      const { data: fullFunctionData } = await supabase
        .from('functions')
        .select(`
          function_id,
          name,
          slug,
          start_date,
          end_date,
          organisations!functions_organiser_id_fkey(
            name
          ),
          locations(
            place_name,
            street_address,
            suburb,
            state,
            postal_code,
            country
          )
        `)
        .eq('function_id', functionId)
        .single();

      // Fetch package data for email
      const { data: packageData } = await supabase
        .from('packages')
        .select('name, price_per_person')
        .eq('package_id', packageId)
        .single();

      // Prepare email data
      const emailData = {
        confirmationNumber: confirmationNumber,
        functionData: {
          name: fullFunctionData?.name || 'Event',
          startDate: fullFunctionData?.start_date,
          endDate: fullFunctionData?.end_date,
          organiser: {
            name: fullFunctionData?.organisations?.name || 'United Grand Lodge of NSW & ACT'
          },
          location: fullFunctionData?.locations ? {
            place_name: fullFunctionData.locations.place_name,
            street_address: fullFunctionData.locations.street_address,
            suburb: fullFunctionData.locations.suburb,
            state: fullFunctionData.locations.state,
            postal_code: fullFunctionData.locations.postal_code,
            country: fullFunctionData.locations.country
          } : undefined
        },
        billingDetails: {
          firstName: bookingContact.firstName,
          lastName: bookingContact.lastName,
          emailAddress: bookingContact.email,
          mobileNumber: bookingContact.mobile,
          addressLine1: billingDetails?.addressLine1,
          suburb: billingDetails?.suburb,
          stateTerritory: billingDetails?.stateTerritory,
          postcode: billingDetails?.postcode,
          country: billingDetails?.country
        },
        lodgeDetails: {
          lodgeName: lodgeDetails.lodgeName,
          grandLodgeName: lodgeDetails.grandLodgeName || 'United Grand Lodge of NSW & ACT',
          lodgeNumber: lodgeDetails.lodgeNumber
        },
        packages: [{
          packageName: packageData?.name || 'Lodge Package',
          packagePrice: (packageData?.price_per_person || (subtotal / tableCount)) / 100, // Convert from cents to dollars
          quantity: tableCount,
          totalPrice: subtotal / 100 // Convert from cents to dollars
        }],
        subtotal: subtotal / 100, // Convert from cents to dollars
        stripeFee: stripeFee / 100, // Convert from cents to dollars
        totalAmount: amount / 100 // Convert from cents to dollars
      };

      // Send email via our lodge confirmation API
      const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/emails/lodge-confirmation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      });

      if (emailResponse.ok) {
        const emailResult = await emailResponse.json();
        console.log('[Lodge Registration API] Lodge confirmation email sent successfully:', emailResult.emailId);
      } else {
        const emailError = await emailResponse.text();
        console.error('[Lodge Registration API] Failed to send lodge confirmation email:', emailError);
        // Don't fail the registration if email fails
      }
    } catch (emailError) {
      console.error('[Lodge Registration API] Error sending lodge confirmation email:', emailError);
      // Don't fail the registration if email fails
    }

    return NextResponse.json({
      success: true,
      registrationId: finalRegistrationId,
      confirmationNumber: confirmationNumber,
      customerId: registrationResult?.customerId || registrationResult?.customer_id,
      paymentIntentId: paymentIntent?.id,
      totalTickets: registrationResult?.totalAttendees || registrationResult?.total_attendees || (tableCount * 10),
      createdTickets: registrationResult?.createdTickets || registrationResult?.created_tickets || 0,
    });

  } catch (error: any) {
    console.error('[Lodge Registration API] Fatal error:', error);
    console.error('[Lodge Registration API] Error stack:', error.stack);
    
    // Check for specific error types
    if (error.message?.includes('Invalid URL')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Configuration error: Invalid URL. Please check environment variables.',
          details: error.message 
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT endpoint for updating registration after payment
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ functionId: string; packageId: string }> }
) {
  try {
    const params = await context.params;
    const { functionId, packageId } = params;
    const body = await request.json();
    const {
      registrationId,
      paymentStatus,
      stripePaymentIntentId,
    } = body;

    if (!registrationId || !paymentStatus) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Call the upsert RPC to update status - it has SECURITY DEFINER
    const { data: registrationResult, error: registrationError } = await supabase
      .rpc('upsert_lodge_registration', {
        p_function_id: functionId,
        p_package_id: packageId,
        p_table_count: 0, // Not changing tables
        p_booking_contact: {}, // Empty, not updating contact
        p_lodge_details: {}, // Empty, not updating lodge details
        p_payment_status: paymentStatus,
        p_stripe_payment_intent_id: stripePaymentIntentId,
        p_registration_id: registrationId,
        p_total_amount: 0, // Not updating amounts for status changes
        p_subtotal: 0,
        p_stripe_fee: 0,
        p_platform_fee_amount: 0, // Not updating platform fee for status changes
        p_metadata: {},
        p_connected_account_id: null
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
    console.error('Lodge registration update error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}