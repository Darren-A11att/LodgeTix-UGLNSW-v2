import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { getHeroFunction } from "@/lib/services/homepage-service"
import { MasonicLogo } from "@/components/masonic-logo"

const navigation = [
  { name: 'Events', href: '/functions' },
  { name: 'About', href: '/about' },
  { name: 'Contact', href: '/contact' },
  { name: 'Help', href: '/help' },
]

export async function HeroAngledDesign() {
  const heroFunction = await getHeroFunction();
  
  // If no function found, show a generic message
  if (!heroFunction) {
    return (
      <div className="bg-masonic-navy">
        <header className="absolute inset-x-0 top-0 z-50">
          <div className="mx-auto max-w-7xl">
            <div className="px-6 pt-6 lg:max-w-2xl lg:pr-0 lg:pl-8">
              <nav aria-label="Global" className="flex items-center justify-between lg:justify-start">
                <Link href="/" className="-m-1.5 p-1.5 flex items-center gap-2">
                  <span className="sr-only">LodgeTix</span>
                  <MasonicLogo size="sm" />
                  <span className="text-lg font-semibold text-white">LodgeTix</span>
                </Link>
                <div className="hidden lg:ml-12 lg:flex lg:gap-x-14">
                  {navigation.map((item) => (
                    <Link key={item.name} href={item.href} className="text-sm font-semibold text-gray-100 hover:text-white">
                      {item.name}
                    </Link>
                  ))}
                </div>
                <div className="hidden lg:ml-auto lg:flex lg:items-center lg:gap-x-6">
                  <Link href="/login" className="text-sm font-semibold text-gray-100 hover:text-white">
                    Log in
                  </Link>
                </div>
              </nav>
            </div>
          </div>
        </header>

        <div className="relative">
          <div className="mx-auto max-w-7xl">
            <div className="relative z-10 pt-14 lg:w-full lg:max-w-2xl">
              <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                aria-hidden="true"
                className="absolute inset-y-0 right-8 hidden h-full w-80 translate-x-1/2 transform fill-masonic-navy lg:block"
              >
                <polygon points="0,0 90,0 50,100 0,100" />
              </svg>

              <div className="relative px-6 py-32 sm:py-40 lg:px-8 lg:py-56 lg:pr-0">
                <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-xl">
                  <div className="hidden sm:mb-8 sm:flex">
                    <div className="relative rounded-full px-3 py-1 text-sm text-gray-300 ring-1 ring-white/20 hover:ring-white/30">
                      United Grand Lodge of NSW & ACT official ticketing platform.{' '}
                      <Link href="/about" className="font-semibold text-masonic-gold">
                        <span aria-hidden="true" className="absolute inset-0" />
                        Learn more <span aria-hidden="true">&rarr;</span>
                      </Link>
                    </div>
                  </div>
                  <h1 className="text-4xl font-bold tracking-tight text-masonic-gold sm:text-6xl">
                    Welcome to LodgeTix
                  </h1>
                  <p className="mt-6 text-lg text-gray-300 sm:text-xl">
                    Your premier destination for Masonic events and ticketing. Join us for memorable occasions and timeless traditions.
                  </p>
                  <div className="mt-10 flex items-center gap-x-6">
                    <Button asChild className="bg-masonic-gold hover:bg-masonic-lightgold text-masonic-navy">
                      <Link href="/functions">
                        Explore Events
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="border-masonic-gold bg-masonic-navy text-masonic-gold hover:bg-masonic-navy/80">
                      <Link href="/about">
                        Learn more <span aria-hidden="true">→</span>
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-masonic-lightblue lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2 relative">
            <Image
              alt="Masonic Lodge Interior"
              src="/placeholder.svg?height=800&width=800"
              width={800}
              height={800}
              className="aspect-3/2 object-cover lg:aspect-auto lg:size-full"
            />
            {/* 30% transparent masonic blue overlay */}
            <div className="absolute inset-0 bg-masonic-blue/30"></div>
          </div>
        </div>
      </div>
    );
  }

  const {
    title,
    description,
    date,
    time,
    location,
    imageUrl,
    slug,
    organiser
  } = heroFunction;

  return (
    <div className="bg-masonic-navy">
      <header className="absolute inset-x-0 top-0 z-50">
        <div className="mx-auto max-w-7xl">
          <div className="px-6 pt-6 lg:max-w-2xl lg:pr-0 lg:pl-8">
            <nav aria-label="Global" className="flex items-center justify-between lg:justify-start">
              <Link href="/" className="-m-1.5 p-1.5 flex items-center gap-2">
                <span className="sr-only">LodgeTix</span>
                <MasonicLogo size="sm" />
                <span className="text-lg font-semibold text-white">LodgeTix</span>
              </Link>
              <div className="hidden lg:ml-12 lg:flex lg:gap-x-14">
                {navigation.map((item) => (
                  <Link key={item.name} href={item.href} className="text-sm font-semibold text-gray-100 hover:text-white">
                    {item.name}
                  </Link>
                ))}
              </div>
              <div className="hidden lg:ml-auto lg:flex lg:items-center lg:gap-x-6">
                <Link href="/login" className="text-sm font-semibold text-gray-100 hover:text-white">
                  Log in
                </Link>
              </div>
            </nav>
          </div>
        </div>
      </header>

      <div className="relative">
        <div className="mx-auto max-w-7xl">
          <div className="relative z-10 pt-14 lg:w-full lg:max-w-2xl">
            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden="true"
              className="absolute inset-y-0 right-8 hidden h-full w-80 translate-x-1/2 transform fill-masonic-navy lg:block"
            >
              <polygon points="0,0 90,0 50,100 0,100" />
            </svg>

            <div className="relative px-6 py-32 sm:py-40 lg:px-8 lg:py-56 lg:pr-0">
              <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-xl">
                <div className="hidden sm:mb-8 sm:flex">
                  <div className="relative rounded-full px-3 py-1 text-sm text-gray-300 ring-1 ring-white/20 hover:ring-white/30">
                    {organiser}
                    {date && time && (
                      <>
                        {' • '}
                        <span className="font-semibold text-masonic-gold">
                          {date} at {time}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <h1 className="text-4xl font-bold tracking-tight text-masonic-gold sm:text-6xl">
                  {title}
                </h1>
                <p className="mt-6 text-lg text-gray-300 sm:text-xl">
                  {description || "Join us for this special Masonic occasion. Experience the tradition, fellowship, and ceremony that makes our community special."}
                </p>
                {location && (
                  <p className="mt-4 text-base text-gray-300">
                    📍 {location}
                  </p>
                )}
                <div className="mt-10 flex items-center gap-x-6">
                  <Button asChild className="bg-masonic-gold hover:bg-masonic-lightgold text-masonic-navy">
                    <Link href={slug ? `/functions/${slug}/register` : "/functions"}>
                      Get Tickets
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="border-masonic-gold bg-masonic-navy text-masonic-gold hover:bg-masonic-navy/80">
                    <Link href="/functions">
                      Learn more <span aria-hidden="true">→</span>
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-masonic-lightblue lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2 relative">
          <Image
            alt={title || "Masonic Event"}
            src={imageUrl || "/placeholder.svg?height=800&width=800"}
            width={800}
            height={800}
            className="aspect-3/2 object-cover lg:aspect-auto lg:size-full"
            priority
          />
          {/* 30% transparent masonic blue overlay */}
          <div className="absolute inset-0 bg-masonic-blue/30"></div>
        </div>
      </div>
    </div>
  );
}