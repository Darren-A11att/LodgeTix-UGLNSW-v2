import Image from "next/image"
import { getHomepageContentService } from "@/lib/content/homepage-content-service"

export async function SponsorsSection() {
  // Get content from centralized content service
  const contentService = await getHomepageContentService()
  const sponsorsContent = await contentService.getSponsorsContent()
  return (
    <div className="bg-gray-100 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <h2 className="text-center text-lg/8 font-semibold text-masonic-navy">
          {sponsorsContent.title}
        </h2>
        <div className="mx-auto mt-10 grid max-w-lg grid-cols-4 items-center gap-x-8 gap-y-10 sm:max-w-xl sm:grid-cols-6 sm:gap-x-10 lg:mx-0 lg:max-w-none lg:grid-cols-5">
          {sponsorsContent.items.map((sponsor: any, index: number) => (
            <div
              key={sponsor.name}
              className="col-span-2 max-h-12 w-full object-contain lg:col-span-1"
            >
              <Image
                alt={sponsor.alt || sponsor.name}
                src={sponsor.logo}
                width={158}
                height={48}
                className="h-12 w-full object-contain filter brightness-0 opacity-60 hover:opacity-80 transition-opacity"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}