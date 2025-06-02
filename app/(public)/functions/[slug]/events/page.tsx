import { notFound } from 'next/navigation'

interface FunctionEventsPageProps {
  params: Promise<{ slug: string }>
}

export default async function FunctionEventsPage({ params }: FunctionEventsPageProps) {
  const { slug } = await params
  
  return (
    <div>
      <h1>Events for Function: {slug}</h1>
      <p>This page will list all events for this function</p>
    </div>
  )
}
