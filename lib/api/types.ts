/**
 * API Response Types
 */

import { Database } from '../../shared/types/database';
import { ApiResponse, PaginatedResponse, WithTimestamps } from '../../shared/types/utils';

// Extract database types
type Tables = Database['public']['Tables'];
type Views = Database['public']['Views'];
type Functions = Database['public']['Functions'];

/**
 * View Response Types
 */
export type AuthUserCustomerView = Views['auth_user_customer_view']['Row'];
export type MembershipsView = Views['memberships_view']['Row'];
export type RegistrationPaymentsView = Views['registration_payments']['Row'];
export type RegistrationSummaryView = Views['registration_summary']['Row'];

/**
 * Table Response Types with proper naming
 */
export type AttendeeResponse = Tables['attendees']['Row'];
export type ContactResponse = Tables['contacts']['Row'];
export type CustomerResponse = Tables['customers']['Row'];
export type EventResponse = Tables['events']['Row'];
export type EventTicketResponse = Tables['event_tickets']['Row'];
export type OrganisationResponse = Tables['organisations']['Row'];
export type PackageResponse = Tables['packages']['Row'];
export type RegistrationResponse = Tables['registrations']['Row'];
export type TicketResponse = Tables['tickets']['Row'];
export type LocationResponse = Tables['locations']['Row'];
export type GrandLodgeResponse = Tables['grand_lodges']['Row'];
export type LodgeResponse = Tables['lodges']['Row'];
export type MasonicProfileResponse = Tables['masonic_profiles']['Row'];

/**
 * RPC Function Return Types
 */
export type EventTicketAvailabilityResult = Functions['initialize_event_ticket_availability']['Returns'];
export type RecalculateEventCountsResult = Functions['recalculate_event_counts']['Returns'];
export type RecalculateEventTicketCountsResult = Functions['recalculate_event_ticket_counts']['Returns'];

/**
 * API Error Response
 */
export interface ApiError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

/**
 * Standard API Responses
 */
export type StandardApiResponse<T> = ApiResponse<T>;
export type StandardPaginatedResponse<T> = PaginatedResponse<T>;

/**
 * Event with related data
 */
export interface EventWithDetails extends EventResponse {
  location?: LocationResponse | null;
  organiser?: OrganisationResponse | null;
  tickets?: EventTicketResponse[];
  packages?: PackageResponse[];
  parentEvent?: EventResponse | null;
  childEvents?: EventResponse[];
}

/**
 * Registration with related data
 */
export interface RegistrationWithDetails extends RegistrationResponse {
  contact?: ContactResponse | null;
  organisation?: OrganisationResponse | null;
  attendees?: AttendeeResponse[];
  tickets?: TicketResponse[];
  event?: EventResponse | null;
}

/**
 * Attendee with related data
 */
export interface AttendeeWithDetails extends AttendeeResponse {
  contact?: ContactResponse | null;
  masonicProfile?: MasonicProfileResponse | null;
  tickets?: TicketResponse[];
  relatedAttendee?: AttendeeResponse | null;
}

/**
 * Package with computed fields
 */
export interface PackageWithComputedFields extends PackageResponse {
  totalValue?: number;
  savings?: number;
  availableQuantity?: number;
}

/**
 * Ticket purchase request
 */
export interface TicketPurchaseRequest {
  eventId: string;
  tickets: Array<{
    ticketTypeId: string;
    quantity: number;
    attendeeIds?: string[];
  }>;
  registrationId?: string;
  contactDetails?: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
}

/**
 * Payment intent creation request
 */
export interface PaymentIntentRequest {
  amount: number;
  currency?: string;
  registrationId: string;
  metadata?: Record<string, string>;
}

/**
 * Batch operation results
 */
export interface BatchOperationResult<T> {
  successful: T[];
  failed: Array<{
    item: any;
    error: ApiError;
  }>;
  totalProcessed: number;
}

/**
 * Realtime subscription types
 */
export interface RealtimeEventPayload<T> {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: T | null;
  old: T | null;
  table: string;
  schema: string;
  commitTimestamp: string;
}

/**
 * Search/Filter parameters
 */
export interface SearchParams {
  query?: string;
  filters?: Record<string, any>;
  sort?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  pagination?: {
    page: number;
    pageSize: number;
  };
}

/**
 * Aggregate response types
 */
export interface EventStats {
  totalTicketsSold: number;
  totalRevenue: number;
  totalAttendees: number;
  capacityUtilization: number;
}

export interface RegistrationStats {
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  totalRevenue: number;
  averageOrderValue: number;
}