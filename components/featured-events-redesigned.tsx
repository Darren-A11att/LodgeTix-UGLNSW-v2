import Link from "next/link"
import Image from "next/image"
import { formatCurrency } from "@/lib/formatters"
import { getHomepageContentService } from "@/lib/content/homepage-content-service"

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export async function FeaturedEventsRedesigned() {
  // Get content from centralized content service
  const contentService = await getHomepageContentService()
  const eventsContent = await contentService.getFeaturedEventsContent()
  
  // Use the events data from content service (handles database vs fallback)
  const eventsForDisplay = eventsContent.eventsData
    
  return (
    <div className="bg-white">
      <div className="mx-auto max-w-2xl px-4 py-24 sm:px-6 sm:py-32 lg:max-w-7xl lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-4xl font-semibold tracking-tight text-masonic-navy sm:text-5xl">{eventsContent.title}</h2>
          <p className="mt-4 text-lg text-gray-600">
            {eventsContent.description}
          </p>
        </div>

        <div className="mt-16 space-y-16">
          {eventsForDisplay.map((event: any, eventIdx: number) => (
            <div
              key={event.id}
              className="flex flex-col-reverse lg:grid lg:grid-cols-12 lg:items-center lg:gap-x-8"
            >
              <div
                className={classNames(
                  eventIdx % 2 === 0 ? 'lg:col-start-1' : 'lg:col-start-6 xl:col-start-7',
                  'mt-6 lg:col-span-7 lg:row-start-1 lg:mt-0 xl:col-span-6',
                )}
              >
                <h3 className="text-lg font-medium text-masonic-navy">{event.title}</h3>
                <p className="mt-2 text-base/7 text-gray-500">{event.description}</p>
                <div className="mt-3 text-base/7 text-gray-500">
                  <time>{event.date}</time>
                  {event.location && (
                    <>
                      <span className="mx-2">•</span>
                      <span>{event.location}</span>
                    </>
                  )}
                </div>
              </div>
              <div
                className={classNames(
                  eventIdx % 2 === 0 ? 'lg:col-start-8 xl:col-start-7' : 'lg:col-start-1',
                  'flex-auto lg:col-span-5 lg:row-start-1 xl:col-span-6',
                )}
              >
                <div className="relative aspect-[4/3] w-full rounded-lg bg-gray-100 overflow-hidden">
                  <Image
                    alt={event.title}
                    src={event.imageUrl}
                    fill
                    className={classNames(
                      "object-cover",
                      event.imagePosition === 'top' && 'object-top',
                      event.imagePosition === 'bottom' && 'object-bottom',
                      event.imagePosition === 'left' && 'object-left',
                      event.imagePosition === 'right' && 'object-right',
                      event.imagePosition === 'center' && 'object-center',
                      (!event.imagePosition || event.imagePosition === 'center') && 'object-center'
                    )}
                    style={{
                      maskImage: 'linear-gradient(to bottom, black, black)',
                      maskSize: '100% 100%',
                      WebkitMaskImage: 'linear-gradient(to bottom, black, black)',
                      WebkitMaskSize: '100% 100%'
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-16 text-center">
          <Link
            href={eventsContent.viewAllButton.href}
            className="inline-flex items-center justify-center rounded-md bg-masonic-navy px-6 py-3 text-base font-medium text-white hover:bg-masonic-blue transition-colors"
          >
            {eventsContent.viewAllButton.text}
            <span aria-hidden="true" className="ml-2">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}