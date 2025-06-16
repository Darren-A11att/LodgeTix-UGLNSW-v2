"use client"

import React from 'react'
import Link from 'next/link'
import { TicketIcon } from "lucide-react"
import { WizardShellLayout } from "@/components/register/RegistrationWizard/Layouts/WizardShellLayout"
import { useParams } from 'next/navigation'
import { useRegistrationStore } from '@/lib/registrationStore'
import { useFunctionOrganiser } from '@/hooks/useFunctionOrganiser'

export default function RegistrationLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const slug = params.slug as string
  const currentStep = useRegistrationStore((state) => state.currentStep)
  const { organiserName } = useFunctionOrganiser(slug)
  
  // Only hide footer on mobile for steps after the first one
  const hideFooterOnMobile = currentStep > 1
  
  return (
    <div className="flex flex-col min-h-screen h-screen max-h-screen">
      {/* Full-width App Header - fixed height */}
      <header className="w-full flex-shrink-0 z-10 flex h-14 items-center justify-between border-b bg-white px-4 md:px-6">
        <Link href="/" className="flex items-center">
          <TicketIcon className="mr-2 h-5 w-5 text-masonic-navy" />
          <span className="font-bold">LodgeTix</span>
        </Link>
        <div className="flex items-center">
          <Link href={`/functions/${slug}`} className="text-sm text-masonic-navy hover:underline">
            Back to Event
          </Link>
        </div>
      </header>

      {/* Main Content Area - takes remaining height */}
      <main className="flex-1 overflow-y-auto">
        <div className="w-full sm:container sm:mx-auto sm:max-w-6xl px-0 sm:px-4 md:py-5 flex flex-col h-full">
          <main className="flex-1 py-2 sm:py-4">
            <WizardShellLayout className="h-full">
              {children}
            </WizardShellLayout>
          </main>
        </div>
      </main>

      {/* Full-width App Footer - hidden on mobile for steps 2+ */}
      <footer className={`w-full flex-shrink-0 bg-masonic-navy py-4 text-white ${
        hideFooterOnMobile ? 'hidden sm:block' : ''
      }`}>
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm mb-2">Need help? Use the Instant Message Bubble, Email: support@lodgetix.io or Phone: 0438871124</p>
          <p>&copy; {new Date().getFullYear()} LodgeTix as agent for {organiserName}</p>
        </div>
      </footer>
    </div>
  )
}