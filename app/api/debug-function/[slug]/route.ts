import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = await createClient();
    
    const result = {
      slug,
      timestamp: new Date().toISOString(),
      functionLookup: null as any,
      eventLookup: null as any,
      authentication: null as any,
      error: null as any
    };
    
    // Test function lookup
    try {
      const { data: functionData, error: functionError } = await supabase
        .from('functions')
        .select('function_id, slug, name, is_published')
        .eq('slug', slug)
        .eq('is_published', true)
        .single();
      
      result.functionLookup = {
        data: functionData,
        error: functionError?.message || null,
        found: !!functionData
      };
    } catch (error: any) {
      result.functionLookup = {
        error: error.message,
        found: false
      };
    }
    
    // Test event lookup
    try {
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select(`
          event_id,
          function_id,
          slug,
          is_published,
          functions!inner (
            function_id,
            slug,
            name,
            is_published
          )
        `)
        .eq('slug', slug)
        .eq('is_published', true)
        .eq('functions.is_published', true)
        .single();
      
      result.eventLookup = {
        data: eventData,
        error: eventError?.message || null,
        found: !!eventData
      };
    } catch (error: any) {
      result.eventLookup = {
        error: error.message,
        found: false
      };
    }
    
    // Test authentication
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      result.authentication = {
        authenticated: !!user,
        userId: user?.id || null,
        error: authError?.message || null
      };
    } catch (error: any) {
      result.authentication = {
        authenticated: false,
        error: error.message
      };
    }
    
    return NextResponse.json(result);
    
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}