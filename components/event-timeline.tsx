import { CalendarDays, Clock, Gift, Wallet } from "lucide-react"
import type { EventType as Event } from "@/shared/types/event"
import { formatEventDate, formatEventTime } from "@/lib/formatters"
import { getEventTimeline } from "@/lib/services/homepage-service"

interface TimelineEventCardProps {
  event: Event
  icon: React.ReactNode
}

// Single timeline event card component
function TimelineEventCard({ event, icon }: TimelineEventCardProps) {
  // Format the event date and time
  const formattedDate = formatEventDate(event)
  const formattedTime = formatEventTime(event)
  
  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-masonic-navy">
        {icon}
      </div>
      <h3 className="mb-2 text-xl font-bold text-masonic-navy">{event.title}</h3>
      <div className="w-full border-t border-gray-300 py-2"></div>
      <div className="mb-2 flex items-center justify-center">
        <CalendarDays className="mr-2 h-4 w-4 text-masonic-navy" />
        <span className="text-gray-700">{formattedDate}</span>
      </div>
      <div className="mb-4 flex items-center justify-center">
        <Clock className="mr-2 h-4 w-4 text-masonic-navy" />
        <span className="text-gray-700">{formattedTime}</span>
      </div>
      <p className="text-gray-600">
        {event.description}
      </p>
    </div>
  )
}

// Collection of icons to use for the timeline events
const timelineIcons = [
  <CalendarDays key="calendar" className="h-10 w-10 text-masonic-gold" />,
  <Gift key="gift" className="h-10 w-10 text-masonic-gold" />,
  <Wallet key="wallet" className="h-10 w-10 text-masonic-gold" />
]

// Main timeline component that displays child events
export function EventTimeline({ events }: { events: Event[] }) {
  return (
    <section className="bg-[#f0f4f8] py-16">
      <div className="container mx-auto px-4">
        <h2 className="mb-8 text-center text-3xl font-bold text-masonic-navy">Event Timeline</h2>

        <div className="relative mx-auto max-w-5xl">
          {/* Timeline events */}
          <div className="grid gap-8 md:grid-cols-3">
            {events.slice(0, 3).map((event, index) => (
              <TimelineEventCard 
                key={event.id || event.event_id || index} 
                event={event} 
                icon={timelineIcons[index % timelineIcons.length]} 
              />
            ))}
          </div>

          {/* Horizontal connecting line for larger screens */}
          <div className="absolute left-0 right-0 top-10 hidden border-t border-gray-300 md:block"></div>
        </div>
      </div>
    </section>
  )
}

// Server component to fetch Supabase data for timeline
export async function EventTimelineWithData() {
  // Fetch timeline events from Supabase
  const timelineEvents = await getEventTimeline();
  
  // If we have events from the database, render them
  if (timelineEvents && timelineEvents.length > 0) {
    return <EventTimeline events={timelineEvents} />;
  }
  
  // Otherwise fallback to hardcoded timeline
  return <EventTimelineFallback />;
}

// Fallback timeline component with hardcoded data
export function EventTimelineFallback() {
  return (
    <section className="bg-[#f0f4f8] py-16">
      <div className="container mx-auto px-4">
        <h2 className="mb-8 text-center text-3xl font-bold text-masonic-navy">Event Timeline</h2>

        <div className="relative mx-auto max-w-5xl">
          {/* Timeline events */}
          <div className="grid gap-8 md:grid-cols-3">
            {/* Installation Ceremony */}
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-masonic-navy">
                <CalendarDays className="h-10 w-10 text-masonic-gold" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-masonic-navy">Installation Ceremony</h3>
              <div className="w-full border-t border-gray-300 py-2"></div>
              <div className="mb-2 flex items-center justify-center">
                <CalendarDays className="mr-2 h-4 w-4 text-masonic-navy" />
                <span className="text-gray-700">May 15, 2025</span>
              </div>
              <div className="mb-4 flex items-center justify-center">
                <Clock className="mr-2 h-4 w-4 text-masonic-navy" />
                <span className="text-gray-700">2:00 PM - 5:00 PM</span>
              </div>
              <p className="text-gray-600">
                The formal installation of MW Bro Bernie Khristian Albano as Grand Master.
              </p>
            </div>

            {/* Grand Banquet */}
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-masonic-navy">
                <Gift className="h-10 w-10 text-masonic-gold" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-masonic-navy">Grand Banquet</h3>
              <div className="w-full border-t border-gray-300 py-2"></div>
              <div className="mb-2 flex items-center justify-center">
                <CalendarDays className="mr-2 h-4 w-4 text-masonic-navy" />
                <span className="text-gray-700">May 16, 2025</span>
              </div>
              <div className="mb-4 flex items-center justify-center">
                <Clock className="mr-2 h-4 w-4 text-masonic-navy" />
                <span className="text-gray-700">7:00 PM - 11:00 PM</span>
              </div>
              <p className="text-gray-600">A formal dinner celebrating the installation with distinguished guests.</p>
            </div>

            {/* Farewell Brunch */}
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-masonic-navy">
                <Wallet className="h-10 w-10 text-masonic-gold" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-masonic-navy">Farewell Brunch</h3>
              <div className="w-full border-t border-gray-300 py-2"></div>
              <div className="mb-2 flex items-center justify-center">
                <CalendarDays className="mr-2 h-4 w-4 text-masonic-navy" />
                <span className="text-gray-700">May 17, 2025</span>
              </div>
              <div className="mb-4 flex items-center justify-center">
                <Clock className="mr-2 h-4 w-4 text-masonic-navy" />
                <span className="text-gray-700">10:00 AM - 1:00 PM</span>
              </div>
              <p className="text-gray-600">A casual gathering to conclude the Grand Installation weekend.</p>
            </div>
          </div>

          {/* Horizontal connecting line for larger screens */}
          <div className="absolute left-0 right-0 top-10 hidden border-t border-gray-300 md:block"></div>
        </div>
      </div>
    </section>
  )
}