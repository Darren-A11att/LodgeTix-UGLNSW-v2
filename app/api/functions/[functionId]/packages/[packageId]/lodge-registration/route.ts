import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getSquarePaymentsApi, getSquareLocationId, convertToCents, generateIdempotencyKey } from '@/lib/utils/square-client';
import { calculateSquareFees } from '@/lib/utils/square-fee-calculator';
import type { CreatePaymentRequest, CreateRefundRequest } from 'square';

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
      squareFee,
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

    // Round all amounts to ensure they're whole numbers
    const roundedAmount = Math.round(amount);
    const roundedSubtotal = Math.round(subtotal);
    const roundedSquareFee = Math.round(squareFee);
    
    // Calculate Square fees using the fee calculator
    // Note: calculateSquareFees expects amount in dollars, but frontend sends cents
    const subtotalInDollars = roundedSubtotal / 100;
    const feeCalculation = calculateSquareFees(subtotalInDollars, {
      userCountry: 'AU' // Default to AU, could be determined from billing address
    });
    
    console.log('[Lodge Registration API] Square fee calculation:', {
      original: { amount, subtotal, squareFee },
      rounded: { amount: roundedAmount, subtotal: roundedSubtotal, squareFee: roundedSquareFee },
      subtotalInDollars,
      calculated: {
        customerPayment: feeCalculation.customerPayment,
        squareFee: feeCalculation.squareFee,
        platformFee: feeCalculation.platformFee
      }
    });

    // Fetch function for payment details (needed for both payment and registration)
    const { data: functionData } = await supabase
      .from('functions')
      .select(`
        function_id,
        name,
        slug,
        organiser_id,
        organisations!functions_organiser_id_fkey(
          organisation_id,
          name
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
    
    const organisationName = functionData.organisations?.name;

    // If payment method provided, process payment first
    let payment = null;
    let paymentStatus = 'pending';
    
    if (paymentMethodId) {
      // Determine receipt email
      const receiptEmail = bookingContact?.email || lodgeDetails?.contactEmail;
      console.log('[Lodge Registration API] Setting receipt email to:', receiptEmail);
      
      // Prepare Square payment request
      const paymentsApi = getSquarePaymentsApi();
      const locationId = getSquareLocationId();
      const idempotencyKey = generateIdempotencyKey();
      
      const paymentRequest: CreatePaymentRequest = {
        sourceId: paymentMethodId, // Square nonce from Web Payments SDK
        idempotencyKey,
        amountMoney: {
          amount: BigInt(Math.round(feeCalculation.customerPayment * 100)),
          currency: 'AUD'
        },
        locationId,
        referenceId: `L${Date.now().toString().slice(-8)}`,
        note: `Lodge Registration - ${functionData.name} (${tableCount} tables)`,
        buyerEmailAddress: receiptEmail
      };

      // Add billing address if provided
      if (bookingContact?.firstName && bookingContact?.lastName && bookingContact?.addressLine1) {
        paymentRequest.billingAddress = {
          addressLine1: bookingContact.addressLine1,
          addressLine2: bookingContact.addressLine2 || undefined,
          locality: bookingContact.suburb || bookingContact.city,
          administrativeDistrictLevel1: bookingContact.stateTerritory || bookingContact.state,
          postalCode: bookingContact.postcode || bookingContact.postalCode,
          country: bookingContact.country || 'AU',
          firstName: bookingContact.firstName,
          lastName: bookingContact.lastName
        };
      }

      // Add customer details
      paymentRequest.customerDetails = {
        customerInitiated: true,
        sellerKeyedIn: false
      };
      
      // Create Square payment
      const response = await paymentsApi.createPayment(paymentRequest);
      
      if (response.result.payment) {
        payment = response.result.payment;
        
        if (payment.status !== 'COMPLETED') {
          return NextResponse.json(
            { 
              success: false, 
              error: 'Payment failed',
              status: payment.status
            },
            { status: 400 }
          );
        }
        
        paymentStatus = 'completed';
      } else {
        return NextResponse.json(
          { success: false, error: 'Payment creation failed' },
          { status: 400 }
        );
      }
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
        p_square_payment_id: payment?.id || null,
        p_registration_id: registrationId || null,
        p_total_amount: payment ? feeCalculation.customerPayment : parseFloat((roundedAmount / 100).toFixed(2)),        // Total charged to customer (including all fees)
        p_total_price_paid: payment ? feeCalculation.connectedAmount : parseFloat((roundedSubtotal / 100).toFixed(2)),  // Subtotal (amount without fees)
        p_platform_fee_amount: payment ? feeCalculation.platformFee : 0, // Platform commission
        p_square_fee: payment ? feeCalculation.squareFee : parseFloat((roundedSquareFee / 100).toFixed(2)),       // Square processing fee only
        p_metadata: {
          billingDetails,
          originalAmountCents: amount,
          originalSubtotalCents: subtotal,
          originalSquareFeeCents: squareFee,
          roundedAmountCents: roundedAmount,
          roundedSubtotalCents: roundedSubtotal,
          roundedSquareFeeCents: roundedSquareFee,
          platformFeeAmountCents: payment ? convertToCents(feeCalculation.platformFee) : 0,
          squarePaymentId: payment?.id,
        },
        p_connected_account_id: null  // Square doesn't use connected accounts like Stripe
      });

    console.log('[Lodge Registration API] RPC Result:', {
      data: registrationResult,
      error: registrationError
    });

    if (registrationError) {
      console.error('[Lodge Registration API] Registration error:', registrationError);
      
      // Refund the payment if registration fails and payment was made
      if (payment && payment.status === 'COMPLETED') {
        console.log('[Lodge Registration API] Creating refund due to registration failure:', registrationError.message);
        const paymentsApi = getSquarePaymentsApi();
        const refundRequest: CreateRefundRequest = {
          idempotencyKey: generateIdempotencyKey(),
          amountMoney: payment.amountMoney,
          paymentId: payment.id!,
          reason: 'Registration database failure'
        };
        
        try {
          await paymentsApi.createRefund(refundRequest);
        } catch (refundError) {
          console.error('[Lodge Registration API] Failed to create refund:', refundError);
        }
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
        squareFee: squareFee / 100, // Convert from cents to dollars
        totalAmount: amount / 100 // Convert from cents to dollars
      };

      // Send email via our lodge confirmation API with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'}/api/emails/lodge-confirmation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (emailResponse.ok) {
        const emailResult = await emailResponse.json();
        console.log('[Lodge Registration API] Lodge confirmation email sent successfully:', emailResult.emailId);
      } else {
        const emailError = await emailResponse.text();
        console.error('[Lodge Registration API] Failed to send lodge confirmation email:', emailError);
        // Don't fail the registration if email fails
      }
    } catch (emailError: any) {
      if (emailError.name === 'AbortError') {
        console.error('[Lodge Registration API] Email sending timed out after 5 seconds');
      } else {
        console.error('[Lodge Registration API] Error sending lodge confirmation email:', emailError);
      }
      // Don't fail the registration if email fails
    }

    return NextResponse.json({
      success: true,
      registrationId: finalRegistrationId,
      confirmationNumber: confirmationNumber,
      customerId: registrationResult?.customerId || registrationResult?.customer_id,
      paymentId: payment?.id,
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
      squarePaymentId,
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
        p_square_payment_id: squarePaymentId,
        p_registration_id: registrationId,
        p_total_amount: 0, // Not updating amounts for status changes
        p_subtotal: 0,
        p_square_fee: 0,
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