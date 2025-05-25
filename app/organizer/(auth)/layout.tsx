import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { OrganizerLayout } from '../components/layout/OrganizerLayout'

interface OrganizerData {
  organizer_id: string
  organization_name: string
  organization_slug: string
  contact_email: string
  stripe_account_id: string | null
  stripe_charges_enabled: boolean
  user_role: string
  user_name: string
  user_email: string
}

async function getOrganizerData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/organizer/login')
  }
  
  // Use RPC function to get organizer data with authentication check
  const { data: organizerData, error } = await supabase
    .rpc('get_organizer_by_user_id', { user_uuid: user.id })
    .single()
  
  if (error || !organizerData) {
    console.error('Organizer auth error:', error)
    redirect('/organizer/no-organization')
  }
  
  const orgData = organizerData as OrganizerData
  
  return {
    id: user.id,
    email: orgData.user_email,
    name: orgData.user_name,
    organizerId: orgData.organizer_id,
    organizationName: orgData.organization_name,
    organizationSlug: orgData.organization_slug,
    role: orgData.user_role,
    stripeConnected: orgData.stripe_charges_enabled || false
  }
}

async function getRecentEvents(organizerId: string) {
  const supabase = await createClient()
  
  // Get recent events for this organizer
  const { data: events, error } = await supabase
    .rpc('get_organizer_events_with_counts', { org_id: organizerId })
  
  if (error || !events) {
    console.error('Error fetching recent events:', error)
    return []
  }
  
  // Return the 3 most recent events, prioritizing upcoming events
  return events
    .slice(0, 3)
    .map((event: any) => ({
      id: event.event_id,
      name: event.title,
      slug: event.slug,
      initial: event.title.split(' ').map((w: string) => w[0]).join('').substring(0, 2).toUpperCase()
    }))
}

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const organizerData = await getOrganizerData()
  const recentEvents = await getRecentEvents(organizerData.organizerId)
  
  return (
    <OrganizerLayout 
      user={{
        name: organizerData.name,
        email: organizerData.email,
        stripeConnected: organizerData.stripeConnected
      }} 
      recentFunctions={recentEvents}
    >
      {children}
    </OrganizerLayout>
  )
}