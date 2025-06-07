import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { getHomepageContentService } from "@/lib/content/homepage-content-service"

export async function CTASection() {
  // Get content from centralized content service
  const contentService = await getHomepageContentService()
  const ctaContent = await contentService.getCtaContent()
  return (
    <div className="overflow-hidden bg-gray-100 py-32">
      <div className="mx-auto max-w-7xl px-6 lg:flex lg:px-8">
        <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-12 gap-y-16 lg:mx-0 lg:max-w-none lg:min-w-full lg:flex-none lg:gap-y-8">
          <div className="lg:col-end-1 lg:w-full lg:max-w-lg lg:pb-8">
            <h2 className="text-4xl font-semibold tracking-tight text-masonic-navy sm:text-5xl">
              {ctaContent.title}
            </h2>
            <p className="mt-6 text-xl/8 text-gray-700">
              {ctaContent.description}
            </p>
            <p className="mt-6 text-base/7 text-gray-600">
              {ctaContent.secondaryDescription}
            </p>
            <div className="mt-10 flex">
              <Button asChild className="bg-masonic-navy hover:bg-masonic-blue text-white">
                <Link href={ctaContent.button.href}>
                  {ctaContent.button.text} <span aria-hidden="true">&rarr;</span>
                </Link>
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap items-start justify-end gap-6 sm:gap-8 lg:contents">
            <div className="w-0 flex-auto lg:ml-auto lg:w-auto lg:flex-none lg:self-end">
              <Image
                alt={ctaContent.images[0].alt}
                src={ctaContent.images[0].url}
                width={592}
                height={400}
                className={ctaContent.images[0].className}
              />
            </div>
            <div className="contents lg:col-span-2 lg:col-end-2 lg:ml-auto lg:flex lg:w-[37rem] lg:items-start lg:justify-end lg:gap-x-8">
              <div className="order-first flex w-64 flex-none justify-end self-end lg:w-auto">
                <Image
                  alt={ctaContent.images[1].alt}
                  src={ctaContent.images[1].url}
                  width={768}
                  height={604}
                  className={ctaContent.images[1].className}
                />
              </div>
              <div className="flex w-96 flex-auto justify-end lg:w-auto lg:flex-none">
                <Image
                  alt={ctaContent.images[2].alt}
                  src={ctaContent.images[2].url}
                  width={1152}
                  height={842}
                  className={ctaContent.images[2].className}
                />
              </div>
              <div className="hidden sm:block sm:w-0 sm:flex-auto lg:w-auto lg:flex-none">
                <Image
                  alt={ctaContent.images[3].alt}
                  src={ctaContent.images[3].url}
                  width={768}
                  height={604}
                  className={ctaContent.images[3].className}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}