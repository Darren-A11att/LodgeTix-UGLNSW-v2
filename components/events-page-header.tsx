import { CalendarDays, MapPin, Users } from "lucide-react"
import { format } from "date-fns"
import type { FunctionType } from "@/shared/types"

interface EventsPageHeaderProps {
  functionData: FunctionType
}

export function EventsPageHeader({ functionData }: EventsPageHeaderProps) {
  // Format date range
  const startDate = new Date(functionData.start_date)
  const endDate = new Date(functionData.end_date)
  const dateRange = startDate.getMonth() === endDate.getMonth() && startDate.getFullYear() === endDate.getFullYear()
    ? `${format(startDate, 'd')} - ${format(endDate, 'd MMMM yyyy')}`
    : `${format(startDate, 'd MMM')} - ${format(endDate, 'd MMM yyyy')}`
  
  // Get location display
  const locationDisplay = functionData.location 
    ? `${functionData.location.suburb || functionData.location.place_name}, ${functionData.location.state}`
    : 'Various locations'

  // Function details for cards
  const cards = [
    {
      name: 'Event Period',
      description: dateRange,
      icon: CalendarDays,
    },
    {
      name: 'Location',
      description: locationDisplay,
      icon: MapPin,
    },
    {
      name: 'Organiser',
      description: 'United Grand Lodge of NSW & ACT',
      icon: Users,
    },
  ]

  return (
    <div className="relative isolate overflow-hidden bg-gray-900 py-24 sm:py-32">
      {/* Background image */}
      <img
        alt={functionData.name}
        src={functionData.image_url || '/placeholder.svg?height=1500&width=2830'}
        className="absolute inset-0 -z-10 size-full object-cover object-center opacity-30"
      />
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-gray-900/50 via-gray-900/80 to-gray-900/95" />
      
      {/* Decorative blurs */}
      <div className="hidden sm:absolute sm:-top-10 sm:right-1/2 sm:-z-10 sm:mr-10 sm:block sm:transform-gpu sm:blur-3xl">
        <div
          style={{
            clipPath:
              'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
          }}
          className="aspect-1097/845 w-[68.5625rem] bg-linear-to-tr from-masonic-blue to-masonic-navy opacity-20"
        />
      </div>
      <div className="absolute -top-52 left-1/2 -z-10 -translate-x-1/2 transform-gpu blur-3xl sm:top-[-28rem] sm:ml-16 sm:translate-x-0 sm:transform-gpu">
        <div
          style={{
            clipPath:
              'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
          }}
          className="aspect-1097/845 w-[68.5625rem] bg-linear-to-tr from-masonic-blue to-masonic-navy opacity-20"
        />
      </div>
      
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-none">
          <h1 className="text-4xl font-bold text-white">{functionData.name}</h1>
          <div className="masonic-divider mt-4 mb-6 border-white/20"></div>
          <p className="text-lg text-gray-300 max-w-4xl">
            {functionData.description || 'Explore our upcoming events and register for those that interest you'}
          </p>
        </div>
        
        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-6 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3 lg:gap-8">
          {cards.map((card) => (
            <div key={card.name} className="flex gap-x-4 rounded-xl bg-white/5 p-6 ring-1 ring-white/10 ring-inset backdrop-blur-sm">
              <card.icon aria-hidden="true" className="h-7 w-7 flex-none text-masonic-gold" />
              <div className="text-base/7">
                <h3 className="font-semibold text-white">{card.name}</h3>
                <p className="mt-2 text-gray-300">{card.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}