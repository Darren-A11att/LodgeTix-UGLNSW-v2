import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/shared/types/database'

export async function createClient() {
  const cookieStore = await cookies()
  
  // Only log in development when specifically debugging auth issues
  const DEBUG_AUTH = process.env.NODE_ENV === 'development' && process.env.DEBUG_AUTH === 'true'
  
  if (DEBUG_AUTH) {
    const allCookies = cookieStore.getAll().map(c => c.name)
    console.log('[createClient] Available cookies:', allCookies)
  }

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const value = cookieStore.get(name)?.value
          // Only log when specifically debugging
          if (DEBUG_AUTH && name.includes('auth-token')) {
            console.log(`[createClient] Getting ${name}:`, value ? 'exists' : 'missing')
          }
          return value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}