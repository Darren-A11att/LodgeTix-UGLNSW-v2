import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { 
  getSquarePaymentsApi, 
  getSquareRefundsApi, 
  getSquareLocationId, 
  generateIdempotencyKey,
  searchSquareCustomerByEmail,
  createSquareCustomer
} from '@/lib/utils/square-client';
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
    
    // Search for existing Square customer or create new one
    console.log('[Individuals Payment API] Searching for Square customer with email:', receiptEmail);
    let squareCustomerId = null;
    
    try {
      // Search for existing customer
      const existingCustomer = await searchSquareCustomerByEmail(receiptEmail);
      
      if (existingCustomer) {
        squareCustomerId = existingCustomer.id;
        console.log('[Individuals Payment API] Found existing Square customer:', squareCustomerId);
      } else {
        // Create new customer with booking contact details
        console.log('[Individuals Payment API] Creating new Square customer');
        
        const customerData = {
          idempotencyKey: generateIdempotencyKey(),
          givenName: billingDetails?.givenName || billingDetails?.firstName || 'Customer',
          familyName: billingDetails?.familyName || billingDetails?.lastName || 'Name',
          emailAddress: receiptEmail,
          phoneNumber: billingDetails?.phone || billingDetails?.mobileNumber,
          companyName: billingDetails?.businessName,
          address: billingDetails?.addressLine1 ? {
            addressLine1: billingDetails.addressLines?.[0] || billingDetails.addressLine1,
            addressLine2: billingDetails.addressLines?.[1] || billingDetails.addressLine2,
            locality: billingDetails.city || billingDetails.suburb,
            administrativeDistrictLevel1: billingDetails.state || billingDetails.stateTerritory,
            postalCode: billingDetails.postalCode || billingDetails.postcode,
            country: billingDetails.country || 'AU'
          } : undefined,
          taxIds: billingDetails?.businessNumber ? {
            euVat: billingDetails.businessNumber // Using EU VAT field for ABN
          } : undefined
        };
        
        const newCustomer = await createSquareCustomer(customerData);
        squareCustomerId = newCustomer?.id;
        console.log('[Individuals Payment API] Created new Square customer:', squareCustomerId);
      }
    } catch (error) {
      console.error('[Individuals Payment API] Error handling Square customer:', error);
      // Continue without customer ID if there's an error
    }
    
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
      statementDescriptionIdentifier: registrationData.functions?.name?.substring(0, 20),
      customerId: squareCustomerId || undefined, // Add customer ID if found/created
      // Authorization-only settings
      autocomplete: false,
      delayAction: 'CANCEL',
      delayDuration: 'PT5M' // 5 minutes
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
      
      // For authorization-only payments, we expect APPROVED status
      if (payment.status !== 'APPROVED' && payment.status !== 'COMPLETED') {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Payment authorization failed',
            status: payment.status
          },
          { status: 400 }
        );
      }
      
      // Payment is authorized but not yet captured
      paymentStatus = 'authorized';
      console.log('[Individuals Payment API] Payment authorized successfully:', payment.id);
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
        square_customer_id: squareCustomerId,
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