'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MasonicLogo } from '@/components/masonic-logo';
import { ArrowLeft } from 'lucide-react';

export function BusinessHeader() {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" size="sm" className="text-gray-600 hover:text-masonic-navy">
              <Link href="/" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Events
              </Link>
            </Button>
            <Link href="/business" className="flex items-center gap-2">
              <MasonicLogo size="sm" />
              <span className="text-lg font-semibold text-masonic-navy">
                LodgeTix <span className="text-masonic-gold">Business</span>
              </span>
            </Link>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/business" className="text-sm font-medium text-gray-700 hover:text-masonic-navy">
              Home
            </Link>
            <Link href="/business/product" className="text-sm font-medium text-gray-700 hover:text-masonic-navy">
              Features
            </Link>
            <Link href="/business/solutions" className="text-sm font-medium text-gray-700 hover:text-masonic-navy">
              Solutions
            </Link>
            <Link href="/business/pricing" className="text-sm font-medium text-gray-700 hover:text-masonic-navy">
              Pricing
            </Link>
            <Link href="/business/about" className="text-sm font-medium text-gray-700 hover:text-masonic-navy">
              About
            </Link>
            <Button asChild variant="outline" className="border-masonic-gold text-masonic-gold hover:bg-masonic-gold hover:text-white">
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild className="bg-masonic-navy hover:bg-masonic-blue text-white">
              <Link href="/register">Start Free Trial</Link>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}