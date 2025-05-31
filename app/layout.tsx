import type { Metadata } from 'next'
import React from 'react'
import '@/styles/globals.css'
import './disableFastRefreshLogs'
import { LocationInitializer } from '@/components/location-initializer'
import { AuthProvider } from '@/contexts/auth-provider'
import { LayoutWithFooter } from '@/components/ui/layout-with-footer'

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
        <script 
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit">
        </script>
      </head>
      <body>
        <AuthProvider>
          <LocationInitializer />
          <LayoutWithFooter>
            {children}
          </LayoutWithFooter>
        </AuthProvider>
      </body>
    </html>
  )
}