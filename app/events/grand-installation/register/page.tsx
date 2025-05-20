"use client"

import { RegistrationWizard } from "../../../../components/register/RegistrationWizard/registration-wizard"
import Link from "next/link"
import { TicketIcon } from "lucide-react"

export default function RegistrationPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-white px-4 md:px-6">
        <Link href="/" className="flex items-center">
          <TicketIcon className="mr-2 h-5 w-5 text-masonic-navy" />
          <span className="font-bold">LodgeTix</span>
        </Link>
        <div className="flex items-center">
          <Link href="/events/grand-installation" className="text-sm text-masonic-navy hover:underline">
            Back to Event
          </Link>
        </div>
      </header>

      <main className="container mx-auto py-8 flex-grow">
        <RegistrationWizard />
      </main>

      <footer className="bg-masonic-navy py-6 text-white">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; {new Date().getFullYear()} United Grand Lodge of NSW & ACT. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
