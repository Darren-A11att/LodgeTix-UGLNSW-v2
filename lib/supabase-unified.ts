/**
 * Unified Supabase Client
 * Single source of truth for all Supabase client instances
 * Resolves multiple client creation issues and table name mapping conflicts
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/supabase/types';

// Environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate environment variables
if (!SUPABASE_URL) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}

if (!SUPABASE_ANON_KEY) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
}

// Global singleton instances to prevent multiple GoTrueClient instances
let browserClientInstance: SupabaseClient<Database> | null = null;
let serverClientInstance: SupabaseClient<Database> | null = null;

// Current database table names (snake_case after migration)
export const DB_TABLE_NAMES = {
  // Core tables
  events: 'events',
  attendees: 'attendees',
  registrations: 'registrations',
  customers: 'customers',
  tickets: 'tickets',
  
  // Event-related tables
  attendeeevents: 'attendeeevents',
  eventpackages: 'eventpackages',
  eventpackagetickets: 'eventpackagetickets',
  
  // Masonic tables
  masonicprofiles: 'masonicprofiles',
  organisationmemberships: 'organisationmemberships',
  grand_lodges: 'grand_lodges',
  lodges: 'lodges',
  
  // Package and ticket tables
  packages: 'packages',
  package_events: 'package_events',
  ticket_definitions: 'ticket_definitions',
  attendee_ticket_assignments: 'attendee_ticket_assignments',
  
  // Value-added services
  value_added_services: 'value_added_services',
  package_vas_options: 'package_vas_options',
  event_vas_options: 'event_vas_options',
  registration_vas: 'registration_vas',
  
  // Location and organization
  locations: 'locations',
  organisations: 'organisations',
  
  // Pricing
  price_tiers: 'price_tiers',
  ticket_type_price_tiers: 'ticket_type_price_tiers',
  fee_types: 'fee_types',
  event_fees: 'event_fees',
  
  // User management
  user_roles: 'user_roles',
  people: 'people',
  
  // Legacy compatibility - map old PascalCase names to snake_case
  Events: 'events',
  Attendees: 'attendees',
  Registrations: 'registrations',
  Customers: 'customers',
  Tickets: 'tickets',
  AttendeeEvents: 'attendeeevents',
  EventPackages: 'eventpackages',
  EventPackageTickets: 'eventpackagetickets',
  MasonicProfiles: 'masonicprofiles',
  OrganisationMemberships: 'organisationmemberships',
} as const;

// Schema constants
export const supabaseSchemas = {
  public: 'public',
  stripe: 'stripe',
  log: 'log',
} as const;

/**
 * Get browser-side Supabase client (singleton)
 * Uses anon key for client-side operations
 */
export function getBrowserClient(): SupabaseClient<Database> {
  // Return existing instance if available
  if (browserClientInstance) {
    return browserClientInstance;
  }
  
  // Ensure we're on the client side
  if (typeof window === 'undefined') {
    throw new Error('getBrowserClient() can only be called on the client side');
  }
  
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Missing Supabase environment variables for browser client');
  }

  // Development HMR support - store on window to persist across hot reloads
  if (process.env.NODE_ENV === 'development') {
    // @ts-ignore
    if (window.__supabaseBrowserClient) {
      // @ts-ignore
      browserClientInstance = window.__supabaseBrowserClient;
      return browserClientInstance;
    }
  }

  console.log('[Supabase] Creating new browser client instance');
  browserClientInstance = createClient<Database>(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      }
    }
  );
  
  // Store on window for HMR in development
  if (process.env.NODE_ENV === 'development') {
    // @ts-ignore
    window.__supabaseBrowserClient = browserClientInstance;
  }
  
  return browserClientInstance;
}

/**
 * Get server-side Supabase client (singleton)
 * Uses service role key for server-side operations
 */
export function getServerClient(): SupabaseClient<Database> {
  // Return existing instance if available
  if (serverClientInstance) {
    return serverClientInstance;
  }
  
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing Supabase environment variables for server client');
  }

  console.log('[Supabase] Creating new server client instance');
  serverClientInstance = createClient<Database>(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      }
    }
  );
  
  return serverClientInstance;
}

/**
 * Get the appropriate client based on environment
 */
export function getSupabaseClient(isServer = false): SupabaseClient<Database> {
  return isServer ? getServerClient() : getBrowserClient();
}

/**
 * Helper function to get a Supabase query with correct table name mapping
 * Automatically maps old PascalCase names to current snake_case names
 */
export function table(tableName: string, isServer = false) {
  const client = getSupabaseClient(isServer);
  const normalizedName = DB_TABLE_NAMES[tableName as keyof typeof DB_TABLE_NAMES] || tableName.toLowerCase();
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Supabase] Accessing table: "${normalizedName}" (input: "${tableName}")`);
  }
  
  return client.from(normalizedName);
}

// Export default browser client for backward compatibility
// This will be the primary export that replaces all other supabase imports
export const supabase = typeof window !== 'undefined' ? getBrowserClient() : null;

// For server-side admin operations
export const getSupabaseAdmin = getServerClient;

// Export table names for external use
export const supabaseTables = DB_TABLE_NAMES;