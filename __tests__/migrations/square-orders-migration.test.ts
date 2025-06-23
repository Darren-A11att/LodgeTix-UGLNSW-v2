import { createClient } from '@supabase/supabase-js';

// Test database connection
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

describe('Square Orders Migration - Database Schema', () => {
  let supabase: any;

  beforeAll(() => {
    supabase = createClient(supabaseUrl, supabaseServiceKey);
  });

  describe('packages table', () => {
    it('should have catalog_object_id column', async () => {
      const { data, error } = await supabase
        .from('packages')
        .select('catalog_object_id')
        .limit(1);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it('should have quantity column (renamed from qty)', async () => {
      const { data, error } = await supabase
        .from('packages')
        .select('quantity')
        .limit(1);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it('should not have qty column anymore', async () => {
      const { data, error } = await supabase
        .from('packages')
        .select('qty')
        .limit(1);

      expect(error).toBeTruthy();
      expect(error.code).toBe('42703'); // Column does not exist
    });
  });

  describe('event_tickets table', () => {
    it('should have catalog_object_id column', async () => {
      const { data, error } = await supabase
        .from('event_tickets')
        .select('catalog_object_id')
        .limit(1);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });
  });

  describe('Column constraints', () => {
    it('packages.catalog_object_id should allow NULL values', async () => {
      const { data: columns } = await supabase.rpc('get_column_info', {
        table_name: 'packages',
        column_name: 'catalog_object_id'
      });

      expect(columns?.[0]?.is_nullable).toBe('YES');
    });

    it('packages.quantity should have default value of 1', async () => {
      const { data: columns } = await supabase.rpc('get_column_info', {
        table_name: 'packages',
        column_name: 'quantity'
      });

      expect(columns?.[0]?.column_default).toContain('1');
    });
  });
});

// Helper RPC function that needs to be created in the database
const GET_COLUMN_INFO_RPC = `
CREATE OR REPLACE FUNCTION get_column_info(table_name text, column_name text)
RETURNS TABLE (
  column_name text,
  data_type text,
  is_nullable text,
  column_default text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.column_name::text,
    c.data_type::text,
    c.is_nullable::text,
    c.column_default::text
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
    AND c.table_name = $1
    AND c.column_name = $2;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
`;