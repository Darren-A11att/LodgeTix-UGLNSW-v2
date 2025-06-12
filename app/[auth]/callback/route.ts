import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { userRoleService } from '@/lib/services/user-role-service'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // If there's a specific next URL, use it
      if (next && next !== '/') {
        return NextResponse.redirect(`${origin}${next}`)
      }
      
      // Otherwise, determine the appropriate portal for the user
      const defaultPortal = await userRoleService.getDefaultPortal()
      return NextResponse.redirect(`${origin}${defaultPortal}`)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/error`)
}