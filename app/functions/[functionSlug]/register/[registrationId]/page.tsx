import { redirect } from 'next/navigation'

interface RegistrationPageProps {
  params: Promise<{
    functionSlug: string
    registrationId: string
  }>
}

export default async function RegistrationPage({ params }: RegistrationPageProps) {
  const { functionSlug, registrationId } = await params
  
  // Redirect to the tickets page
  redirect(`/functions/${functionSlug}/register/${registrationId}/tickets`)
}