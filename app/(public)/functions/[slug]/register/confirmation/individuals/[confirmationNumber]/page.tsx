import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { RegistrationWizard } from '@/components/register/RegistrationWizard/registration-wizard';

interface ConfirmationPageProps {
  params: Promise<{
    slug: string;
    confirmationNumber: string;
  }>;
}

export default async function ConfirmationPage({ params }: ConfirmationPageProps) {
  const { slug, confirmationNumber } = await params;
  
  console.log('[ConfirmationPage] Loading confirmation:', {
    slug,
    confirmationNumber
  });
  
  const supabase = await createClient();
  
  // Fetch registration using confirmation number view
  const { data: registration, error } = await supabase
    .from('individuals_registration_confirmation_view')
    .select('*')
    .eq('confirmation_number', confirmationNumber)
    .single();
  
  if (error || !registration) {
    console.error('[ConfirmationPage] Registration not found:', error);
    redirect(`/functions/${slug}?error=confirmation_not_found`);
  }
  
  // Verify the function slug matches
  if (registration.function_slug !== slug) {
    console.error('[ConfirmationPage] Function slug mismatch');
    redirect(`/functions/${registration.function_slug}/register/confirmation/${confirmationNumber}`);
  }
  
  // Verify payment is completed
  if (registration.payment_status !== 'completed' || registration.status !== 'completed') {
    console.error('[ConfirmationPage] Payment not completed');
    redirect(`/functions/${slug}?error=payment_not_completed`);
  }
  
  console.log('[ConfirmationPage] Registration found:', {
    registrationId: registration.registration_id,
    functionId: registration.function_id,
    attendeeCount: registration.total_attendees,
    ticketCount: registration.total_tickets
  });
  
  // Render the registration wizard at the confirmation step
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
        functionName: registration.function_name,
        eventTitle: registration.event_title,
        eventDate: registration.event_start,
        totalAmount: registration.total_amount,
        attendees: registration.attendees,
        tickets: registration.tickets,
        billingName: `${registration.billing_first_name} ${registration.billing_last_name}`,
        billingEmail: registration.billing_email,
        customerName: `${registration.customer_first_name} ${registration.customer_last_name}`,
        customerEmail: registration.customer_email
      }}
    />
  );
}