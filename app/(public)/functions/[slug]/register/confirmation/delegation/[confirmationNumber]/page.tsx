import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { RegistrationWizard } from '@/components/register/RegistrationWizard/registration-wizard';

interface DelegationConfirmationPageProps {
  params: Promise<{
    slug: string;
    confirmationNumber: string;
  }>;
}

export default async function DelegationConfirmationPage({ params }: DelegationConfirmationPageProps) {
  const { slug, confirmationNumber } = await params;
  
  console.log('[DelegationConfirmationPage] Loading delegation confirmation:', {
    slug,
    confirmationNumber
  });
  
  const supabase = await createClient();
  
  // Fetch delegation registration using confirmation number view
  const { data: registration, error } = await supabase
    .from('delegation_registration_confirmation_view')
    .select('*')
    .eq('confirmation_number', confirmationNumber)
    .single();
  
  if (error || !registration) {
    console.error('[DelegationConfirmationPage] Delegation registration not found:', error);
    redirect(`/functions/${slug}?error=confirmation_not_found`);
  }
  
  // Verify the function slug matches
  if (registration.function_slug !== slug) {
    console.error('[DelegationConfirmationPage] Function slug mismatch');
    redirect(`/functions/${registration.function_slug}/register/confirmation/delegation/${confirmationNumber}`);
  }
  
  // Verify payment is completed
  if (registration.payment_status !== 'completed' || registration.status !== 'completed') {
    console.error('[DelegationConfirmationPage] Payment not completed');
    redirect(`/functions/${slug}?error=payment_not_completed`);
  }
  
  console.log('[DelegationConfirmationPage] Delegation registration found:', {
    registrationId: registration.registration_id,
    functionId: registration.function_id,
    delegationName: registration.delegation_name,
    delegationLeader: registration.delegation_leader,
    delegateCount: registration.total_delegates,
    ticketCount: registration.total_tickets
  });
  
  // Render the registration wizard at the confirmation step with delegation-specific data
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
        registrationType: 'delegation',
        functionName: registration.function_name,
        eventTitle: registration.event_title,
        eventDate: registration.event_start,
        totalAmount: registration.total_amount,
        // Delegation-specific data
        delegationName: registration.delegation_name,
        delegationLeader: registration.delegation_leader,
        delegationSize: registration.delegation_size,
        // Delegates instead of attendees
        delegates: registration.delegates,
        totalDelegates: registration.total_delegates,
        tickets: registration.tickets,
        // Billing information
        billingName: `${registration.billing_first_name} ${registration.billing_last_name}`,
        billingEmail: registration.billing_email,
        // Delegation leader (customer) information
        customerName: `${registration.customer_first_name} ${registration.customer_last_name}`,
        customerEmail: registration.customer_email,
        customerPhone: registration.customer_phone
      }}
    />
  );
}