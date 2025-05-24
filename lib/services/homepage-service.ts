import { getBrowserClient } from '@/lib/supabase-singleton';
import { api } from '@/lib/api-logger';
import { formatEventDate, formatEventTime } from '@/lib/event-facade';

/**
 * Get the next upcoming event (parent or child)
 * First tries to get a parent event, then falls back to any event
 */
export async function getGrandInstallationEvent() {
  try {
    const supabase = getBrowserClient();
    const now = new Date().toISOString();
    
    // First try to get the soonest upcoming parent event
    const { data: parentEvent, error: parentError } = await supabase
      .from("events")
      .select('*')
      .is('parent_event_id', null)  // Parent events only
      .eq('is_published', true)      // Published events only
      .gte('event_end', now)         // Not yet ended
      .order('event_start', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!parentError && parentEvent) {
      return transformEventData(parentEvent);
    }

    // If no parent event found, get ANY upcoming event
    const { data: anyEvent, error: anyError } = await supabase
      .from("events")
      .select('*')
      .eq('is_published', true)      // Published events only
      .gte('event_end', now)         // Not yet ended
      .order('event_start', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (anyError) {
      api.error('Error fetching any upcoming event:', anyError);
      return null;
    }

    return anyEvent ? transformEventData(anyEvent) : null;
  } catch (error) {
    api.error('Exception fetching upcoming event:', error);
    return null;
  }
}

/**
 * Get event timeline - either child events of a parent, or upcoming events
 */
export async function getEventTimeline() {
  try {
    const supabase = getBrowserClient();
    const mainEvent = await getGrandInstallationEvent();
    
    if (!mainEvent) {
      api.warn('No events found for timeline');
      return [];
    }

    // If it's a parent event, get its children
    if (!mainEvent.parent_event_id) {
      const { data, error } = await supabase
        .from("events")
        .select('*')
        .eq("parent_event_id", mainEvent.id)
        .eq('is_published', true)
        .order("event_start", { ascending: true })
        .limit(8);

      if (!error && data && data.length > 0) {
        return data.map(transformEventData);
      }
    }

    // Otherwise, get upcoming events (excluding the main one)
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("events")
      .select('*')
      .eq('is_published', true)
      .gte('event_end', now)
      .neq('id', mainEvent.id)  // Exclude the main event
      .order("event_start", { ascending: true })
      .limit(3);

    if (error) {
      api.error('Error fetching event timeline:', error);
      return [];
    }

    return (data || []).map(transformEventData);
  } catch (error) {
    api.error('Exception fetching event timeline:', error);
    return [];
  }
}

/**
 * Get featured events for homepage
 */
export async function getFeaturedEvents() {
  try {
    const supabase = getBrowserClient();
    const { data, error } = await supabase
      .from("events")
      .select('*')
      .eq('featured', true)
      .order("event_start", { ascending: true })
      .limit(3);

    if (error) {
      api.error('Error fetching featured events:', error);
      return [];
    }

    return data.map(transformEventData);
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

  const formattedDate = formatEventDate({
    event_start: data.event_start,
    date: data.date
  });

  const formattedTime = formatEventTime({
    event_start: data.event_start,
    time: data.time
  });

  return {
    id: data.id,
    slug: data.slug,
    title: data.title,
    subtitle: data.subtitle,
    description: data.description,
    organiser: data.organiser || data.organizer_name,
    location: data.location,
    image_url: data.image_url,
    imageUrl: data.image_url, // For compatibility with EventCard component
    date: formattedDate,
    time: formattedTime,
    price: data.price ? `$${data.price}` : "$0",
    parent_event_id: data.parent_event_id,
    event_start: data.event_start,
    event_end: data.event_end
  };
}