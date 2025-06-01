import { createClient } from '@supabase/supabase-js'
import { Database } from '@/shared/types/database'

/**
 * Create a Supabase client using a bearer token from the Authorization header
 * This is useful when cookies aren't being properly forwarded
 */
export async function createClientWithToken(bearerToken: string | null) {
  if (!bearerToken) {
    throw new Error('No authorization token provided')
  }

  // Remove 'Bearer ' prefix if present
  const token = bearerToken.replace('Bearer ', '')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  // Create a client with the specific access token
  const supabase = createClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      },
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    }
  )

  // Verify the token is valid by getting the user
  const { data: { user }, error } = await supabase.auth.getUser(token)
  
  if (error || !user) {
    throw new Error('Invalid authorization token')
  }

  return { supabase, user }
}