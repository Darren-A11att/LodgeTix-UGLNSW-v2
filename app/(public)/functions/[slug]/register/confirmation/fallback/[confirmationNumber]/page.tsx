import { ConfirmationFallback } from '@/components/register/RegistrationWizard/confirmation-fallback';

interface PageProps {
  params: Promise<{
    slug: string;
    confirmationNumber: string;
  }>;
}

export default async function FallbackConfirmationPage({ params }: PageProps) {
  const { confirmationNumber } = await params;

  return (
    <ConfirmationFallback 
      confirmationNumber={confirmationNumber}
      registrationType="individual" // Default, can be enhanced with localStorage data
    />
  );
}