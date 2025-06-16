import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ functionId: string }> }
) {
  try {
    const { functionId } = await params;
    const supabase = await createClient();
    
    // Use RPC to get function details - now using function ID
    const { data, error } = await supabase
      .rpc('get_function_details', { p_function_id: functionId });

    if (error) {
      console.error('Error fetching function details:', error);
      return NextResponse.json(
        { error: 'Failed to fetch function details' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Function not found' },
        { status: 404 }
      );
    }

    // The RPC returns a structured object with function, events, packages, location, organiser
    const functionInfo = data.function;
    
    if (!functionInfo) {
      return NextResponse.json(
        { error: 'Function not found' },
        { status: 404 }
      );
    }

    // Return data in the format expected by FunctionType interface (snake_case)
    const transformedFunction = {
      function_id: functionInfo.function_id,
      name: functionInfo.name,
      slug: functionInfo.slug,
      description: functionInfo.description,
      image_url: functionInfo.image_url,
      start_date: functionInfo.start_date,
      end_date: functionInfo.end_date,
      location_id: functionInfo.location_id,
      organiser_id: functionInfo.organiser_id,
      events: data.events || [],
      packages: data.packages || [],
      location: data.location,
      organiser: data.organiser,
      registrationCount: 0,
      metadata: functionInfo.metadata || {},
      is_published: functionInfo.is_published
    };

    return NextResponse.json(transformedFunction);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}