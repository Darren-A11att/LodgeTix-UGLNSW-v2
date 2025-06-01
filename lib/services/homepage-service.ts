import { createClient } from '@/utils/supabase/server';
import { api } from '@/lib/api-logger';
import { formatEventDate, formatEventTime } from '@/lib/event-facade';
import type { Database } from '@/shared/types/database';

/**
 * Get the featured function for the homepage
 * Uses FEATURED_FUNCTION_ID from environment variables or falls back to the first function
 */
export async function getGrandInstallationEvent() {
  try {
    const supabase = await createClient();
    
    // Try to get function from environment variable first
    const featuredFunctionId = process.env.FEATURED_FUNCTION_ID;
    
    if (featuredFunctionId) {
      const { data: functionData, error } = await supabase
        .from('functions')
        .select('*, location:locations(*)')
        .eq('function_id', featuredFunctionId)
        .eq('is_published', true)
        .single();
        
      if (!error && functionData) {
        // Just map the field names
        return {
          id: functionData.function_id,
          event_id: functionData.function_id,
          title: functionData.name,
          subtitle: '',
          description: functionData.description,
          date: formatEventDate({ event_start: functionData.start_date }),
          time: formatEventTime({ event_start: functionData.start_date }),
          location: functionData.location?.place_name || 'TBD',
          imageUrl: functionData.image_url,
          image_url: functionData.image_url,
          logo: '/placeholder.svg?height=120&width=120',
          slug: functionData.slug,
          organiser: 'United Grand Lodge of NSW & ACT',
          event_start: functionData.start_date,
          event_end: functionData.end_date
        };
      }
    }
    
    // Fall back to the first published function
    const { data: firstFunction, error } = await supabase
      .from('functions')
      .select('*, location:locations(*)')
      .eq('is_published', true)
      .order('start_date', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!error && firstFunction) {
      return {
        id: firstFunction.function_id,
        event_id: firstFunction.function_id,
        title: firstFunction.name,
        subtitle: '',
        description: firstFunction.description,
        date: formatEventDate({ event_start: firstFunction.start_date }),
        time: formatEventTime({ event_start: firstFunction.start_date }),
        location: firstFunction.location?.place_name || 'TBD',
        imageUrl: firstFunction.image_url,
        image_url: firstFunction.image_url,
        logo: '/placeholder.svg?height=120&width=120',
        slug: firstFunction.slug,
        organiser: 'United Grand Lodge of NSW & ACT',
        event_start: firstFunction.start_date,
        event_end: firstFunction.end_date
      };
    }

    return null;
  } catch (error) {
    api.error('Exception fetching featured function:', error);
    return null;
  }
}

/**
 * Get event timeline - events belonging to the featured function
 */
export async function getEventTimeline() {
  try {
    const supabase = await createClient();
    const mainFunction = await getGrandInstallationEvent();
    
    if (!mainFunction) {
      api.warn('No function found for timeline');
      return [];
    }

    // Get events for this function
    const { data, error } = await supabase
      .from("events")
      .select(`
        event_id,
        slug,
        title,
        subtitle,
        description,
        event_start,
        event_end,
        image_url,
        featured,
        type,
        organiser_id,
        locations (
          place_name,
          street_address,
          suburb,
          state,
          postal_code
        ),
        organisations (
          name
        )
      `)
      .eq("function_id", mainFunction.id)
      .eq('is_published', true)
      .order("event_start", { ascending: true })
      .limit(8);

    if (error) {
      api.error('Error fetching event timeline:', error);
      return [];
    }

    // Transform to match expected format
    return (data || []).map(event => {
      const locationString = event.locations ? 
        `${event.locations.place_name}, ${event.locations.suburb}, ${event.locations.state}` : 
        'TBD';
      
      return transformEventData({
        event_id: event.event_id,
        slug: event.slug,
        title: event.title,
        subtitle: event.subtitle,
        description: event.description,
        event_start: event.event_start,
        event_end: event.event_end,
        image_url: event.image_url,
        location_string: locationString,
        organiser_name: event.organisations?.name || 'TBD',
        featured: event.featured,
        type: event.type
      });
    });
  } catch (error) {
    api.error('Exception fetching event timeline:', error);
    return [];
  }
}

/**
 * Get featured events for homepage
 * Note: This function is not currently used - FeaturedEventsSection uses EventRPCService directly
 */
export async function getFeaturedEvents() {
  try {
    const supabase = await createClient();
    const featuredFunctionId = process.env.FEATURED_FUNCTION_ID;
    
    // Build query for events
    let query = supabase
      .from("events")
      .select(`
        event_id,
        slug,
        title,
        subtitle,
        description,
        event_start,
        event_end,
        image_url,
        featured,
        type,
        organiser_id,
        locations (
          place_name,
          street_address,
          suburb,
          state,
          postal_code
        ),
        organisations (
          name
        )
      `)
      .eq('featured', true)
      .eq('is_published', true)
      .order("event_start", { ascending: true })
      .limit(3);
    
    // Filter by function if specified
    if (featuredFunctionId) {
      query = query.eq('function_id', featuredFunctionId);
    }

    const { data, error } = await query;

    if (error) {
      api.error('Error fetching featured events:', error);
      return [];
    }

    // Transform to match expected format
    return (data || []).map(event => {
      const locationString = event.locations ? 
        `${event.locations.place_name}, ${event.locations.suburb}, ${event.locations.state}` : 
        'TBD';
      
      return transformEventData({
        event_id: event.event_id,
        slug: event.slug,
        title: event.title,
        subtitle: event.subtitle,
        description: event.description,
        event_start: event.event_start,
        event_end: event.event_end,
        image_url: event.image_url,
        location_string: locationString,
        organiser_name: event.organisations?.name || 'TBD',
        featured: event.featured,
        type: event.type
      });
    });
  } catch (error) {
    api.error('Exception fetching featured events:', error);
    return [];
  }
}

/**
 * Transform raw event data to homepage format
 */
function transformEventData(data: any) {
  if (!data) return null;
  
  // Validate data structure
  if (typeof data !== 'object' || Array.isArray(data) || !data.event_id) {
    api.error('Invalid event data structure in transformEventData:', data);
    return null;
  }

  const formattedDate = formatEventDate({
    event_start: data.event_start,
    date: data.date
  });

  const formattedTime = formatEventTime({
    event_start: data.event_start,
    time: data.time
  });

  return {
    id: data.event_id,
    event_id: data.event_id, // Include both for compatibility
    slug: data.slug || `event-${data.event_id}`,
    title: data.title || 'Untitled Event',
    subtitle: data.subtitle || '',
    description: data.description || '',
    organiser: data.organiser || data.organiser_name || 'TBD',
    location: data.location_string || 'TBD',
    image_url: data.image_url || null,
    imageUrl: data.image_url || null, // For compatibility with EventCard component
    date: formattedDate,
    time: formattedTime,
    price: data.price ? `$${data.price}` : "$0",
    parent_event_id: data.parent_event_id || null,
    event_start: data.event_start,
    event_end: data.event_end
  };
}