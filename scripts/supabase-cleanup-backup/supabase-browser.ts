/**
 * This file sets up the Supabase client for client-side use
 * We're now using a singleton pattern to prevent multiple instances
 */

// Re-export everything from supabase-singleton to maintain backward compatibility
import { 
  supabase, 
  getSupabaseClient, 
  getBrowserClient as createBrowserClient,
  supabaseTables,
  supabaseSchemas,
  table
} from './supabase-singleton';
import { Database } from '@/shared/types/database';

export {
  supabase,
  createBrowserClient,
  supabaseTables,
  supabaseSchemas,
  table
};