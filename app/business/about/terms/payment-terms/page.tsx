'use client'

import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { COMPANY_INFO, DateFormatters } from '@/lib/constants/company-details'

export default function PaymentTermsPage() {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/legal-docs/payment-processing-terms.md')
      .then(response => response.text())
      .then(text => {
        setContent(text)
        setLoading(false)
      })
      .catch(error => {
        console.error('Error loading payment terms:', error)
        setLoading(false)
      })
  }, [])

  return (
    <div className="bg-white px-6 py-32 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Payment Processing Terms</CardTitle>
            <CardDescription className="text-base">
              {COMPANY_INFO.legalName} - {COMPANY_INFO.tradingName} Platform<br />
              ABN: {COMPANY_INFO.abn}<br />
              Last updated: {DateFormatters.getLastUpdatedDate()}<br />
              <span className="text-red-600 font-medium">These payment terms govern all financial transactions on the LodgeTix platform</span>
            </CardDescription>
          </CardHeader>

          <CardContent className="prose prose-sm max-w-none">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-gray-500">Loading Payment Processing Terms...</p>
              </div>
            ) : (
              <ReactMarkdown
                components={{
                  h1: ({node, ...props}) => <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-6" {...props} />,
                  h2: ({node, ...props}) => <h2 className="text-xl font-semibold mb-4 mt-8" {...props} />,
                  h3: ({node, ...props}) => <h3 className="text-lg font-medium mb-3" {...props} />,
                  h4: ({node, ...props}) => <h4 className="font-medium mb-2" {...props} />,
                  p: ({node, ...props}) => <p className="mb-4" {...props} />,
                  ul: ({node, ...props}) => <ul className="list-disc list-inside space-y-2 mb-4" {...props} />,
                  ol: ({node, ...props}) => <ol className="list-decimal list-inside space-y-2 mb-4" {...props} />,
                  li: ({node, ...props}) => <li {...props} />,
                  strong: ({node, ...props}) => <strong className="font-semibold" {...props} />,
                  blockquote: ({node, ...props}) => (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                      <blockquote {...props} />
                    </div>
                  ),
                }}
              >
                {content}
              </ReactMarkdown>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}