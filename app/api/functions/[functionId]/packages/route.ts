import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { functionId: string } }
) {
  try {
    // Use server client - let RLS handle access control
    const supabase = await createClient();
    
    console.log('[API] Fetching packages for function_id:', params.functionId);
    
    // Query the function_packages_view which should have proper RLS policies
    const { data: packages, error } = await supabase
      .from('function_packages_view')
      .select('*')
      .eq('function_id', params.functionId)
      .order('package_name');

    if (error) {
      console.error('[API] Error fetching packages:', error);
      return NextResponse.json(
        { error: 'Failed to fetch packages', details: error.message },
        { status: 500 }
      );
    }

    console.log(`[API] Found ${packages?.length || 0} packages for function ${params.functionId}`);
    
    // Transform the view data to match the expected format
    const transformedPackages = (packages || []).map((pkg: any) => ({
      package_id: pkg.package_id,
      name: pkg.package_name,
      description: pkg.package_description,
      package_price: pkg.package_price,
      original_price: pkg.original_price,
      discount: pkg.discount,
      function_id: pkg.function_id,
      is_active: pkg.is_active,
      qty: pkg.qty,
      included_items: pkg.included_items,
      includes_description: pkg.includes_description,
      eligibility_criteria: pkg.eligibility_criteria,
      registration_types: pkg.registration_types,
      event_id: pkg.event_id,
      created_at: pkg.package_created_at,
      updated_at: pkg.package_updated_at
    }));

    return NextResponse.json({ 
      packages: transformedPackages,
      count: transformedPackages.length 
    });
  } catch (error) {
    console.error('[API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}