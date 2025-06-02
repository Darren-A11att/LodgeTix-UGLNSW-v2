'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { TicketIcon } from 'lucide-react'
import { Footer } from './footer'
import { MainNav } from '../navigation/main-nav'

interface LayoutWithFooterProps {
  children: React.ReactNode
}

export function LayoutWithFooter({ children }: LayoutWithFooterProps) {
  const pathname = usePathname()
  
  // Check if we're on specific page types
  const isHomepage = pathname === '/'
  const isRegistrationWizard = pathname.includes('/register/')
  
  // Extract event slug from pathname if available
  const eventSlugMatch = pathname.match(/\/events\/([^\/]+)/)
  const eventSlug = eventSlugMatch ? eventSlugMatch[1] : undefined
  
  // For non-homepage pages that aren't registration wizard, show header and footer
  const shouldShowHeader = !isHomepage && !isRegistrationWizard
  const shouldShowFooter = !isRegistrationWizard
  
  return (
    <>
      {shouldShowHeader && (
        <header className="w-full flex-shrink-0 z-10 flex h-14 items-center justify-between border-b bg-white px-4 md:px-6">
          <Link href="/" className="flex items-center">
            <TicketIcon className="mr-2 h-5 w-5 text-masonic-navy" />
            <span className="font-bold">LodgeTix</span>
          </Link>
          <div className="flex items-center space-x-6">
            <MainNav />
          </div>
        </header>
      )}
      {children}
      {shouldShowFooter && <Footer eventSlug={eventSlug} />}
    </>
  )
}