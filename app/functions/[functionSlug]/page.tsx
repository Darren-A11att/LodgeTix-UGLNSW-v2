import { createServerFunctionService } from '@/lib/services/function-service-server'
import { FunctionDetails } from '@/components/function-details'

export default async function FunctionPage({ 
  params 
}: { 
  params: Promise<{ functionSlug: string }>
}) {
  const { functionSlug } = await params
  const functionService = await createServerFunctionService()
  const fn = await functionService.getFunctionBySlug(functionSlug)
  
  return <FunctionDetails function={fn} />
}