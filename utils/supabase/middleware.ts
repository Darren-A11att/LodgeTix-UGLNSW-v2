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

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

  // This will refresh the session if it's expired
  // Wrap in try-catch to handle refresh token errors gracefully
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

  console.log(`[updateSession] Completed for ${request.url}`)
  return response
}