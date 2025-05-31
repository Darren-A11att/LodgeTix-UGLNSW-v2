'use client'

import { usePathname } from 'next/navigation'
import { Footer } from './footer'

interface LayoutWithFooterProps {
  children: React.ReactNode
}

export function LayoutWithFooter({ children }: LayoutWithFooterProps) {
  const pathname = usePathname()
  
  // Don't show footer on registration wizard pages
  const isRegistrationWizard = pathname.includes('/register/')
  
  // Extract event slug from pathname if available
  const eventSlugMatch = pathname.match(/\/events\/([^\/]+)/)
  const eventSlug = eventSlugMatch ? eventSlugMatch[1] : undefined
  
  return (
    <>
      {children}
      {!isRegistrationWizard && <Footer eventSlug={eventSlug} />}
    </>
  )
}