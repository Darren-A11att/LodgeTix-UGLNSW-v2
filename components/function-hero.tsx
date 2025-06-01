import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import type { FunctionType } from '@/shared/types'

interface FunctionHeroProps {
  function: FunctionType
}

export function FunctionHero({ function: fn }: FunctionHeroProps) {
  const eventCount = fn.events?.length || 0
  const startDate = new Date(fn.startDate)
  const endDate = new Date(fn.endDate)
  const durationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

  return (
    <div className="relative h-full min-h-[600px]">
      {fn.imageUrl && (
        <img 
          src={fn.imageUrl} 
          alt={fn.name} 
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60 flex items-center justify-center">
        <div className="text-white text-center max-w-4xl px-4">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">{fn.name}</h1>
          <p className="text-xl md:text-2xl mb-2">
            {format(startDate, 'MMMM d')} - {format(endDate, 'MMMM d, yyyy')}
          </p>
          <p className="text-lg md:text-xl mb-8">
            {eventCount} events over {durationDays} days
          </p>
          {fn.description && (
            <p className="text-lg mb-8 max-w-2xl mx-auto">
              {fn.description}
            </p>
          )}
          <Link href={`/functions/${fn.slug}`}>
            <Button size="lg" className="text-lg px-8 py-4 bg-masonic-gold text-masonic-navy hover:bg-masonic-lightgold">
              View Details & Register
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}