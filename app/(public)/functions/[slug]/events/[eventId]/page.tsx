import { notFound } from 'next/navigation'

interface EventDetailPageProps {
  params: Promise<{ slug: string; eventId: string }>
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { slug, eventId } = await params
  
  return (
    <div>
      <h1>Event: {eventId}</h1>
      <p>Function: {slug}</p>
      <p>This page will show event details</p>
    </div>
  )
}
