import TicketsPageClient from './page-client'

export default async function TicketsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  return <TicketsPageClient id={id} />
}