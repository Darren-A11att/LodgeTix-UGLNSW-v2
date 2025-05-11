"use client"

import * as React from "react"
import Link from "next/link"
import { Menu, TicketIcon } from "lucide-react"
import { useSidebar } from "@/components/ui/sidebar" // Assuming useSidebar is exported and usable
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface MobileAppLayoutProps {
  children: React.ReactNode
  pageActions?: React.ReactNode
  className?: string
}

export function MobileAppLayout({
  children,
  pageActions,
  className,
}: MobileAppLayoutProps) {
  const { toggleSidebar, openMobile, setOpenMobile } = useSidebar()

  // On mobile, the sidebar is usually a sheet. The toggleSidebar might handle both,
  // but explicitly using setOpenMobile might be clearer if toggleSidebar is for desktop collapse/expand.
  // Let's assume toggleSidebar is smart enough or use setOpenMobile directly.
  const handleMenuToggle = () => {
    // If useSidebar().isMobile is available and true, then useSidebar().setOpenMobile(!useSidebar().openMobile)
    // For now, we'll use toggleSidebar, assuming it correctly opens the mobile sheet.
    // The sidebar.tsx uses isMobile internally to show a Sheet.
    // toggleSidebar calls setOpenMobile((open) => !open) when isMobile is true.
    toggleSidebar()
  }

  return (
    <div className={cn("flex flex-col h-screen bg-gray-100", className)}>
      {/* Header */}
      <header className="flex h-14 flex-shrink-0 items-center justify-between border-b bg-white px-4 shadow-sm">
        <Link href="/" className="flex items-center">
          <TicketIcon className="mr-2 h-5 w-5 text-masonic-navy" />
          <span className="font-bold text-masonic-navy">LodgeTix</span>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleMenuToggle}
          aria-label="Toggle navigation menu"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </header>

      {/* Scrollable Body Content */}
      <main className="flex-grow overflow-y-auto p-4">
        {children}
      </main>

      {/* Fixed Footer for Page-Specific Actions */}
      {pageActions && (
        <footer className="flex-shrink-0 border-t bg-white p-3 shadow-md">
          <div className="flex items-center justify-center gap-2">
            {pageActions}
          </div>
        </footer>
      )}
    </div>
  )
}

// Export as default or named, depending on convention. Let's use named.
export default MobileAppLayout; 