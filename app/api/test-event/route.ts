import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action') || 'find-proclamation'
  
  try {
    if (action === 'list-all') {
      // List all events
      const { data, error } = await supabase
        .from('events')
        .select('event_id, slug, title, is_published, event_start')
        .order('created_at', { ascending: false })
        .limit(10)
      
      if (error) {
        return NextResponse.json({ 
          success: false, 
          error: error.message,
          details: error 
        }, { status: 500 })
      }
      
      return NextResponse.json({ 
        success: true, 
        count: data?.length || 0,
        events: data || [],
        message: `Found ${data?.length || 0} events`
      })
    } else if (action === 'search-proclamation') {
      // Search for any event with 'proclamation' in the title
      const { data, error } = await supabase
        .from('events')
        .select('event_id, slug, title, is_published')
        .ilike('title', '%proclamation%')
      
      if (error) {
        return NextResponse.json({ 
          success: false, 
          error: error.message,
          details: error 
        }, { status: 500 })
      }
      
      return NextResponse.json({ 
        success: true, 
        count: data?.length || 0,
        events: data || [],
        message: `Found ${data?.length || 0} events with 'proclamation' in title`
      })
    } else {
      // Default: find by slug
      const { data, error } = await supabase
        .from('events')
        .select('event_id, slug, title, is_published')
        .eq('slug', 'grand-proclamation-2025')
        .single()
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows found"
        return NextResponse.json({ 
          success: false, 
          error: error.message,
          details: error 
        }, { status: 500 })
      }
      
      return NextResponse.json({ 
        success: true, 
        event: data,
        message: data ? 'Event found!' : 'Event not found in database'
      })
    }
  } catch (err) {
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to query database',
      details: err 
    }, { status: 500 })
  }
}