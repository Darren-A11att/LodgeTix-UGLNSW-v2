import Link from 'next/link'
import { Button } from '@/components/ui/button'
import type { FunctionType } from '@/shared/types'

interface FunctionNavigationProps {
  function: FunctionType
  currentEventId?: string
}

export function FunctionNavigation({ 
  function: fn, 
  currentEventId 
}: FunctionNavigationProps) {
  return (
    <div className="bg-gray-100 border-b sticky top-0 z-10">
      <div className="container mx-auto py-4">
        <div className="flex items-center justify-between">
          <nav className="flex space-x-6">
            <Link 
              href={`/functions/${fn.slug}`}
              className="font-medium hover:text-blue-600 transition-colors"
            >
              Overview
            </Link>
            <Link 
              href={`/functions/${fn.slug}#events`}
              className="font-medium hover:text-blue-600 transition-colors"
            >
              All Events ({fn.events.length})
            </Link>
            {fn.packages && fn.packages.length > 0 && (
              <Link 
                href={`/functions/${fn.slug}#packages`}
                className="font-medium hover:text-blue-600 transition-colors"
              >
                Packages
              </Link>
            )}
          </nav>
          
          <Link href={`/functions/${fn.slug}/register`}>
            <Button>Register Now</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}