import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { functionId: string } }
) {
  try {
    const supabase = await createClient();
    
    // Use RPC to get function details - now using function ID
    const { data, error } = await supabase
      .rpc('get_function_details', { p_function_id: params.functionId });

    if (error) {
      console.error('Error fetching function details:', error);
      return NextResponse.json(
        { error: 'Failed to fetch function details' },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'Function not found' },
        { status: 404 }
      );
    }

    // The RPC returns an array, but we expect a single function
    const functionData = data[0];

    // Transform the data to match the FunctionType interface
    const transformedFunction = {
      id: functionData.function_id,
      name: functionData.name,
      slug: functionData.slug,
      description: functionData.description,
      imageUrl: functionData.image_url,
      startDate: functionData.start_date,
      endDate: functionData.end_date,
      locationId: functionData.location_id,
      organiserId: functionData.organiser_id,
      events: functionData.events || [],
      packages: functionData.packages || [],
      location: functionData.location,
      registrationCount: functionData.registration_count || 0,
      metadata: functionData.metadata || {},
      isPublished: functionData.is_published
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