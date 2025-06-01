import Link from 'next/link'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { format } from 'date-fns'
import type { FunctionType } from '@/shared/types'

interface FunctionCardProps {
  function: FunctionType
}

export function FunctionCard({ function: fn }: FunctionCardProps) {
  const startDate = new Date(fn.startDate)
  const endDate = new Date(fn.endDate)
  const eventCount = fn.events?.length || 0
  
  // Calculate minimum price from packages or events
  let minPrice = 0
  if (fn.packages && fn.packages.length > 0) {
    minPrice = Math.min(...fn.packages.map(pkg => pkg.totalCost))
  }
  
  return (
    <Link href={`/functions/${fn.slug}`}>
      <Card className="hover:shadow-lg transition-shadow h-full">
        <CardHeader className="p-0">
          {fn.imageUrl && (
            <img 
              src={fn.imageUrl} 
              alt={fn.name} 
              className="w-full h-48 object-cover rounded-t-lg"
            />
          )}
        </CardHeader>
        <CardContent className="p-6">
          <h3 className="text-xl font-bold mb-2">{fn.name}</h3>
          <p className="text-sm text-gray-600 mb-3">
            {format(startDate, 'MMM d')} - {format(endDate, 'MMM d, yyyy')}
          </p>
          {fn.description && (
            <p className="text-gray-700 mb-4 line-clamp-3">
              {fn.description}
            </p>
          )}
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">
              {eventCount} {eventCount === 1 ? 'event' : 'events'}
            </span>
            {minPrice > 0 && (
              <span className="text-sm font-bold">
                From ${minPrice}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}