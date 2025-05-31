import { createClient } from '@/utils/supabase/server'
import { Database } from '@/shared/types/database'
import { notFound } from 'next/navigation'

export interface Event {
  id: string
  slug: string
  title: string
  description: string
  date: string
  location: string
  imageUrl: string
  price: string
  organiser?: string
  category?: string
  status?: "Published" | "Draft" | "Members Only"
  ticketsSold?: number
  revenue?: string
  dressCode?: string
  regalia?: string
  degreeType?: string
  tickets?: Ticket[]
  longDescription?: string
  time?: string
}

export interface Ticket {
  id: string
  event_id: string
  name: string
  price: number
  available: boolean
  description?: string
  quantity?: number
  max_per_order?: number
  min_per_order?: number
}

function isUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

export async function getEventByIdOrSlug(idOrSlug: string): Promise<Event | null> {
  const supabase = await createClient()
  
  let query = supabase
    .from('events')
    .select(`
      *,
      tickets:Tickets(*)
    `)
  
  // Check if it's a UUID
  if (isUUID(idOrSlug)) {
    query = query.eq('event_id', idOrSlug)
  } else {
    query = query.eq('slug', idOrSlug)
  }
  
  const { data, error } = await query.single()
  
  if (error) {
    console.error('Error fetching event:', error)
    return null
  }
  
  // Transform the data to match our Event interface
  return {
    id: data.event_id,
    slug: data.slug,
    title: data.title,
    description: data.description,
    date: data.event_start ? new Date(data.event_start).toISOString().split('T')[0] : '',
    location: data.location || '',
    imageUrl: data.image_url || '/placeholder.svg',
    price: data.price ? `$${data.price}` : '$0',
    organiser: data.organiser_name,
    category: data.type,
    status: data.is_published ? "Published" : "Draft",
    ticketsSold: 0, // Not available in current schema
    revenue: '$0', // Not available in current schema
    dressCode: data.dress_code,
    regalia: data.regalia,
    degreeType: data.degree_type,
    tickets: data.tickets,
    longDescription: data.description,
    time: data.event_start ? new Date(data.event_start).toLocaleTimeString() : ''
  }
}

export async function getEventTickets(eventId: string): Promise<Ticket[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('event_id', eventId)
    .order('price_paid', { ascending: true })
  
  if (error) {
    console.error('Error fetching tickets:', error)
    return []
  }
  
  return data || []
}

export async function getPublishedEvents(): Promise<Event[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('is_published', true)
    .order('event_start', { ascending: true })
  
  if (error) {
    console.error('Error fetching events:', error)
    return []
  }
  
  return data.map(event => ({
    id: event.event_id,
    slug: event.slug,
    title: event.title,
    description: event.description,
    date: event.event_start ? new Date(event.event_start).toISOString().split('T')[0] : '',
    location: event.location || '',
    imageUrl: event.image_url || '/placeholder.svg',
    price: event.price ? `$${event.price}` : '$0',
    organizer: event.organizer_name,
    category: event.type,
    status: event.is_published ? "Published" : "Draft",
    ticketsSold: 0, // Not available in current schema
    revenue: '$0', // Not available in current schema
    dressCode: event.dress_code,
    regalia: event.regalia,
    degreeType: event.degree_type,
    longDescription: event.description,
    time: event.event_start ? new Date(event.event_start).toLocaleTimeString() : ''
  }))
}