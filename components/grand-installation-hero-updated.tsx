import Link from "next/link"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { getEventById } from "@/lib/event-facade"
import { formatEventDate } from "@/lib/formatters"

// Main hero component that fetches and displays data from Supabase
export async function GrandInstallationHeroUpdated() {
  // Fetch the Grand Installation event by ID
  const event = await getEventById("307c2d85-72d5-48cf-ac94-082ca2a5d23d")
  
  if (!event) {
    // Fallback for when the event can't be found
    return <GrandInstallationHeroFallback />
  }

  // Format date for display
  const formattedDate = formatEventDate(event)
  const location = event.location || "Sydney Masonic Centre"
  
  return (
    <section className="relative bg-masonic-navy py-20 text-white">
      <div className="absolute inset-0 z-0 opacity-20">
        <Image
          src={event.imageUrl || "/placeholder.svg?height=800&width=1600"}
          alt="Masonic pattern background"
          fill
          className="object-cover"
        />
      </div>
      <div className="container relative z-10 mx-auto px-4">
        <div className="mx-auto max-w-5xl text-center">
          <div className="mb-6 flex justify-center">
            <Image
              src={event.organizer_url || "/placeholder.svg?height=120&width=120"}
              alt={event.organizer_name || "United Grand Lodge of NSW & ACT"}
              width={120}
              height={120}
              className="rounded-full border-4 border-masonic-gold"
            />
          </div>
          <h1 className="mb-4 text-4xl font-bold md:text-5xl lg:text-6xl">{event.title || "Grand Installation"}</h1>
          <h2 className="mb-6 text-2xl font-medium md:text-3xl">{event.subtitle || "MW Bro Bernie Khristian Albano"}</h2>
          <div className="masonic-divider"></div>
          <p className="mb-4 text-xl">{event.organizer_name || "Grand Master of the United Grand Lodge of NSW & ACT"}</p>
          <p className="mb-8 text-lg">{formattedDate} • {location}</p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Button asChild size="lg" className="bg-masonic-gold text-masonic-navy hover:bg-masonic-lightgold">
              <Link href={`/events/${event.slug}/register`}>Purchase Tickets</Link>
            </Button>
          </div>
        </div>
      </div>
      <div
        className="absolute bottom-0 left-0 right-0 h-16 bg-white"
        style={{ clipPath: "polygon(0 100%, 100% 100%, 100% 0)" }}
      ></div>
    </section>
  )
}

// Fallback component in case the data fetch fails
function GrandInstallationHeroFallback() {
  return (
    <section className="relative bg-masonic-navy py-20 text-white">
      <div className="absolute inset-0 z-0 opacity-20">
        <Image
          src="/placeholder.svg?height=800&width=1600"
          alt="Masonic pattern background"
          fill
          className="object-cover"
        />
      </div>
      <div className="container relative z-10 mx-auto px-4">
        <div className="mx-auto max-w-5xl text-center">
          <div className="mb-6 flex justify-center">
            <Image
              src="/placeholder.svg?height=120&width=120"
              alt="United Grand Lodge of NSW & ACT"
              width={120}
              height={120}
              className="rounded-full border-4 border-masonic-gold"
            />
          </div>
          <h1 className="mb-4 text-4xl font-bold md:text-5xl lg:text-6xl">Grand Installation</h1>
          <h2 className="mb-6 text-2xl font-medium md:text-3xl">MW Bro Bernie Khristian Albano</h2>
          <div className="masonic-divider"></div>
          <p className="mb-4 text-xl">Grand Master of the United Grand Lodge of NSW & ACT</p>
          <p className="mb-8 text-lg">Saturday, 25 November 2023 • Sydney Masonic Centre</p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Button asChild size="lg" className="bg-masonic-gold text-masonic-navy hover:bg-masonic-lightgold">
              <Link href="/events">View Events</Link>
            </Button>
          </div>
        </div>
      </div>
      <div
        className="absolute bottom-0 left-0 right-0 h-16 bg-white"
        style={{ clipPath: "polygon(0 100%, 100% 100%, 100% 0)" }}
      ></div>
    </section>
  )
}