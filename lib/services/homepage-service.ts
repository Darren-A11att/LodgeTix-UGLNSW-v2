import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api-logger';
import { formatEventDate, formatEventTime } from '@/lib/event-facade';

// Grand Installation event ID from mapping document
const GRAND_INSTALLATION_ID = '307c2d85-72d5-48cf-ac94-082ca2a5d23d';

/**
 * Get the main Grand Installation event
 */
export async function getGrandInstallationEvent() {
  try {
    const { data, error } = await supabase
      .from('Events')
      .select('*')
      .eq('id', GRAND_INSTALLATION_ID)
      .single();

    if (error) {
      api.error('Error fetching Grand Installation event:', error);
      return null;
    }

    return transformEventData(data);
  } catch (error) {
    api.error('Exception fetching Grand Installation event:', error);
    return null;
  }
}

/**
 * Get event timeline for Grand Installation
 */
export async function getEventTimeline() {
  try {
    const { data, error } = await supabase
      .from('Events')
      .select('*')
      .eq('parentEventId', GRAND_INSTALLATION_ID)
      .eq('featured', true)
      .order('eventStart', { ascending: true })
      .limit(3);

    if (error) {
      api.error('Error fetching event timeline:', error);
      return [];
    }

    return data.map(transformEventData);
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
    const { data, error } = await supabase
      .from('Events')
      .select('*')
      .eq('featured', true)
      .order('eventStart', { ascending: true })
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
    eventStart: data.eventStart,
    date: data.date
  });

  const formattedTime = formatEventTime({
    eventStart: data.eventStart,
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
    imageUrl: data.imageUrl,
    date: formattedDate,
    time: formattedTime,
    price: data.price ? `$${data.price}` : "$0"
  };
}