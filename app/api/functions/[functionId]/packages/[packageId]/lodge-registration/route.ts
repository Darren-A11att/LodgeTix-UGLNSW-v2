import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

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
    
    console.log('[Lodge Registration API] Amount rounding:', {
      original: { amount, subtotal, stripeFee },
      rounded: { amount: roundedAmount, subtotal: roundedSubtotal, stripeFee: roundedStripeFee }
    });

    // If payment method provided, process payment first
    let paymentIntent = null;
    let paymentStatus = 'pending';
    
    if (paymentMethodId) {
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
      
      // Platform fee is handled by the difference between customer payment and transfer amount
      // Customer pays: amount (includes all fees)
      // Connected account receives: subtotal
      // Platform keeps: amount - subtotal - stripe_processing_fee
      
      // Get base URL with fallback
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
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
          
          // Add statement descriptor with function name and registration type
          const descriptorText = `${functionData.name} lodge`.trim();
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
    console.log('[Lodge Registration API] Calling upsert_lodge_registration RPC with financial parameters');
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
        p_total_amount: parseFloat((roundedAmount / 100).toFixed(2)),        // Convert rounded cents to dollars with 2 decimal places
        p_subtotal: parseFloat((roundedSubtotal / 100).toFixed(2)),          // Convert rounded cents to dollars with 2 decimal places
        p_stripe_fee: parseFloat((roundedStripeFee / 100).toFixed(2)),       // Convert rounded cents to dollars with 2 decimal places
        p_metadata: {
          billingDetails,
          originalAmountCents: amount,
          originalSubtotalCents: subtotal,
          originalStripFeeCents: stripeFee,
          roundedAmountCents: roundedAmount,
          roundedSubtotalCents: roundedSubtotal,
          roundedStripFeeCents: roundedStripeFee,
        }
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

    // Generate confirmation number if payment was successful
    let confirmationNumber = registrationResult?.confirmationNumber || registrationResult?.confirmation_number;
    const finalRegistrationId = registrationResult?.registrationId || registrationResult?.registration_id || registrationId;
    
    if (paymentStatus === 'completed' && !confirmationNumber) {
      console.log('[Lodge Registration API] Triggering confirmation number generation...');
      
      try {
        // Invoke the confirmation generation edge function
        const { data: edgeFunctionData, error: edgeFunctionError } = await supabase.functions.invoke('generate-confirmation', {
          body: {
            type: 'UPDATE',
            table: 'registrations',
            schema: 'public',
            record: {
              id: finalRegistrationId,
              registration_id: finalRegistrationId,
              status: 'completed',
              payment_status: 'completed',
              confirmation_number: null,
              registration_type: 'lodge',
              function_id: functionId,
              customer_id: '',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            old_record: {
              id: finalRegistrationId,
              registration_id: finalRegistrationId,
              status: 'pending',
              payment_status: 'pending',
              confirmation_number: null,
              registration_type: 'lodge',
              function_id: functionId,
              customer_id: '',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          },
        });

        if (edgeFunctionError) {
          console.error('[Lodge Registration API] Edge function error:', edgeFunctionError);
        } else {
          console.log('[Lodge Registration API] Edge function invoked successfully:', edgeFunctionData);
        }
      } catch (edgeError) {
        console.error('[Lodge Registration API] Failed to invoke edge function:', edgeError);
      }
      
      // Poll for confirmation number after triggering edge function
      console.log('[Lodge Registration API] Polling for confirmation number...');
      
      const maxPolls = 5;
      const pollInterval = 3000; // 3 seconds
      
      for (let i = 0; i < maxPolls; i++) {
        // Wait for poll interval (except on first iteration)
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, pollInterval));
        }
        
        console.log(`[Lodge Registration API] Poll attempt ${i + 1}/${maxPolls}`);
        
        // Query the confirmation view
        const { data: confirmationData, error: confirmationError } = await supabase
          .from('lodge_registration_confirmation_view')
          .select('confirmation_number')
          .eq('registration_id', finalRegistrationId)
          .single();
        
        if (confirmationData?.confirmation_number) {
          confirmationNumber = confirmationData.confirmation_number;
          console.log('[Lodge Registration API] Confirmation number found:', confirmationNumber);
          break;
        }
        
        if (confirmationError && confirmationError.code !== 'PGRST116') {
          console.error('[Lodge Registration API] Error polling for confirmation:', confirmationError);
        }
      }
      
      // If no confirmation number after polling, return error
      if (!confirmationNumber) {
        console.error('[Lodge Registration API] Confirmation number generation timeout');
        return NextResponse.json(
          { 
            success: false, 
            error: 'Confirmation number generation timeout. Registration was successful but confirmation is pending.',
            registrationId: finalRegistrationId
          },
          { status: 500 }
        );
      }
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