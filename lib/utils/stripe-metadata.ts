import Stripe from 'stripe';
import { getAppVersion } from '@/lib/config/app-version';

/**
 * Stripe Metadata Utilities
 * 
 * Handles building, validating, and formatting metadata for Stripe objects
 * while respecting Stripe's limitations:
 * - Max 50 keys per object
 * - Max 40 characters per key
 * - Max 500 characters per value
 * - Total metadata size cannot exceed 8KB
 */

/**
 * Safely truncate metadata values to fit Stripe's 500 character limit
 */
export function truncateMetadataValue(value: string | null | undefined, maxLength: number = 500): string {
  if (!value) return '';
  const stringValue = String(value);
  return stringValue.length > maxLength ? stringValue.substring(0, maxLength - 3) + '...' : stringValue;
}

/**
 * Format metadata key to comply with Stripe's requirements
 * - Max 40 characters
 * - Lowercase
 * - Only alphanumeric and underscores
 */
export function formatMetadataKey(key: string): string {
  return key
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .substring(0, 40);
}

/**
 * Build metadata object with validation for Stripe's limits
 */
export function buildMetadata(data: Record<string, any>): Record<string, string> {
  const metadata: Record<string, string> = {};
  let totalSize = 0;
  let keyCount = 0;
  
  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined || value === '') continue;
    if (keyCount >= 50) {
      console.warn(`Metadata key limit reached (50), skipping remaining keys`);
      break;
    }
    
    const formattedKey = formatMetadataKey(key);
    const stringValue = truncateMetadataValue(value);
    
    // Check total size (8KB limit)
    const entrySize = formattedKey.length + stringValue.length;
    if (totalSize + entrySize > 8000) {
      console.warn(`Metadata size limit approaching, skipping key: ${key}`);
      continue;
    }
    
    metadata[formattedKey] = stringValue;
    totalSize += entrySize;
    keyCount++;
  }
  
  return metadata;
}

/**
 * Build comprehensive metadata for a payment intent
 */
export interface PaymentIntentMetadataParams {
  // Registration
  registrationId: string;
  registrationType: 'individual' | 'lodge' | 'delegation';
  confirmationNumber: string;
  
  // Event
  eventId: string;
  eventTitle: string;
  eventSlug: string;
  
  // Organization
  organisationId: string;
  organisationName: string;
  organisationType?: string;
  
  // Attendees
  totalAttendees: number;
  primaryAttendeeName: string;
  primaryAttendeeEmail: string;
  attendeeTypes: Record<string, number>; // { mason: 5, guest: 3 }
  
  // Lodge (optional)
  lodgeId?: string;
  lodgeName?: string;
  lodgeNumber?: string;
  grandLodgeId?: string;
  
  // Tickets
  ticketsCount: number;
  ticketTypes: Record<string, number>; // { standard: 5, vip: 2 }
  ticketIds: string[];
  
  // Financial
  subtotal: number;
  totalAmount: number;
  stripeFee: number;
  platformFee: number;
  platformFeePercentage: number;
  currency: string;
  
  // Tracking
  userId?: string;
  sessionId?: string;
  referrer?: string;
  deviceType?: 'mobile' | 'desktop' | 'tablet';
  appVersion?: string;
}

export function buildPaymentIntentMetadata(params: PaymentIntentMetadataParams): Record<string, string> {
  // Format attendee types as string
  const attendeeTypesStr = Object.entries(params.attendeeTypes)
    .map(([type, count]) => `${type}:${count}`)
    .join(',');
    
  // Format ticket types as string
  const ticketTypesStr = Object.entries(params.ticketTypes)
    .map(([type, count]) => `${type}:${count}`)
    .join(',');
    
  // Build the metadata object
  const rawMetadata = {
    // Registration Core
    registration_id: params.registrationId,
    registration_type: params.registrationType,
    confirmation_number: params.confirmationNumber,
    
    // Event
    event_id: params.eventId,
    event_title: params.eventTitle,
    event_slug: params.eventSlug,
    
    // Organization
    organisation_id: params.organisationId,
    organisation_name: params.organisationName,
    organisation_type: params.organisationType || '',
    
    // Attendee Information
    total_attendees: String(params.totalAttendees),
    primary_attendee_name: params.primaryAttendeeName,
    primary_attendee_email: params.primaryAttendeeEmail,
    attendee_types: attendeeTypesStr,
    
    // Lodge Information (if applicable)
    lodge_id: params.lodgeId || '',
    lodge_name: params.lodgeName || '',
    lodge_number: params.lodgeNumber || '',
    grand_lodge_id: params.grandLodgeId || '',
    
    // Ticket Details
    tickets_count: String(params.ticketsCount),
    ticket_types: ticketTypesStr,
    ticket_ids: params.ticketIds.join(','),
    
    // Financial
    subtotal: String(params.subtotal),
    total_amount: String(params.totalAmount),
    stripe_fee: String(params.stripeFee),
    platform_fee: String(params.platformFee),
    platform_fee_percentage: String(params.platformFeePercentage),
    currency: params.currency,
    
    // Tracking
    created_at: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    app_version: params.appVersion || getAppVersion(),
    
    // User Session
    user_id: params.userId || '',
    session_id: params.sessionId || '',
    
    // Additional Context
    referrer: params.referrer || '',
    device_type: params.deviceType || '',
  };
  
  return buildMetadata(rawMetadata);
}

/**
 * Build metadata for Stripe Customer
 */
export interface CustomerMetadataParams {
  attendeeId: string;
  registrationId: string;
  attendeeType: string;
  isPrimary: boolean;
  
  // Masonic information
  masonType?: string;
  lodgeName?: string;
  lodgeNumber?: string;
  grandLodge?: string;
  masonicRank?: string;
  
  // Additional info
  dietaryRequirements?: string;
  accessibilityNeeds?: string;
  createdAt: string;
}

export function buildCustomerMetadata(params: CustomerMetadataParams): Record<string, string> {
  const rawMetadata = {
    attendee_id: params.attendeeId,
    registration_id: params.registrationId,
    attendee_type: params.attendeeType,
    is_primary: String(params.isPrimary),
    
    // Masonic information
    mason_type: params.masonType || '',
    lodge_name: params.lodgeName || '',
    lodge_number: params.lodgeNumber || '',
    grand_lodge: params.grandLodge || '',
    masonic_rank: params.masonicRank || '',
    
    // Dietary/Access
    dietary_requirements: params.dietaryRequirements || '',
    accessibility_needs: params.accessibilityNeeds || '',
    
    created_at: params.createdAt,
    updated_at: new Date().toISOString()
  };
  
  return buildMetadata(rawMetadata);
}

/**
 * Build metadata for Stripe Product (Event)
 */
export interface ProductMetadataParams {
  eventId: string;
  eventType?: string;
  eventSlug: string;
  organisationId: string;
  eventStart?: Date;
  eventEnd?: Date;
  locationId?: string;
  maxAttendees?: number;
  isMultiDay: boolean;
  isPublished: boolean;
  isFeatured: boolean;
}

export function buildProductMetadata(params: ProductMetadataParams): Record<string, string> {
  const rawMetadata = {
    event_id: params.eventId,
    event_type: params.eventType || 'general',
    event_slug: params.eventSlug,
    
    organisation_id: params.organisationId,
    
    event_start: params.eventStart?.toISOString() || '',
    event_end: params.eventEnd?.toISOString() || '',
    
    location_id: params.locationId || '',
    max_attendees: String(params.maxAttendees || 0),
    
    is_multi_day: String(params.isMultiDay),
    is_published: String(params.isPublished),
    is_featured: String(params.isFeatured),
    
    created_at: new Date().toISOString(),
    last_synced: new Date().toISOString()
  };
  
  return buildMetadata(rawMetadata);
}

/**
 * Build metadata for Stripe Price (Ticket)
 */
export interface PriceMetadataParams {
  ticketId: string;
  ticketType: string;
  eventId: string;
  includesMeal?: boolean;
  includesDrinks?: boolean;
  maxQuantity?: number;
  minQuantity?: number;
  eligibility?: string;
}

export function buildPriceMetadata(params: PriceMetadataParams): Record<string, string> {
  const rawMetadata = {
    ticket_id: params.ticketId,
    ticket_type: params.ticketType,
    event_id: params.eventId,
    
    includes_meal: String(params.includesMeal || false),
    includes_drinks: String(params.includesDrinks || false),
    
    max_quantity: String(params.maxQuantity || 0),
    min_quantity: String(params.minQuantity || 1),
    
    eligibility: params.eligibility || 'all',
    
    created_at: new Date().toISOString()
  };
  
  return buildMetadata(rawMetadata);
}

/**
 * Aggregate child events data for parent event metadata
 */
export interface ChildEventSummary {
  eventId: string;
  title: string;
  slug: string;
  eventStart?: Date;
}

export function aggregateChildEventsMetadata(childEvents: ChildEventSummary[]): Record<string, string> {
  if (!childEvents || childEvents.length === 0) {
    return {};
  }
  
  return {
    child_event_count: String(childEvents.length),
    child_event_ids: truncateMetadataValue(childEvents.map(e => e.eventId).join(',')),
    child_event_titles: truncateMetadataValue(childEvents.map(e => e.title).join('|')),
    child_event_slugs: truncateMetadataValue(childEvents.map(e => e.slug).join(',')),
    child_event_dates: truncateMetadataValue(
      childEvents
        .map(e => e.eventStart ? e.eventStart.toISOString().split('T')[0] : '')
        .join(',')
    )
  };
}