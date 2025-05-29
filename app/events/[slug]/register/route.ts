import { NextResponse } from 'next/server'
import { generateUUID } from '@/lib/uuid-slug-utils'

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  // Generate a new registration ID
  const registrationId = generateUUID()
  
  // Redirect to the registration wizard page with the new registration ID
  return NextResponse.redirect(
    new URL(`/events/${params.slug}/register/${registrationId}/tickets`, request.url)
  )
}