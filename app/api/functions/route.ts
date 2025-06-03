import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import type { Database } from '@/shared/types/database';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get all published functions with their events and packages
    const { data: functions, error } = await supabase
      .from('functions')
      .select(`
        *,
        events!function_id(
          event_id,
          title,
          subtitle,
          slug,
          event_start,
          event_end,
          is_published
        ),
        packages!function_id(
          package_id,
          name,
          description,
          package_price,
          is_active
        ),
        location:locations!location_id(
          location_id,
          name,
          city,
          state
        )
      `)
      .eq('is_published', true)
      .order('start_date', { ascending: true });

    if (error) {
      console.error('Error fetching functions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch functions' },
        { status: 500 }
      );
    }

    // Transform the data to match the FunctionType interface
    const transformedFunctions = functions?.map(func => ({
      id: func.function_id,
      name: func.name,
      slug: func.slug,
      description: func.description,
      imageUrl: func.image_url,
      startDate: func.start_date,
      endDate: func.end_date,
      locationId: func.location_id,
      organiserId: func.organiser_id,
      events: func.events || [],
      packages: func.packages || [],
      location: func.location,
      registrationCount: 0, // This would need to be calculated separately
      metadata: func.metadata || {}
    }));

    return NextResponse.json(transformedFunctions || []);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}