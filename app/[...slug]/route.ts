import { NextResponse } from 'next/server'

// Catch-all route handler for invalid paths
export async function GET(request: Request) {
  const url = new URL(request.url)
  
  // Check if this is a Supabase auth callback with access token
  if (url.pathname === '/*' || (url.hash && url.hash.includes('access_token'))) {
    // Redirect to the auth reset password page
    return NextResponse.redirect(new URL('/auth/reset-password', request.url))
  }
  
  // For all other invalid paths, return 404
  return new NextResponse('Not Found', { status: 404 })
}