import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Get list of all tables in the database
    const { data: tableData, error: tableError } = await supabase
      .rpc('get_tables');
    
    if (tableError) {
      // If RPC function doesn't exist, try an alternative approach
      const { data, error } = await supabase
        .from('pg_tables')
        .select('tablename')
        .eq('schemaname', 'public');
      
      if (error) {
        // If that fails too, use a simple check for our specific tables
        const results = {
          checks: [
            await checkTable('content'),
            await checkTable('content_features'),
            await checkTable('content_values')
          ]
        };
        return NextResponse.json(results);
      }
      
      return NextResponse.json({
        tables: data.map((t: any) => t.tablename)
      });
    }
    
    return NextResponse.json({
      tables: tableData
    });
  } catch (error) {
    console.error('Error checking tables:', error);
    return NextResponse.json({ error: 'Error checking tables' }, { status: 500 });
  }
}

// New POST endpoint to check if a specific table exists
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { query } = body;
    
    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }
    
    // Execute the provided SQL query
    const { data, error, status } = await supabase.rpc('execute_sql', { sql_query: query });
    
    if (error) {
      // If the RPC method doesn't exist, try a different approach
      // Check if the table exists using information_schema
      if (body.tableName) {
        const tableName = body.tableName;
        const { data: tableCheck, error: tableError } = await supabase
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_schema', 'public')
          .eq('table_name', tableName.toLowerCase())
          .single();
        
        if (tableError) {
          // Try a simpler check
          return NextResponse.json({
            exists: false,
            error: tableError.message,
            message: `Table check failed for ${tableName}`,
            details: await checkTable(tableName)
          });
        }
        
        return NextResponse.json({
          exists: !!tableCheck,
          table: tableName,
          data: tableCheck
        });
      }
      
      return NextResponse.json({
        success: false,
        error: error.message,
        status
      });
    }
    
    return NextResponse.json({
      success: true,
      data,
      query
    });
  } catch (error: any) {
    console.error('Error executing query:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'An error occurred',
    }, { status: 500 });
  }
}

async function checkTable(tableName: string) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    return {
      table: tableName,
      exists: !error,
      error: error ? error.message : null,
      sample: data
    };
  } catch (error: any) {
    return {
      table: tableName,
      exists: false,
      error: error.message
    };
  }
}