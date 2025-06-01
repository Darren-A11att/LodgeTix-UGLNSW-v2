import { createClient } from '@/utils/supabase/server'
import { FunctionService } from './function-service'

/**
 * Server-side FunctionService factory
 * Use this in Server Components only
 */
export async function createServerFunctionService() {
  const client = await createClient()
  return new FunctionService(client)
}