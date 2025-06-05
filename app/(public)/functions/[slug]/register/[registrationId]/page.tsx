import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { RegistrationWizard } from '@/components/register/RegistrationWizard/registration-wizard';

interface RegistrationWizardPageProps {
  params: Promise<{
    slug: string;
    registrationId: string;
  }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function RegistrationWizardPage({ params, searchParams }: RegistrationWizardPageProps) {
  const { slug, registrationId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const showConfirmation = resolvedSearchParams.showConfirmation === 'true';
  
  console.log('[RegistrationPage] Page loaded:', {
    slug,
    registrationId,
    showConfirmation,
    searchParams: resolvedSearchParams
  });
  
  const supabase = await createClient();
  
  // First check if this is an existing registration
  const { data: registration, error: regError } = await supabase
    .from('registrations')
    .select(`
      registration_id,
      function_id,
      customer_id,
      status,
      functions!inner (
        function_id,
        slug,
        name,
        is_published
      )
    `)
    .eq('registration_id', registrationId)
    .eq('functions.slug', slug)
    .eq('functions.is_published', true)
    .single();

  // If registration doesn't exist, this might be a new registration
  // Verify the function exists for new registrations
  if (regError || !registration) {
    console.log('[RegistrationPage] Registration not found:', {
      registrationId,
      slug,
      error: regError,
      showConfirmation
    });
    const { data: functionData, error: functionError } = await supabase
      .from('functions')
      .select('function_id, slug, name, is_published')
      .eq('slug', slug)
      .eq('is_published', true)
      .single();

    if (functionError || !functionData) {
      console.error('Function not found:', functionError);
      redirect('/functions');
    }

    // For new registrations, create a mock registration object for the wizard
    const mockRegistration = {
      registration_id: registrationId,
      function_id: functionData.function_id,
      customer_id: null,
      status: 'draft' as const,
      functions: {
        function_id: functionData.function_id,
        slug: functionData.slug,
        name: functionData.name,
        is_published: functionData.is_published
      }
    };

    // If showConfirmation is true but registration doesn't exist, this is an error
    if (showConfirmation) {
      console.error('[RegistrationPage] Registration not found for confirmation:', {
        registrationId,
        slug,
        error: regError?.message || 'Registration not found',
        hint: 'This might be a draftId instead of actual registrationId'
      });
      // Show error page or redirect
      redirect(`/functions/${slug}?error=registration_not_found`);
    }

    return (
      <RegistrationWizard 
        functionSlug={functionData.slug}
        functionId={functionData.function_id}
        registrationId={registrationId}
        isNewRegistration={true}
      />
    );
  }

  // For anonymous registrations, no auth check needed
  // The registration wizard will handle contact creation and auth as needed
  const { data: { user } } = await supabase.auth.getUser();
  
  // For existing registrations, check if the user has access
  // Lodge registrations may use anonymous auth, so we need to check the customer's auth_user_id
  if (registration.customer_id) {
    const { data: customer } = await supabase
      .from('customers')
      .select('auth_user_id')
      .eq('customer_id', registration.customer_id)
      .single();
    
    // Only enforce auth check if the customer has an auth_user_id
    if (customer?.auth_user_id && (!user || user.id !== customer.auth_user_id)) {
      console.error('User not authorized for registration');
      redirect('/login');
    }
  }

  // Check if registration is completed - but allow showing confirmation if requested
  if (!showConfirmation && (registration.status === 'completed' || registration.status === 'paid' || registration.status === 'confirmed')) {
    redirect(`/registrations/${registrationId}`);
  }
  
  // For confirmed registrations with showConfirmation flag, show the wizard at step 6
  // Include all possible statuses that indicate a completed payment
  const isShowingConfirmation = showConfirmation && (
    registration.status === 'confirmed' || 
    registration.status === 'completed' || 
    registration.status === 'paid'
  );

  return (
    <RegistrationWizard 
      functionSlug={registration.functions.slug}
      functionId={registration.function_id}
      registrationId={registrationId}
      isNewRegistration={false}
      initialStep={isShowingConfirmation ? 6 : undefined}
    />
  );
}