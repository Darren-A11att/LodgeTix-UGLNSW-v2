/**
 * Zod validation schemas for runtime type validation
 * These schemas match the database constraints and provide runtime validation
 */

import { z } from 'zod';

/**
 * Enum schemas
 */
export const AttendeeTypeSchema = z.enum(['mason', 'guest', 'ladypartner', 'guestpartner']);
export const ContactPreferenceSchema = z.enum(['directly', 'primaryattendee', 'mason', 'guest', 'providelater']);
export const ContactTypeSchema = z.enum(['individual', 'organisation']);
export const CustomerTypeSchema = z.enum(['booking_contact', 'sponsor', 'donor']);
export const OrganisationTypeSchema = z.enum(['lodge', 'grandlodge', 'masonicorder', 'company', 'other']);
export const PaymentStatusSchema = z.enum(['pending', 'completed', 'failed', 'refunded', 'partially_refunded', 'cancelled', 'expired', 'unpaid']);
export const RegistrationTypeSchema = z.enum(['individuals', 'groups', 'officials', 'lodge', 'delegation']);

/**
 * UUID validation
 */
export const UUIDSchema = z.string().uuid();

/**
 * Contact schema
 */
export const ContactSchema = z.object({
  contact_id: UUIDSchema,
  email: z.string().email(),
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  type: ContactTypeSchema,
  title: z.string().max(50).nullable().optional(),
  suffix_1: z.string().max(50).nullable().optional(),
  suffix_2: z.string().max(50).nullable().optional(),
  suffix_3: z.string().max(50).nullable().optional(),
  mobile_number: z.string().max(20).nullable().optional(),
  address_line_1: z.string().max(255).nullable().optional(),
  address_line_2: z.string().max(255).nullable().optional(),
  suburb_city: z.string().max(100).nullable().optional(),
  state: z.string().max(50).nullable().optional(),
  postcode: z.string().max(20).nullable().optional(),
  country: z.string().max(100).nullable().optional(),
  organisation_id: UUIDSchema.nullable().optional(),
  stripe_customer_id: z.string().nullable().optional(),
  auth_user_id: UUIDSchema.nullable().optional(),
  business_name: z.string().max(255).nullable().optional(),
  dietary_requirements: z.string().nullable().optional(),
  special_needs: z.string().nullable().optional(),
  has_partner: z.boolean().nullable().optional(),
  is_partner: z.boolean().nullable().optional(),
  contact_preference: z.string().nullable().optional(),
  billing_email: z.string().email().nullable().optional(),
  billing_phone: z.string().max(20).nullable().optional(),
  billing_organisation_name: z.string().max(255).nullable().optional(),
  billing_street_address: z.string().max(255).nullable().optional(),
  billing_city: z.string().max(100).nullable().optional(),
  billing_state: z.string().max(50).nullable().optional(),
  billing_postal_code: z.string().max(20).nullable().optional(),
  billing_country: z.string().max(100).nullable().optional(),
  source_id: z.string().nullable().optional(),
  source_type: z.string().nullable().optional(),
  created_at: z.string().datetime().nullable().optional(),
  updated_at: z.string().datetime().nullable().optional(),
});

/**
 * Organisation schema
 */
export const OrganisationSchema = z.object({
  organisation_id: UUIDSchema,
  name: z.string().min(1).max(255),
  type: OrganisationTypeSchema,
  known_as: z.string().max(255).nullable().optional(),
  abbreviation: z.string().max(50).nullable().optional(),
  street_address: z.string().max(255).nullable().optional(),
  city: z.string().max(100).nullable().optional(),
  state: z.string().max(50).nullable().optional(),
  postal_code: z.string().max(20).nullable().optional(),
  country: z.string().max(100).nullable().optional(),
  website: z.string().url().nullable().optional(),
  stripe_onbehalfof: z.string().nullable().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

/**
 * Event schema
 */
export const EventSchema = z.object({
  event_id: UUIDSchema,
  title: z.string().min(1).max(255),
  slug: z.string().min(1).max(255),
  subtitle: z.string().max(255).nullable().optional(),
  description: z.string().nullable().optional(),
  event_start: z.string().datetime().nullable().optional(),
  event_end: z.string().datetime().nullable().optional(),
  location_id: UUIDSchema.nullable().optional(),
  organiser_id: UUIDSchema.nullable().optional(),
  type: z.string().max(50).nullable().optional(),
  featured: z.boolean().nullable().optional(),
  image_url: z.string().url().nullable().optional(),
  is_multi_day: z.boolean().nullable().optional(),
  parent_event_id: UUIDSchema.nullable().optional(),
  event_includes: z.array(z.string()).nullable().optional(),
  important_information: z.array(z.string()).nullable().optional(),
  is_purchasable_individually: z.boolean().nullable().optional(),
  max_attendees: z.number().int().positive().nullable().optional(),
  dress_code: z.string().nullable().optional(),
  regalia: z.string().nullable().optional(),
  regalia_description: z.string().nullable().optional(),
  degree_type: z.string().nullable().optional(),
  display_scope_id: UUIDSchema.nullable().optional(),
  registration_availability_id: UUIDSchema.nullable().optional(),
  is_published: z.boolean().nullable().optional(),
  sold_count: z.number().int().min(0).default(0),
  reserved_count: z.number().int().min(0).default(0),
  attendance: z.any().nullable().optional(), // JSON field
  documents: z.any().nullable().optional(), // JSON field
  sections: z.any().nullable().optional(), // JSON field
  related_events: z.array(z.string()).nullable().optional(),
  created_at: z.string().datetime(),
});

/**
 * Registration schema
 */
export const RegistrationSchema = z.object({
  registration_id: UUIDSchema,
  contact_id: UUIDSchema.nullable().optional(),
  event_id: UUIDSchema.nullable().optional(),
  organisation_id: UUIDSchema.nullable().optional(),
  registration_type: RegistrationTypeSchema.nullable().optional(),
  registration_date: z.string().datetime().nullable().optional(),
  payment_status: PaymentStatusSchema.nullable().optional(),
  total_price_paid: z.number().min(0).nullable().optional(),
  total_amount_paid: z.number().min(0).nullable().optional(),
  stripe_payment_intent_id: z.string().nullable().optional(),
  primary_attendee_id: UUIDSchema.nullable().optional(),
  agree_to_terms: z.boolean().nullable().optional(),
  confirmation_number: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  registration_data: z.any().nullable().optional(), // JSON field
  created_at: z.string().datetime().nullable().optional(),
  updated_at: z.string().datetime().nullable().optional(),
});

/**
 * Attendee schema
 */
export const AttendeeSchema = z.object({
  attendee_id: UUIDSchema,
  registration_id: UUIDSchema,
  contact_id: UUIDSchema.nullable().optional(),
  attendee_type: AttendeeTypeSchema,
  contact_preference: ContactPreferenceSchema,
  title: z.string().max(50).nullable().optional(),
  first_name: z.string().max(100).nullable().optional(),
  last_name: z.string().max(100).nullable().optional(),
  suffix: z.string().max(50).nullable().optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().max(20).nullable().optional(),
  dietary_requirements: z.string().nullable().optional(),
  special_needs: z.string().nullable().optional(),
  is_primary: z.boolean().nullable().optional(),
  is_partner: z.string().nullable().optional(), // Note: string type, not boolean
  has_partner: z.boolean().nullable().optional(),
  related_attendee_id: UUIDSchema.nullable().optional(),
  relationship: z.string().nullable().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

/**
 * Ticket schema
 */
export const TicketSchema = z.object({
  ticket_id: UUIDSchema,
  event_id: UUIDSchema,
  attendee_id: UUIDSchema.nullable().optional(),
  registration_id: UUIDSchema.nullable().optional(),
  ticket_type_id: UUIDSchema.nullable().optional(),
  package_id: UUIDSchema.nullable().optional(),
  price_paid: z.number().min(0),
  original_price: z.number().min(0).nullable().optional(),
  ticket_price: z.number().min(0).nullable().optional(),
  status: z.string().default('Active'),
  ticket_status: z.string().nullable().optional(),
  payment_status: z.string().nullable().optional(),
  seat_info: z.string().nullable().optional(),
  currency: z.string().length(3).nullable().optional(),
  is_partner_ticket: z.boolean().nullable().optional(),
  checked_in_at: z.string().datetime().nullable().optional(),
  purchased_at: z.string().datetime().nullable().optional(),
  reservation_id: z.string().nullable().optional(),
  reservation_expires_at: z.string().datetime().nullable().optional(),
  id: z.string().nullable().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

/**
 * Event Ticket (ticket type) schema
 */
export const EventTicketSchema = z.object({
  id: UUIDSchema,
  event_id: UUIDSchema,
  name: z.string().min(1).max(255),
  price: z.number().min(0),
  description: z.string().nullable().optional(),
  eligibility_criteria: z.any().nullable().optional(), // JSON field
  is_active: z.boolean().nullable().optional(),
  total_capacity: z.number().int().positive().nullable().optional(),
  available_count: z.number().int().min(0).nullable().optional(),
  sold_count: z.number().int().min(0).nullable().optional(),
  reserved_count: z.number().int().min(0).nullable().optional(),
  status: z.string().nullable().optional(),
  created_at: z.string().datetime().nullable().optional(),
  updated_at: z.string().datetime().nullable().optional(),
});

/**
 * Package schema
 */
export const PackageSchema = z.object({
  package_id: UUIDSchema,
  name: z.string().min(1).max(255),
  package_price: z.number().min(0),
  description: z.string().nullable().optional(),
  event_id: UUIDSchema.nullable().optional(),
  parent_event_id: UUIDSchema.nullable().optional(),
  original_price: z.number().min(0).nullable().optional(),
  discount: z.number().min(0).max(100).nullable().optional(),
  qty: z.number().int().positive().nullable().optional(),
  is_active: z.boolean().nullable().optional(),
  eligibility_criteria: z.any().nullable().optional(), // JSON field
  included_items: z.array(z.object({
    event_ticket_id: z.string().nullable().optional(),
    quantity: z.number().int().positive().nullable().optional(),
  })).nullable().optional(),
  includes_description: z.array(z.string()).nullable().optional(),
  created_at: z.string().datetime().nullable().optional(),
  updated_at: z.string().datetime().nullable().optional(),
});

/**
 * Masonic Profile schema
 */
export const MasonicProfileSchema = z.object({
  masonic_profile_id: UUIDSchema,
  contact_id: UUIDSchema.nullable().optional(),
  lodge_id: UUIDSchema.nullable().optional(),
  grand_lodge_id: UUIDSchema.nullable().optional(),
  masonic_title: z.string().max(100).nullable().optional(),
  rank: z.string().max(100).nullable().optional(),
  grand_rank: z.string().max(100).nullable().optional(),
  grand_officer: z.string().max(100).nullable().optional(),
  grand_office: z.string().max(100).nullable().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

/**
 * Grand Lodge schema
 */
export const GrandLodgeSchema = z.object({
  grand_lodge_id: UUIDSchema,
  name: z.string().min(1).max(255),
  organisation_id: UUIDSchema.nullable().optional(),
  abbreviation: z.string().max(50).nullable().optional(),
  country: z.string().max(100).nullable().optional(),
  country_code_iso3: z.string().length(3).nullable().optional(),
  state_region: z.string().max(100).nullable().optional(),
  state_region_code: z.string().max(10).nullable().optional(),
  created_at: z.string().datetime(),
});

/**
 * Lodge schema
 */
export const LodgeSchema = z.object({
  lodge_id: UUIDSchema,
  name: z.string().min(1).max(255),
  number: z.number().int().positive().nullable().optional(),
  organisation_id: UUIDSchema.nullable().optional(),
  grand_lodge_id: UUIDSchema.nullable().optional(),
  display_name: z.string().max(255).nullable().optional(),
  meeting_place: z.string().max(255).nullable().optional(),
  district: z.string().max(100).nullable().optional(),
  state_region: z.string().max(100).nullable().optional(),
  area_type: z.string().max(50).nullable().optional(),
  created_at: z.string().datetime(),
});

/**
 * Location schema
 */
export const LocationSchema = z.object({
  location_id: UUIDSchema,
  place_name: z.string().min(1).max(255),
  room_or_area: z.string().max(255).nullable().optional(),
  street_address: z.string().max(255).nullable().optional(),
  suburb: z.string().max(100).nullable().optional(),
  state: z.string().max(50).nullable().optional(),
  postal_code: z.string().max(20).nullable().optional(),
  country: z.string().max(100).nullable().optional(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  capacity: z.number().int().positive().nullable().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

/**
 * Request/Response schemas for API validation
 */

/**
 * Create registration request schema
 */
export const CreateRegistrationRequestSchema = z.object({
  registration_type: RegistrationTypeSchema,
  event_id: UUIDSchema,
  contact_details: z.object({
    first_name: z.string().min(1),
    last_name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().optional(),
  }),
  attendees: z.array(z.object({
    attendee_type: AttendeeTypeSchema,
    first_name: z.string().min(1),
    last_name: z.string().min(1),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    dietary_requirements: z.string().optional(),
    special_needs: z.string().optional(),
    // Add other attendee-specific fields as needed
  })).min(1),
  agree_to_terms: z.boolean().refine(val => val === true, {
    message: "You must agree to the terms and conditions",
  }),
});

/**
 * Update registration request schema
 */
export const UpdateRegistrationRequestSchema = z.object({
  payment_status: PaymentStatusSchema.optional(),
  total_price_paid: z.number().min(0).optional(),
  stripe_payment_intent_id: z.string().optional(),
  status: z.string().optional(),
});

/**
 * Ticket purchase request schema
 */
export const TicketPurchaseRequestSchema = z.object({
  event_id: UUIDSchema,
  tickets: z.array(z.object({
    ticket_type_id: UUIDSchema,
    quantity: z.number().int().positive(),
    attendee_ids: z.array(UUIDSchema).optional(),
  })).min(1),
  registration_id: UUIDSchema.optional(),
  contact_details: z.object({
    first_name: z.string().min(1),
    last_name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().optional(),
  }).optional(),
});

/**
 * Helper functions for validation
 */

/**
 * Validates and parses data with a schema
 * @param schema The Zod schema to use
 * @param data The data to validate
 * @returns Parsed data or throws validation error
 */
export function validateWithSchema<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

/**
 * Safely validates data with a schema
 * @param schema The Zod schema to use
 * @param data The data to validate
 * @returns Result object with either data or error
 */
export function safeValidateWithSchema<T>(schema: z.ZodSchema<T>, data: unknown): 
  { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { success: false, error: result.error };
  }
}

/**
 * Type exports for inferred types
 */
export type Contact = z.infer<typeof ContactSchema>;
export type Organisation = z.infer<typeof OrganisationSchema>;
export type Event = z.infer<typeof EventSchema>;
export type Registration = z.infer<typeof RegistrationSchema>;
export type Attendee = z.infer<typeof AttendeeSchema>;
export type Ticket = z.infer<typeof TicketSchema>;
export type EventTicket = z.infer<typeof EventTicketSchema>;
export type Package = z.infer<typeof PackageSchema>;
export type MasonicProfile = z.infer<typeof MasonicProfileSchema>;
export type GrandLodge = z.infer<typeof GrandLodgeSchema>;
export type Lodge = z.infer<typeof LodgeSchema>;
export type Location = z.infer<typeof LocationSchema>;

export type CreateRegistrationRequest = z.infer<typeof CreateRegistrationRequestSchema>;
export type UpdateRegistrationRequest = z.infer<typeof UpdateRegistrationRequestSchema>;
export type TicketPurchaseRequest = z.infer<typeof TicketPurchaseRequestSchema>;