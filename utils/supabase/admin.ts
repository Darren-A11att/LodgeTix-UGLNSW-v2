import { createClient } from '@supabase/supabase-js'
import { Database } from '@/supabase/supabase'

/**
 * Creates a Supabase client that bypasses Row Level Security.
 * ⚠️ WARNING: This should only be used for server-side operations where you've already
 * verified the user's permissions. Never expose this to the client side.
 * 
 * This is a temporary solution until proper RLS policies are configured.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  
  return createClient<Database>(
    supabaseUrl,
    supabaseServiceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    }
  )
}