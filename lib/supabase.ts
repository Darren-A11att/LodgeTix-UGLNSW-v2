/**
 * Main Supabase client export file
 * Re-exports everything from supabase-singleton for backward compatibility
 */

// Re-export everything from the singleton implementation
export {
  supabase,
  getBrowserClient,
  getSupabaseClient,
  supabaseTables,
  supabaseSchemas,
  table,
  getSupabase
} from './supabase-singleton';

// Type exports
export type { Database } from '@/shared/types/database';
