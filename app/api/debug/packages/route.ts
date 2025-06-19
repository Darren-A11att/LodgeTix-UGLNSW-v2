import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { functionId } = await request.json();
    console.log('[DEBUG] Checking packages for function:', functionId);
    
    const supabase = await createClient();
    
    // Direct query to packages table
    const { data: packagesTable, error: packagesError } = await supabase
      .from('packages')
      .select('*')
      .eq('function_id', functionId);
    
    console.log('[DEBUG] Direct packages table query:', {
      count: packagesTable?.length || 0,
      error: packagesError,
      packages: packagesTable
    });
    
    // Try the materialized view
    const { data: viewData, error: viewError } = await supabase
      .from('function_packages_view')
      .select('*')
      .eq('function_id', functionId);
    
    console.log('[DEBUG] Function packages view query:', {
      count: viewData?.length || 0,
      error: viewError,
      view: viewData
    });
    
    // Try the RPC function
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('get_function_packages_ultra_fast', {
        p_function_id: functionId,
        p_registration_type: null,
        p_attendee_type: null,
        p_max_price: null,
        p_limit: 50,
        p_offset: 0
      });
    
    console.log('[DEBUG] RPC function query:', {
      data: rpcData,
      error: rpcError
    });
    
    return NextResponse.json({
      functionId,
      packagesTable: {
        count: packagesTable?.length || 0,
        data: packagesTable,
        error: packagesError
      },
      functionPackagesView: {
        count: viewData?.length || 0,
        data: viewData,
        error: viewError
      },
      rpcFunction: {
        data: rpcData,
        error: rpcError
      }
    });
    
  } catch (error) {
    console.error('[DEBUG] Error:', error);
    return NextResponse.json(
      { error: 'Debug query failed', details: error },
      { status: 500 }
    );
  }
}