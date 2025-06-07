import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { RegistrationWizard } from '@/components/register/RegistrationWizard/registration-wizard';

interface LodgeConfirmationPageProps {
  params: Promise<{
    slug: string;
    confirmationNumber: string;
  }>;
}

export default async function LodgeConfirmationPage({ params }: LodgeConfirmationPageProps) {
  const { slug, confirmationNumber } = await params;
  
  console.log('[LodgeConfirmationPage] Loading lodge confirmation:', {
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
    console.error('[LodgeConfirmationPage] Lodge registration not found:', error);
    redirect(`/functions/${slug}?error=confirmation_not_found`);
  }
  
  // Verify the function slug matches
  if (registration.function_slug !== slug) {
    console.error('[LodgeConfirmationPage] Function slug mismatch');
    redirect(`/functions/${registration.function_slug}/register/confirmation/lodge/${confirmationNumber}`);
  }
  
  // Verify payment is completed
  if (registration.payment_status !== 'completed' || registration.status !== 'completed') {
    console.error('[LodgeConfirmationPage] Payment not completed');
    redirect(`/functions/${slug}?error=payment_not_completed`);
  }
  
  console.log('[LodgeConfirmationPage] Lodge registration found:', {
    registrationId: registration.registration_id,
    functionId: registration.function_id,
    lodgeName: registration.lodge_name,
    lodgeNumber: registration.lodge_number,
    memberCount: registration.total_members,
    ticketCount: registration.total_tickets
  });
  
  // Render the registration wizard at the confirmation step with lodge-specific data
  return (
    <RegistrationWizard 
      functionSlug={slug}
      functionId={registration.function_id}
      registrationId={registration.registration_id}
      isNewRegistration={false}
      initialStep={6} // Confirmation step
      confirmationNumber={confirmationNumber}
      confirmationData={{
        confirmationNumber,
        registrationId: registration.registration_id,
        registrationType: 'lodge',
        functionName: registration.function_name,
        totalAmount: registration.total_amount_paid,
        // Lodge-specific data
        lodgeName: registration.lodge_name,
        lodgeNumber: registration.lodge_number,
        lodgeId: registration.lodge_id,
        grandLodgeId: registration.grand_lodge_id,
        // Members instead of attendees
        lodgeMembers: registration.lodge_members,
        memberTickets: registration.member_tickets,
        packages: registration.packages_summary,
        totalMembers: registration.total_members,
        tickets: registration.tickets,
        // Billing information
        billingName: `${registration.billing_first_name} ${registration.billing_last_name}`,
        billingEmail: registration.billing_email,
        // Lodge secretary (customer) information
        customerName: `${registration.customer_first_name} ${registration.customer_last_name}`,
        customerEmail: registration.customer_email,
        customerPhone: registration.customer_phone
      }}
    />
  );
}