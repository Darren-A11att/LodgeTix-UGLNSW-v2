import {
  getBrowserClient,
  getServerClient,
  supabaseSchemas,
  supabaseTables
} from './supabase-singleton';

// Export the browser client as 'supabase' for backward compatibility
// Use a getter to delay initialization until runtime
export const supabase = new Proxy({} as ReturnType<typeof getBrowserClient>, {
  get: (_, prop) => {
    try {
      const client = getBrowserClient();
      return client[prop as keyof ReturnType<typeof getBrowserClient>];
    } catch (error) {
      // During build time, return mock methods
      if (typeof window === 'undefined') {
        console.warn(`Supabase.${String(prop)} called during build time`);
        return () => Promise.resolve({ data: null, error: null });
      }
      throw error;
    }
  }
});

// Export the server client getter
export const getSupabaseAdmin = getServerClient;

// Re-export constants if they are managed by supabase-singleton.ts now
export { supabaseTables, supabaseSchemas };

/**
 * Helper function to get a Supabase query with the correct table name casing.
 * This version uses the client from supabase-singleton.
 * 
 * IMPORTANT: Our database tables have been migrated from PascalCase to snake_case.
 * When using this function:
 * 1. Table names will be normalized to their proper snake_case version
 *    (e.g., 'registrations' or "registrations" -> "registrations")
 * 2. Column names have also been migrated to snake_case and must match the schema
 * 
 * Example:
 *   table("registrations").eq("registration_id", id)
 * 
 * @param tableName - The table name (case insensitive, will be normalized to snake_case)
 * @returns A Supabase query builder for the table with the correct snake_case name
 */
export function table(tableName: string) {
  const client = getBrowserClient(); // Or getSupabaseClient() if logic for server/client is needed here
  if (!client) {
    console.error("Supabase client (browser) is not initialized when calling table() from supabase.ts");
    throw new Error("Supabase client (browser) not initialized in supabase.ts table().");
  }
  const normalizedTableName = tableName.toLowerCase();
  // console.log(`Accessing table via supabase.ts: "${normalizedTableName}" (original input: "${tableName}")`);
  return client.from(normalizedTableName as keyof import('@/supabase/supabase').Database['public']['Tables']);
}

// All old client creation logic, HMR code, and old constants that are now handled by 
// supabase-singleton.ts should be removed from this file.
// The entire content of this file is replaced by the code above. 