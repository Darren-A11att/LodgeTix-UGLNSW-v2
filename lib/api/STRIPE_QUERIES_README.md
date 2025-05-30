# Stripe Payment Processing Queries

This module provides optimized database queries for fetching all necessary data for Stripe payment processing.

## Overview

The `stripe-queries.ts` module contains specialized functions that fetch comprehensive registration data needed for Stripe Connect payment processing. These queries are optimized to minimize database round trips while gathering all required metadata.

## Main Functions

### `getPaymentProcessingData(registrationId: string)`
The primary function for payment processing. It attempts to use an optimized RPC function first, falling back to regular queries if the RPC is not available.

**Returns:** Complete registration context including:
- Registration details
- Event information and hierarchy
- Organization with Stripe Connect details
- All attendees with masonic profiles
- All tickets with event details
- Lodge registration details (if applicable)

### `getRegistrationWithFullContext(registrationId: string)`
Fetches complete registration data using multiple optimized queries. This is the fallback when the RPC function is not available.

### `getPrimaryAttendeeDetails(registrationId: string)`
Gets the primary attendee's full details for Stripe customer creation, including masonic profile and lodge information.

### `getEventHierarchy(eventId: string)`
Retrieves the complete event hierarchy including parent and child events for metadata.

### Helper Functions

- `getEventTicketTypes(eventId: string)` - Fetches all ticket types for an event including child events
- `getOrganizationByEvent(eventId: string)` - Gets organization details by event ID
- `getRegistrationSummary(registrationId: string)` - Provides attendee and ticket breakdowns
- `getLodgeRegistrationDetails(registrationId: string)` - Gets lodge-specific registration data
- `getRegistrationMinimal(registrationId: string)` - Quick check with minimal data
- `getMultipleRegistrations(registrationIds: string[])` - Batch fetch for bulk operations

## Database Optimization

### RPC Function
An RPC function `get_payment_processing_data` is provided in the migrations that performs all joins in a single database call for optimal performance.

### Indexes
The following indexes are created for performance:
- `idx_attendees_registration_id`
- `idx_tickets_registration_id`
- `idx_events_parent_event_id`
- `idx_events_organiser_id`
- `idx_masonic_profiles_attendee_id`
- `idx_lodge_registrations_registration_id`

## Usage Example

```typescript
import { getPaymentProcessingData } from '@/lib/api/stripe-queries';

// In payment processing route
const paymentData = await getPaymentProcessingData(registrationId);

if (!paymentData) {
  throw new Error('Registration not found');
}

// Access comprehensive data
const {
  registration,
  event,
  organization,
  parent_event,
  child_events,
  attendees,
  tickets,
  lodge_registration
} = paymentData;

// Build Stripe metadata
const metadata = {
  registration_id: registration.registration_id,
  event_title: event.title,
  organisation_name: organization.name,
  total_attendees: registration.attendee_count,
  // ... etc
};
```

## Type Definitions

The module exports a comprehensive `RegistrationWithFullContext` interface that provides full type safety for all returned data.

## Performance Considerations

1. **Use the RPC function** when available for best performance
2. **Indexes are critical** - ensure they exist before using in production
3. **Consider caching** organization data as it rarely changes
4. **Batch operations** available for processing multiple registrations

## Migration

To use this module:
1. Run the `get_payment_processing_data_rpc.sql` migration
2. Import functions from `@/lib/api/stripe-queries`
3. Replace existing scattered queries with these optimized versions