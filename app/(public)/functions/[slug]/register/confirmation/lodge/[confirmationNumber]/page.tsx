import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import LodgeConfirmationPage from '@/components/register/confirmation/lodge-confirmation-page';

interface LodgeConfirmationRouteProps {
  params: Promise<{
    slug: string;
    confirmationNumber: string;
  }>;
}

export default async function LodgeConfirmationRoute({ params }: LodgeConfirmationRouteProps) {
  const { slug, confirmationNumber } = await params;
  
  console.log('[LodgeConfirmationRoute] Loading lodge confirmation:', {
    slug,
    confirmationNumber
  });
  
  const supabase = await createClient();
  
  // Fetch lodge registration using confirmation number view
  const { data: registration, error } = await supabase
    .from('lodge_registration_confirmation_view')
    .select('*')
    .eq('confirmation_number', confirmationNumber)
    .single();
  
  if (error || !registration) {
    console.error('[LodgeConfirmationRoute] Lodge registration not found:', error);
    redirect(`/functions/${slug}?error=confirmation_not_found`);
  }
  
  // Verify the function slug matches
  if (registration.function_slug !== slug) {
    console.error('[LodgeConfirmationRoute] Function slug mismatch');
    redirect(`/functions/${registration.function_slug}/register/confirmation/lodge/${confirmationNumber}`);
  }
  
  // Verify payment is completed
  if (registration.payment_status !== 'completed' || registration.status !== 'completed') {
    console.error('[LodgeConfirmationRoute] Payment not completed', {
      payment_status: registration.payment_status,
      status: registration.status
    });
    redirect(`/functions/${slug}?error=payment_not_completed`);
  }
  
  console.log('[LodgeConfirmationRoute] Lodge registration found:', {
    registrationId: registration.registration_id,
    functionId: registration.function_id,
    lodgeName: registration.lodge_name,
    lodgeNumber: registration.lodge_number,
    memberCount: registration.total_members,
    ticketCount: registration.total_tickets
  });
  
  // Transform the database data to match the LodgeConfirmationPage component props
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
      lodgeName: registration.lodge_name,
      grandLodgeName: registration.grand_lodge_name,
      lodgeNumber: registration.lodge_number
    },
    packages: Array.isArray(registration.packages) ? registration.packages.map((pkg: any) => ({
      packageName: pkg.packageName,
      packagePrice: pkg.packagePrice,
      quantity: pkg.ticketCount,
      totalPrice: pkg.packagePrice * pkg.ticketCount
    })) : [],
    subtotal: registration.subtotal,
    stripeFee: registration.stripe_fee,
    totalAmount: registration.total_amount_paid
  };
  
  return <LodgeConfirmationPage registration={transformedRegistration} />;
}