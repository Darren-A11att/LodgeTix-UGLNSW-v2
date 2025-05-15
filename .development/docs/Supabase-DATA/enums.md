# Supabase Database Enumerated Types Documentation

This document describes all enumerated types (ENUMs) defined in the LodgeTix-UGLNSW-v2 Supabase database. Enumerated types provide a way to constrain values to a specific set of options, improving data integrity and readability.

## Enum Types Overview

The database contains the following enumerated types:

1. **attendee_contact_preference** - Specifies how an attendee prefers to be contacted
2. **attendee_type** - Categorizes the type of attendee
3. **billing_reason** - Describes reasons for billing operations (Stripe integration)
4. **billing_scheme** - Defines billing scheme types (Stripe integration)
5. **collection_method** - Specifies payment collection methods (Stripe integration)
6. **invoice_status** - Describes possible states of an invoice (Stripe integration)
7. **organisation_type** - Categorizes types of organizations
8. **price_type** - Distinguishes between one-time and recurring prices
9. **quote_status** - Describes possible states of a quote (Stripe integration)
10. **stripe_order_status** - Tracks status of orders (Stripe integration)
11. **stripe_subscription_status** - Tracks status of subscriptions (Stripe integration)
12. **tax_behavior** - Defines how taxes are handled (Stripe integration)

## Detailed Enum Documentation

### attendee_contact_preference

This enum defines how an attendee prefers to be contacted.

**Type Name:** `attendee_contact_preference`

| Value | Description |
|-------|-------------|
| Directly | Contact the attendee directly |
| PrimaryAttendee | Contact via the primary attendee |
| Mason | Contact via the Mason |
| Guest | Contact via the Guest |
| ProvideLater | Contact details to be provided later |

**Usage:**
- Used in the `Attendees` table's `contactpreference` column
- Controls how communication about events, tickets, and updates is delivered

### attendee_type

This enum categorizes the different types of attendees at an event.

**Type Name:** `attendee_type`

| Value | Description |
|-------|-------------|
| Mason | A Freemason attending the event |
| Guest | A non-Masonic guest attending the event |
| LadyPartner | A female partner of a Mason |
| GuestPartner | A partner of a Guest |

**Usage:**
- Used in the `Attendees` table's `attendeetype` column
- Determines eligibility for certain ticket types
- Affects form fields displayed during registration
- May influence pricing for certain ticket types

### billing_reason

This enum describes the reasons for creating a billing event, primarily used with Stripe integration.

**Type Name:** `billing_reason`

| Value | Description |
|-------|-------------|
| subscription_cycle | Regular billing cycle for a subscription |
| subscription_create | Initial billing for a new subscription |
| subscription_update | Billing due to subscription change |
| subscription_threshold | Billing triggered by usage threshold |
| manual | Manually triggered billing |
| upcoming | Upcoming billing preview |
| quote_accept | Billing triggered by quote acceptance |

**Usage:**
- Primarily used with Stripe integrations
- Helps track why billing operations occur
- May affect billing logic and notifications

### billing_scheme

This enum defines the billing scheme types, primarily used with Stripe integration.

**Type Name:** `billing_scheme`

| Value | Description |
|-------|-------------|
| per_unit | Charges the same amount per unit |
| tiered | Uses tiered pricing based on quantity |

**Usage:**
- Used with price/product definitions
- Affects how quantities are calculated in orders
- Determines price calculation logic

### collection_method

This enum specifies the methods used to collect payments, primarily used with Stripe integration.

**Type Name:** `collection_method`

| Value | Description |
|-------|-------------|
| charge_automatically | Payment is automatically charged |
| send_invoice | An invoice is sent for manual payment |

**Usage:**
- Determines how payments are collected
- Affects payment flow and user experience
- Influences automation of payment processing

### invoice_status

This enum describes the possible statuses of an invoice, primarily used with Stripe integration.

**Type Name:** `invoice_status`

| Value | Description |
|-------|-------------|
| draft | Invoice is a draft and not yet finalized |
| open | Invoice is open and awaiting payment |
| paid | Invoice has been paid |
| void | Invoice has been voided |
| uncollectible | Invoice is marked as uncollectible |

**Usage:**
- Tracks the lifecycle of invoices
- Affects reporting and financial reconciliation
- May trigger different notification flows

### organisation_type

This enum categorizes the types of organizations in the system.

**Type Name:** `organisation_type`

| Value | Description |
|-------|-------------|
| Lodge | A Masonic Lodge |
| GrandLodge | A Grand Lodge (governing body) |
| MasonicOrder | A Masonic Order or affiliated body |
| Company | A commercial company |
| Other | Other type of organization |

**Usage:**
- Used in the `organisations` table's `type` column
- Affects business logic and UI presentation
- Determines available operations and relationships
- May influence event eligibility and visibility

### price_type

This enum distinguishes between one-time and recurring prices.

**Type Name:** `price_type`

| Value | Description |
|-------|-------------|
| one_time | A single, one-time charge |
| recurring | A recurring charge (subscription) |

**Usage:**
- Defines whether a price is for a one-time purchase or recurring payment
- Affects billing logic and display
- Influences payment processing workflow

### quote_status

This enum describes the possible statuses of a quote, primarily used with Stripe integration.

**Type Name:** `quote_status`

| Value | Description |
|-------|-------------|
| draft | Quote is in draft form |
| open | Quote is open and awaiting response |
| accepted | Quote has been accepted by the customer |
| canceled | Quote has been canceled |
| expired | Quote has expired |

**Usage:**
- Tracks the lifecycle of quotes
- May affect business flow and next actions
- Influences reporting and analytics

### stripe_order_status

This enum tracks the status of orders processed through Stripe.

**Type Name:** `stripe_order_status`

| Value | Description |
|-------|-------------|
| pending | Order is pending processing |
| completed | Order has been completed |
| canceled | Order has been canceled |

**Usage:**
- Tracks the state of orders
- Affects inventory and fulfillment processes
- Influences customer notifications and reporting

### stripe_subscription_status

This enum tracks the status of subscriptions managed through Stripe.

**Type Name:** `stripe_subscription_status`

| Value | Description |
|-------|-------------|
| not_started | Subscription has not yet started |
| incomplete | Subscription is incomplete |
| incomplete_expired | Subscription failed to activate and has expired |
| trialing | Subscription is in trial period |
| active | Subscription is active and in good standing |
| past_due | Subscription payment is past due |
| canceled | Subscription has been canceled |
| unpaid | Subscription has unpaid invoices |
| paused | Subscription is temporarily paused |

**Usage:**
- Tracks the lifecycle of subscriptions
- Determines access to subscription benefits
- Affects billing operations and retry logic
- Influences reporting and customer communications

### tax_behavior

This enum defines how taxes are handled in pricing, primarily used with Stripe integration.

**Type Name:** `tax_behavior`

| Value | Description |
|-------|-------------|
| inclusive | Price includes taxes |
| exclusive | Taxes are calculated and added to price |
| unspecified | Tax behavior is not specified |

**Usage:**
- Determines how taxes are calculated
- Affects display prices and checkout totals
- Influences financial reporting and tax compliance

## Additional Custom Enums

While not explicitly defined in the database types file, the following enums are used in the database schema:

### payment_status

This enum tracks the status of payments for registrations.

**Type Name:** `payment_status`

| Value | Description |
|-------|-------------|
| pending | Payment is pending |
| completed | Payment has completed successfully |
| failed | Payment has failed |
| refunded | Payment has been fully refunded |
| partially_refunded | Payment has been partially refunded |
| cancelled | Payment has been cancelled |
| expired | Payment has expired |

**Usage:**
- Used in the `Registrations` table's `paymentStatus` column
- Tracks the state of payment for registrations
- Affects business logic and reporting

### registration_type

This enum categorizes the types of registrations.

**Type Name:** `registration_type`

| Value | Description |
|-------|-------------|
| Individuals | Registration for individuals |
| Groups | Registration for a group |
| Officials | Registration for officials |

**Usage:**
- Used in the `Registrations` table's `registrationType` column
- Affects registration flow and available options
- May influence pricing and form fields

## Using Enums in TypeScript

The Supabase TypeScript client provides type definitions for these enums. They can be imported and used in TypeScript code as follows:

```typescript
import { Database } from '@/shared/types/supabase';

// Type for attendee_type enum
type AttendeeType = Database['public']['Enums']['attendee_type'];

// Example usage in a function
function isEligibleForMasonicTicket(attendeeType: AttendeeType): boolean {
  return attendeeType === 'Mason';
}
```

## Using Enums in SQL Queries

In SQL queries, enums are used as typed values:

```sql
-- Example: Find all Mason attendees
SELECT * FROM "Attendees" 
WHERE attendeetype = 'Mason'::attendee_type;

-- Example: Find all Lodges
SELECT * FROM "organisations" 
WHERE type = 'Lodge'::organisation_type;
```

## References

- [PostgreSQL Enumerated Types](https://www.postgresql.org/docs/current/datatype-enum.html)
- [Supabase TypeScript Documentation](https://supabase.com/docs/reference/javascript/typescript-support)