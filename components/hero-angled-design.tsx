import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { getHomepageContentService } from "@/lib/content/homepage-content-service"
import { MasonicLogo } from "@/components/masonic-logo"

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export async function HeroAngledDesign() {
  // Get content from centralized content service
  const contentService = await getHomepageContentService()
  const navigationContent = await contentService.getNavigationContent()
  const heroContent = await contentService.getHeroContent()
  
  return (
    <div className="bg-masonic-navy">
      <header className="absolute inset-x-0 top-0 z-50">
        <div className="mx-auto max-w-7xl">
          <div className="px-6 pt-6 lg:max-w-2xl lg:pr-0 lg:pl-8">
            <nav aria-label="Global" className="flex items-center justify-between lg:justify-start">
              <Link href="/" className="-m-1.5 p-1.5 flex items-center gap-2">
                <span className="sr-only">{navigationContent.brand.name}</span>
                <MasonicLogo size="sm" />
                <span className="text-lg font-semibold text-white">{navigationContent.brand.name}</span>
              </Link>
              <div className="hidden lg:ml-12 lg:flex lg:gap-x-14">
                {navigationContent.menuItems.map((item: any) => (
                  <Link key={item.name} href={item.href} className="text-sm font-semibold text-gray-100 hover:text-white">
                    {item.name}
                  </Link>
                ))}
              </div>
              <div className="hidden lg:ml-auto lg:flex lg:items-center lg:gap-x-6">
                <Link href={navigationContent.authLink.href} className="text-sm font-semibold text-gray-100 hover:text-white">
                  {navigationContent.authLink.text}
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
                    {heroContent.badge.text}{' '}
                    <Link href={heroContent.badge.linkHref} className="font-semibold text-masonic-gold">
                      <span aria-hidden="true" className="absolute inset-0" />
                      {heroContent.badge.linkText} <span aria-hidden="true">&rarr;</span>
                    </Link>
                  </div>
                </div>
                <h1 className="text-4xl font-bold tracking-tight text-masonic-gold sm:text-6xl">
                  {heroContent.title}
                </h1>
                <p className="mt-6 text-lg text-gray-300 sm:text-xl">
                  {heroContent.description}
                </p>
                <div className="mt-10 flex items-center gap-x-6">
                  <Button asChild className="bg-masonic-gold hover:bg-masonic-lightgold text-masonic-navy">
                    <Link href={heroContent.buttons.primary.href}>
                      {heroContent.buttons.primary.text}
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="border-masonic-gold bg-masonic-navy text-masonic-gold hover:bg-masonic-navy/80">
                    <Link href={heroContent.buttons.secondary.href}>
                      {heroContent.buttons.secondary.text} <span aria-hidden="true">→</span>
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-masonic-lightblue lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2 relative">
          <div className="relative w-full h-full lg:aspect-auto aspect-[3/2]">
            <Image
              alt={heroContent.image.alt}
              src={heroContent.image.url}
              fill
              className={classNames(
                "object-cover",
                heroContent.image.position === 'top' && 'object-top',
                heroContent.image.position === 'bottom' && 'object-bottom',
                heroContent.image.position === 'left' && 'object-left',
                heroContent.image.position === 'right' && 'object-right',
                heroContent.image.position === 'center' && 'object-center',
                (!heroContent.image.position || heroContent.image.position === 'center') && 'object-center'
              )}
              style={{
                maskImage: 'linear-gradient(to bottom, black, black)',
                maskSize: '100% 100%',
                WebkitMaskImage: 'linear-gradient(to bottom, black, black)',
                WebkitMaskSize: '100% 100%'
              }}
              priority
            />
          </div>
          {/* 30% transparent masonic blue overlay */}
          <div className={`absolute inset-0 ${heroContent.backgroundOverlay}`}></div>
        </div>
      </div>
    </div>
  );
}