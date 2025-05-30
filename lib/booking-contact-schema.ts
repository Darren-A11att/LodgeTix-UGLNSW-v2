import { z } from 'zod';

// Define schemas for country and state objects
export const countrySchema = z.object({
  id: z.number().optional(), // Library might provide an id
  name: z.string().min(1, 'Country name is required'),
  isoCode: z.string().min(2, 'Country ISO code is required').max(3, 'Country ISO code is too long'), // Typically 2 or 3 letters
});

export const stateTerritorySchema = z.object({
  id: z.number().optional(), // Library might provide an id
  name: z.string().min(1, 'State/Territory name is required'),
  isoCode: z.string().optional(), // State ISO code is not always present or as standardized
  countryCode: z.string().optional(), // Library might provide this
});

export type CountryType = z.infer<typeof countrySchema>;
export type StateTerritoryType = z.infer<typeof stateTerritorySchema>;

// Booking Contact schema that maps to customers table
export const bookingContactSchema = z.object({
  // Form-specific fields
  billToPrimary: z.boolean().default(false),
  
  // Maps to customers table columns
  firstName: z.string().min(1, 'First name is required'), // -> first_name
  lastName: z.string().min(1, 'Last name is required'), // -> last_name
  emailAddress: z.string().email('Invalid email address'), // -> email
  mobileNumber: z.string().min(1, 'Mobile number is required'), // -> phone
  
  // Business fields
  businessName: z.string().optional(), // -> business_name
  businessNumber: z.string().optional(), // Not mapped to customers table (registration-specific)
  
  // Address fields
  addressLine1: z.string().min(1, 'Address Line 1 is required'), // -> address_line1
  addressLine2: z.string().optional(), // -> address_line2
  suburb: z.string().min(1, 'Suburb is required'), // -> city
  postcode: z.string().min(1, 'Postcode is required'), // -> postal_code
  stateTerritory: stateTerritorySchema.optional(), // -> state (name field)
  country: countrySchema, // -> country (name field)
});

export type BookingContact = z.infer<typeof bookingContactSchema>;

// Type that matches the customers table structure
export interface CustomerRecord {
  contact_id?: string;
  user_id?: string | null;
  organisation_id?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  business_name?: string | null;
  email?: string | null;
  phone?: string | null;
  billing_organisation_name?: string | null;
  billing_email?: string | null;
  billing_phone?: string | null;
  billing_street_address?: string | null;
  billing_city?: string | null;
  billing_state?: string | null;
  billing_postal_code?: string | null;
  billing_country?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
  stripe_customer_id?: string | null;
  created_at?: string;
  updated_at?: string;
  customer_type?: 'individual' | 'company' | 'lodge' | 'grandlodge' | 'masonicorder' | 'other' | null;
}

// Function to map BookingContact to CustomerRecord
export const mapBookingContactToCustomer = (
  bookingContact: BookingContact,
  additionalData?: {
    contactId?: string;
    userId?: string;
    customerType?: CustomerRecord['customer_type'];
    stripeCustomerId?: string;
  }
): CustomerRecord => {
  return {
    contact_id: additionalData?.contactId,
    user_id: additionalData?.userId,
    customer_type: additionalData?.customerType,
    stripe_customer_id: additionalData?.stripeCustomerId,
    
    // Basic contact info
    first_name: bookingContact.firstName,
    last_name: bookingContact.lastName,
    email: bookingContact.emailAddress,
    phone: bookingContact.mobileNumber,
    business_name: bookingContact.businessName,
    
    // Physical address
    address_line1: bookingContact.addressLine1,
    address_line2: bookingContact.addressLine2,
    city: bookingContact.suburb,
    state: bookingContact.stateTerritory?.name,
    postal_code: bookingContact.postcode,
    country: bookingContact.country?.name,
    
    // Billing address (duplicate for now, can be different in future)
    billing_organisation_name: bookingContact.businessName,
    billing_email: bookingContact.emailAddress,
    billing_phone: bookingContact.mobileNumber,
    billing_street_address: bookingContact.addressLine1,
    billing_city: bookingContact.suburb,
    billing_state: bookingContact.stateTerritory?.name,
    billing_postal_code: bookingContact.postcode,
    billing_country: bookingContact.country?.name,
    
    // Timestamps
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
};

// Function to map CustomerRecord back to BookingContact (for loading saved data)
export const mapCustomerToBookingContact = (customer: CustomerRecord): Partial<BookingContact> => {
  return {
    firstName: customer.first_name || '',
    lastName: customer.last_name || '',
    emailAddress: customer.email || '',
    mobileNumber: customer.phone || '',
    businessName: customer.business_name || undefined,
    addressLine1: customer.address_line1 || '',
    addressLine2: customer.address_line2 || undefined,
    suburb: customer.city || '',
    postcode: customer.postal_code || '',
    stateTerritory: customer.state ? { name: customer.state } : undefined,
    country: customer.country ? { name: customer.country, isoCode: 'AU' } : { name: 'Australia', isoCode: 'AU' },
  };
};

// Validation helpers
export const validateBookingContact = (data: BookingContact) => {
  const result = bookingContactSchema.safeParse(data);
  if (!result.success) {
    console.error("Validation errors:", result.error.flatten().fieldErrors);
  }
  return result;
};

export const isBookingContactComplete = (details: BookingContact | null | undefined): boolean => {
  if (!details) return false;
  const result = bookingContactSchema.safeParse(details);
  return result.success;
};

// Keep legacy exports for backward compatibility during migration
export const billingDetailsSchema = bookingContactSchema;
export type BillingDetails = BookingContact;
export const validateBillingDetails = validateBookingContact;
export const isBillingDetailsComplete = isBookingContactComplete;