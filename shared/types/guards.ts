/**
 * Type guards for runtime type checking
 */

import { Database } from './database';
import { AttendeeType } from './register';

type Tables = Database['public']['Tables'];

/**
 * Type guard for Registration
 */
export function isRegistration(obj: any): obj is Tables['registrations']['Row'] {
  return obj && 
    typeof obj.registration_id === 'string' &&
    (obj.registration_type === null || 
     ['individuals', 'groups', 'officials', 'lodge', 'delegation'].includes(obj.registration_type));
}

/**
 * Type guard for Attendee
 */
export function isAttendee(obj: any): obj is Tables['attendees']['Row'] {
  return obj && 
    typeof obj.attendee_id === 'string' &&
    typeof obj.registration_id === 'string' &&
    ['mason', 'guest', 'ladypartner', 'guestpartner'].includes(obj.attendee_type);
}

/**
 * Type guard for Event
 */
export function isEvent(obj: any): obj is Tables['events']['Row'] {
  return obj && 
    typeof obj.event_id === 'string' &&
    typeof obj.title === 'string' &&
    typeof obj.slug === 'string';
}

/**
 * Type guard for Contact
 */
export function isContact(obj: any): obj is Tables['contacts']['Row'] {
  return obj && 
    typeof obj.contact_id === 'string' &&
    typeof obj.email === 'string' &&
    typeof obj.first_name === 'string' &&
    typeof obj.last_name === 'string' &&
    ['individual', 'organisation'].includes(obj.type);
}

/**
 * Type guard for Organisation
 */
export function isOrganisation(obj: any): obj is Tables['organisations']['Row'] {
  return obj && 
    typeof obj.organisation_id === 'string' &&
    typeof obj.name === 'string' &&
    ['lodge', 'grandlodge', 'masonicorder', 'company', 'other'].includes(obj.type);
}

/**
 * Type guard for Ticket
 */
export function isTicket(obj: any): obj is Tables['tickets']['Row'] {
  return obj && 
    typeof obj.ticket_id === 'string' &&
    typeof obj.event_id === 'string' &&
    typeof obj.price_paid === 'number';
}

/**
 * Type guard for EventTicket
 */
export function isEventTicket(obj: any): obj is Tables['event_tickets']['Row'] {
  return obj && 
    typeof obj.event_ticket_id === 'string' &&
    typeof obj.event_id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.price === 'number';
}

/**
 * Type guard for Package
 */
export function isPackage(obj: any): obj is Tables['packages']['Row'] {
  return obj && 
    typeof obj.package_id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.package_price === 'number';
}

/**
 * Type guard for Mason attendee data
 */
export function isMasonAttendee(attendee: any): boolean {
  return attendee?.attendee_type === 'mason';
}

/**
 * Type guard for Guest attendee data
 */
export function isGuestAttendee(attendee: any): boolean {
  return attendee?.attendee_type === 'guest';
}

/**
 * Type guard for Lady Partner attendee data
 */
export function isLadyPartnerAttendee(attendee: any): boolean {
  return attendee?.attendee_type === 'ladypartner';
}

/**
 * Type guard for Guest Partner attendee data
 */
export function isGuestPartnerAttendee(attendee: any): boolean {
  return attendee?.attendee_type === 'guestpartner';
}

/**
 * Type guard for checking if a value is defined (not null or undefined)
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Type guard for checking if a string is not empty
 */
export function isNonEmptyString(value: any): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Type guard for valid UUID
 */
export function isValidUUID(value: any): value is string {
  if (typeof value !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}