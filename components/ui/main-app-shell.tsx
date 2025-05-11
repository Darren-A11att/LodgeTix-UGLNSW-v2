"use client"

import React from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import NextLink from "next/link"

import { SidebarProvider, useSidebar } from "@/components/ui/sidebar"
import { useIsMobile } from "@/hooks/use-mobile"
import MobileAppLayout from "@/components/ui/mobile-app-layout"
import { Button } from "@/components/ui/button"
import { TicketIcon } from "lucide-react"
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Home, Users, Settings, TicketIcon as AppLogoIcon } from "lucide-react"
import { cn } from "@/lib/utils"

// Corrected DesktopLayout for a public-facing site
function DesktopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
      <header className="sticky top-0 z-40 w-full border-b bg-white dark:border-gray-800 dark:bg-gray-950">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <NextLink href="/" className="flex items-center gap-2 font-semibold">
            <AppLogoIcon className="mr-2 h-6 w-6 text-masonic-navy" />
            <span>LodgeTix</span>
          </NextLink>
          <nav className="hidden items-center gap-6 md:flex">
            <NextLink href="/events" className="text-sm font-medium hover:underline hover:underline-offset-4">Events</NextLink>
            <NextLink href="/about" className="text-sm font-medium hover:underline hover:underline-offset-4">About</NextLink>
            <NextLink href="/contact" className="text-sm font-medium hover:underline hover:underline-offset-4">Contact</NextLink>
            {/* Add Login/Register or My Tickets button if needed */}
            {/* <Button variant="outline" size="sm">Login</Button> */}
          </nav>
          <div className="flex items-center gap-2 md:hidden">
            {/* Placeholder for potential mobile-specific header elements if ever needed in DesktopLayout context */}
            {/* Usually, MobileAppLayout handles all mobile header concerns. */}
          </div>
        </div>
      </header>
      <main className="flex-1">
        {children}
      </main>
      <footer className="border-t bg-gray-100 py-8 dark:border-gray-800 dark:bg-gray-950">
        <div className="container mx-auto px-4 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>&copy; {new Date().getFullYear()} United Grand Lodge of NSW & ACT. All rights reserved.</p>
          <div className="mt-2 space-x-4">
            <NextLink href="/terms" className="hover:underline">Terms</NextLink>
            <NextLink href="/privacy" className="hover:underline">Privacy</NextLink>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default function MainAppShell({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const isMobile = useIsMobile()
  console.log("Current isMobile state:", isMobile);
  const pathname = usePathname()

  let pageSpecificActions: React.ReactNode = null

  if (pathname === "/events/grand-installation") {
    pageSpecificActions = (
      <Button className="w-full bg-masonic-gold text-masonic-navy hover:bg-masonic-lightgold" asChild>
        <Link href="/events/grand-installation/register">
          <TicketIcon className="mr-2 h-4 w-4" /> Get Tickets
        </Link>
      </Button>
    )
  }
  // Add more else if blocks here for other pages needing specific actions

  return (
    <SidebarProvider>
      {isMobile ? (
        <MobileAppLayout pageActions={pageSpecificActions}>
          {children}
        </MobileAppLayout>
      ) : (
        <DesktopLayout>
          {children}
        </DesktopLayout>
      )}
    </SidebarProvider>
  )
} 