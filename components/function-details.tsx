import Link from 'next/link'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { EventCard } from '@/components/event-card'
import { FunctionNavigation } from '@/components/function-navigation'
import type { FunctionType } from '@/shared/types'

interface FunctionDetailsProps {
  function: FunctionType
}

export function FunctionDetails({ function: fn }: FunctionDetailsProps) {
  // Calculate duration in days
  const startDate = new Date(fn.startDate)
  const endDate = new Date(fn.endDate)
  const durationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

  return (
    <div>
      {/* Hero Section */}
      <div className="relative h-96">
        {fn.imageUrl ? (
          <img src={fn.imageUrl} alt={fn.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gray-200" />
        )}
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="text-white text-center">
            <h1 className="text-5xl font-bold mb-4">{fn.name}</h1>
            <p className="text-xl">
              {format(startDate, 'MMMM d')} - {format(endDate, 'MMMM d, yyyy')}
            </p>
          </div>
        </div>
      </div>
      
      {/* Function Navigation */}
      <FunctionNavigation function={fn} />
      
      {/* Content */}
      <div className="container mx-auto py-8">
        {/* Description */}
        {fn.description && (
          <section className="mb-12">
            <p className="text-lg text-gray-700 max-w-4xl mx-auto">{fn.description}</p>
          </section>
        )}

        {/* Events Grid */}
        <section id="events" className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Events</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {fn.events.map((event, index) => (
              <EventCard 
                key={event.event_id || event.id || `event-${index}`} 
                event={event} 
                functionSlug={fn.slug}
              />
            ))}
          </div>
        </section>

        {/* Packages Section */}
        {fn.packages && fn.packages.length > 0 && (
          <section id="packages" className="mb-12">
            <h2 className="text-3xl font-bold mb-6">Packages</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {fn.packages.map(pkg => (
                <div key={pkg.id} className="border rounded-lg p-6">
                  <h3 className="text-xl font-bold mb-2">{pkg.name}</h3>
                  {pkg.description && (
                    <p className="text-gray-600 mb-4">{pkg.description}</p>
                  )}
                  <div className="space-y-2">
                    {pkg.fullPrice && (
                      <p className="text-sm">
                        Full Price: <span className="font-bold">${pkg.fullPrice}</span>
                      </p>
                    )}
                    {pkg.discount && (
                      <p className="text-sm text-green-600">
                        Discount: ${pkg.discount}
                      </p>
                    )}
                    {pkg.totalCost && (
                      <p className="text-lg font-bold">
                        Total: ${pkg.totalCost}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
        
        {/* Register Button */}
        <div className="text-center">
          <Link href={`/functions/${fn.slug}/register`}>
            <Button size="lg" className="px-8">
              Register for {fn.name}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}