import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Configuration - update these with your production database details
const SUPABASE_URL = process.env.PRODUCTION_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.PRODUCTION_SUPABASE_SERVICE_KEY || '';
const OUTPUT_FILE = path.join(__dirname, '..', 'supabase', 'seed.sql');

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Please set PRODUCTION_SUPABASE_URL and PRODUCTION_SUPABASE_SERVICE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Tables in dependency order
const tables = [
  { name: 'locations', schema: 'public' },
  { name: 'organisations', schema: 'public' },
  { name: 'contacts', schema: 'public', where: 'organisation_id IS NOT NULL' },
  { name: 'functions', schema: 'public' },
  { name: 'events', schema: 'public' },
  { name: 'event_tickets', schema: 'public' },
  { name: 'packages', schema: 'public' },
  { name: 'package_event_tickets', schema: 'public' },
  // Optionally include some sample data
  { name: 'customers', schema: 'public', limit: 10 },
  { name: 'registrations', schema: 'public', where: "status IN ('completed', 'confirmed')", limit: 10 },
  { name: 'attendees', schema: 'public', limit: 20 },
  { name: 'tickets', schema: 'public', limit: 50 },
];

async function generateInsertStatement(tableName: string, data: any[]): Promise<string> {
  if (data.length === 0) return '';

  const statements: string[] = [];
  
  for (const row of data) {
    const columns = Object.keys(row).filter(col => 
      !['created_at', 'updated_at'].includes(col) && 
      row[col] !== undefined
    );
    
    const values = columns.map(col => {
      const value = row[col];
      if (value === null) return 'NULL';
      if (typeof value === 'boolean') return value.toString();
      if (typeof value === 'number') return value.toString();
      if (typeof value === 'object') return `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`;
      // Escape single quotes in strings
      return `'${String(value).replace(/'/g, "''")}'`;
    });

    statements.push(
      `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')}) ON CONFLICT DO NOTHING;`
    );
  }

  return statements.join('\n');
}

async function extractSeedData() {
  let seedContent = `-- Seed data extracted from production database
-- Generated on: ${new Date().toISOString()}
-- This file respects foreign key dependencies

-- Disable triggers during import
SET session_replication_role = replica;

BEGIN;

`;

  for (const table of tables) {
    console.log(`Extracting data from ${table.schema}.${table.name}...`);
    
    let query = supabase.from(table.name).select('*');
    
    if (table.where) {
      // Apply WHERE clause - this is a simple implementation
      // In production, you'd want more sophisticated query building
      console.log(`  Applying filter: ${table.where}`);
    }
    
    if (table.limit) {
      query = query.limit(table.limit);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error(`Error extracting ${table.name}:`, error);
      continue;
    }
    
    if (data && data.length > 0) {
      seedContent += `\n-- ${table.name} (${data.length} rows)\n`;
      seedContent += await generateInsertStatement(table.name, data);
      seedContent += '\n';
      console.log(`  Extracted ${data.length} rows`);
    } else {
      console.log(`  No data found`);
    }
  }

  seedContent += `
COMMIT;

-- Re-enable triggers
SET session_replication_role = DEFAULT;

-- Reset sequences
DO $$
DECLARE
    seq RECORD;
    max_id BIGINT;
BEGIN
    FOR seq IN 
        SELECT 
            s.schemaname,
            s.sequencename,
            t.schemaname AS table_schema,
            t.tablename AS table_name,
            a.attname AS column_name
        FROM pg_sequences s
        JOIN pg_depend d ON d.objid = (s.schemaname||'.'||s.sequencename)::regclass
        JOIN pg_class c ON c.oid = d.refobjid
        JOIN pg_tables t ON t.tablename = c.relname
        JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = d.refobjsubid
        WHERE s.schemaname NOT IN ('pg_catalog', 'information_schema')
    LOOP
        EXECUTE format('SELECT COALESCE(MAX(%I), 1) FROM %I.%I', 
            seq.column_name, seq.table_schema, seq.table_name) INTO max_id;
        EXECUTE format('SELECT setval(''%I.%I'', %s)', 
            seq.schemaname, seq.sequencename, max_id);
    END LOOP;
END $$;
`;

  // Write to file
  fs.writeFileSync(OUTPUT_FILE, seedContent);
  console.log(`\nSeed file generated: ${OUTPUT_FILE}`);
}

// Run the extraction
extractSeedData().catch(console.error);