import type { Metadata } from 'next'
import React from 'react'
import Script from 'next/script'
import '@/styles/globals.css'
import './disableFastRefreshLogs'
import { LocationInitializer } from '@/components/location-initializer'
import { AuthProvider } from '@/contexts/auth-provider'
import { FeaturedFunctionProvider } from '@/contexts/featured-function-context'
import { LayoutWithFooter } from '@/components/ui/layout-with-footer'
import { Toaster } from '@/components/ui/sonner'

export const metadata: Metadata = {
  title: 'Grand Proclamation 2025 | LodgeTix',
  description: 'Proclamation of MW Bro B. Khristian Albano GM as the Grand Master of the United Grand Lodge of NSW & ACT for 2025.',
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
          <FeaturedFunctionProvider>
            <LocationInitializer />
            <LayoutWithFooter>
              {children}
            </LayoutWithFooter>
            <Toaster />
          </FeaturedFunctionProvider>
        </AuthProvider>
        
        {/* Crisp Chat Widget */}
        <Script
          id="crisp-widget"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.$crisp=[];
              window.CRISP_WEBSITE_ID="16b49683-a08e-4e31-99b6-2b4c004e486f";
              (function(){
                var d=document;
                var s=d.createElement("script");
                s.src="https://client.crisp.chat/l.js";
                s.async=1;
                d.getElementsByTagName("head")[0].appendChild(s);
              })();
            `,
          }}
        />
      </body>
    </html>
  )
}