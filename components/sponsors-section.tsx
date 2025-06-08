import Image from "next/image"
import { getHomepageContentService } from "@/lib/content/homepage-content-service"

export async function SponsorsSection() {
  // Get content from centralized content service
  const contentService = await getHomepageContentService()
  const sponsorsContent = await contentService.getSponsorsContent()
  return (
    <div className="hidden sm:block bg-gray-100 py-24 sm:py-32">
      <div className="w-full px-6 lg:px-12 xl:px-20">
        <h2 className="text-center text-lg/8 font-semibold text-masonic-navy mb-10">
          {sponsorsContent.title}
        </h2>
        <div className="flex items-center justify-evenly">
          {sponsorsContent.items.map((sponsor: any, index: number) => (
            <div
              key={sponsor.name}
              className="flex items-center justify-center"
            >
              <Image
                alt={sponsor.alt || sponsor.name}
                src={sponsor.logo}
                width={250}
                height={250}
                className="h-auto w-full max-w-[150px] lg:max-w-[180px] xl:max-w-[200px] object-contain"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}