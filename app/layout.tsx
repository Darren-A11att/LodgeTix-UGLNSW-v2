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
import { COMPANY_INFO } from '@/lib/constants/company-details'
import { AuthEncryptionProvider } from '@/components/providers/auth-encryption-provider'

export const metadata: Metadata = {
  title: `Grand Proclamation 2025 | ${COMPANY_INFO.tradingName}`,
  description: 'Join us for the Grand Proclamation 2025. Register for this historic Masonic event through our secure event management platform.',
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
          <AuthEncryptionProvider>
            <FeaturedFunctionProvider>
              <LocationInitializer />
              <LayoutWithFooter>
                {children}
              </LayoutWithFooter>
              <Toaster />
            </FeaturedFunctionProvider>
          </AuthEncryptionProvider>
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