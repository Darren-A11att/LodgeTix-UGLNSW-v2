import Link from "next/link"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { getGrandInstallationEvent } from "@/lib/services/homepage-service"

export async function GrandInstallationHero() {
  const event = await getGrandInstallationEvent();
  
  // If no event found, show a generic message
  if (!event) {
    return (
      <section className="relative bg-masonic-navy py-20 text-white">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-5xl text-center">
            <h1 className="mb-4 text-4xl font-bold md:text-5xl lg:text-6xl">No Upcoming Events</h1>
            <p className="mb-8 text-lg">Please check back later for upcoming Masonic events.</p>
          </div>
        </div>
      </section>
    );
  }
  
  // Use actual event data
  const title = event.title;
  const subtitle = event.subtitle || "";
  const organiser = event.organiser || "United Grand Lodge of NSW & ACT";
  const dateLocation = `${event.date} • ${event.location}`;
  const imageUrl = event.imageUrl || "/placeholder.svg?height=800&width=1600";
  const logoUrl = event.logo || "/placeholder.svg?height=120&width=120";
  const slug = event.slug;

  return (
    <section className="relative bg-masonic-navy py-20 text-white">
      <div className="absolute inset-0 z-0 opacity-20">
        <Image
          src={imageUrl}
          alt="Masonic pattern background"
          fill
          className="object-cover"
        />
      </div>
      <div className="container relative z-10 mx-auto px-4">
        <div className="mx-auto max-w-5xl text-center">
          <div className="mb-6 flex justify-center">
            <Image
              src={logoUrl}
              alt="United Grand Lodge of NSW & ACT"
              width={120}
              height={120}
              className="rounded-full border-4 border-masonic-gold"
            />
          </div>
          <h1 className="mb-4 text-4xl font-bold md:text-5xl lg:text-6xl">{title}</h1>
          <h2 className="mb-6 text-2xl font-medium md:text-3xl">{subtitle}</h2>
          <div className="masonic-divider"></div>
          <p className="mb-4 text-xl">{organiser}</p>
          <p className="mb-8 text-lg">{dateLocation}</p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Button asChild size="lg" className="bg-masonic-gold text-masonic-navy hover:bg-masonic-lightgold">
              <Link href={`/functions/${slug}/register`}>Purchase Tickets</Link>
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