import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Use environment variables for configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Map of DB table names for consistent access after the snake_case migration
// The tables have been renamed from PascalCase to snake_case
export const DB_TABLE_NAMES = {
  // Old PascalCase/camelCase names mapping to new snake_case names
  Events: 'events',
  DisplayScopes: 'display_scopes',
  EventDays: 'event_days',
  Customers: 'customers',
  Masons: 'masons',
  Guests: 'guests',
  Contacts: 'contacts',
  Registrations: 'registrations',
  Tickets: 'tickets',
  MasonicProfiles: 'masonic_profiles',
  TicketDefinitions: 'ticket_definitions',
  
  // Also include the snake_case versions mapping to themselves for consistency
  events: 'events',
  display_scopes: 'display_scopes',
  event_days: 'event_days',
  customers: 'customers',
  masons: 'masons',
  guests: 'guests',
  contacts: 'contacts',
  registrations: 'registrations',
  tickets: 'tickets',
  masonic_profiles: 'masonic_profiles',
  ticket_definitions: 'ticket_definitions'
};

// Verify that environment variables are correctly loaded
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Check your .env file.');
  // Consider throwing an error or handling this case more robustly
  // depending on your application's needs.
}

// Create and export the Supabase client
// Add a type assertion or check to satisfy TypeScript if needed, 
// especially if strict null checks are enabled.
export const supabase = createClient(
  supabaseUrl!, 
  supabaseAnonKey!,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    }
    // Important: Supabase API uses the actual table names as defined in the database
    // Our tables are now in snake_case, and column names have also been migrated to snake_case
  }
);

/**
 * Helper function to get a Supabase query with the correct table name casing
 * This provides a consistent interface after the DB migration to snake_case tables
 * 
 * IMPORTANT: Our database tables have been migrated from PascalCase to snake_case.
 * When using this function:
 * 1. Table names will be normalized to their proper snake_case version
 *    (e.g., "Registrations" or "registrations" -> "registrations")
 * 2. Column names have also been migrated to snake_case and must match the schema
 *    - Old: "registrationId" -> New: "registration_id"
 *    - Old: "firstName" -> New: "first_name"
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