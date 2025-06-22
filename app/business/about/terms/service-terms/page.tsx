'use client'

import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import HeaderSection from '@/docs/legal-pages/header-section'
import Link from 'next/link'

export default function ServiceTermsPage() {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/legal-docs/terms-of-service.md')
      .then(response => response.text())
      .then(text => {
        setContent(text)
        setLoading(false)
      })
      .catch(error => {
        console.error('Error loading terms:', error)
        setLoading(false)
      })
  }, [])

  return (
    <div className="bg-white">
      <HeaderSection />
      
      <div className="px-6 py-12 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-4xl">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading Terms of Service...</p>
            </div>
          ) : (
            <div className="prose prose-lg prose-gray max-w-none">
              <ReactMarkdown
                components={{
                  h1: ({node, ...props}) => <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl mb-8" {...props} />,
                  h2: ({node, ...props}) => <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8" {...props} />,
                  h3: ({node, ...props}) => <h3 className="text-xl font-semibold mb-3 mt-6" {...props} />,
                  h4: ({node, ...props}) => <h4 className="text-lg font-medium mb-2 mt-4" {...props} />,
                  p: ({node, ...props}) => <p className="text-gray-700 mb-4" {...props} />,
                  ul: ({node, ...props}) => <ul className="list-disc list-inside space-y-2 mb-4" {...props} />,
                  ol: ({node, ...props}) => <ol className="list-decimal list-inside space-y-2 mb-4" {...props} />,
                  li: ({node, ...props}) => <li className="text-gray-700" {...props} />,
                  strong: ({node, ...props}) => <strong className="font-semibold text-gray-900" {...props} />,
                  blockquote: ({node, ...props}) => (
                    <blockquote className="border-l-4 border-gray-300 pl-4 my-4 italic text-gray-600" {...props} />
                  ),
                  code: ({node, inline, ...props}) => 
                    inline ? (
                      <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono" {...props} />
                    ) : (
                      <code className="block bg-gray-100 p-4 rounded text-sm font-mono overflow-x-auto" {...props} />
                    ),
                  table: ({node, ...props}) => (
                    <div className="overflow-x-auto my-6">
                      <table className="min-w-full divide-y divide-gray-300" {...props} />
                    </div>
                  ),
                  thead: ({node, ...props}) => <thead className="bg-gray-50" {...props} />,
                  tbody: ({node, ...props}) => <tbody className="bg-white divide-y divide-gray-200" {...props} />,
                  tr: ({node, ...props}) => <tr {...props} />,
                  th: ({node, ...props}) => (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" {...props} />
                  ),
                  td: ({node, ...props}) => (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" {...props} />
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
    </div>
  )
}