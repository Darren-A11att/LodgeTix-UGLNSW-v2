/**
 * This file sets up the Supabase client for client-side use
 */
import { createClient } from '@supabase/supabase-js'
import { Database } from '../shared/types/supabase'

// Environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Table name mapping for consistent querying
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
}

// Schema constants
export const supabaseSchemas = {
  public: 'public',
  stripe: 'stripe',
  log: 'log',
}

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
}

// Create a Supabase client for browser usage
export const createBrowserClient = () => {
  return createClient<Database>(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    }
  )
}

// Export a singleton instance for typical browser usage
export const supabase = createBrowserClient()

/**
 * Helper function to get a Supabase query with the correct table name casing
 */
export function table(tableName: string) {
  const normalizedName = DB_TABLE_NAMES[tableName as keyof typeof DB_TABLE_NAMES] || tableName
  return supabase.from(normalizedName)
}