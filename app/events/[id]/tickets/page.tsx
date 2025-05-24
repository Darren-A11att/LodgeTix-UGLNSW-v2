"use client"

import React from 'react'
import Link from 'next/link'
import { TicketIcon } from "lucide-react"
import { WizardShellLayout } from "@/components/register/RegistrationWizard/Layouts/WizardShellLayout"
import { RegistrationWizard } from "@/components/register/RegistrationWizard/registration-wizard"
import { getEventById } from "@/lib/event-facade"
import { useRegistrationStore } from '@/lib/registrationStore'
import ClientOnly from '@/components/register/RegistrationWizard/utils/ClientOnly'

function RegistrationLayout({ eventId, eventSlug }: { eventId: string, eventSlug: string }) {
  const currentStep = useRegistrationStore((state) => state.currentStep)
  const [mounted, setMounted] = React.useState(false)
  const [slug, setSlug] = React.useState(eventSlug)
  
  // Handle hydration mismatch and fetch event data
  React.useEffect(() => {
    setMounted(true)
    
    // Fetch event data for the Back to Event link
    async function fetchEventData() {
      try {
        const event = await getEventById(eventId)
        if (event?.slug) {
          setSlug(event.slug)
        }
      } catch (error) {
        console.error("Failed to fetch event data:", error)
      }
    }
    
    fetchEventData()
  }, [eventId])
  
  // Only hide footer on mobile for steps after the first one
  const hideFooterOnMobile = mounted && currentStep > 1
  
  return (
    <div className="flex flex-col min-h-screen h-screen max-h-screen">
      {/* Full-width App Header - fixed height */}
      <header className="w-full flex-shrink-0 z-10 flex h-14 items-center justify-between border-b bg-white px-4 md:px-6">
        <Link href="/" className="flex items-center">
          <TicketIcon className="mr-2 h-5 w-5 text-masonic-navy" />
          <span className="font-bold">LodgeTix</span>
        </Link>
        <div className="flex items-center">
          <Link href={`/events/${slug}`} className="text-sm text-masonic-navy hover:underline">
            Back to Event
          </Link>
        </div>
      </header>

      {/* Main Content Area - takes remaining height */}
      <main className="flex-1 overflow-hidden">
        <ClientOnly
          fallback={
            <div className="w-full py-8 text-center animate-pulse">
              <div className="h-8 bg-slate-200 rounded w-1/3 mx-auto mb-4"></div>
              <div className="h-4 bg-slate-200 rounded w-1/2 mx-auto mb-3"></div>
              <div className="h-4 bg-slate-200 rounded w-2/3 mx-auto mb-3"></div>
              <div className="h-10 bg-slate-200 rounded w-1/4 mx-auto mt-6"></div>
            </div>
          }
        >
          <WizardShellLayout>
            <RegistrationWizard eventId={eventId} />
          </WizardShellLayout>
        </ClientOnly>
      </main>

      {/* Full-width App Footer - hidden on mobile for steps 2+ */}
      <footer className={`w-full flex-shrink-0 bg-masonic-navy py-4 text-white ${hideFooterOnMobile ? 'hidden sm:block' : ''}`}>
        <div className="container mx-auto px-4 text-center">
          <p>&copy; {new Date().getFullYear()} United Grand Lodge of NSW & ACT. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

// Since we've added 'use client', we need a different approach
// We'll fetch data on the client side for now
export default function TicketsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params)
  const id = resolvedParams.id
  
  // For now, we'll just pass the ID and handle navigation in the component
  // A full solution would involve setting up a special API route for server data
  return <RegistrationLayout eventId={id} eventSlug={id} />
}