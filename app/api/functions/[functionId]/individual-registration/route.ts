import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getSquarePaymentsApi, getSquareLocationId, convertToCents, generateIdempotencyKey } from '@/lib/utils/square-client';
import { calculateSquareFeesWithDb } from '@/lib/utils/square-fee-calculator';
import type { CreatePaymentRequest, CreateRefundRequest } from 'square';

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
      squareFee,
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
    let payment = null;
    let paymentStatus = 'pending';
    
    if (paymentMethodId && totalAmount > 0) {
      // Fetch function for payment details
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
      
      // Calculate Square fees using the fee calculator
      const feeCalculation = calculateSquareFees(subtotal, {
        userCountry: 'AU' // Default to AU, could be determined from billing address
      });
      
      console.log('[Individual Registration API] Square fee calculation:', {
        subtotal,
        customerPayment: feeCalculation.customerPayment,
        squareFee: feeCalculation.squareFee,
        platformFee: feeCalculation.platformFee
      });
      
      // Build metadata for payment
      const primaryAttendee = attendees.find((a: any) => a.isPrimary) || attendees[0];
      const attendeeTypes: Record<string, number> = {};
      attendees.forEach((a: any) => {
        const type = a.attendeeType || 'guest';
        attendeeTypes[type] = (attendeeTypes[type] || 0) + 1;
      });
      
      // Prepare Square payment request
      const paymentsApi = getSquarePaymentsApi();
      const locationId = getSquareLocationId();
      const idempotencyKey = generateIdempotencyKey();
      
      const paymentRequest: CreatePaymentRequest = {
        sourceId: paymentMethodId, // Square nonce from Web Payments SDK
        idempotencyKey,
        amountMoney: {
          amount: BigInt(convertToCents(feeCalculation.customerPayment)),
          currency: 'AUD'
        },
        locationId,
        referenceId: `I${Date.now().toString().slice(-8)}`,
        note: `Individual Registration - ${functionData.name} (${attendees.length} attendees)`,
        buyerEmailAddress: bookingContact?.email || primaryAttendee?.email
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

    // Call the upsert RPC with multiple parameters including platform fee
    const { data: registrationResult, error: registrationError } = await supabase
      .rpc('upsert_individual_registration', {
        p_function_id: functionId,
        p_customer_data: bookingContact,
        p_attendees: attendees,
        p_tickets: selectedTickets,
        p_payment_status: paymentStatus,
        p_square_payment_id: payment?.id || null,
        p_registration_id: registrationId || null,
        p_total_amount: totalAmount || 0,                    // Total charged to customer (including all fees)
        p_total_price_paid: subtotal || 0,                   // Subtotal (amount without fees)
        p_platform_fee_amount: payment ? calculateSquareFees(subtotal, { userCountry: 'AU' }).platformFee : 0,   // Platform commission
        p_square_fee: squareFee || 0,                        // Square processing fee only
        p_metadata: {
          source: 'individual-registration-api',
          created_at: new Date().toISOString(),
          squarePaymentId: payment?.id,
          platformFeeAmountDollars: payment ? calculateSquareFees(subtotal, { userCountry: 'AU' }).platformFee : 0
        }
      });

    if (registrationError) {
      console.error('Registration error:', registrationError);
      
      // Refund the payment if registration fails and payment was made
      if (payment && payment.status === 'COMPLETED') {
        console.log('[Individual Registration API] Creating refund due to registration failure:', registrationError.message);
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
          console.error('[Individual Registration API] Failed to create refund:', refundError);
        }
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
      paymentId: payment?.id,
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
      squarePaymentId,
      totalAmount,
      subtotal,
      squareFee
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
        p_square_payment_id: squarePaymentId,
        p_registration_id: registrationId,
        p_total_amount: totalAmount || 0,
        p_subtotal: subtotal || 0,
        p_square_fee: squareFee || 0,
        p_platform_fee_amount: 0  // Not updating platform fee for status changes
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