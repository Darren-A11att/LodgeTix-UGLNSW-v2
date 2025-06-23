import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getSquarePaymentsApi, getSquareRefundsApi, getSquareLocationId, generateIdempotencyKey } from '@/lib/utils/square-client';
import { calculateSquareFeesWithDb } from '@/lib/utils/square-fee-calculator';
import type { CreatePaymentRequest } from 'square';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[Individuals Payment API] Received request:', body);
    
    const {
      registrationId,
      paymentMethodId,
      billingDetails,
      amount,
      subtotal,
    } = body;

    // Validate required fields
    if (!registrationId || !paymentMethodId || !amount) {
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
      const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously();
      if (anonError) {
        console.error('Failed to create anonymous session:', anonError);
        return NextResponse.json(
          { success: false, error: 'Authentication failed' },
          { status: 401 }
        );
      }
    }

    // Round amounts to ensure they're whole numbers
    const roundedAmount = Math.round(amount);
    const roundedSubtotal = Math.round(subtotal || amount);
    
    // Calculate Square fees using the fee calculator
    // Convert to dollars for fee calculation
    const subtotalInDollars = roundedSubtotal / 100;
    const feeCalculation = await calculateSquareFeesWithDb(subtotalInDollars, {
      userCountry: billingDetails?.country || 'AU' // Default to AU
    });
    
    console.log('[Individuals Payment API] Square fee calculation:', {
      original: { amount, subtotal },
      rounded: { amount: roundedAmount, subtotal: roundedSubtotal },
      subtotalInDollars,
      calculated: {
        customerPayment: feeCalculation.customerPayment,
        squareFee: feeCalculation.squareFee,
        platformFee: feeCalculation.platformFee
      }
    });

    // Fetch registration details for payment note
    const { data: registrationData } = await supabase
      .from('registrations')
      .select(`
        registration_id,
        function_id,
        functions!registrations_function_id_fkey(
          function_id,
          name
        )
      `)
      .eq('registration_id', registrationId)
      .single();
      
    if (!registrationData) {
      return NextResponse.json(
        { success: false, error: 'Registration not found' },
        { status: 404 }
      );
    }

    // Determine receipt email from billing details
    const receiptEmail = billingDetails?.email || 'customer@example.com';
    console.log('[Individuals Payment API] Setting receipt email to:', receiptEmail);
    
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
      referenceId: `I${Date.now().toString().slice(-8)}`,
      note: `Individual Registration - ${registrationData.functions?.name}`,
      buyerEmailAddress: receiptEmail,
      buyerPhoneNumber: billingDetails?.phone || billingDetails?.mobileNumber,
      statementDescriptionIdentifier: registrationData.functions?.name?.substring(0, 20)
    };

    // Add billing address if provided - map from SquareBillingDetails format
    if (billingDetails?.givenName || billingDetails?.firstName) {
      paymentRequest.billingAddress = {
        firstName: billingDetails.givenName || billingDetails.firstName,
        lastName: billingDetails.familyName || billingDetails.lastName,
        addressLine1: billingDetails.addressLines?.[0] || billingDetails.addressLine1,
        addressLine2: billingDetails.addressLines?.[1] || billingDetails.addressLine2 || undefined,
        locality: billingDetails.city || billingDetails.suburb,
        administrativeDistrictLevel1: billingDetails.state || billingDetails.stateTerritory,
        postalCode: billingDetails.postalCode || billingDetails.postcode,
        country: billingDetails.country || 'AU'
      };
    }

    // Add customer details
    paymentRequest.customerDetails = {
      customerInitiated: true,
      sellerKeyedIn: false
    };
    
    console.log('[Individuals Payment API] Creating Square payment...');
    
    // Create Square payment
    const response = await paymentsApi.createPayment(paymentRequest);
    
    let payment = null;
    let paymentStatus = 'pending';
    
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
      console.log('[Individuals Payment API] Payment completed successfully:', payment.id);
    } else {
      return NextResponse.json(
        { success: false, error: 'Payment creation failed' },
        { status: 400 }
      );
    }

    // Update registration with payment details
    console.log('[Individuals Payment API] Updating registration with payment details...');
    const { error: updateError } = await supabase
      .from('registrations')
      .update({
        payment_status: paymentStatus as any,
        total_amount_paid: feeCalculation.customerPayment,
        subtotal: feeCalculation.connectedAmount,
        square_fee: feeCalculation.squareFee,
        platform_fee_amount: feeCalculation.platformFee,
        square_payment_id: payment?.id,
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('registration_id', registrationId);

    if (updateError) {
      console.error('[Individuals Payment API] Registration update error:', updateError);
      
      // Refund the payment if registration update fails
      if (payment && payment.status === 'COMPLETED') {
        console.log('[Individuals Payment API] Creating refund due to registration update failure');
        try {
          const refundsApi = getSquareRefundsApi();
          await refundsApi.refundPayment({
            idempotencyKey: generateIdempotencyKey(),
            amountMoney: payment.amountMoney!,
            paymentId: payment.id!,
            reason: 'Registration update failure'
          });
        } catch (refundError) {
          console.error('[Individuals Payment API] Failed to create refund:', refundError);
        }
      }

      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      );
    }

    // Generate confirmation number if not already present
    let confirmationNumber = null;
    if (paymentStatus === 'completed') {
      confirmationNumber = 'IND-' + Math.floor(Math.random() * 1000000).toString().padStart(6, '0') + 
                          String.fromCharCode(65 + Math.floor(Math.random() * 26)) + 
                          String.fromCharCode(65 + Math.floor(Math.random() * 26));
      
      const { error: confirmationError } = await supabase
        .from('registrations')
        .update({
          confirmation_number: confirmationNumber,
          confirmation_generated_at: new Date().toISOString()
        })
        .eq('registration_id', registrationId);

      if (confirmationError) {
        console.error('[Individuals Payment API] Confirmation number update error:', confirmationError);
        // Don't fail the whole process for this
      } else {
        console.log('[Individuals Payment API] Confirmation number generated:', confirmationNumber);
      }
    }

    return NextResponse.json({
      success: true,
      registrationId: registrationId,
      confirmationNumber: confirmationNumber,
      paymentId: payment?.id,
      status: 'completed',
      message: 'Payment processed successfully'
    });

  } catch (error: any) {
    console.error('[Individuals Payment API] Fatal error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}