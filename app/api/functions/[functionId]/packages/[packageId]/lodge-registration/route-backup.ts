import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
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
    
    // Create service role client for RPC calls (bypasses RLS)
    const supabaseServiceRole = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

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
      const { data: functionData } = await supabaseServiceRole
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
        // Use functionId in return URL to avoid issues with undefined slug
        return_url: `${baseUrl}/api/functions/${functionId}/register/success`,
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
      
      paymentStatus = 'completed';
    }

    // Call the upsert RPC using service role client to bypass RLS
    console.log('[Lodge Registration API] Calling upsert_lodge_registration RPC with service role');
    const { data: registrationResult, error: registrationError } = await supabaseServiceRole
      .rpc('upsert_lodge_registration', {
        p_function_id: functionId,
        p_package_id: packageId,
        p_table_count: tableCount,
        p_booking_contact: bookingContact,
        p_lodge_details: lodgeDetails,
        p_payment_status: paymentStatus,
        p_stripe_payment_intent_id: paymentIntent?.id || null,
        p_registration_id: registrationId || null,
        p_total_amount: parseFloat((amount / 100).toFixed(2)),        // Convert cents to dollars with 2 decimal places
        p_subtotal: parseFloat((subtotal / 100).toFixed(2)),          // Convert cents to dollars with 2 decimal places
        p_stripe_fee: parseFloat((stripeFee / 100).toFixed(2)),       // Convert cents to dollars with 2 decimal places
        p_metadata: {
          billingDetails
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
          const authUserId = user?.id;
          
          // Create new contact (no upsert) with correct field mappings - use service role to bypass RLS
          const { data: contact, error: contactError } = await supabaseServiceRole
            .from('contacts')
            .insert({
              email: bookingContact.email,
              first_name: bookingContact.firstName,
              last_name: bookingContact.lastName,
              title: bookingContact.title,
              suffix_1: bookingContact.suffix,  // Map suffix to suffix_1
              mobile_number: bookingContact.mobile,  // Correct column name
              billing_phone: bookingContact.phone,  // Use billing_phone not phone
              dietary_requirements: bookingContact.dietaryRequirements,
              special_needs: bookingContact.additionalInfo,  // Map additionalInfo to special_needs
              auth_user_id: authUserId,
              type: 'organisation',  // Lodge registrations are organisations
              business_name: lodgeDetails.lodgeName,
              // Add address fields if provided
              address_line_1: bookingContact.addressLine1,
              address_line_2: bookingContact.addressLine2,
              suburb_city: bookingContact.suburb,
              state: bookingContact.stateTerritory?.name || bookingContact.state,
              postcode: bookingContact.postcode,
              country: bookingContact.country?.name || 'Australia',
            })
            .select()
            .single();
            
          if (contactError) {
            throw new Error(`Failed to create contact: ${contactError.message}`);
          }
          
          // Generate registration ID and confirmation number
          const registrationId = crypto.randomUUID();
          const confirmationNumber = `LDG-${new Date().toISOString().slice(2,10).replace(/-/g,'')}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
          
          // Create registration record directly - use service role to bypass RLS
          const { data: registration, error: regError } = await supabaseServiceRole
            .from('registrations')
            .insert({
              registration_id: registrationId,  // Explicitly set the registration_id
              function_id: functionId,
              contact_id: contact.contact_id,  // Use contact_id not customer_id
              registration_type: 'lodge',  // Changed from 'lodges' to 'lodge'
              status: paymentStatus === 'completed' ? 'confirmed' : 'pending',
              payment_status: paymentStatus,
              stripe_payment_intent_id: paymentIntent?.id || null,
              total_amount_paid: amount || 0,
              subtotal: subtotal || 0,
              stripe_fee: stripeFee || 0,
              includes_processing_fee: stripeFee > 0,
              registration_date: new Date().toISOString(),
              agree_to_terms: true,
              registration_data: {
                lodge_details: lodgeDetails,
                table_count: tableCount,
                booking_contact: bookingContact,
                package_id: packageId
              },
              confirmation_number: confirmationNumber
            })
            .select()
            .single();
            
          if (regError) {
            throw new Error(`Failed to create registration: ${regError.message}`);
          }
          
          // Get package details - use service role
          const { data: packageData, error: packageError } = await supabaseServiceRole
            .from('packages')
            .select('*')
            .eq('package_id', packageId)
            .single();
            
          if (packageError || !packageData) {
            throw new Error(`Failed to fetch package details: ${packageError?.message}`);
          }
          
          // Create tickets based on included_items array
          const tickets = [];
          const ticketsPerTable = packageData.qty || 10;
          const totalTickets = tableCount * ticketsPerTable;
          
          // Process included_items array if it exists
          if (packageData.included_items && Array.isArray(packageData.included_items)) {
            for (const item of packageData.included_items) {
              if (item.item_type === 'event_ticket' && item.item_id) {
                // Fetch event ticket details
                const { data: eventTicket } = await supabaseServiceRole
                  .from('event_tickets')
                  .select('*, events!event_tickets_event_id_fkey(event_id)')
                  .eq('id', item.item_id)
                  .single();
                  
                if (eventTicket) {
                  const ticketsForThisItem = totalTickets * (item.quantity || 1);
                  for (let i = 0; i < ticketsForThisItem; i++) {
                    tickets.push({
                      registration_id: registrationId,
                      event_id: eventTicket.event_id,
                      ticket_type_id: item.item_id,
                      price_paid: eventTicket.price,
                      original_price: eventTicket.price,
                      status: paymentStatus === 'completed' ? 'sold' : 'reserved',
                      currency: 'AUD',
                      package_id: packageId,
                    });
                  }
                }
              }
            }
          } else if (packageData.event_id) {
            // Fallback: If no included_items, use direct event_id link
            const { data: eventTickets } = await supabaseServiceRole
              .from('event_tickets')
              .select('*')
              .eq('event_id', packageData.event_id);
              
            if (eventTickets && eventTickets.length > 0) {
              const eventTicket = eventTickets[0]; // Use first ticket type
              for (let i = 0; i < totalTickets; i++) {
                tickets.push({
                  registration_id: registrationId,
                  event_id: packageData.event_id,
                  ticket_type_id: eventTicket.id,
                  price_paid: packageData.package_price / ticketsPerTable,
                  original_price: eventTicket.price,
                  status: paymentStatus === 'completed' ? 'sold' : 'reserved',
                  currency: 'AUD',
                  package_id: packageId,
                });
              }
            }
          }
          
          if (tickets.length > 0) {
            const { error: ticketError } = await supabaseServiceRole
              .from('tickets')
              .insert(tickets);
              
            if (ticketError) {
              console.error('[Lodge Registration API] Failed to create tickets:', ticketError);
            }
          }
          
          // Return success with registration details
          return NextResponse.json({
            success: true,
            registrationId: registrationId,  // Use the generated registration ID
            confirmationNumber: confirmationNumber,  // Use the generated confirmation number
            customerId: authUserId,  // Return auth user ID as customer ID for compatibility
            totalTickets: tickets.length,
            createdTickets: tickets.length,
          });
          
        } catch (fallbackError: any) {
          console.error('[Lodge Registration API] Fallback method failed:', fallbackError);
          
          // Refund payment if fallback fails
          if (paymentIntent && paymentIntent.status === 'succeeded') {
            console.log('[Lodge Registration API] Creating refund due to fallback failure:', fallbackError.message);
            await stripe.refunds.create({
              payment_intent: paymentIntent.id,
              reason: 'duplicate',
              metadata: {
                refund_reason: 'fallback_registration_failure',
                original_error: fallbackError.message,
                registration_type: 'lodge_fallback',
                refund_timestamp: new Date().toISOString()
              }
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
        console.log('[Lodge Registration API] Creating refund due to primary registration failure');
        await stripe.refunds.create({
          payment_intent: paymentIntent.id,
          reason: 'duplicate',
          metadata: {
            refund_reason: 'primary_registration_failure',
            registration_type: 'lodge_primary',
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
    
    // Create service role client for RPC calls (bypasses RLS)
    const supabaseServiceRole = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Call the upsert RPC to update status using service role
    const { data: registrationResult, error: registrationError } = await supabaseServiceRole
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