/**
 * @deprecated The createAdminClient function has been removed for security reasons.
 * 
 * Use createServerClient() from '@/utils/supabase/server' instead, which respects Row Level Security (RLS).
 * 
 * For server-side operations:
 * 1. Use createServerClient() from '@/utils/supabase/server'
 * 2. Ensure your RLS policies are properly configured
 * 3. Use the authenticated user's context for all operations
 * 
 * If you need to perform operations as a specific user:
 * - Use Supabase's auth.admin API with proper authentication
 * - Never bypass RLS in production code
 * 
 * Migration guide:
 * Before: const supabase = createAdminClient()
 * After:  const supabase = createServerClient()
 */
export function createAdminClient() {
  throw new Error(
    'createAdminClient() has been removed for security reasons. ' +
    'Please use createServerClient() from @/utils/supabase/server instead. ' +
    'If you need to perform admin operations, ensure proper authentication and RLS policies are in place.'
  )
}