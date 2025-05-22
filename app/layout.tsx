import type { Metadata } from 'next'
import React from 'react'
import Script from 'next/script'
import '@/styles/globals.css'
import './disableFastRefreshLogs'
import { LocationInitializer } from '@/components/location-initializer'
import { AuthProvider } from '@/contexts/auth-provider'

export const metadata: Metadata = {
  title: 'Grand Proclamation 2025 | United Grand Lodge of NSW & ACT',
  description: 'Created with v0',
  generator: ';)',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <Script 
          src="https://challenges.cloudflare.com/turnstile/v0/api.js" 
          async 
          defer 
        />
      </head>
      <body>
        <AuthProvider>
          <LocationInitializer />
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}