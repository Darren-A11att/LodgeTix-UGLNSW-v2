import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"

export function CTASection() {
  return (
    <div className="overflow-hidden bg-gray-100 py-32">
      <div className="mx-auto max-w-7xl px-6 lg:flex lg:px-8">
        <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-12 gap-y-16 lg:mx-0 lg:max-w-none lg:min-w-full lg:flex-none lg:gap-y-8">
          <div className="lg:col-end-1 lg:w-full lg:max-w-lg lg:pb-8">
            <h2 className="text-4xl font-semibold tracking-tight text-masonic-navy sm:text-5xl">
              Join Our Community
            </h2>
            <p className="mt-6 text-xl/8 text-gray-700">
              Become part of a tradition that spans centuries. Experience the brotherhood, ceremony, and fellowship 
              that makes Freemasonry a cornerstone of community life.
            </p>
            <p className="mt-6 text-base/7 text-gray-600">
              From intimate lodge meetings to grand installations, our events offer opportunities to connect with 
              like-minded individuals, participate in meaningful ceremonies, and contribute to charitable causes 
              that make a difference in our communities.
            </p>
            <div className="mt-10 flex">
              <Button asChild className="bg-masonic-navy hover:bg-masonic-blue text-white">
                <Link href="/functions">
                  Explore Events <span aria-hidden="true">&rarr;</span>
                </Link>
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap items-start justify-end gap-6 sm:gap-8 lg:contents">
            <div className="w-0 flex-auto lg:ml-auto lg:w-auto lg:flex-none lg:self-end">
              <Image
                alt="Masonic ceremony in progress"
                src="/placeholder.svg?height=400&width=592&text=Ceremony"
                width={592}
                height={400}
                className="aspect-7/5 w-[37rem] max-w-none rounded-2xl bg-gray-50 object-cover"
              />
            </div>
            <div className="contents lg:col-span-2 lg:col-end-2 lg:ml-auto lg:flex lg:w-[37rem] lg:items-start lg:justify-end lg:gap-x-8">
              <div className="order-first flex w-64 flex-none justify-end self-end lg:w-auto">
                <Image
                  alt="Lodge meeting with brethren"
                  src="/placeholder.svg?height=604&width=768&text=Lodge+Meeting"
                  width={768}
                  height={604}
                  className="aspect-4/3 w-[24rem] max-w-none flex-none rounded-2xl bg-gray-50 object-cover"
                />
              </div>
              <div className="flex w-96 flex-auto justify-end lg:w-auto lg:flex-none">
                <Image
                  alt="Masonic charitable work"
                  src="/placeholder.svg?height=842&width=1152&text=Charity+Work"
                  width={1152}
                  height={842}
                  className="aspect-7/5 w-[37rem] max-w-none flex-none rounded-2xl bg-gray-50 object-cover"
                />
              </div>
              <div className="hidden sm:block sm:w-0 sm:flex-auto lg:w-auto lg:flex-none">
                <Image
                  alt="Historic lodge building"
                  src="/placeholder.svg?height=604&width=768&text=Historic+Lodge"
                  width={768}
                  height={604}
                  className="aspect-4/3 w-[24rem] max-w-none rounded-2xl bg-gray-50 object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}