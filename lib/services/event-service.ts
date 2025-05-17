import { createClient } from '@supabase/supabase-js'
import { DB_TABLE_NAMES } from '@/lib/supabase'
import { notFound } from 'next/navigation'

// Server-side Supabase client - uses service role key
const getServerSupabase = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    }
  })
}

export interface Event {
  id: string
  slug: string
  title: string
  description: string
  date: string
  location: string
  imageUrl: string
  price: string
  organizer?: string
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
  const supabase = getServerSupabase()
  
  let query = supabase
    .from(DB_TABLE_NAMES.events)
    .select(`
      *,
      tickets:${DB_TABLE_NAMES.tickets}(*)
    `)
  
  // Check if it's a UUID
  if (isUUID(idOrSlug)) {
    query = query.eq('id', idOrSlug)
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
    id: data.id,
    slug: data.slug,
    title: data.title,
    description: data.description,
    date: data.date,
    location: data.location,
    imageUrl: data.image_url || '/placeholder.svg',
    price: data.price || '$0',
    organizer: data.organizer,
    category: data.category,
    status: data.status,
    ticketsSold: data.tickets_sold,
    revenue: data.revenue,
    dressCode: data.dress_code,
    regalia: data.regalia,
    degreeType: data.degree_type,
    tickets: data.tickets,
    longDescription: data.long_description,
    time: data.time
  }
}

export async function getEventTickets(eventId: string): Promise<Ticket[]> {
  const supabase = getServerSupabase()
  
  const { data, error } = await supabase
    .from(DB_TABLE_NAMES.tickets)
    .select('*')
    .eq('event_id', eventId)
    .order('price', { ascending: true })
  
  if (error) {
    console.error('Error fetching tickets:', error)
    return []
  }
  
  return data || []
}

export async function getPublishedEvents(): Promise<Event[]> {
  const supabase = getServerSupabase()
  
  const { data, error } = await supabase
    .from(DB_TABLE_NAMES.events)
    .select('*')
    .eq('status', 'Published')
    .order('date', { ascending: true })
  
  if (error) {
    console.error('Error fetching events:', error)
    return []
  }
  
  return data.map(event => ({
    id: event.id,
    slug: event.slug,
    title: event.title,
    description: event.description,
    date: event.date,
    location: event.location,
    imageUrl: event.image_url || '/placeholder.svg',
    price: event.price || '$0',
    organizer: event.organizer,
    category: event.category,
    status: event.status,
    ticketsSold: event.tickets_sold,
    revenue: event.revenue,
    dressCode: event.dress_code,
    regalia: event.regalia,
    degreeType: event.degree_type,
    longDescription: event.long_description,
    time: event.time
  }))
}