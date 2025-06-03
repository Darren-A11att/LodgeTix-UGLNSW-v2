import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ functionId: string }> }
) {
  try {
    // Await params as required in Next.js 15
    const { functionId } = await params;
    
    // Use server client - let RLS handle access control
    const supabase = await createClient();
    
    console.log('[API] Fetching packages for function_id:', functionId);
    
    // Query the function_packages_view which should have proper RLS policies
    const { data: packages, error } = await supabase
      .from('function_packages_view')
      .select('*')
      .eq('function_id', functionId)
      .order('package_name');

    if (error) {
      console.error('[API] Error fetching packages:', error);
      return NextResponse.json(
        { error: 'Failed to fetch packages', details: error.message },
        { status: 500 }
      );
    }

    console.log(`[API] Found ${packages?.length || 0} packages for function ${functionId}`);
    
    // Transform the view data to match the expected format
    const transformedPackages = (packages || []).map((pkg: any) => {
      // Extract registration types from eligibility criteria if present
      let registrationTypes: string[] = ['individual', 'lodge', 'delegation']; // Default to all types
      
      // If package has eligibility criteria, parse it to determine allowed registration types
      if (pkg.eligibility_criteria && typeof pkg.eligibility_criteria === 'object') {
        const criteria = pkg.eligibility_criteria;
        
        // Check if there's a specific registration_types field in the criteria
        if (criteria.registration_types && Array.isArray(criteria.registration_types)) {
          registrationTypes = criteria.registration_types;
        }
        // Otherwise, infer from rules if present
        else if (criteria.rules && Array.isArray(criteria.rules)) {
          // Look for registration_type rules
          const registrationTypeRule = criteria.rules.find((rule: any) => 
            rule.type === 'registration_type'
          );
          if (registrationTypeRule && registrationTypeRule.value) {
            // If there's a specific registration type rule, use it
            registrationTypes = Array.isArray(registrationTypeRule.value) 
              ? registrationTypeRule.value 
              : [registrationTypeRule.value];
          }
        }
      }
      
      return {
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
        registration_types: registrationTypes,
        event_id: pkg.event_id,
        created_at: pkg.package_created_at,
        updated_at: pkg.package_updated_at
      };
    });

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