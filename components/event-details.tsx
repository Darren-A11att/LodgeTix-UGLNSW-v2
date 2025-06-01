import Link from 'next/link'
import { format } from 'date-fns'
import { ArrowLeft, Calendar, Clock, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { EventType } from '@/shared/types'

interface EventDetailsProps {
  event: EventType
  functionSlug: string
}

export function EventDetails({ event, functionSlug }: EventDetailsProps) {
  const eventDate = new Date(event.eventStart)
  const eventEndDate = event.eventEnd ? new Date(event.eventEnd) : null
  
  return (
    <div>
      {/* Back to Function Link */}
      <div className="container mx-auto py-4">
        <Link 
          href={`/functions/${functionSlug}`} 
          className="inline-flex items-center text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to {event.functionName}
        </Link>
      </div>

      {/* Event Header */}
      <div className="bg-gray-50 py-12">
        <div className="container mx-auto">
          <h1 className="text-4xl font-bold mb-4">{event.title || 'Event'}</h1>
          
          <div className="flex flex-wrap gap-6 text-gray-600">
            <div className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              <span>{format(eventDate, 'EEEE, MMMM d, yyyy')}</span>
            </div>
            
            <div className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              <span>
                {format(eventDate, 'h:mm a')}
                {eventEndDate && ` - ${format(eventEndDate, 'h:mm a')}`}
              </span>
            </div>
            
            {event.location && (
              <div className="flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                <span>{event.location}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Event Content */}
      <div className="container mx-auto py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {event.imageUrl && (
              <img 
                src={event.imageUrl} 
                alt={event.title || 'Event'} 
                className="w-full rounded-lg mb-6"
              />
            )}
            
            {event.description && (
              <div className="prose max-w-none mb-8">
                <h2 className="text-2xl font-bold mb-4">About This Event</h2>
                <p className="text-gray-700">{event.description}</p>
              </div>
            )}
            
            {event.eventIncludes && event.eventIncludes.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-bold mb-3">What's Included</h3>
                <ul className="list-disc list-inside space-y-1">
                  {event.eventIncludes.map((item, index) => (
                    <li key={index} className="text-gray-700">{item}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {event.importantInformation && event.importantInformation.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-bold mb-3">Important Information</h3>
                <ul className="list-disc list-inside space-y-1">
                  {event.importantInformation.map((info, index) => (
                    <li key={index} className="text-gray-700">{info}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {(event.dressCode || event.regalia) && (
              <div className="mb-8">
                <h3 className="text-xl font-bold mb-3">Dress Code & Regalia</h3>
                {event.dressCode && (
                  <p className="text-gray-700 mb-2">
                    <strong>Dress Code:</strong> {event.dressCode}
                  </p>
                )}
                {event.regalia && (
                  <p className="text-gray-700">
                    <strong>Regalia:</strong> {event.regalia}
                  </p>
                )}
              </div>
            )}
          </div>
          
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-gray-50 rounded-lg p-6 sticky top-4">
              <h3 className="text-xl font-bold mb-4">Event Details</h3>
              
              <div className="space-y-3 mb-6">
                {event.type && (
                  <div>
                    <span className="text-sm text-gray-600">Event Type</span>
                    <p className="font-semibold">{event.type}</p>
                  </div>
                )}
                
                {event.category && (
                  <div>
                    <span className="text-sm text-gray-600">Category</span>
                    <p className="font-semibold">{event.category}</p>
                  </div>
                )}
                
                {event.price && (
                  <div>
                    <span className="text-sm text-gray-600">Price</span>
                    <p className="font-semibold text-lg">{event.price}</p>
                  </div>
                )}
              </div>
              
              <Link href={`/functions/${functionSlug}/register`}>
                <Button className="w-full" size="lg">
                  Register for This Event
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}