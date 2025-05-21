import fs from 'fs';
import path from 'path';
import { supabase } from '../lib/supabase';

async function setupContentTables() {
  console.log('Setting up content tables...');

  try {
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, '..', 'supabase', 'migrations', '20250521-content-tables.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf-8');

    // Execute the SQL statements
    const { error } = await supabase.rpc('execute_sql', { sql: sqlContent });

    if (error) {
      console.error('Error executing SQL:', error);
      return;
    }

    console.log('Content tables setup successfully!');
  } catch (error) {
    console.error('Error setting up content tables:', error);
  }
}

// Run the function
setupContentTables().catch(console.error);