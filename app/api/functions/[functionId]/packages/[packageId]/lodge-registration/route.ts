import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getSquareLocationId } from '@/lib/utils/square-client';
import { calculateSquareFeesWithDb } from '@/lib/utils/square-fee-calculator';
import { SquareOrdersService } from '@/lib/services/square-orders-service';
import { convertToDollars, convertToCents } from '@/lib/utils/square-client';
import { generateUUID } from '@/lib/uuid-slug-utils';

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
      packageQuantity, // Replaces tableCount
      bookingContact,
      lodgeDetails,
      paymentMethodId,
      amount,
      subtotal,
      squareFee,
      billingDetails,
      registrationId, // Optional, for updates
      additionalMetadata = {}, // Additional metadata from form
      attendeeDetails, // CRITICAL: Contains all collected data from Grand Lodge form
      registrationMode // 'purchaseOnly' or 'registerDelegation'
    } = body;

    // Validate required fields
    if (!packageQuantity || !bookingContact || !lodgeDetails) {
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
    
    // Get the current user (anonymous or authenticated)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('[Lodge Registration API] Failed to get user:', userError);
      return NextResponse.json(
        { success: false, error: 'Authentication failed' },
        { status: 401 }
      );
    }
    
    // Fetch package details to get catalog_object_id and quantity
    const { data: packageData, error: packageError } = await supabase
      .from('packages')
      .select('*, function_id, name, package_price, quantity, catalog_object_id')
      .eq('package_id', packageId)
      .single();
      
    if (packageError || !packageData) {
      console.error('[Lodge Registration API] Package fetch error:', packageError);
      return NextResponse.json(
        { success: false, error: 'Package not found' },
        { status: 404 }
      );
    }
    
    // Check if package has catalog_object_id (warning but don't block)
    if (!packageData.catalog_object_id) {
      console.warn('[Lodge Registration API] Package missing catalog_object_id, using ad-hoc item');
    }

    // Calculate pricing
    const packagePrice = packageData.package_price || 0;
    const itemQuantity = packageData.quantity || 1; // Items per package
    const subtotalInDollars = packageQuantity * packagePrice;
    
    // Calculate Square fees using database configuration
    const feeCalculation = await calculateSquareFeesWithDb(subtotalInDollars, {
      userCountry: 'AU' // Default to AU
    });
    
    console.log('[Lodge Registration API] Pricing calculation:', {
      packageQuantity,
      packagePrice,
      itemQuantity,
      subtotalInDollars,
      fees: {
        customerPayment: feeCalculation.customerPayment,
        squareFee: feeCalculation.squareFee,
        platformFee: feeCalculation.platformFee
      },
      orderTotal: subtotalInDollars + feeCalculation.squareFee,
      paymentTotal: feeCalculation.customerPayment
    });

    // Fetch function for metadata
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

    // Initialize Square Orders Service
    const squareOrdersService = new SquareOrdersService();
    
    // Process Square order and payment
    let squareCustomerId: string | null = null;
    let squareOrderId: string | null = null;
    let squarePaymentId: string | null = null;
    let paymentStatus = 'pending';
    
    // Declare actualSquareAmounts outside try block
    let actualSquareAmounts = {
      subtotal: 0,
      totalTax: 0,
      processingFee: 0,
      totalAmount: 0
    };
    
    try {
      // Step 1: Create Square customer with comprehensive data
      const customerData = {
        firstName: bookingContact.firstName || bookingContact.first_name,
        lastName: bookingContact.lastName || bookingContact.last_name,
        email: bookingContact.email,
        mobile: bookingContact.mobile || bookingContact.phone,
        addressLine1: bookingContact.addressLine1 || bookingContact.address_line_1,
        city: bookingContact.city || bookingContact.suburb,
        state: bookingContact.state || bookingContact.stateTerritory || bookingContact.state_territory,
        postcode: bookingContact.postcode || bookingContact.postal_code,
        country: bookingContact.country || 'Australia',
        // Include masonic details in customer note for Square
        note: [
          bookingContact.title && `Title: ${bookingContact.title}`,
          bookingContact.rank && `Rank: ${bookingContact.rank}`,
          bookingContact.grandRank && `Grand Rank: ${bookingContact.grandRank}`,
          bookingContact.grandOfficerStatus && `Officer Status: ${bookingContact.grandOfficerStatus}`,
          bookingContact.grandOffice && `Office: ${bookingContact.grandOffice}`
        ].filter(Boolean).join(', ')
      };
      
      console.log('[Lodge Registration API] Creating Square customer');
      const { customerId } = await squareOrdersService.createCustomer(customerData);
      squareCustomerId = customerId;
      
      // Step 2: Create Square order
      const orderData = {
        customerId: squareCustomerId,
        locationId: getSquareLocationId(),
        packages: [{
          packageId: packageId,
          catalogObjectId: packageData.catalog_object_id || null, // Allow null for ad-hoc items
          packageQuantity: packageQuantity,
          itemQuantity: itemQuantity,
          price: packagePrice,
          name: packageData.name
        }],
        processingFee: feeCalculation.squareFee + feeCalculation.platformFee, // Include both Square fee and platform fee
        metadata: {
          functionId: functionId,
          functionName: functionData.name,
          // For delegations, use the organization name instead of lodge name
          organizationName: lodgeDetails.delegationType === 'grandLodge' 
            ? lodgeDetails.grandLodgeName 
            : (lodgeDetails.organisationName || lodgeDetails.lodgeName || lodgeDetails.lodge_name),
          // Only include lodge details for actual lodge registrations
          ...(lodgeDetails.delegationType !== 'grandLodge' && lodgeDetails.lodge_id && {
            lodgeName: lodgeDetails.lodgeName || lodgeDetails.lodge_name,
            lodgeId: lodgeDetails.lodge_id,
          }),
          grandLodgeId: lodgeDetails.grand_lodge_id,
          grandLodgeName: lodgeDetails.grandLodgeName,
          registrationType: lodgeDetails.delegationType === 'grandLodge' ? 'delegation' : 'lodge',
          delegationType: lodgeDetails.delegationType,
          // Include organization details for masonic orders
          ...(lodgeDetails.organisationAbbreviation && {
            organisationAbbreviation: lodgeDetails.organisationAbbreviation,
            organisationKnownAs: lodgeDetails.organisationKnownAs
          }),
          contactName: `${customerData.firstName} ${customerData.lastName}`,
          contactEmail: customerData.email,
          contactPhone: customerData.mobile,
          // Include masonic details
          contactTitle: bookingContact.title,
          contactRank: bookingContact.rank,
          contactGrandRank: bookingContact.grandRank,
          ...additionalMetadata
        }
      };
      
      console.log('[Lodge Registration API] Creating Square order');
      const orderResult = await squareOrdersService.createLodgeOrder(orderData);
      console.log('[Lodge Registration API] createLodgeOrder returned:', {
        hasOrderId: !!orderResult.orderId,
        hasOrder: !!orderResult.order,
        orderResultKeys: Object.keys(orderResult)
      });
      
      const { orderId, order } = orderResult;
      squareOrderId = orderId;
      
      // Debug logging for order response
      console.log('[Lodge Registration API] Order response:', {
        orderId,
        orderExists: !!order,
        totalMoney: order?.total_money,
        totalServiceChargeMoney: order?.total_service_charge_money,
        totalTaxMoney: order?.total_tax_money,
        netAmountDueMoney: order?.net_amount_due_money,
        // Log the actual order object structure
        orderKeys: order ? Object.keys(order) : 'order is null/undefined'
      });
      
      // Extract actual amounts from Square order response for consistency
      if (order && order.net_amount_due_money) {
        // Use net_amount_due_money as it's what needs to be paid
        const amountDue = Number(order.net_amount_due_money.amount);
        
        actualSquareAmounts = {
          subtotal: convertToDollars(amountDue - (Number(order.total_service_charge_money?.amount) || 0)),
          totalTax: convertToDollars(Number(order.total_tax_money?.amount) || 0),
          processingFee: convertToDollars(Number(order.total_service_charge_money?.amount) || 0),
          totalAmount: convertToDollars(amountDue)
        };
        
        console.log('[Lodge Registration API] Using net_amount_due from Square:', {
          amountDueCents: amountDue,
          amountDueDollars: actualSquareAmounts.totalAmount
        });
      } else {
        console.error('[Lodge Registration API] WARNING: No order object returned from Square!');
        // Fall back to calculated amounts
        actualSquareAmounts = {
          subtotal: subtotalInDollars,
          totalTax: 0, // Will be calculated by Square
          processingFee: feeCalculation.squareFee + feeCalculation.platformFee,
          totalAmount: subtotalInDollars + feeCalculation.squareFee + feeCalculation.platformFee
        };
        console.log('[Lodge Registration API] Using fallback calculated amounts:', actualSquareAmounts);
      }
      
      // Step 3: Process payment if payment method provided
      if (paymentMethodId) {
        console.log('[Lodge Registration API] Processing payment with amounts:', {
          actualSquareAmounts,
          calculatedTotal: feeCalculation.customerPayment,
          orderId: squareOrderId,
          hasPaymentMethod: !!paymentMethodId
        });
        
        // Use actual Square total amount for payment
        const paymentData = {
          orderId: squareOrderId,
          paymentMethodId: paymentMethodId,
          amount: actualSquareAmounts.totalAmount, // Use Square's calculated amount
          billingDetails: billingDetails
        };
        
        console.log('[Lodge Registration API] Payment data being sent:', {
          orderId: paymentData.orderId,
          amount: paymentData.amount,
          amountInCents: convertToCents(paymentData.amount),
          paymentMethodIdLength: paymentData.paymentMethodId?.length
        });
        
        // Validate payment amount before sending to Square
        if (!paymentData.amount || paymentData.amount <= 0) {
          console.error('[Lodge Registration API] CRITICAL: Payment amount is 0 or invalid!', {
            actualSquareAmounts,
            order,
            calculatedTotal: feeCalculation.customerPayment
          });
          
          // Use fallback calculation if Square amount is invalid
          const fallbackAmount = subtotalInDollars + feeCalculation.squareFee + feeCalculation.platformFee;
          if (fallbackAmount > 0) {
            console.log('[Lodge Registration API] Using fallback amount:', fallbackAmount);
            paymentData.amount = fallbackAmount;
          } else {
            throw new Error('Invalid payment amount. Unable to process payment.');
          }
        }
        
        const { paymentId, status, payment } = await squareOrdersService.createPayment(paymentData);
        squarePaymentId = paymentId;
        
        // Verify payment amount matches order amount
        if (payment && payment.total_money) {
          const paidAmount = convertToDollars(Number(payment.total_money.amount));
          if (Math.abs(paidAmount - actualSquareAmounts.totalAmount) > 0.01) {
            console.warn('[Lodge Registration API] Payment amount mismatch:', {
              orderAmount: actualSquareAmounts.totalAmount,
              paidAmount: paidAmount
            });
          }
        }
        
        // When autocomplete=true, the payment automatically pays the order
        // No need to call payOrder separately
        paymentStatus = (status === 'COMPLETED' || status === 'APPROVED') ? 'completed' : 'pending';
        
        console.log('[Lodge Registration API] Payment processed:', {
          paymentId: squarePaymentId,
          status: status,
          paymentStatus: paymentStatus,
          actualAmountPaid: actualSquareAmounts.totalAmount
        });
      }
      
    } catch (error) {
      console.error('[Lodge Registration API] Square API error:', error);
      
      // Handle specific error types
      if (error instanceof Error) {
        if (error.message.includes('Insufficient inventory') || error.message.includes('sold out')) {
          return NextResponse.json(
            { 
              success: false, 
              error: error.message,
              errorType: 'INVENTORY_UNAVAILABLE'
            },
            { status: 400 }
          );
        }
        if (error.message.includes('Payment failed')) {
          return NextResponse.json(
            { 
              success: false, 
              error: 'Payment failed. Please check your card details and try again.',
              errorType: 'PAYMENT_FAILED'
            },
            { status: 400 }
          );
        }
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: error instanceof Error ? error.message : 'Order processing failed'
        },
        { status: 500 }
      );
    }

    // Use actual Square amounts for database storage (authoritative source)
    const finalAmounts = paymentMethodId && actualSquareAmounts.totalAmount > 0 
      ? actualSquareAmounts  // Use Square response amounts after successful payment
      : {  // Fallback to calculated amounts if no payment made
          subtotal: subtotalInDollars,
          totalTax: 0, // Will be calculated by Square later
          processingFee: feeCalculation.squareFee,
          totalAmount: feeCalculation.customerPayment
        };

    // Log comprehensive data being stored
    console.log('[Lodge Registration API] Comprehensive data being stored:', {
      bookingContact: {
        hasTitle: !!bookingContact.title,
        hasRank: !!bookingContact.rank,
        hasGrandRank: !!bookingContact.grandRank,
        hasGrandOfficerStatus: !!bookingContact.grandOfficerStatus,
        hasOrganizationName: !!lodgeDetails.organisationName,
        fullData: bookingContact
      },
      lodgeDetails: {
        hasOrganizationDetails: !!(lodgeDetails.organisationName || lodgeDetails.organisationAbbreviation),
        hasGrandLodgeName: !!lodgeDetails.grandLodgeName,
        fullData: lodgeDetails
      },
      attendeeDetails: attendeeDetails
    });

    // If registrationId is provided, check if it exists
    let validRegistrationId = registrationId;
    if (registrationId) {
      const { data: existingReg, error: checkError } = await supabase
        .from('registrations')
        .select('registration_id')
        .eq('registration_id', registrationId)
        .single();
      
      if (checkError || !existingReg) {
        console.log('[Lodge Registration API] Provided registration ID does not exist, will create new registration');
        validRegistrationId = null;
      }
    }
    
    // Determine registration type based on mode and delegation type
    // If registrationMode is 'purchaseOnly', treat it as a lodge registration regardless of delegation type
    const isDelegation = registrationMode === 'purchaseOnly' ? false : 
                        (lodgeDetails.delegationType === 'grandLodge' || lodgeDetails.delegationType === 'masonicOrder');
    
    // Call the appropriate RPC based on registration type
    console.log(`[Lodge Registration API] Registration mode: ${registrationMode}, isDelegation: ${isDelegation}`);
    console.log(`[Lodge Registration API] Calling ${isDelegation ? 'delegation' : 'lodge'} registration RPC with Square amounts:`, finalAmounts);
    
    let registrationResult, registrationError;
    
    if (isDelegation) {
      // For delegations, insert directly into registrations table
      console.log('[Lodge Registration API] Creating delegation registration directly');
      
      // Check if customer exists for this user ID
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('customer_id')
        .eq('customer_id', user.id)
        .single();
      
      let customerId;
      
      if (existingCustomer) {
        // Update existing customer
        customerId = existingCustomer.customer_id;
        const { error: updateError } = await supabase
          .from('customers')
          .update({
            first_name: bookingContact.firstName,
            last_name: bookingContact.lastName,
            phone: bookingContact.mobile,
            business_name: lodgeDetails.organisationName || lodgeDetails.grandLodgeName || 'Delegation',
            updated_at: new Date().toISOString()
          })
          .eq('customer_id', customerId);
        
        if (updateError) {
          console.error('[Lodge Registration API] Customer update error:', updateError);
        }
      } else {
        // Create new customer using the authenticated user's ID
        const newCustomerId = user.id;
        const { error: insertError } = await supabase
          .from('customers')
          .insert({
            customer_id: newCustomerId,
            first_name: bookingContact.firstName,
            last_name: bookingContact.lastName,
            email: bookingContact.email,
            phone: bookingContact.mobile,
            business_name: lodgeDetails.organisationName || lodgeDetails.grandLodgeName || 'Delegation',
            customer_type: 'booking_contact',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        if (insertError) {
          console.error('[Lodge Registration API] Customer creation error:', insertError);
          throw new Error('Failed to create customer record');
        }
        
        customerId = newCustomerId;
      }
      
      // Create contact record with masonic profile data
      const { data: contactData, error: contactError } = await supabase
        .from('contacts')
        .insert({
          contact_id: generateUUID(),
          title: bookingContact.title || '',
          first_name: bookingContact.firstName,
          last_name: bookingContact.lastName,
          suffix_1: bookingContact.grandRank || '', // Store grand rank in suffix_1
          suffix_2: bookingContact.grandOfficerStatus || '', // Store officer status in suffix_2
          suffix_3: bookingContact.grandOffice || '', // Store office in suffix_3
          email: bookingContact.email,
          mobile_number: bookingContact.mobile,
          type: 'organisation',
          organisation_id: lodgeDetails.grand_lodge_id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (contactError) {
        console.error('[Lodge Registration API] Contact creation error:', contactError);
        // Don't fail registration if contact creation fails
      }
      
      const contactId = contactData?.contact_id;
      
      // Generate confirmation number for delegation registrations
      const delegationConfirmationNumber = paymentStatus === 'completed' 
        ? `DEL-${Math.floor(Math.random() * 900000 + 100000)}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`
        : null;
      
      // Create registration directly
      const registrationData = {
        registration_id: validRegistrationId || generateUUID(),
        function_id: functionId,
        customer_id: customerId,
        booking_contact_id: contactId || customerId, // Use contact ID if created, otherwise customer ID
        organisation_id: lodgeDetails.grand_lodge_id,
        organisation_name: lodgeDetails.organisationName || lodgeDetails.grandLodgeName || 'Delegation',
        registration_type: registrationMode === 'purchaseOnly' ? 'lodge' : 'delegation',
        status: paymentStatus === 'completed' ? 'completed' : 'pending',
        payment_status: paymentStatus,
        confirmation_number: delegationConfirmationNumber,
        total_amount_paid: finalAmounts.totalAmount,
        subtotal: finalAmounts.subtotal,
        square_fee: finalAmounts.processingFee,
        stripe_fee: 0,
        platform_fee_amount: feeCalculation.platformFee,
        square_payment_id: squarePaymentId,
        // Store all comprehensive data in registration_data JSONB
        registration_data: {
          bookingContact: bookingContact,
          lodgeDetails: lodgeDetails,
          attendeeDetails: attendeeDetails,
          registrationMode: registrationMode || 'purchaseOnly', // Track which mode was used
          packageDetails: {
            packageId: packageId,
            packageName: packageData.name,
            packageDescription: packageData.description,
            packageQuantity: packageQuantity,
            itemQuantity: itemQuantity,
            pricePerPackage: packagePrice,
            originalPrice: packageData.original_price,
            discount: packageData.discount,
            subtotal: finalAmounts.subtotal,
            includesDescription: packageData.includes_description,
            eligibilityCriteria: packageData.eligibility_criteria,
            registrationTypes: packageData.registration_types,
            isActive: packageData.is_active,
            catalogObjectId: packageData.catalog_object_id
          },
          metadata: {
            ...additionalMetadata,
            squareOrderId: squareOrderId,
            squareCustomerId: squareCustomerId,
            squarePaymentId: squarePaymentId,
            squareAmounts: finalAmounts
          }
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('registrations')
        .upsert(registrationData, {
          onConflict: 'registration_id',
          ignoreDuplicates: false
        })
        .select()
        .single();
      
      if (error) {
        registrationError = error;
        registrationResult = null;
      } else {
        // Format result to match expected structure
        registrationResult = {
          registrationId: data.registration_id,
          customerId: data.customer_id,
          confirmationNumber: data.confirmation_number || delegationConfirmationNumber
        };
        registrationError = null;
      }
    } else {
      // Use existing lodge RPC for lodge registrations
      const { data, error } = await supabase
        .rpc('upsert_lodge_registration', {
        p_function_id: functionId,
        p_package_id: packageId,
        p_table_count: packageQuantity, // The RPC still expects p_table_count
        p_booking_contact: bookingContact,
        p_lodge_details: lodgeDetails,
        p_payment_status: paymentStatus,
        p_stripe_payment_intent_id: null, // Not used for Square
        p_square_payment_id: squarePaymentId,
        p_registration_id: validRegistrationId || null,
        p_total_amount: finalAmounts.totalAmount, // Use Square's actual total
        p_total_price_paid: finalAmounts.subtotal, // Use Square's actual subtotal
        p_platform_fee_amount: feeCalculation.platformFee, // Platform fee unchanged
        p_stripe_fee: 0, // Not used for Square
        p_square_fee: finalAmounts.processingFee, // Use Square's actual processing fee
        p_metadata: {
          billingDetails,
          squareOrderId: squareOrderId,
          squareCustomerId: squareCustomerId,
          packageQuantity,
          itemQuantity,
          totalItems: packageQuantity * itemQuantity,
          squareAmounts: finalAmounts, // Store Square response amounts for reference
          calculatedAmounts: { // Store original calculations for comparison
            subtotal: subtotalInDollars,
            processingFee: feeCalculation.squareFee,
            totalAmount: feeCalculation.customerPayment
          },
          // CRITICAL: Store ALL collected attendee data
          attendeeDetails: attendeeDetails || {},
          // Store comprehensive booking contact data (includes masonic details)
          comprehensiveBookingContact: bookingContact,
          // Store comprehensive lodge details (includes organization data)
          comprehensiveLodgeDetails: lodgeDetails,
          // Store registration mode
          registrationMode: registrationMode || 'purchaseOnly',
          // Store complete package information
          packageDetails: {
            packageId: packageId,
            packageName: packageData.name,
            packageDescription: packageData.description,
            packagePrice: packagePrice,
            originalPrice: packageData.original_price,
            discount: packageData.discount,
            quantity: packageQuantity,
            itemsPerPackage: itemQuantity,
            totalItems: packageQuantity * itemQuantity,
            includesDescription: packageData.includes_description,
            eligibilityCriteria: packageData.eligibility_criteria,
            registrationTypes: packageData.registration_types,
            isActive: packageData.is_active,
            catalogObjectId: packageData.catalog_object_id
          },
          ...additionalMetadata // Include any other metadata passed
        },
        p_connected_account_id: null  // Square doesn't use connected accounts
      });
      
      registrationResult = data;
      registrationError = error;
    }

    console.log('[Lodge Registration API] RPC Result:', {
      data: registrationResult,
      error: registrationError
    });

    if (registrationError) {
      console.error('[Lodge Registration API] Registration error:', registrationError);
      
      // TODO: Implement refund logic using Square Orders API if needed
      // For now, log the error and notify support
      if (squarePaymentId && paymentStatus === 'completed') {
        console.error('[Lodge Registration API] Payment was processed but registration failed. Manual refund may be required.');
        console.error('Square Order ID:', squareOrderId);
        console.error('Square Payment ID:', squarePaymentId);
      }

      return NextResponse.json(
        { success: false, error: registrationError.message },
        { status: 500 }
      );
    }

    // Extract confirmation number and registration ID from result
    let confirmationNumber, finalRegistrationId;
    
    if (isDelegation) {
      // Delegation RPC returns a different structure
      confirmationNumber = registrationResult?.confirmationNumber;
      finalRegistrationId = registrationResult?.registrationId || validRegistrationId;
    } else {
      // Lodge RPC returns array or object
      confirmationNumber = registrationResult?.[0]?.confirmation_number || registrationResult?.confirmationNumber || registrationResult?.confirmation_number;
      finalRegistrationId = registrationResult?.[0]?.registration_id || registrationResult?.registrationId || registrationResult?.registration_id || validRegistrationId;
    }
    
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
            registration_type: isDelegation ? 'delegation' : 'lodge',
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

      // Package data was already fetched earlier, no need to fetch again

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
          packagePrice: packagePrice, // Already in dollars
          quantity: packageQuantity,
          totalPrice: finalAmounts.subtotal // Use Square's actual subtotal
        }],
        subtotal: finalAmounts.subtotal, // Use Square's actual subtotal
        squareFee: finalAmounts.processingFee, // Use Square's actual processing fee
        totalAmount: finalAmounts.totalAmount, // Use Square's actual total
        gstAmount: finalAmounts.totalTax, // Include actual GST from Square
        originalCalculations: { // Include for debugging/comparison
          calculatedSubtotal: subtotalInDollars,
          calculatedSquareFee: feeCalculation.squareFee,
          calculatedTotal: feeCalculation.customerPayment
        }
      };

      // Send email via our lodge confirmation API with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/emails/lodge-confirmation`, {
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
      customerId: isDelegation ? registrationResult?.customerId : (registrationResult?.customerId || registrationResult?.customer_id),
      paymentId: squarePaymentId,
      orderId: squareOrderId,
      totalTickets: isDelegation ? (packageQuantity * itemQuantity) : (registrationResult?.totalAttendees || registrationResult?.total_attendees || (packageQuantity * itemQuantity)),
      createdTickets: isDelegation ? (packageQuantity * itemQuantity) : (registrationResult?.createdTickets || registrationResult?.created_tickets || 0),
      // Include actual Square amounts for consistency
      squareAmounts: finalAmounts,
      // Include original calculations for comparison/debugging
      originalCalculations: {
        subtotal: subtotalInDollars,
        processingFee: feeCalculation.squareFee,
        totalAmount: feeCalculation.customerPayment
      },
      // Include registration type for client handling
      registrationType: isDelegation ? 'delegation' : 'lodge'
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
        p_package_quantity: 0, // Not changing package quantity
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