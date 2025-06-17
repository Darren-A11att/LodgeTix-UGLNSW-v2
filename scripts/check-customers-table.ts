import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

if (!supabaseUrl) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL environment variable is required');
  process.exit(1);
}
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function checkCustomersTable() {
  console.log('🔍 Checking customers table structure...');
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // Get table structure
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error querying customers table:', error);
    } else {
      console.log('✅ Customers table accessible');
      if (data.length > 0) {
        console.log('📄 Sample record structure:');
        console.log(Object.keys(data[0]));
      } else {
        console.log('📄 Table is empty, checking via information_schema...');
        
        // Query column information
        const { data: columns, error: colError } = await supabase
          .rpc('get_table_columns', { table_name: 'customers' });
        
        if (colError) {
          console.log('⚠️  get_table_columns RPC not available, using direct query...');
          
          // Direct query to get columns
          const query = `
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'customers' 
            AND table_schema = 'public'
            ORDER BY ordinal_position;
          `;
          
          const { data: directColumns, error: directError } = await supabase
            .from('information_schema.columns')
            .select('column_name, data_type, is_nullable')
            .eq('table_name', 'customers')
            .eq('table_schema', 'public');
          
          if (directError) {
            console.error('❌ Error getting column info:', directError);
          } else {
            console.log('📋 Customers table columns:');
            directColumns.forEach(col => {
              console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
            });
          }
        } else {
          console.log('📋 Customers table columns:', columns);
        }
      }
    }
  } catch (error) {
    console.error('💥 Error:', error);
  }
}

checkCustomersTable().then(() => {
  console.log('🏁 Table check completed');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});