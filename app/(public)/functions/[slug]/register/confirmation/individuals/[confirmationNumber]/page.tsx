import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { ConfirmationPage } from '@/components/register/confirmation-page';

interface IndividualConfirmationPageProps {
  params: Promise<{
    slug: string;
    confirmationNumber: string;
  }>;
}

export default async function IndividualConfirmationPage({ params }: IndividualConfirmationPageProps) {
  const { slug, confirmationNumber } = await params;
  
  console.log('[IndividualConfirmationPage] Loading confirmation:', {
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
    console.error('[IndividualConfirmationPage] Registration not found:', error);
    redirect(`/functions/${slug}?error=confirmation_not_found`);
  }
  
  // Verify the function slug matches
  if (registration.function_slug !== slug) {
    console.error('[IndividualConfirmationPage] Function slug mismatch');
    redirect(`/functions/${registration.function_slug}/register/confirmation/individuals/${confirmationNumber}`);
  }
  
  // Verify payment is completed
  if (registration.payment_status !== 'completed' || registration.status !== 'completed') {
    console.error('[IndividualConfirmationPage] Payment not completed');
    redirect(`/functions/${slug}?error=payment_not_completed`);
  }
  
  console.log('[IndividualConfirmationPage] Registration found:', {
    registrationId: registration.registration_id,
    functionId: registration.function_id,
    attendeeCount: registration.total_attendees,
    ticketCount: registration.total_tickets
  });
  
  return <ConfirmationPage confirmationNumber={confirmationNumber} />;
}