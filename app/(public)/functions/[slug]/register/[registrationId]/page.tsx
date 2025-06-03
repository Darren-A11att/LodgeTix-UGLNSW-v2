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
  const supabase = await createClient();
  
  // First check if this is an existing registration
  const { data: registration, error: regError } = await supabase
    .from('registrations')
    .select(`
      registration_id,
      function_id,
      contact_id,
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
      contact_id: null,
      status: 'draft' as const,
      functions: {
        function_id: functionData.function_id,
        slug: functionData.slug,
        name: functionData.name,
        is_published: functionData.is_published
      }
    };

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
  // Lodge registrations may use anonymous auth, so we need to check the contact's auth_user_id
  if (registration.contact_id) {
    const { data: contact } = await supabase
      .from('contacts')
      .select('auth_user_id')
      .eq('contact_id', registration.contact_id)
      .single();
    
    // Only enforce auth check if the contact has an auth_user_id
    if (contact?.auth_user_id && (!user || user.id !== contact.auth_user_id)) {
      console.error('User not authorized for registration');
      redirect('/login');
    }
  }

  // Check if registration is completed - but allow showing confirmation if requested
  if (!showConfirmation && (registration.status === 'completed' || registration.status === 'paid')) {
    redirect(`/registrations/${registrationId}`);
  }
  
  // For confirmed registrations with showConfirmation flag, show the wizard at step 6
  const isShowingConfirmation = showConfirmation && (registration.status === 'confirmed' || registration.status === 'completed');

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