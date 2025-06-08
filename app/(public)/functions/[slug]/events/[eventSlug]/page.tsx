import { notFound } from 'next/navigation'
import { EventDetails } from '@/components/event-details'
import { createClient } from '@/utils/supabase/server'
import { resolveFunctionSlug } from '@/lib/utils/function-slug-resolver'

interface EventDetailPageProps {
  params: Promise<{ slug: string; eventSlug: string }>
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { slug: functionSlug, eventSlug } = await params
  
  try {
    // Create server-side Supabase client
    const supabase = await createClient()
    
    // First, resolve the function slug to get the function ID
    const functionId = await resolveFunctionSlug(functionSlug)
    if (!functionId) {
      console.error('Function not found for slug:', functionSlug)
      notFound()
    }
    
    // Fetch the event by slug, ensuring it belongs to this function
    const { data: event, error } = await supabase
      .from('events')
      .select(`
        *,
        function:functions!function_id(*),
        location:locations!location_id(*)
      `)
      .eq('slug', eventSlug)
      .eq('function_id', functionId)
      .single()
    
    if (error || !event) {
      console.error('Event not found:', error)
      notFound()
    }
    
    // Transform the event data to match EventType
    const transformedEvent = {
      event_id: event.event_id,
      slug: event.slug,
      title: event.title,
      description: event.description,
      functionName: event.function?.name || '',
      functionSlug: functionSlug,
      eventStart: event.event_start,
      eventEnd: event.event_end,
      location: event.location?.place_name || '',
      imageUrl: event.image_url,
      type: event.type,
      category: event.category,
      dressCode: event.dress_code,
      regalia: event.regalia,
      eventIncludes: event.event_includes || [],
      importantInformation: event.important_information || [],
      price: event.price || 'View pricing',
      minPrice: 0, // Will be calculated from tickets if needed
      maxAttendees: event.max_attendees,
      isPublished: event.is_published,
      functionId: event.function_id,
    }
    
    // Render the EventDetails component
    return <EventDetails event={transformedEvent} functionSlug={functionSlug} />
  } catch (error) {
    console.error('Failed to load event details:', error)
    notFound()
  }
}
