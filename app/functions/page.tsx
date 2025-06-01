import { createServerFunctionService } from '@/lib/services/function-service-server'
import { FunctionCard } from '@/components/function-card'

export default async function FunctionsPage() {
  const functionService = await createServerFunctionService()
  const functions = await functionService.getAllFunctions()
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold mb-8">All Functions</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {functions.map(fn => (
          <FunctionCard key={fn.id} function={fn} />
        ))}
      </div>
    </div>
  )
}