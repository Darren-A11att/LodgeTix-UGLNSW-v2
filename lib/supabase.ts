import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/supabase/types';

// Client-side configuration (publicly available)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Server-side configuration (should be kept secret)
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Map of DB table names for consistent access after the snake_case migration
// The tables have been renamed from PascalCase to snake_case
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
  
  // Also include the snake_case versions mapping to themselves for consistency
  events: 'events',
  displayscopes: 'displayscopes',
  customers: 'customers',
  registrations: 'registrations',
  tickets: 'tickets',
  attendees: 'attendees',
  attendeeevents: 'attendeeevents',
  eventtickets: 'eventtickets',
  eventpackages: 'eventpackages',
  eventpackagetickets: 'eventpackagetickets',
  masonicprofiles: 'masonicprofiles',
  organisationmemberships: 'organisationmemberships'
};

// Verify that environment variables are correctly loaded
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase public environment variables. Check your .env file (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY).');
  // Consider throwing an error or handling this case more robustly
  // depending on your application's needs.
}

// Client-side Supabase client (uses ANON key)

// Ensure a single instance of Supabase client in development (HMR)
let supabaseSingleton: SupabaseClient | null = null;

if (typeof window !== 'undefined') { // Ensure this only runs on the client-side
  if (process.env.NODE_ENV === 'development') {
    // @ts-ignore
    if (!global._supabaseClient) {
      // @ts-ignore
      global._supabaseClient = createClient<Database>(
        supabaseUrl!,
        supabaseAnonKey!,
        {
          auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
          }
        }
      );
      console.log("New Supabase client created and attached to global for HMR.");
    }
    // @ts-ignore
    supabaseSingleton = global._supabaseClient;
  } else {
    // In production, or if not in development, just create it normally if not already done
    if (!supabaseSingleton) {
      supabaseSingleton = createClient<Database>(
        supabaseUrl!,
        supabaseAnonKey!,
        {
          auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
          }
        }
      );
    }
  }
}

export const supabase = supabaseSingleton!;

// Server-side Supabase client (uses SERVICE_ROLE key for admin operations)
// This client should ONLY be used in server-side code (e.g., API routes)
let supabaseAdminSingleton: SupabaseClient | null = null;

export const getSupabaseAdmin = () => {
  if (supabaseAdminSingleton) {
    return supabaseAdminSingleton;
  }

  if (!supabaseUrl) {
    console.error('CRITICAL: Missing Supabase URL for admin client.');
    throw new Error('Supabase URL is not configured for admin client.');
  }
  if (!supabaseServiceRoleKey) {
    console.error('CRITICAL: Missing Supabase Service Role Key for admin client. Ensure SUPABASE_SERVICE_ROLE_KEY is set in your server environment.');
    // In a production environment, you might want to throw an error or have a more robust fallback.
    // For now, we'll log the error and the app might not function correctly regarding admin DB operations.
    throw new Error('Supabase Service Role Key is not configured.'); 
  }

  supabaseAdminSingleton = createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false, // Not needed for service role
      persistSession: false    // Not needed for service role
    }
  });
  console.log("Supabase Admin client initialized.");
  return supabaseAdminSingleton;
};

/**
 * Helper function to get a Supabase query with the correct table name casing
 * This provides a consistent interface after the DB migration to snake_case tables
 * 
 * IMPORTANT: This function uses the CLIENT-SIDE (anon key) Supabase instance.
 * For server-side admin operations, use `getSupabaseAdmin().from(...)` directly.
 * 
 * IMPORTANT: Our database tables have been migrated from PascalCase to snake_case.
 * When using this function:
 * 1. Table names will be normalized to their proper snake_case version
 *    (e.g., "Registrations" or "registrations" -> "registrations")
 * 2. Column names have also been migrated to snake_case and must match the schema
 *    - Old: "registration_id" -> New: "registration_id"
 *    - Old: "first_name" -> New: "first_name"
 * 
 * Example:
 *   // Correct (uses snake_case for both table and column names)
 *   table("registrations").eq("registration_id", id)
 *   table("attendees").eq("first_name", "John")
 * 
 * @param tableName - The table name (case insensitive, will be normalized to snake_case)
 * @returns A Supabase query builder for the table with the correct snake_case name
 */
export function table(tableName: string) {
  // Normalize the table name to its snake_case version regardless of input case
  const normalizedTableName = 
    DB_TABLE_NAMES[tableName as keyof typeof DB_TABLE_NAMES] || tableName.toLowerCase();
  console.log(`Accessing table: "${normalizedTableName}" (original input: "${tableName}")`);
  return supabase.from(normalizedTableName);
}

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

  // Stripe Tables (now in 'stripe' schema, but listing names here might still be useful)
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

  // Log Tables (now in 'log' schema)
  tableRenameLog: 'table_rename_log',
  columnRenameLog: 'column_rename_log',
  // Add other log tables if needed for constants
};

// You might want to define schema constants too
export const supabaseSchemas = {
  public: 'public',
  stripe: 'stripe',
  log: 'log',
}; 