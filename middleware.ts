import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  const url = new URL(request.url)
  
  // Only log API routes to reduce noise
  if (url.pathname.startsWith('/api')) {
    console.log(`[Middleware] Processing API route: ${request.method} ${url.pathname}`)
  }
  
  // Handle Supabase auth callback - the /* path is invalid
  if (url.pathname === '/*' && url.hash.includes('access_token')) {
    // Redirect to the auth reset password page
    return NextResponse.redirect(new URL('/auth/reset-password', request.url))
  }
  
  // Skip middleware for auth pages to avoid redirect loops
  if (url.pathname.startsWith('/auth/')) {
    return NextResponse.next()
  }
  
  // Update the session for all requests
  // This will refresh tokens if needed and ensure cookies are set properly
  const response = await updateSession(request)
  
  return response
}

// Apply middleware to all routes including API routes
export const config = {
  matcher: [
    /*
     * Match all request paths except static assets
     * This includes:
     * - All pages (/)
     * - All API routes (/api/*)
     * Excludes:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - image files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}