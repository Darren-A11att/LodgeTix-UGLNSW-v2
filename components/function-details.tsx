import Link from 'next/link'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FunctionNavigation } from '@/components/function-navigation'
import { CalendarDays, Clock, MapPin, Package, Ticket, Users } from 'lucide-react'
import type { FunctionType, EventType, PackageType } from '@/shared/types'
import { formatCurrency } from '@/lib/formatters'

interface FunctionDetailsProps {
  function: FunctionType
}

export function FunctionDetails({ function: fn }: FunctionDetailsProps) {
  // Calculate duration in days
  const startDate = new Date(fn.start_date)
  const endDate = new Date(fn.end_date)
  const durationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

  // Group events by type/category
  const eventsByType = fn.events.reduce((acc, event) => {
    const type = event.type || 'Other'
    if (!acc[type]) acc[type] = []
    acc[type].push(event)
    return acc
  }, {} as Record<string, EventType[]>)

  return (
    <div>
      {/* Hero Section */}
      <div className="relative h-96">
        {fn.image_url ? (
          <img src={fn.image_url} alt={fn.name} className="w-full h-full object-cover" />
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
      
      {/* Content - 2 Column Layout */}
      <div className="container mx-auto py-8 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - 2/3 width */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            {fn.description && (
              <section>
                <p className="text-lg text-gray-700">{fn.description}</p>
              </section>
            )}

            {/* Events Section - Blog Style */}
            <section id="events">
              <h2 className="text-3xl font-bold mb-6">Events</h2>
              <div className="space-y-12">
                {fn.events.map((event) => (
                  <article key={event.event_id} className="relative isolate flex flex-col gap-6 lg:flex-row">
                    {/* Event Image */}
                    <div className="relative aspect-video sm:aspect-2/1 lg:aspect-square lg:w-64 lg:shrink-0">
                      {event.image_url ? (
                        <img
                          alt={event.title || 'Event'}
                          src={event.image_url}
                          className="absolute inset-0 size-full rounded-2xl bg-gray-50 object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 size-full rounded-2xl bg-gray-100 flex items-center justify-center">
                          <CalendarDays className="w-12 h-12 text-gray-400" />
                        </div>
                      )}
                      <div className="absolute inset-0 rounded-2xl ring-1 ring-gray-900/10 ring-inset" />
                    </div>
                    
                    {/* Event Details */}
                    <div className="flex-1">
                      <div className="flex items-center gap-x-4 text-xs">
                        <time dateTime={event.event_start} className="text-gray-500">
                          {format(new Date(event.event_start), 'EEEE, MMMM d, yyyy')}
                        </time>
                        {event.type && (
                          <span className="relative z-10 rounded-full bg-gray-50 px-3 py-1.5 font-medium text-gray-600">
                            {event.type}
                          </span>
                        )}
                      </div>
                      
                      <div className="group relative">
                        <h3 className="mt-3 text-lg font-semibold text-gray-900 group-hover:text-gray-600">
                          <Link href={`/functions/${fn.slug}/events/${event.slug}`}>
                            <span className="absolute inset-0" />
                            {event.title || 'Event'}
                          </Link>
                        </h3>
                        {event.description && (
                          <p className="mt-5 text-sm text-gray-600 line-clamp-3">{event.description}</p>
                        )}
                      </div>
                      
                      {/* Event Meta */}
                      <div className="mt-6 flex items-center gap-x-6 text-sm text-gray-500">
                        <div className="flex items-center gap-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{format(new Date(event.event_start), 'h:mm a')}</span>
                        </div>
                        {event.dress_code && (
                          <div className="flex items-center gap-x-1">
                            <Users className="w-4 h-4" />
                            <span>{event.dress_code}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            {/* Location Section */}
            {fn.location && (
              <section className="bg-gray-50 rounded-lg p-6">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <MapPin className="w-6 h-6" />
                  Location
                </h2>
                <div className="space-y-2">
                  <p className="text-lg font-semibold">{fn.location.place_name}</p>
                  {fn.location.suburb && fn.location.state && (
                    <p className="text-gray-600">{fn.location.suburb}, {fn.location.state}</p>
                  )}
                </div>
              </section>
            )}
          </div>

          {/* Right Column - 1/3 width */}
          <div className="lg:col-span-1 space-y-6">
            {/* Packages Section */}
            {fn.packages && fn.packages.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Packages
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {fn.packages.map((pkg) => (
                    <div key={pkg.package_id} className="border rounded-lg p-4">
                      <h4 className="font-semibold text-sm">{pkg.name}</h4>
                      {pkg.description && (
                        <p className="text-xs text-gray-600 mt-1">{pkg.description}</p>
                      )}
                      <div className="mt-2 flex items-baseline justify-between">
                        <span className="text-lg font-bold text-masonic-navy">
                          {formatCurrency(pkg.package_price)}
                        </span>
                        {pkg.original_price && pkg.original_price > pkg.package_price && (
                          <span className="text-xs text-gray-500 line-through">
                            {formatCurrency(pkg.original_price)}
                          </span>
                        )}
                      </div>
                      {pkg.includes_description && pkg.includes_description.length > 0 && (
                        <ul className="mt-2 text-xs text-gray-600 space-y-1">
                          {pkg.includes_description.slice(0, 3).map((item, index) => (
                            <li key={index} className="flex items-start">
                              <span className="text-green-500 mr-1">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                          {pkg.includes_description.length > 3 && (
                            <li className="text-gray-500 italic">
                              +{pkg.includes_description.length - 3} more...
                            </li>
                          )}
                        </ul>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Individual Tickets Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ticket className="w-5 h-5" />
                  Individual Tickets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Individual event tickets are available during registration.
                </p>
                <div className="mt-4 text-sm text-gray-500">
                  <p>• Select specific events</p>
                  <p>• Mix and match attendance</p>
                  <p>• Perfect for partial attendance</p>
                </div>
              </CardContent>
            </Card>

            {/* Register CTA */}
            <Card className="bg-masonic-navy text-white">
              <CardContent className="pt-6">
                <h3 className="text-lg font-bold mb-2">Ready to Register?</h3>
                <p className="text-sm mb-4 text-gray-200">
                  {durationDays} days of fellowship and tradition await
                </p>
                <Link href={`/functions/${fn.slug}/register`}>
                  <Button className="w-full bg-white text-masonic-navy hover:bg-gray-100">
                    Register Now
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}