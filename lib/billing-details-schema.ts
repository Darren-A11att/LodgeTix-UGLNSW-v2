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

export const billingDetailsSchema = z.object({
  billToPrimary: z.boolean().default(false),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  businessName: z.string().optional(),
  addressLine1: z.string().min(1, 'Address Line 1 is required'),
  mobileNumber: z.string().min(1, 'Mobile number is required'), // Consider more specific validation later
  suburb: z.string().min(1, 'Suburb is required'),
  postcode: z.string().min(1, 'Postcode is required'),
  emailAddress: z.string().email('Invalid email address'),
  country: countrySchema, // Updated to use the object schema
  stateTerritory: stateTerritorySchema.optional(), // Updated, and making it optional for now
});

export type BillingDetails = z.infer<typeof billingDetailsSchema>; 