import { type CookieOptions, createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
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
          // This is required for the cookie to work in an iframe
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
            maxAge: 0,
          })
        },
      },
    }
  )

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Routes that require authentication
  const authRequiredRoutes = [
    '/organizer/dashboard',
    '/account/tickets',
  ]

  // Check if we're on a protected route and redirect if not authenticated
  const isAuthRoute = authRequiredRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )

  if (isAuthRoute && !session) {
    // Redirect to login if accessing protected route without session
    const redirectUrl = new URL('/organizer/login', request.url)
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Prevent authenticated users from accessing login/signup pages
  const isLoginPage = request.nextUrl.pathname === '/organizer/login' || 
                      request.nextUrl.pathname === '/organizer/signup'
  
  if (isLoginPage && session) {
    // Redirect to dashboard if already logged in
    return NextResponse.redirect(new URL('/organizer/dashboard', request.url))
  }

  return response
}

// Apply middleware to specific routes only
export const config = {
  matcher: [
    '/organizer/:path*',
    '/account/:path*',
  ],
}