import { notFound } from "next/navigation"
import { resolveFunctionSlug } from "@/lib/utils/function-slug-resolver"
import { createServerFunctionService } from "@/lib/services/function-service-server"
import { FunctionDetails } from "@/components/function-details"

// Mark as dynamic since it uses server-side authentication
export const dynamic = 'force-dynamic'

export default async function FunctionPage({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}) {
  const { slug } = await params
  
  try {
    // Resolve slug to function ID
    const functionId = await resolveFunctionSlug(slug, true);
    
    if (!functionId) {
      return notFound();
    }
    
    // Initialize function service with server-side client
    const functionService = await createServerFunctionService();
    
    // Fetch the function details
    const functionData = await functionService.getFunctionById(functionId);
    
    if (!functionData) {
      return notFound();
    }
    
    // Render the FunctionDetails component
    return <FunctionDetails function={functionData} />
  } catch (error) {
    console.error('Failed to load function details:', error);
    return notFound();
  }
}