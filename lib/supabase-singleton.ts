// Single source of truth for Supabase clients
// This file ensures we never create duplicate Supabase client instances

import { createClient } from '@supabase/supabase-js';
import { Database } from '@/shared/types/supabase';
import { api } from '@/lib/api-logger';

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

// Singleton instances
let browserClientInstance: ReturnType<typeof createClient> | null = null;
let serverClientInstance: ReturnType<typeof createClient> | null = null;

// Map of original DB table names to their actual PascalCase names
export const DB_TABLE_NAMES = {
  events: 'Events',
  display_scopes: 'DisplayScopes',
  displayScopes: 'DisplayScopes',
  eventDays: 'EventDays',
  event_days: 'EventDays',
  customers: 'Customers',
  masons: 'Masons',
  guests: 'Guests',
  contacts: 'Contacts',
  registrations: 'Registrations',
  tickets: 'Tickets',
  masonic_profiles: 'MasonicProfiles',
  masonicProfiles: 'MasonicProfiles',
  ticketDefinitions: 'TicketDefinitions',
  ticket_definitions: 'TicketDefinitions'
};

// Schema constants
export const supabaseSchemas = {
  public: 'public',
  stripe: 'stripe',
  log: 'log',
};

// Complete table name mapping
export const supabaseTables = {
  events: 'Events',
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
  masonicProfiles: 'MasonicProfiles',
  organisationMemberships: 'OrganisationMemberships',
  organisations: 'organisations',
  locations: 'locations',
  attendees: 'Attendees',
  tickets: 'Tickets',
  priceTiers: 'price_tiers',
  ticketTypePriceTiers: 'ticket_type_price_tiers',
  feeTypes: 'fee_types',
  eventFees: 'event_fees',
  userRoles: 'user_roles',
  registrations: 'Registrations',
  customers: 'Customers',
  people: 'people',

  // Stripe Tables
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

  // Log Tables
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
  const normalizedName = DB_TABLE_NAMES[tableName as keyof typeof DB_TABLE_NAMES] || tableName;
  return client.from(normalizedName);
}

// Export default browser client for backwards compatibility
export const supabase = getBrowserClient();