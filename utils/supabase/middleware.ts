import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
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
          return request.cookies.get(name)?.value
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
    await supabase.auth.getUser()
  } catch (error) {
    // If refresh token is invalid, clear the cookies and continue
    // This prevents console errors for expired/invalid tokens
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 'refresh_token_not_found' || error.code === 'invalid_refresh_token') {
        // Clear auth cookies to force re-authentication
        response.cookies.delete('sb-auth-token')
        response.cookies.delete('sb-refresh-token')
      }
    }
  }

  return response
}