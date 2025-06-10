/**
 * Comprehensive Metadata Types for Registration
 * These types capture ALL visible data during the registration process
 */

import { v7 as uuidv7 } from 'uuid';

// Function-level metadata
export interface FunctionMetadata {
  functionId: string;
  functionName: string;
  functionDescription?: string;
  functionDates?: {
    startDate: string;
    endDate: string;
  };
  organizationId?: string;
  organizationName?: string;
  captureTimestamp: string;
}

// Event details nested within ticket
export interface EventMetadata {
  eventId: string;
  eventTitle: string;
  eventSubtitle: string | null;
  eventSlug: string;
  startDate?: string | null;
  endDate?: string | null;
  venue?: string | null;
  venueAddress?: string | null;
  description?: string | null;
  status?: string | null;
}

// Complete ticket metadata snapshot
export interface TicketMetadata {
  // Core identifiers
  ticketId: string; // event_ticket_id from database
  name: string;
  description: string | null;
  price: number;
  
  // Event information (nested)
  event: EventMetadata;
  
  // Availability snapshot at selection time
  availability: {
    isActive: boolean;
    totalCapacity: number | null;
    availableCount: number | null;
    reservedCount: number | null;
    soldCount: number | null;
    status: 'available' | 'low_stock' | 'sold_out';
  };
  
  // Status & timestamps
  status: 'unpaid';
  selectionTimestamp: string; // ISO timestamp when captured
  functionId: string;
}

// Complete package metadata with included tickets
export interface PackageMetadata {
  // Core identifiers
  packageId: string;
  name: string;
  description: string | null;
  
  // Pricing
  price: number;
  originalPrice: number | null;
  discount: number | null;
  
  // Included items with FULL metadata
  includedTickets: TicketMetadata[]; // Full nested ticket data
  includesDescription: string[] | null;
  
  // Status & timestamps
  status: 'unpaid';
  selectionTimestamp: string;
  functionId: string;
}

// Individual ticket record (created when selected)
export interface TicketRecord {
  ticketRecordId: string; // New UUID for this specific ticket instance
  ticket: TicketMetadata; // Complete metadata snapshot
  quantity: number;
  subtotal: number;
  selectionTimestamp: string;
  status: 'unpaid';
  // Link to attendee
  attendeeId?: string;
  // If from package
  fromPackageId?: string;
}

// Package selection record
export interface PackageRecord {
  packageRecordId: string; // New UUID for this selection
  package: PackageMetadata; // Complete metadata snapshot
  quantity: number;
  subtotal: number;
  selectionTimestamp: string;
  status: 'unpaid';
  // Ticket records generated from this package
  generatedTicketRecords: Array<{
    ticketRecordId: string;
    eventTicketId: string;
    fromPackageId: string;
  }>;
}

// Enhanced ticket/package selections per attendee
export interface EnhancedTicketSelection extends TicketRecord {
  // Additional fields if needed
}

export interface EnhancedPackageSelection extends PackageRecord {
  // Additional fields if needed
}

// Attendee selection summary
export interface AttendeeSelectionSummary {
  attendeeId: string;
  attendeeName: string;
  attendeeType: string;
  packages: EnhancedPackageSelection[];
  individualTickets: EnhancedTicketSelection[];
  attendeeSubtotal: number;
  status: 'unpaid';
}

// Lodge bulk selection (no attendees yet)
export interface LodgeBulkSelection {
  selectionType: 'package' | 'tickets';
  // For package selection
  packageId?: string;
  packageMetadata?: PackageMetadata;
  // For individual tickets
  ticketSelections?: Array<{
    ticketId: string;
    ticketMetadata: TicketMetadata;
    quantity: number;
  }>;
  quantity: number; // Number of attendees
  pricePerUnit: number;
  subtotal: number;
  status: 'unpaid';
  selectionTimestamp: string;
  willGenerateTickets: number; // Total tickets to be created later
}

// Complete order summary
export interface OrderSummary {
  // Registration details
  registrationId?: string;
  functionId: string;
  functionName: string;
  registrationType: 'individuals' | 'lodge' | 'delegation';
  
  // Attendee summary
  totalAttendees: number;
  attendeeSummaries: AttendeeSelectionSummary[];
  
  // Pricing breakdown
  subtotal: number;
  processingFees: number;
  stripeFee: number;
  totalAmount: number;
  currency: 'AUD';
  
  // Item counts
  totalTickets: number;
  totalPackages: number;
  
  // Status & timestamps
  status: 'draft' | 'pending' | 'completed' | 'cancelled';
  paymentStatus: 'unpaid' | 'paid' | 'failed' | 'refunded';
  createdAt: string;
  updatedAt: string;
  selectionCompleteTimestamp: string;
}

// Registration table data mapping
export interface RegistrationTableData {
  function_id: string | null;
  customer_id: string | null;
  booking_contact_id: string | null;
  event_id: string | null;
  total_amount: number;
  stripe_fee: number;
  status: 'draft' | 'pending' | 'completed' | 'cancelled';
  payment_status: 'unpaid' | 'paid' | 'failed' | 'refunded';
  payment_intent_id: string | null;
  stripe_payment_intent_id: string | null;
  organization_id: string | null;
}

// Helper function to determine availability status
export function determineAvailabilityStatus(availableCount: number | null): 'available' | 'low_stock' | 'sold_out' {
  if (availableCount === null) return 'available'; // Unlimited
  if (availableCount === 0) return 'sold_out';
  if (availableCount <= 10) return 'low_stock';
  return 'available';
}

// Helper function to generate ticket records from package
export function generateTicketRecordsFromPackage(
  packageMetadata: PackageMetadata,
  attendeeId?: string
): TicketRecord[] {
  return packageMetadata.includedTickets.map(ticket => ({
    ticketRecordId: uuidv7(),
    ticket,
    quantity: 1,
    subtotal: 0, // Price included in package
    selectionTimestamp: new Date().toISOString(),
    status: 'unpaid' as const,
    attendeeId,
    fromPackageId: packageMetadata.packageId
  }));
}