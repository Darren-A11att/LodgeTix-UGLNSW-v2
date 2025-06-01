import { redirect } from 'next/navigation'
import { createServerFunctionService } from '@/lib/services/function-service-server'
import { TicketsPageClient } from "./client-page"

interface TicketsPageProps {
  params: Promise<{
    functionSlug: string
    registrationId: string
  }>
}

export default async function TicketsPage({ params }: TicketsPageProps) {
  const { functionSlug, registrationId } = await params
  
  // Fetch function data on the server
  const functionService = await createServerFunctionService()
  const functionData = await functionService.getFunctionBySlug(functionSlug)
  
  if (!functionData) {
    redirect('/functions')
  }
  
  return (
    <TicketsPageClient 
      functionId={functionData.function_id}
      functionSlug={functionSlug}
      registrationId={registrationId}
    />
  )
}