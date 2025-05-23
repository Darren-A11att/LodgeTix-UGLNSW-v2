"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { TicketIcon } from "lucide-react";
import { WizardShellLayout } from "@/components/register/RegistrationWizard/Layouts/WizardShellLayout";
import { useRegistrationStore } from '@/lib/registrationStore';

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentStep = useRegistrationStore((state) => state.currentStep);
  const [mounted, setMounted] = useState(false);
  
  // Handle hydration mismatch by only showing step-dependent UI after component mounts
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Only hide footer on mobile for steps after the first one
  const hideFooterOnMobile = mounted && currentStep > 1;

  return (
    <div className="flex flex-col min-h-screen h-screen max-h-screen">
      {/* Full-width App Header - fixed height */}
      <header className="w-full flex-shrink-0 z-10 flex h-14 items-center justify-between border-b bg-white px-4 md:px-6">
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

      {/* Main Content Area - takes remaining height */}
      <main className="flex-1 overflow-hidden">
        <WizardShellLayout>
          {children}
        </WizardShellLayout>
      </main>

      {/* Full-width App Footer - hidden on mobile for steps 2+ */}
      <footer className={`w-full flex-shrink-0 bg-masonic-navy py-4 text-white ${hideFooterOnMobile ? 'hidden sm:block' : ''}`}>
        <div className="container mx-auto px-4 text-center">
          <p>&copy; {new Date().getFullYear()} United Grand Lodge of NSW & ACT. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}