import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  const url = new URL(request.url)
  console.log(`[updateSession] ${request.method} ${url.pathname}`)
  
  const authCookies = request.cookies.getAll().filter(c => 
    c.name.includes('auth-token') || c.name.includes('refresh-token')
  )
  console.log(`[updateSession] Auth cookies present:`, authCookies.length > 0)
  
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Check for required environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[updateSession] Missing Supabase environment variables:', {
      url: !!supabaseUrl,
      key: !!supabaseAnonKey
    })
    
    // Return response without Supabase operations to prevent complete failure
    // This allows the app to work without auth functionality
    return response
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          const value = request.cookies.get(name)?.value
          return value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Only perform auth checks for protected routes or when auth cookies are present
  const isProtectedRoute = url.pathname.startsWith('/organiser') || 
                          url.pathname.startsWith('/account') ||
                          url.pathname.startsWith('/registrations')
  
  const hasAuthCookies = authCookies.length > 0
  
  // Only check authentication for protected routes or when auth cookies exist
  if (isProtectedRoute || hasAuthCookies) {
    try {
      console.log(`[updateSession] Calling getUser()...`)
      const { data: { user }, error } = await supabase.auth.getUser()
      console.log(`[updateSession] getUser result:`, { user: user?.id, error: error?.message })
    } catch (error) {
      console.error(`[updateSession] getUser error:`, error)
      // If refresh token is invalid, clear the cookies and continue
      // This prevents console errors for expired/invalid tokens
      if (error && typeof error === 'object' && 'code' in error) {
        if (error.code === 'refresh_token_not_found' || error.code === 'invalid_refresh_token') {
          console.log(`[updateSession] Clearing invalid auth cookies`)
          // Clear auth cookies to force re-authentication
          response.cookies.delete('sb-auth-token')
          response.cookies.delete('sb-refresh-token')
        }
      }
    }
  } else {
    console.log(`[updateSession] Skipping auth check for public route: ${url.pathname}`)
  }

  console.log(`[updateSession] Completed for ${request.url}`)
  return response
}