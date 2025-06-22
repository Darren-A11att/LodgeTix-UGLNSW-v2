'use client'

import Link from 'next/link'

export function MainNav() {
  return (
    <nav className="flex items-center space-x-6">
      <Link 
        href="/" 
        className="text-sm font-medium hover:underline hover:underline-offset-4"
      >
        Home
      </Link>
      <Link 
        href="/functions" 
        className="text-sm font-medium hover:underline hover:underline-offset-4"
      >
        Functions
      </Link>
      <Link 
        href="/business" 
        className="text-sm font-medium hover:underline hover:underline-offset-4"
      >
        Software
      </Link>
      <Link 
        href="/business/about" 
        className="text-sm font-medium hover:underline hover:underline-offset-4"
      >
        About
      </Link>
      <Link 
        href="/business/about/contact" 
        className="text-sm font-medium hover:underline hover:underline-offset-4"
      >
        Contact
      </Link>
    </nav>
  )
}