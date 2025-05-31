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
  events: 'events',
  packages: 'packages',
  packageEvents: 'package_events',
  ticketDefinitions: 'ticket_definitions',
  attendeeTicketAssignments: 'attendee_ticket_assignments',
  valueAddedServices: 'value_added_services',
  packageVasOptions: 'package_vas_options',
  eventVasOptions: 'event_vas_options',
  registrationVas: 'registration_vas',
  grandLodges: 'grand_lodges',
  lodges: 'lodges',
  masonicProfiles: 'masonic_profiles',
  organisationMemberships: 'organisation_memberships',
  organisations: 'organisations',
  locations: 'locations',
  attendees: 'attendees',
  tickets: 'tickets',
  priceTiers: 'price_tiers',
  ticketTypePriceTiers: 'ticket_type_price_tiers',
  feeTypes: 'fee_types',
  eventFees: 'event_fees',
  userRoles: 'user_roles',
  registrations: 'registrations',
  customers: 'customers',
  people: 'people',

  // Stripe Tables (now in 'stripe' schema, ensure snake_case)
  stripeCustomers: 'stripe_customers',
  stripeTaxCodes: 'stripe_tax_codes',
  stripeTaxRates: 'stripe_tax_rates',
  stripeCoupons: 'stripe_coupons',
  stripePromotionCodes: 'stripe_promotion_codes',
  stripeProducts: 'stripe_products',
  stripeDiscounts: 'stripe_discounts',
  stripeQuotes: 'stripe_quotes',
  stripePrices: 'stripe_prices',
  stripeQuoteLineItems: 'stripe_quote_line_items',
  stripeInvoices: 'stripe_invoices',
  stripeInvoiceLineItems: 'stripe_invoice_line_items',

  // Log Tables (now in 'log' schema, ensure snake_case)
  tableRenameLog: 'table_rename_log',
  columnRenameLog: 'column_rename_log',
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
 * @deprecated The getServerClient function has been removed for security reasons.
 * Use createServerClient() from '@/utils/supabase/server' instead.
 */
export function getServerClient() {
  throw new Error(
    'getServerClient() has been removed for security reasons. ' +
    'Please use createServerClient() from @/utils/supabase/server instead, ' +
    'which respects Row Level Security (RLS) policies.'
  );
}

/**
 * Get the appropriate client based on environment
 */
export function getSupabaseClient(isServer = false) {
  if (isServer) {
    throw new Error(
      'Server-side Supabase client with service role has been removed for security. ' +
      'Please use createServerClient() from @/utils/supabase/server instead.'
    );
  }
  return getBrowserClient();
}

/**
 * Helper function to get a Supabase query with the correct table name casing
 */
export function table(tableName: string, isServer = false) {
  const client = getSupabaseClient(isServer);
  if (!client) {
    // This case should ideally not happen if clients are initialized correctly
    // and called after initialization.
    console.error("Supabase client is not initialized when calling table(). isServer:", isServer);
    throw new Error("Supabase client not initialized.");
  }
  // Normalize the table name to its snake_case version regardless of input case
  const normalizedName = 
    supabaseTables[tableName as keyof typeof supabaseTables] || tableName.toLowerCase();
  // console.log(`Accessing table via singleton: "${normalizedName}" (original input: "${tableName}")`); // Optional: for debugging
  return client.from(normalizedName as keyof Database['public']['Tables']);
}

// Export getter function for browser client to prevent multiple instances
// This ensures the client is only created when actually needed
export const getSupabase = () => getBrowserClient();

/**
 * @deprecated The getSupabaseAdmin function has been removed for security reasons.
 * Use createServerClient() from '@/utils/supabase/server' instead.
 */
export const getSupabaseAdmin = () => {
  throw new Error(
    'getSupabaseAdmin() has been removed for security reasons. ' +
    'Please use createServerClient() from @/utils/supabase/server instead, ' +
    'which respects Row Level Security (RLS) policies.'
  );
};

// For backward compatibility, export the getter as 'supabase'
// Note: Consumers should ideally use getBrowserClient() directly
export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get: (_, prop) => {
    const client = getBrowserClient();
    return client[prop as keyof SupabaseClient<Database>];
  }
});