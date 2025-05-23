// Single source of truth for Supabase clients
// This file ensures we never create duplicate Supabase client instances

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/supabase/types';
import { api } from '@/lib/api-logger';

// Environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Note: Environment variables are validated when creating clients, not at module level
// This prevents build-time errors when env vars aren't available

// Singleton instances
let browserClientInstance: SupabaseClient<Database> | null = null;
let serverClientInstance: SupabaseClient<Database> | null = null;

// Map of DB table names for consistent access (snake_case)
export const DB_TABLE_NAMES = {
  // Old PascalCase/camelCase names mapping to new snake_case names
  Events: 'events',
  DisplayScopes: 'displayscopes',
  Customers: 'customers',
  Registrations: 'registrations',
  Tickets: 'tickets',
  Attendees: 'attendees',
  AttendeeEvents: 'attendeeevents',
  EventTickets: 'eventtickets',
  EventPackages: 'eventpackages',
  EventPackageTickets: 'eventpackagetickets',
  MasonicProfiles: 'masonicprofiles',
  OrganisationMemberships: 'organisationmemberships',
  
  // snake_case versions mapping to themselves for consistency
  events: 'events',
  display_scopes: 'displayscopes', // Corrected from displayScopes
  customers: 'customers',
  registrations: 'registrations',
  tickets: 'tickets',
  attendees: 'attendees',
  attendeeevents: 'attendeeevents',
  eventtickets: 'eventtickets',
  eventpackages: 'eventpackages',
  eventpackagetickets: 'eventpackagetickets',
  masonicprofiles: 'masonicprofiles', // Corrected from masonicProfiles
  organisationmemberships: 'organisationmemberships',

  // Added from lib/supabase.ts (ensure comprehensive coverage)
  EventDays: 'event_days', // Added
  eventDays: 'event_days', // Added, alias
  event_days: 'event_days', // Added, snake_case
  Masons: 'masons', // Added
  masons: 'masons', // Added, snake_case
  Guests: 'guests', // Added
  guests: 'guests', // Added, snake_case
  Contacts: 'contacts', // Added
  contacts: 'contacts', // Added, snake_case
  TicketDefinitions: 'ticket_definitions', // Added
  ticketDefinitions: 'ticket_definitions', // Added, alias
  ticket_definitions: 'ticket_definitions' // Added, snake_case
};

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
 * Get a server-side Supabase client with service role (singleton pattern)
 */
export function getServerClient() {
  if (serverClientInstance) {
    return serverClientInstance;
  }
  
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing Supabase environment variables for server client');
  }

  api.debug('Creating new server Supabase client');
  serverClientInstance = createClient(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      }
    }
  );
  
  return serverClientInstance;
}

/**
 * Get the appropriate client based on environment
 */
export function getSupabaseClient(isServer = false) {
  return isServer ? getServerClient() : getBrowserClient();
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
    DB_TABLE_NAMES[tableName as keyof typeof DB_TABLE_NAMES] || tableName.toLowerCase();
  // console.log(`Accessing table via singleton: "${normalizedName}" (original input: "${tableName}")`); // Optional: for debugging
  return client.from(normalizedName as keyof Database['public']['Tables']);
}

// Export getter function for browser client to prevent multiple instances
// This ensures the client is only created when actually needed
export const getSupabase = () => getBrowserClient();

// For backward compatibility, export the getter as 'supabase'
// Note: Consumers should ideally use getBrowserClient() directly
export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get: (_, prop) => {
    const client = getBrowserClient();
    return client[prop as keyof SupabaseClient<Database>];
  }
});