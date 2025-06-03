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

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
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
      
      // Calculate platform fee
      let applicationFeeAmount = 0;
      if (connectedAccountId) {
        const platformFeePercentage = parseFloat(process.env.STRIPE_PLATFORM_FEE_PERCENTAGE || '0.05');
        applicationFeeAmount = Math.round(amount * platformFeePercentage);
      }
      
      // Get base URL with fallback
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      console.log('[Lodge Registration API] Base URL:', baseUrl);
      
      // Prepare payment intent options
      const paymentIntentOptions: any = {
        amount,
        currency: 'aud',
        payment_method: paymentMethodId,
        confirmation_method: 'manual',
        confirm: true,
        return_url: `${baseUrl}/functions/${functionData.slug || functionId}/register/success`,
        metadata: {
          function_id: functionId,
          function_name: functionData.name?.substring(0, 100) || '',
          package_id: packageId,
          registration_type: 'lodge',
          lodge_name: lodgeDetails.lodgeName?.substring(0, 100) || '',
          table_count: tableCount.toString(),
          subtotal: String(subtotal / 100),
          stripe_fee: String(stripeFee / 100),
          platform_fee: String(applicationFeeAmount / 100),
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
          
          // For application fees, we need to create the payment on the platform account
          // and use transfer_data to send funds to the connected account
          paymentIntentOptions.transfer_data = {
            destination: connectedAccountId,
            amount: amount - applicationFeeAmount, // Amount to transfer after fee
          };
          
          // Don't use on_behalf_of with application_fee_amount
          // paymentIntentOptions.on_behalf_of = connectedAccountId;
          // paymentIntentOptions.application_fee_amount = applicationFeeAmount;
          
          // Add statement descriptor
          const statementDescriptor = functionData.name
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
      
      paymentStatus = 'paid';
    }

    // Call the upsert RPC
    console.log('[Lodge Registration API] Calling upsert_lodge_registration RPC');
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
        p_metadata: {
          billingDetails,
          amount: amount / 100,
          subtotal: subtotal / 100,
          stripeFee: stripeFee / 100,
        }
      });

    if (registrationError) {
      console.error('[Lodge Registration API] Registration error:', registrationError);
      
      // Check if RPC doesn't exist
      if (registrationError.code === '42883' || registrationError.message?.includes('function') || registrationError.message?.includes('does not exist')) {
        console.warn('[Lodge Registration API] RPC function not available, using fallback method');
        
        // FALLBACK: Use direct database operations
        try {
          // Get user from auth
          const { data: { user } } = await supabase.auth.getUser();
          const customerId = user?.id;
          
          // Create registration record directly
          const { data: registration, error: regError } = await supabase
            .from('registrations')
            .insert({
              function_id: functionId,
              customer_id: customerId,
              registration_type: 'lodges',
              status: paymentStatus === 'paid' ? 'confirmed' : 'pending',
              payment_status: paymentStatus,
              stripe_payment_intent_id: paymentIntent?.id || null,
              total_amount_paid: amount || 0,
              subtotal: subtotal || 0,
              stripe_fee: stripeFee || 0,
              includes_processing_fee: stripeFee > 0,
              registration_date: new Date().toISOString(),
              agree_to_terms: true,
              metadata: {
                lodge_details: lodgeDetails,
                table_count: tableCount,
                booking_contact: bookingContact,
                package_id: packageId
              }
            })
            .select()
            .single();
            
          if (regError) {
            throw new Error(`Failed to create registration: ${regError.message}`);
          }
          
          // Get package details to create tickets
          const { data: packageData, error: packageError } = await supabase
            .from('packages')
            .select('*, package_includes(*, event_tickets(*))')
            .eq('package_id', packageId)
            .single();
            
          if (packageError || !packageData) {
            throw new Error(`Failed to fetch package details: ${packageError?.message}`);
          }
          
          // Create tickets for each included event
          const tickets = [];
          for (const include of packageData.package_includes || []) {
            const ticketCount = tableCount * 10; // 10 tickets per table
            for (let i = 0; i < ticketCount; i++) {
              tickets.push({
                registration_id: registration.registration_id,
                event_id: include.event_tickets.event_id,
                customer_id: customerId,
                ticket_type: include.event_tickets.ticket_type,
                status: paymentStatus === 'paid' ? 'confirmed' : 'reserved',
                price: include.event_tickets.price,
                currency: 'AUD',
                attendee_number: i + 1,
                is_primary: false,
                metadata: {
                  lodge_registration: true,
                  lodge_name: lodgeDetails.lodgeName,
                  table_number: Math.ceil((i + 1) / 10),
                  seat_number: ((i) % 10) + 1,
                  package_id: packageId
                }
              });
            }
          }
          
          if (tickets.length > 0) {
            const { error: ticketError } = await supabase
              .from('tickets')
              .insert(tickets);
              
            if (ticketError) {
              console.error('[Lodge Registration API] Failed to create tickets:', ticketError);
            }
          }
          
          // Return success with registration details
          return NextResponse.json({
            success: true,
            registrationId: registration.registration_id,
            confirmationNumber: registration.confirmation_number || `REG-${registration.registration_id.substring(0, 8).toUpperCase()}`,
            customerId: customerId,
            totalTickets: tickets.length,
            createdTickets: tickets.length,
          });
          
        } catch (fallbackError: any) {
          console.error('[Lodge Registration API] Fallback method failed:', fallbackError);
          
          // Refund payment if fallback fails
          if (paymentIntent && paymentIntent.status === 'succeeded') {
            await stripe.refunds.create({
              payment_intent: paymentIntent.id,
              reason: 'requested_by_customer',
            });
          }
          
          return NextResponse.json(
            { success: false, error: fallbackError.message },
            { status: 500 }
          );
        }
      }
      
      // Refund the payment if registration fails and payment was made
      if (paymentIntent && paymentIntent.status === 'succeeded') {
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

    return NextResponse.json({
      success: true,
      registrationId: registrationResult.registration_id,
      confirmationNumber: registrationResult.confirmation_number,
      customerId: registrationResult.customer_id,
      paymentIntentId: paymentIntent?.id,
      totalTickets: registrationResult.total_tickets,
      createdTickets: registrationResult.created_tickets,
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
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
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

    // Call the upsert RPC to update status
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