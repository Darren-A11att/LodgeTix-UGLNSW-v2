/**
 * Defines the structure for a Customer profile,
 * mirroring the `customers` table in the database.
 */
export interface CustomerProfile {
  customer_id: string;             // UUID, Primary Key
  contact_id: string | null;       // UUID, Foreign key to contacts table
  customer_type: 'booking_contact' | 'sponsor' | 'donor' | null;
  first_name: string | null;
  last_name: string | null;
  business_name: string | null;
  email: string | null;
  phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  organisation_id: string | null;  // Foreign key to organisations
  stripe_customer_id: string | null;
  // Billing fields
  billing_street_address: string | null;
  billing_city: string | null;
  billing_state: string | null;
  billing_postal_code: string | null;
  billing_country: string | null;
  billing_email: string | null;
  billing_phone: string | null;
  billing_organisation_name: string | null;
  created_at: string | null;       // Timestamptz as string
  updated_at: string | null;       // Timestamptz as string
} 