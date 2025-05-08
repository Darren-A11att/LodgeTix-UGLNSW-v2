import Link from "next/link"
import Image from "next/image"
import { CalendarDays, MapPin } from "lucide-react"

import { Button } from "@/components/ui/button"

interface FeaturedEventProps {
  title: string
  description: string
  date: string
  location: string
  imageUrl: string
  price: string
}

export function FeaturedEvent({ title, description, date, location, imageUrl, price }: FeaturedEventProps) {
  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-lg">
      <div className="grid md:grid-cols-2">
        <div className="relative min-h-[300px]">
          <Image src={imageUrl || "/placeholder.svg"} alt={title} fill className="object-cover" />
        </div>
        <div className="flex flex-col justify-center p-6">
          <div className="mb-2 inline-block rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-800">
            Featured
          </div>
          <h3 className="mb-3 text-2xl font-bold">{title}</h3>
          <p className="mb-4 text-gray-600">{description}</p>
          <div className="mb-4 space-y-2">
            <div className="flex items-center text-gray-500">
              <CalendarDays className="mr-2 h-5 w-5" />
              <span>{date}</span>
            </div>
            <div className="flex items-center text-gray-500">
              <MapPin className="mr-2 h-5 w-5" />
              <span>{location}</span>
            </div>
          </div>
          <div className="mb-4 text-xl font-bold">{price}</div>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/events/grand-installation/register">Register Now</Link>
            </Button>
            <Button variant="outline">Learn More</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
