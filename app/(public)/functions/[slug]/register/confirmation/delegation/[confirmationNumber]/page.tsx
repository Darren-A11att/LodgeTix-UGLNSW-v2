import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import DelegationConfirmationPage from '@/components/register/confirmation/delegation-confirmation-page';
import LodgeConfirmationPage from '@/components/register/confirmation/lodge-confirmation-page';
import { ClientConfirmationPage } from '@/components/register/confirmation/client-confirmation-page';

interface DelegationConfirmationRouteProps {
  params: Promise<{
    slug: string;
    confirmationNumber: string;
  }>;
}

export default async function DelegationConfirmationRoute({ params }: DelegationConfirmationRouteProps) {
  const { slug, confirmationNumber } = await params;
  
  console.log('[DelegationConfirmationRoute] Loading delegation confirmation:', {
    slug,
    confirmationNumber
  });
  
  const supabase = await createClient();
  
  // First, check if it's a delegation registration type
  let registration = null;
  let error = null;
  let viewName = 'delegation_registration_confirmation_view';
  let registrationMode = null;
  const maxRetries = 5;
  const retryDelay = 1000; // 1 second
  
  // Try delegation view first
  for (let i = 0; i < maxRetries; i++) {
    const result = await supabase
      .from(viewName)
      .select('*')
      .eq('confirmation_number', confirmationNumber)
      .single();
    
    registration = result.data;
    error = result.error;
    
    if (registration) {
      console.log(`[DelegationConfirmationRoute] Registration found in ${viewName} on attempt ${i + 1}`);
      
      // Check the registration mode to determine which view to use
      registrationMode = registration.registration_data?.registrationMode || registration.registration_data?.metadata?.registrationMode;
      console.log('[DelegationConfirmationRoute] Registration mode:', registrationMode);
      
      break;
    }
    
    if (i < maxRetries - 1) {
      console.log(`[DelegationConfirmationRoute] Registration not found on attempt ${i + 1}, retrying in ${retryDelay}ms...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
  
  // If not found in delegation view or mode is purchaseOnly, try lodge view
  if ((error || !registration || registrationMode === 'purchaseOnly') && viewName !== 'lodge_registration_confirmation_view') {
    console.log('[DelegationConfirmationRoute] Trying lodge view for registration');
    
    for (let i = 0; i < maxRetries; i++) {
      const lodgeResult = await supabase
        .from('lodge_registration_confirmation_view')
        .select('*')
        .eq('confirmation_number', confirmationNumber)
        .single();
      
      if (lodgeResult.data) {
        registration = lodgeResult.data;
        error = null;
        viewName = 'lodge_registration_confirmation_view';
        console.log(`[DelegationConfirmationRoute] Registration found in lodge view on attempt ${i + 1}`);
        break;
      }
      
      if (i < maxRetries - 1) {
        console.log(`[DelegationConfirmationRoute] Registration not found in lodge view on attempt ${i + 1}, retrying...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }
  
  if (error || !registration) {
    console.error('[DelegationConfirmationRoute] Registration not found after retries:', error);
    redirect(`/functions/${slug}?error=confirmation_not_found`);
  }
  
  // Verify the function slug matches
  if (registration.function_slug !== slug) {
    console.error('[DelegationConfirmationRoute] Function slug mismatch');
    redirect(`/functions/${registration.function_slug}/register/confirmation/delegation/${confirmationNumber}`);
  }
  
  // Verify payment is completed
  if (registration.payment_status !== 'completed' || registration.status !== 'completed') {
    console.error('[DelegationConfirmationRoute] Payment not completed', {
      payment_status: registration.payment_status,
      status: registration.status
    });
    redirect(`/functions/${slug}?error=payment_not_completed`);
  }
  
  console.log('[DelegationConfirmationRoute] Registration found:', {
    registrationId: registration.registration_id,
    functionId: registration.function_id,
    organisationName: registration.organisation_name,
    viewName: viewName,
    registrationMode: registrationMode
  });
  
  // Get registration mode from data if not already extracted
  if (!registrationMode) {
    registrationMode = registration.registration_data?.registrationMode || 
                      registration.registration_data?.metadata?.registrationMode || 
                      'purchaseOnly';
  }
  
  // Render appropriate component based on view name
  if (viewName === 'lodge_registration_confirmation_view') {
    // Lodge view - use lodge confirmation page
    console.log('[DelegationConfirmationRoute] Rendering lodge confirmation page');
    
    const transformedRegistration = {
      confirmationNumber: registration.confirmation_number,
      functionData: {
        name: registration.function_name,
        startDate: registration.function_start_date,
        endDate: registration.function_end_date,
        organiser: {
          name: registration.organiser_name || 'United Grand Lodge of NSW & ACT'
        },
        location: {
          place_name: registration.function_location_name,
          street_address: registration.function_location_address,
          suburb: registration.function_location_city,
          state: registration.function_location_state,
          postal_code: registration.function_location_postal_code,
          country: registration.function_location_country
        }
      },
      billingDetails: {
        firstName: registration.billing_first_name,
        lastName: registration.billing_last_name,
        emailAddress: registration.billing_email,
        mobileNumber: registration.billing_phone,
        addressLine1: registration.billing_street_address,
        suburb: registration.billing_city,
        stateTerritory: { name: registration.billing_state },
        postcode: registration.billing_postal_code,
        country: { name: registration.billing_country }
      },
      lodgeDetails: {
        lodgeName: registration.lodge_name || registration.registration_data?.lodgeDetails?.grandLodgeName || 'Grand Lodge Delegation',
        grandLodgeName: registration.grand_lodge_name || registration.registration_data?.lodgeDetails?.grandLodgeName,
        lodgeNumber: registration.lodge_number
      },
      packages: Array.isArray(registration.packages) ? registration.packages.map((pkg: any) => ({
        packageName: pkg.packageName,
        packagePrice: pkg.packagePrice,
        quantity: pkg.ticketCount,
        totalPrice: pkg.packagePrice * pkg.ticketCount
      })) : [],
      subtotal: registration.subtotal,
      stripeFee: registration.stripe_fee || registration.square_fee,
      totalAmount: registration.total_amount_paid
    };
    
    return <LodgeConfirmationPage registration={transformedRegistration} />;
  } else if (registrationMode === 'registerDelegation') {
    // Register delegation mode - for now use the delegation confirmation page
    // In future, could switch to individuals confirmation page if needed
    console.log('[DelegationConfirmationRoute] Rendering delegation confirmation page for register delegation mode');
    
    const delegationType = registration.registration_data?.lodgeDetails?.delegationType || 'grandLodge';
    const organisationName = registration.organisation_name || 
                            registration.registration_data?.lodgeDetails?.organisationName || 
                            registration.registration_data?.lodgeDetails?.grandLodgeName ||
                            'Delegation';
    
    const transformedRegistration = {
      confirmationNumber: registration.confirmation_number,
      functionData: {
        name: registration.function_name,
        startDate: registration.function_start_date,
        endDate: registration.function_end_date,
        organiser: {
          name: registration.organiser_name || 'United Grand Lodge of NSW & ACT'
        },
        location: {
          place_name: registration.function_location_name,
          street_address: registration.function_location_address,
          suburb: registration.function_location_city,
          state: registration.function_location_state,
          postal_code: registration.function_location_postal_code,
          country: registration.function_location_country
        }
      },
      billingDetails: {
        firstName: registration.billing_first_name || registration.customer_first_name,
        lastName: registration.billing_last_name || registration.customer_last_name,
        emailAddress: registration.billing_email || registration.customer_email,
        mobileNumber: registration.billing_phone || registration.customer_phone,
        addressLine1: registration.billing_street_address,
        suburb: registration.billing_city,
        stateTerritory: { name: registration.billing_state },
        postcode: registration.billing_postal_code,
        country: { name: registration.billing_country }
      },
      delegationDetails: {
        delegationType: delegationType,
        grandLodgeName: registration.registration_data?.lodgeDetails?.grandLodgeName,
        organisationName: organisationName,
        organisationAbbreviation: registration.registration_data?.lodgeDetails?.organisationAbbreviation,
        organisationKnownAs: registration.registration_data?.lodgeDetails?.organisationKnownAs
      },
      packages: Array.isArray(registration.packages) ? registration.packages.map((pkg: any) => ({
        packageName: pkg.packageName,
        packagePrice: pkg.packagePrice,
        quantity: pkg.ticketCount || 1,
        totalPrice: (pkg.packagePrice * (pkg.ticketCount || 1))
      })) : [],
      subtotal: registration.subtotal,
      stripeFee: registration.stripe_fee || registration.square_fee,
      totalAmount: registration.total_amount_paid
    };
    
    return <DelegationConfirmationPage registration={transformedRegistration} />;
  } else {
    // Default fallback - use delegation confirmation page
    console.log('[DelegationConfirmationRoute] Using default delegation confirmation page');
    
    const delegationType = registration.registration_data?.lodgeDetails?.delegationType || 'grandLodge';
    const organisationName = registration.organisation_name || 
                            registration.registration_data?.lodgeDetails?.organisationName || 
                            registration.registration_data?.lodgeDetails?.grandLodgeName ||
                            'Delegation';
    
    const transformedRegistration = {
      confirmationNumber: registration.confirmation_number,
      functionData: {
        name: registration.function_name,
        startDate: registration.function_start_date,
        endDate: registration.function_end_date,
        organiser: {
          name: registration.organiser_name || 'United Grand Lodge of NSW & ACT'
        },
        location: {
          place_name: registration.function_location_name,
          street_address: registration.function_location_address,
          suburb: registration.function_location_city,
          state: registration.function_location_state,
          postal_code: registration.function_location_postal_code,
          country: registration.function_location_country
        }
      },
      billingDetails: {
        firstName: registration.billing_first_name || registration.customer_first_name,
        lastName: registration.billing_last_name || registration.customer_last_name,
        emailAddress: registration.billing_email || registration.customer_email,
        mobileNumber: registration.billing_phone || registration.customer_phone,
        addressLine1: registration.billing_street_address,
        suburb: registration.billing_city,
        stateTerritory: { name: registration.billing_state },
        postcode: registration.billing_postal_code,
        country: { name: registration.billing_country }
      },
      delegationDetails: {
        delegationType: delegationType,
        grandLodgeName: registration.registration_data?.lodgeDetails?.grandLodgeName,
        organisationName: organisationName,
        organisationAbbreviation: registration.registration_data?.lodgeDetails?.organisationAbbreviation,
        organisationKnownAs: registration.registration_data?.lodgeDetails?.organisationKnownAs
      },
      packages: Array.isArray(registration.packages) ? registration.packages.map((pkg: any) => ({
        packageName: pkg.packageName,
        packagePrice: pkg.packagePrice,
        quantity: pkg.ticketCount || 1,
        totalPrice: (pkg.packagePrice * (pkg.ticketCount || 1))
      })) : [],
      subtotal: registration.subtotal,
      stripeFee: registration.stripe_fee || registration.square_fee,
      totalAmount: registration.total_amount_paid
    };
    
    return <DelegationConfirmationPage registration={transformedRegistration} />;
  }
}