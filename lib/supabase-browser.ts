/**
 * This file sets up the Supabase client for client-side use
 * We're now using a singleton pattern to prevent multiple instances
 */

// Re-export everything from supabase-singleton to maintain backward compatibility
import { 
  supabase, 
  DB_TABLE_NAMES, 
  getSupabaseClient, 
  getBrowserClient as createBrowserClient,
  supabaseTables,
  supabaseSchemas,
  table
} from './supabase-singleton';
import { Database } from '@/supabase/types';

export {
  supabase,
  DB_TABLE_NAMES,
  createBrowserClient,
  supabaseTables,
  supabaseSchemas,
  table
};