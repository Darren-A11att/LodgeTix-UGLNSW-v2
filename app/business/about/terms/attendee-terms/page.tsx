'use client'

import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import Link from 'next/link'
import { MasonicLogo } from '@/components/masonic-logo'

export default function AttendeeTermsPage() {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/legal-docs/attendee-terms.md')
      .then(response => response.text())
      .then(text => {
        setContent(text)
        setLoading(false)
      })
      .catch(error => {
        console.error('Error loading attendee terms:', error)
        setLoading(false)
      })
  }, [])

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <MasonicLogo size="sm" />
              <span className="text-lg font-semibold text-masonic-navy">LodgeTix</span>
            </Link>
            <nav className="hidden md:flex items-center gap-8">
              <Link href="/business" className="text-sm font-medium text-gray-700 hover:text-masonic-navy">
                Software
              </Link>
              <Link href="/business/pricing" className="text-sm font-medium text-gray-700 hover:text-masonic-navy">
                Pricing
              </Link>
              <Link href="/business/about/contact" className="text-sm font-medium text-gray-700 hover:text-masonic-navy">
                Contact
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-masonic-navy mb-8">Attendee Terms</h1>
        
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading Attendee Terms...</p>
          </div>
        ) : (
          <div className="prose prose-lg max-w-none">
            <ReactMarkdown
              components={{
                h1: ({node, ...props}) => <h1 className="text-4xl font-bold text-masonic-navy mb-8" {...props} />,
                h2: ({node, ...props}) => <h2 className="text-2xl font-bold text-masonic-navy mb-4 mt-8" {...props} />,
                h3: ({node, ...props}) => <h3 className="text-xl font-semibold mb-3 mt-6" {...props} />,
                h4: ({node, ...props}) => <h4 className="text-lg font-medium mb-2 mt-4" {...props} />,
                p: ({node, ...props}) => <p className="text-gray-700 mb-4" {...props} />,
                ul: ({node, ...props}) => <ul className="list-disc list-inside space-y-2 mb-4" {...props} />,
                ol: ({node, ...props}) => <ol className="list-decimal list-inside space-y-2 mb-4" {...props} />,
                li: ({node, ...props}) => <li className="text-gray-700" {...props} />,
                strong: ({node, ...props}) => <strong className="font-semibold text-gray-900" {...props} />,
                blockquote: ({node, ...props}) => (
                  <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                    <blockquote className="text-sm" {...props} />
                  </div>
                ),
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        )}

        <div className="mt-12 text-center">
          <Link href="/business/about/terms" className="text-blue-600 hover:text-blue-800 font-medium">
            ← Back to Legal Documents
          </Link>
        </div>
      </div>
    </div>
  )
}