/**
 * Utility functions for ticket selection persistence
 * These functions are used by TDD tests and the enhanced registration system
 */

import type { AttendeeTicketSelections, PackageSelection, TicketSelectionItem } from '@/lib/registrationStore';

// Database ticket format (matches what RPC expects)
export interface DatabaseTicket {
  attendee_id: string;
  event_id: string;
  ticket_type_id: string;
  package_id?: string;
  price_paid: number;
  original_price: number;
  registration_id: string;
  status: string;
  payment_status: string;
  is_partner_ticket: boolean;
}

// Store ticket format (what comes from frontend)
export interface StoreTicket {
  attendeeId: string;
  eventId: string;
  ticketTypeId: string;
  packageId?: string;
  price: number;
  isFromPackage: boolean;
  quantity: number;
}

// Attendee data update format
export interface AttendeeDataUpdate {
  attendee_id: string;
  selected_tickets: AttendeeTicketSelections;
}

/**
 * Build ticket selection payload from the enhanced store structure
 */
export function buildTicketSelectionPayload(
  ticketSelections: Record<string, AttendeeTicketSelections>
): AttendeeTicketSelections {
  // Aggregate all selections into a single structure
  const aggregatedPayload: AttendeeTicketSelections = {
    packages: [],
    individualTickets: []
  };

  Object.values(ticketSelections).forEach(selection => {
    aggregatedPayload.packages.push(...selection.packages);
    aggregatedPayload.individualTickets.push(...selection.individualTickets);
  });

  return aggregatedPayload;
}

/**
 * Transform store tickets to database format
 */
export function transformTicketsForDatabase(
  storeTickets: StoreTicket[],
  registrationId: string
): DatabaseTicket[] {
  return storeTickets.map(ticket => ({
    attendee_id: ticket.attendeeId,
    event_id: ticket.eventId,
    ticket_type_id: ticket.ticketTypeId,
    package_id: ticket.packageId || undefined,
    price_paid: ticket.price,
    original_price: ticket.price,
    registration_id: registrationId,
    status: 'Active',
    payment_status: 'Unpaid',
    is_partner_ticket: false
  }));
}

/**
 * Build attendee data updates with ticket selections
 */
export function buildAttendeeDataUpdates(
  attendees: any[],
  ticketSelections: Record<string, AttendeeTicketSelections>
): AttendeeDataUpdate[] {
  return attendees.map(attendee => ({
    attendee_id: attendee.attendeeId,
    selected_tickets: ticketSelections[attendee.attendeeId] || {
      packages: [],
      individualTickets: []
    }
  }));
}

/**
 * Map store attendee IDs to database attendee IDs
 */
export function mapStoreIdToDatabaseId(
  storeAttendeeId: string,
  attendeeIdMap: Map<string, string>
): string {
  const databaseId = attendeeIdMap.get(storeAttendeeId);
  if (!databaseId) {
    throw new Error(`No database ID mapping found for store ID: ${storeAttendeeId}`);
  }
  return databaseId;
}

/**
 * Expand package selection to individual ticket records
 */
export function expandPackageToTickets(packageSelection: {
  packageId: string;
  selectedEvents: string[];
  attendeeId: string;
}): StoreTicket[] {
  return packageSelection.selectedEvents.map(eventId => ({
    attendeeId: packageSelection.attendeeId,
    eventId: eventId,
    ticketTypeId: eventId, // In this context, eventId is the ticket type ID
    packageId: packageSelection.packageId,
    price: 150.00, // Default price - would be fetched from package data in real implementation
    isFromPackage: true,
    quantity: 1
  }));
}

/**
 * Validate ticket selection payload structure
 */
export function validateTicketSelectionPayload(
  payload: AttendeeTicketSelections
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!payload || typeof payload !== 'object') {
    errors.push('Payload must be an object');
    return { isValid: false, errors };
  }

  if (!Array.isArray(payload.packages)) {
    errors.push('packages must be an array');
  }

  if (!Array.isArray(payload.individualTickets)) {
    errors.push('individualTickets must be an array');
  }

  // Validate package structure
  payload.packages?.forEach((pkg, index) => {
    if (!pkg.packageId) {
      errors.push(`Package ${index} missing packageId`);
    }
    if (typeof pkg.quantity !== 'number' || pkg.quantity < 1) {
      errors.push(`Package ${index} quantity must be a positive number`);
    }
    if (!Array.isArray(pkg.tickets)) {
      errors.push(`Package ${index} tickets must be an array`);
    }
  });

  // Validate individual ticket structure
  payload.individualTickets?.forEach((ticket, index) => {
    if (!ticket.ticketId) {
      errors.push(`Individual ticket ${index} missing ticketId`);
    }
    if (typeof ticket.quantity !== 'number' || ticket.quantity < 1) {
      errors.push(`Individual ticket ${index} quantity must be a positive number`);
    }
  });

  return { isValid: errors.length === 0, errors };
}

/**
 * Convert legacy package selections to enhanced format
 */
export function convertLegacyToEnhanced(
  legacyPackages: Record<string, { ticketDefinitionId: string | null; selectedEvents: string[] }>
): Record<string, AttendeeTicketSelections> {
  const enhanced: Record<string, AttendeeTicketSelections> = {};

  Object.entries(legacyPackages).forEach(([attendeeId, legacySelection]) => {
    if (legacySelection.ticketDefinitionId) {
      // Package selection
      enhanced[attendeeId] = {
        packages: [{
          packageId: legacySelection.ticketDefinitionId,
          quantity: 1,
          tickets: legacySelection.selectedEvents.map(eventId => ({
            ticketId: eventId,
            quantity: 1
          }))
        }],
        individualTickets: []
      };
    } else if (legacySelection.selectedEvents.length > 0) {
      // Individual ticket selections
      enhanced[attendeeId] = {
        packages: [],
        individualTickets: legacySelection.selectedEvents.map(eventId => ({
          ticketId: eventId,
          quantity: 1
        }))
      };
    } else {
      // Empty selection
      enhanced[attendeeId] = {
        packages: [],
        individualTickets: []
      };
    }
  });

  return enhanced;
}