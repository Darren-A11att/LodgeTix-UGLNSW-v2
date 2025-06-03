// Single source of truth for Supabase clients
// This file ensures we never create duplicate Supabase client instances

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/shared/types/database';
import { api } from '@/lib/api-logger';

// Environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// Service role key removed for security - use authenticated clients instead

// Note: Environment variables are validated when creating clients, not at module level
// This prevents build-time errors when env vars aren't available

// Singleton instances
let browserClientInstance: SupabaseClient<Database> | null = null;
let serverClientInstance: SupabaseClient<Database> | null = null;

// Track if we've already warned about mock client
let hasWarnedAboutMockClient = false;

// Map of DB table names for consistent access (snake_case)

// Schema constants
export const supabaseSchemas = {
  public: 'public',
  stripe: 'stripe',
  log: 'log',
};

// Complete table name mapping (snake_case)
export const supabaseTables = {
  // Core tables - these exist in the database
  events: 'events',
  packages: 'packages',
  event_tickets: 'event_tickets',
  grand_lodges: 'grand_lodges',
  lodges: 'lodges',
  masonic_profiles: 'masonic_profiles',
  memberships: 'memberships',
  organisations: 'organisations',
  locations: 'locations',
  attendees: 'attendees',
  attendee_events: 'attendee_events',
  tickets: 'tickets',
  user_roles: 'user_roles',
  registrations: 'registrations',
  customers: 'customers',
  contacts: 'contacts',
  display_scopes: 'display_scopes',
  eligibility_criteria: 'eligibility_criteria',
  
  // Additional tables added by migrations
  email_log: 'email_log',
  documents: 'documents',
  organisation_payouts: 'organisation_payouts',
  platform_transfers: 'platform_transfers',
  connected_account_payments: 'connected_account_payments',
  
  // Views
  auth_user_customer_view: 'auth_user_customer_view',
  memberships_view: 'memberships_view',
  registration_payments: 'registration_payments',
  registration_summary: 'registration_summary',
  registration_fee_summary: 'registration_fee_summary',
};

/**
 * Get a browser-side Supabase client (singleton pattern)
 */
export function getBrowserClient() {
  if (browserClientInstance) {
    return browserClientInstance;
  }
  
  // During build time, return a dummy client that won't crash the build
  if (typeof window === 'undefined') {
    if (!hasWarnedAboutMockClient) {
      console.warn('getBrowserClient called during SSR/build - returning mock client');
      hasWarnedAboutMockClient = true;
    }
    // Return a more complete mock that matches Supabase client structure with chainable query builder
    let isSingle = false;
    let isMaybeSingle = false;
    
    const mockQueryBuilder = {
      select: () => mockQueryBuilder,
      insert: () => mockQueryBuilder,
      update: () => mockQueryBuilder,
      delete: () => mockQueryBuilder,
      upsert: () => mockQueryBuilder,
      eq: () => mockQueryBuilder,
      neq: () => mockQueryBuilder,
      gt: () => mockQueryBuilder,
      gte: () => mockQueryBuilder,
      lt: () => mockQueryBuilder,
      lte: () => mockQueryBuilder,
      like: () => mockQueryBuilder,
      ilike: () => mockQueryBuilder,
      is: () => mockQueryBuilder,
      in: () => mockQueryBuilder,
      contains: () => mockQueryBuilder,
      containedBy: () => mockQueryBuilder,
      range: () => mockQueryBuilder,
      overlaps: () => mockQueryBuilder,
      match: () => mockQueryBuilder,
      not: () => mockQueryBuilder,
      or: () => mockQueryBuilder,
      filter: () => mockQueryBuilder,
      order: () => mockQueryBuilder,
      limit: () => mockQueryBuilder,
      single: () => { isSingle = true; return mockQueryBuilder; },
      maybeSingle: () => { isMaybeSingle = true; return mockQueryBuilder; },
      then: (resolve: any) => {
        // Return appropriate mock data based on query type
        if (isSingle || isMaybeSingle) {
          // For single queries, return null data (not found) instead of invalid data
          resolve({ data: null, error: null });
        } else {
          // For list queries, return empty array
          resolve({ data: [], error: null });
        }
      },
      catch: () => mockQueryBuilder,
      finally: (cb: any) => { cb(); return mockQueryBuilder; },
    };

    return {
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signInWithPassword: async () => ({ data: null, error: new Error('Not available during build') }),
        signOut: async () => ({ error: null }),
      },
      from: () => mockQueryBuilder,
    } as any as SupabaseClient<Database>;
  }
  
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Missing Supabase environment variables');
  }

  api.debug('Creating new browser Supabase client');
  browserClientInstance = createClient<Database>(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    }
  );
  
  return browserClientInstance;
}

/**
 * Get the browser-only Supabase client
 * For server-side usage, use createClient() from '@/utils/supabase/server'
 */
export function getSupabaseClient() {
  return getBrowserClient();
}

/**
 * Helper function to get a Supabase query with the correct table name casing
 * Note: This is for browser-only usage. For server-side, use createClient() from '@/utils/supabase/server'
 */
export function table(tableName: string) {
  const client = getSupabaseClient();
  if (!client) {
    console.error("Supabase client is not initialized when calling table().");
    throw new Error("Supabase client not initialized.");
  }
  // Normalize the table name to its snake_case version regardless of input case
  const normalizedName = 
    supabaseTables[tableName as keyof typeof supabaseTables] || tableName.toLowerCase();
  return client.from(normalizedName as keyof Database['public']['Tables']);
}

// Export getter function for browser client to prevent multiple instances
// This ensures the client is only created when actually needed
export const getSupabase = () => getBrowserClient();

// Removed deprecated getSupabaseAdmin function - use createClient() from '@/utils/supabase/server' instead

// For backward compatibility, export the getter as 'supabase'
// Note: Consumers should ideally use getBrowserClient() directly
export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get: (_, prop) => {
    const client = getBrowserClient();
    return client[prop as keyof SupabaseClient<Database>];
  }
});