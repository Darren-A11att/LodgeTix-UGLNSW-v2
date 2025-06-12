import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { userRoleService } from '@/lib/services/user-role-service'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
    
    // Determine the appropriate portal for the user
    const defaultPortal = await userRoleService.getDefaultPortal()
    return NextResponse.redirect(`${origin}${defaultPortal}`)
  }

  // Fallback redirect
  return NextResponse.redirect(`${origin}/portal`)
}