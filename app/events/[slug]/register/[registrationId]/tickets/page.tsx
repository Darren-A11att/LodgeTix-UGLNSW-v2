import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation'
import { TicketsPageClient } from "./client-page"

interface TicketsPageProps {
  params: Promise<{
    slug: string
    registrationId: string
  }>
}

export default async function TicketsPage({ params }: TicketsPageProps) {
  const { slug, registrationId } = await params
  const supabase = await createClient();
  
  // Verify the registration exists and get function details
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
    .single();

  if (regError || !registration) {
    console.error('Registration not found:', regError);
    redirect('/events');
  }

  // Verify user has access to this registration (simplified check for now)
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user || user.id !== registration.contact_id) {
    console.error('User not authorized for registration:', authError);
    redirect('/login');
  }

  // Check if registration is completed
  if (registration.status === 'completed' || registration.status === 'paid') {
    redirect(`/registrations/${registrationId}`);
  }
  
  return (
    <TicketsPageClient 
      functionId={registration.function_id}
      functionSlug={registration.functions.slug}
      registrationId={registrationId}
    />
  )
}