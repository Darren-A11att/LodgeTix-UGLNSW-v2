import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { ClientConfirmationPage } from '@/components/register/confirmation/client-confirmation-page';

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
  
  // Try to fetch registration using confirmation number view
  let registration = null;
  let error = null;
  
  try {
    const { data, error: fetchError } = await supabase
      .from('individuals_registration_confirmation_view')
      .select('*')
      .eq('confirmation_number', confirmationNumber)
      .single();
    
    registration = data;
    error = fetchError;
  } catch (e) {
    console.error('[IndividualConfirmationPage] Error fetching registration:', e);
    error = e;
  }
  
  // If we have an error or no registration, we'll let the client component handle it with localStorage
  if (error || !registration) {
    console.log('[IndividualConfirmationPage] No registration found in database, falling back to localStorage');
  } else {
    // Verify the function slug matches
    if (registration.function_slug !== slug) {
      console.error('[IndividualConfirmationPage] Function slug mismatch');
      redirect(`/functions/${registration.function_slug}/register/confirmation/individuals/${confirmationNumber}`);
    }
    
    // Log what we found
    console.log('[IndividualConfirmationPage] Registration found:', {
      registrationId: registration.registration_id,
      functionId: registration.function_id,
      attendeeCount: registration.total_attendees,
      ticketCount: registration.total_tickets
    });
  }

  // Render the client component which will try localStorage if no data
  return <ClientConfirmationPage confirmationNumber={confirmationNumber} fallbackData={registration} />;
}