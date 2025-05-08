import Link from "next/link"
import Image from "next/image"
import { CalendarDays, MapPin } from "lucide-react"

import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface EventCardProps {
  id: string
  title: string
  description: string
  date: string
  location: string
  imageUrl: string
  price: string
}

export function EventCard({ id, title, description, date, location, imageUrl, price }: EventCardProps) {
  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <div className="relative h-48 w-full">
        <Image src={imageUrl || "/placeholder.svg"} alt={title} fill className="object-cover" />
      </div>
      <CardContent className="p-4">
        <h3 className="mb-2 text-xl font-bold">{title}</h3>
        <p className="mb-4 text-sm text-gray-600 line-clamp-2">{description}</p>
        <div className="space-y-2">
          <div className="flex items-center text-sm text-gray-500">
            <CalendarDays className="mr-2 h-4 w-4" />
            <span>{date}</span>
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <MapPin className="mr-2 h-4 w-4" />
            <span>{location}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between border-t p-4">
        <span className="font-bold">{price}</span>
        <Button asChild size="sm" className="bg-masonic-navy hover:bg-masonic-blue">
          <Link href={`/events/${id}?interested=true`}>View Details</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
