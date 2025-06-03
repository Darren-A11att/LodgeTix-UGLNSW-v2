import Link from 'next/link'
import { format } from 'date-fns'
import type { FunctionType } from '@/shared/types'
import { formatCurrency } from '@/lib/formatters'

interface FunctionCardProps {
  function: FunctionType
}

export function FunctionCard({ function: fn }: FunctionCardProps) {
  // Handle both camelCase (from service) and snake_case (from type) field names
  const startDate = new Date((fn as any).startDate || fn.start_date)
  const endDate = new Date((fn as any).endDate || fn.end_date)
  const eventCount = fn.events?.length || 0
  
  // Format date range
  const dateRange = startDate.getMonth() === endDate.getMonth() && startDate.getFullYear() === endDate.getFullYear()
    ? `${format(startDate, 'd')} - ${format(endDate, 'd MMMM yyyy')}`
    : `${format(startDate, 'd MMM')} - ${format(endDate, 'd MMM yyyy')}`
  
  // Format price
  const priceDisplay = fn.minPrice && fn.minPrice > 0 
    ? `From ${formatCurrency(fn.minPrice)}`
    : 'View pricing'
  
  // Location display - handle different location structures
  const locationDisplay = fn.location 
    ? `${(fn.location as any).city || fn.location.suburb || fn.location.place_name || 'Location'}, ${fn.location.state}`
    : 'Various locations'
  
  return (
    <Link href={`/functions/${fn.slug}`} className="group block">
      <div className="space-y-4">
        {/* Image */}
        <div className="aspect-[4/3] w-full overflow-hidden rounded-lg bg-gray-100">
          <img
            src={(fn as any).imageUrl || fn.image_url || '/placeholder.svg'}
            alt={fn.name}
            className="h-full w-full object-cover object-center group-hover:opacity-75 transition-opacity duration-200"
          />
        </div>
        
        {/* Content */}
        <div>
          <h3 className="text-base font-medium text-masonic-navy">
            {fn.name}
          </h3>
          <p className="mt-1 text-sm italic text-gray-500">
            {dateRange} • {locationDisplay}
          </p>
          <p className="mt-2 text-sm font-medium text-masonic-navy">
            {priceDisplay}
          </p>
          {eventCount > 0 && (
            <p className="mt-1 text-xs text-gray-500">
              {eventCount} {eventCount === 1 ? 'event' : 'events'} included
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}