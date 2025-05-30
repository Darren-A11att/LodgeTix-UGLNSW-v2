# LodgeTix Platform - Comprehensive Data Requirements Document

## Executive Summary

LodgeTix is an event ticketing platform for Masonic events with a hierarchical event structure where parent events contain child events. Users register for parent events but purchase tickets to individual child events. The platform supports three distinct registration types (Individuals, Lodges, and Delegations) and was designed to become a marketplace where event hosts (organizations) receive payments through Stripe Connect, though this feature is not yet implemented.

## Core Data Entities & Requirements

### 1. Events

#### Primary Event Data
- **Basic Information**: ID, slug (URL-friendly), title, subtitle, description, long description
- **Scheduling**: event_start, event_end, is_multi_day flag
- **Location**: Simple location text, detailed venue reference
- **Media**: image_url, banner_image_url
- **Hierarchy**: parent_event_id (null for parent events)
- **Status**: is_published, is_featured, degree_type
- **Capacity**: max_attendees
- **Stripe Integration**: stripe_product_id (for syncing with Stripe)

#### Event Metadata
- **Dress Code & Attire**: dress_code, regalia, regalia_description
- **Organization**: organizer_name, organizer_contact, organization_id
- **Package Association**: is_package flag, package references
- **Additional Info**: important_information array, event_includes array

#### Computed/Aggregated Fields
- **Pricing**: min_price (across all tickets), has_free_tickets
- **Availability**: is_sold_out, total_capacity, tickets_sold, tickets_available
- **Child Events**: Array of child events for parent events
- **URL Construction**: Different patterns for parent vs child events

#### Stripe Product Sync Requirements
- Each event should sync to a Stripe product on the connected account
- Product metadata includes: event_id, parent_event_id, event_type, event_slug
- Organization details: organisation_id
- Event timing: event_start, event_end
- Location and capacity information
- Sync status tracking: last_synced timestamp

### 2. Tickets & Pricing

#### Ticket Types (event_tickets)
- **Basic Info**: ID, name, description, category
- **Pricing**: price, currency (AUD), original_price (for discounts)
- **Inventory Management (Auto-managed by triggers)**:
  - total_capacity: Maximum tickets available of this type
  - available_count: Current tickets available (auto-calculated)
  - reserved_count: Tickets on hold (auto-calculated)
  - sold_count: Tickets sold (auto-calculated)
- **Eligibility**: eligibility_criteria JSONB field with rules:
  ```json
  {
    "rules": [
      {
        "type": "attendee_type",      // or "registration_type", "grand_lodge", "mason_rank"
        "operator": "in",             // or "equals", "not_in"
        "value": ["mason", "guest"]   // can be string or array
      }
    ],
    "operator": "AND"  // or "OR" - how to combine rules
  }
  ```
- **Status**: status (Active/Inactive), is_active boolean
- **Sorting**: sort_order or price-based ordering
- **Stripe Integration**: stripe_price_id (for syncing with Stripe)
- **Timestamps**: created_at, updated_at (auto-updated on count changes)

#### Stripe Price Sync Requirements
- Each ticket type should sync to a Stripe price on the connected account
- Linked to parent event's Stripe product
- Price metadata includes: ticket_id, ticket_type, event_id
- Features: includes_meal, includes_drinks
- Quantity limits: max_quantity, min_quantity
- Eligibility information
- Sync tracking: created_at timestamp

#### Individual Tickets (purchased)
- **Ownership**: attendee_id, registration_id
- **Type Link**: ticket_type_id (NOW REQUIRED - links to event_tickets.id)
- **Event**: event_id (required)
- **Pricing**: 
  - price_paid (required - actual amount paid)
  - original_price (list price before discounts)
  - currency (default: 'AUD')
- **Status** (required, enforced values):
  - 'available': Not assigned to anyone
  - 'reserved': Held for someone but not paid
  - 'sold': Paid and confirmed
  - 'cancelled': Released back to pool
  - 'used': Scanned at event
- **Payment**: payment_status (default: 'Unpaid'), purchased_at
- **Reservation**: reservation_id, reservation_expires_at
- **Metadata**: 
  - is_partner_ticket boolean
  - seat_info (seat assignment)
  - checked_in_at (when scanned)
- **Package Association**: package_id (if part of package)
- **Timestamps**: created_at, updated_at

#### Automatic Inventory Synchronization
- **Database Triggers** automatically update counts when tickets are:
  - Created: Decrements available_count, increments reserved/sold_count
  - Status changed: Moves counts between buckets
  - Deleted: Returns ticket to available pool
- **Count fields are read-only** from application perspective
- **Status transitions** that affect counts:
  - reserved → sold: Moves from reserved to sold count
  - sold → cancelled: Returns to available count
  - reserved → cancelled: Returns to available count

### 3. Packages

#### Package Definition
- **Basic Info**: ID, name, description
- **Pricing**: package_price, original_price, discount_percentage/amount
- **Contents**: included_items array (ticket IDs with quantities)
- **Eligibility**: eligibility_criteria (registration_type specific)
- **Description**: includes_description array
- **Status**: is_active, quantity available

#### Package Rules
- Different packages for different registration types
- Lodge packages: Fixed table pricing (e.g., $1950 for 10 seats)
- Delegation packages: Group pricing options
- Individual packages: Multi-event bundles with discounts

### 4. Registration Types & Data

#### Common Registration Data
- **Registration Info**: ID, confirmation_number, registration_date
- **Type**: registration_type (individuals, lodge, delegation)
- **Financial**: total_amount_paid, payment_status
- **Status**: status (draft, pending, confirmed, cancelled)
- **Payment**: stripe_payment_intent_id
- **Terms**: agree_to_terms flag
- **Session**: anonymous_session_id or user_id

#### Individual Registration ("Myself & Others")
- **Attendees Required**: 1-10 attendees with full details
- **Primary Attendee**: Must have complete contact info
- **Additional Attendees**: Can be mason or guest type
- **Partners**: Each attendee can have partners
- **Contact Flexibility**: Various contact preference options

##### Individual Attendee Data
- **Personal**: title, first_name, last_name, suffix
- **Contact**: email, phone (required for primary)
- **Type**: attendee_type (mason/guest)
- **Mason-Specific**: rank, grand_lodge, lodge, grand_officer details
- **Partner Info**: has_partner, relationship type
- **Additional**: dietary_requirements, special_needs
- **Preferences**: contact_preference (directly, via primary, etc.)

#### Lodge Registration (No Individual Attendees)
- **Lodge Info**: grand_lodge_id, lodge_id/name/number
- **Booking Contact**: Stored as customer, not attendee
- **Order**: number_of_tables, total_tickets (calculated)
- **Special**: seating_preferences, special_requests
- **Attendees**: Names to be provided later (not during registration)

##### Lodge Booking Contact (Customer)
- **Personal**: title, first_name, last_name, suffix
- **Masonic**: rank, grand_officer details
- **Contact**: email, mobile_number, phone
- **Additional**: dietary_requirements, additional_info

#### Delegation Registration
- **Delegation Info**: delegation_name, delegation_order_number
- **Type-Specific**:
  - Grand Lodge Delegation: grand_lodge_id
  - Masonic Order: formal_name, abbreviation, known_as
- **Members**: List of delegation members (attendees)
- **Head of Delegation**: Designated primary contact
- **Options**: Purchase-only mode or full member registration

### 5. Venues/Locations

#### Venue Data
- **Basic Info**: place_name, room_or_area
- **Address**: street_address, suburb, state, postal_code, country
- **Coordinates**: latitude, longitude (for mapping)
- **Capacity**: venue capacity
- **Map Integration**: venue_map_url generation

### 6. Organizations

#### Organization Data
- **Basic Info**: ID, name, known_as, abbreviation
- **Type**: organisation_type (lodge, grandlodge, masonicorder, company, other)
- **Contact**: website, primary contact details
- **Address**: street_address, city, state, postal_code, country
- **Stripe Connect**: stripe_onbehalfof (connected account ID)
- **Platform Settings**: platform_fee_override, payout_schedule

#### Stripe Connect Account Requirements
- **Account Creation**: Express or Standard Connect accounts
- **Account Status**: charges_enabled, payouts_enabled flags
- **Capabilities**: card_payments, transfers
- **Verification**: business_type, business_profile
- **Banking**: external_account for payouts
- **Dashboard Access**: login_links for account management

#### Organization Relationships
- Organizations can host events
- Events must link to organization for payment routing
- Grand Lodges are organizations
- Lodges belong to Grand Lodges
- Members belong to organizations
- One organization can host multiple events

### 7. Authentication & Users

#### User/Auth Data
- **Auth**: user_id (from Supabase), email, session token
- **Type**: anonymous vs authenticated
- **Customer**: Links auth user to customer record
- **Roles**: user_roles table with role assignments

#### Customer Data
- **Identity**: Links to auth user or anonymous session
- **Personal**: first_name, last_name, email, phone
- **Business**: business_name, business_number
- **Billing Address**: Full address details
- **Physical Address**: Separate from billing
- **Stripe**: stripe_customer_id

#### Permissions Model
- **Roles**: admin, organizer, member
- **Organization Membership**: role_in_org, is_primary_contact
- **Registration Ownership**: customer_id on registrations
- **Event Access**: Currently all events are public

### 8. Payment & Financial

#### Payment Processing
- **Payment Intent**: stripe_payment_intent_id, amount
- **Status**: payment_status (pending, completed, failed, refunded)
- **Billing Details**: Collected during checkout
- **Business Info**: Optional ABN/ACN for invoicing
- **Method**: Currently card payments only

#### Stripe Connect Implementation Requirements

##### Connected Account Data
- **Organization**: stripe_onbehalfof (connected account ID)
- **Account Status**: charges_enabled, payouts_enabled
- **Account Type**: 'express' or 'standard'
- **Platform Fees**: application_fee_amount, platform_fee_percentage
- **Payout Schedule**: daily, weekly, monthly options

##### Stripe Product/Event Sync (CRITICAL)
- **Edge Function Required**: Async sync after event/ticket changes
- **Event → Product**: Each event must sync to Stripe Product on connected account
- **Ticket → Price**: Each ticket type must sync to Stripe Price
- **Sync Tracking**: Last sync timestamp, sync status, error logs
- **Rate Limiting**: Handle Stripe API limits gracefully
- **Multi-tenant**: Support multiple connected accounts per organization

##### Payment Intent with Connect
- **Direct Charges**: on_behalf_of parameter routes payment to connected account
- **Platform Fee**: application_fee_amount (configurable percentage, e.g., 5%)
- **Statement Descriptor**: statement_descriptor_suffix with event title (max 22 chars)
- **Transfer Data**: destination account for fund routing

##### Comprehensive Payment Metadata Structure
```
Payment Intent Metadata:
- Registration Core:
  - registration_id
  - registration_type (individual/lodge/delegation)
  - confirmation_number (REG-XXXXXXXX)
  
- Event Hierarchy:
  - parent_event_id
  - parent_event_title (truncated to 500 chars)
  - parent_event_slug
  - child_event_count
  - child_event_ids (comma-separated)
  - child_event_titles (pipe-separated)
  
- Organization:
  - organisation_id
  - organisation_name
  - organisation_type (grand_lodge/lodge/etc)
  
- Attendee Information:
  - total_attendees
  - primary_attendee_name
  - primary_attendee_email
  - attendee_types (e.g., "mason:5,guest:3,partner:2")
  
- Lodge Information (if applicable):
  - lodge_id
  - lodge_name
  - lodge_number
  - grand_lodge_id
  
- Ticket Details:
  - tickets_count
  - ticket_types (e.g., "standard:5,vip:2")
  - ticket_ids (comma-separated)
  - tickets_summary (JSON string, max 500 chars)
  
- Financial:
  - subtotal
  - total_amount
  - platform_fee
  - platform_fee_percentage
  - currency (AUD)
  
- Tracking:
  - created_at (ISO timestamp)
  - environment (production/development)
  - app_version
  - session_id
  - user_id (if authenticated)
  - referrer
  - device_type (mobile/desktop/tablet)
```

##### Stripe Product/Price Sync
- **Event Products**: Each event syncs to a Stripe product
  - product_id stored in events.stripe_product_id
  - Metadata includes event details, organization, location
  - Images from event.image_url
  - Tax code for entertainment events
  
- **Ticket Prices**: Each ticket type syncs to a Stripe price
  - price_id stored in event_tickets.stripe_price_id
  - Linked to parent event's product
  - Metadata includes eligibility, includes (meal/drinks), quantity limits

##### Customer Management in Connect
- **Stripe Customers**: Created on connected accounts, not platform
- **Customer Metadata**:
  - attendee_id, registration_id
  - attendee_type, is_primary
  - Masonic info (lodge, rank, grand_lodge)
  - Dietary/accessibility requirements
  - Created/updated timestamps

##### Error Handling
- Check connected account status before processing
- Handle invalid/inactive connected accounts
- Fallback to platform account if Connect fails
- Comprehensive error messages for user feedback

##### Configuration
- STRIPE_PLATFORM_FEE_PERCENTAGE environment variable
- Per-organization fee overrides possible
- Configurable payout schedules
- Multi-currency support preparation

### 9. Masonic-Specific Data

#### Grand Lodges
- **Info**: name, abbreviation, country, state/region
- **Codes**: country_code_iso3, state_region_code
- **Organization**: Links to organizations table

#### Lodges
- **Identity**: name, number, display_name
- **Hierarchy**: belongs to grand_lodge
- **Location**: district, meeting_place, state_region
- **Type**: area_type classification

#### Masonic Profiles
- **Rank**: Current masonic rank
- **Titles**: masonic_title, grand_officer status
- **Office**: grand_office, grand_rank
- **Associations**: lodge_id, grand_lodge_id

### 10. Operational Data

#### Inventory Management
- **Automatic Synchronization**: Database triggers maintain real-time counts
- **Count Types**:
  - Event-level: reserved_count, sold_count (aggregated across all ticket types)
  - Ticket-type level: available_count, reserved_count, sold_count
- **Availability Checking**: Must verify available_count > 0 before creation
- **Reservation System**:
  - Expiry timestamps for held tickets
  - Automatic status change from reserved to cancelled on expiry
  - Prevents overselling through application-level checks
- **Database Functions Available**:
  - recalculate_event_ticket_counts(): Rebuild ticket type counts
  - recalculate_event_counts(): Rebuild event-level counts
  - initialize_event_ticket_availability(): Set initial availability

#### Session Management
- Anonymous session creation
- Draft registration recovery
- Form persistence (localStorage)
- Auto-save functionality

#### Confirmation & Communication
- Confirmation numbers (REG-XXXX format)
- Email notifications
- QR codes for tickets
- PDF ticket generation

### 11. Stripe Connect Webhook Data

#### Account Management Events
- **account.updated**: Track connected account status changes
  - stripe_account_status (active/pending)
  - stripe_payouts_enabled boolean
  - stripe_details_submitted boolean
  - stripe_capabilities JSON (card_payments, transfers)
  
- **account.application.authorized/deauthorized**: Track platform access
  - Authorization timestamps
  - Deauthorization handling

#### Financial Events
- **payout.created/failed/paid**: Track payouts to organizations
  - payout_id, amount, currency
  - arrival_date, status, method
  - destination account reference
  
- **transfer.created**: Track fund transfers
  - transfer_id, source_transaction
  - destination_account, amount
  - Platform reconciliation data

- **application_fee.created**: Track platform fees
  - fee_id, amount, currency
  - Link to registration_id
  - Commission tracking

#### Payment Events (Enhanced for Connect)
- **payment_intent.succeeded**: Enhanced with Connect data
  - connected_account_id
  - platform_fee_amount
  - Application fee details
  - Full metadata structure

### 12. Connect-Specific Database Tables

#### Organization Payouts
- Track all payouts to connected accounts
- Fields: payout_id, organisation_stripe_id, amount, currency, status
- arrival_date, method, description, metadata

#### Platform Transfers
- Track all transfers between accounts
- Fields: transfer_id, source_transaction, destination_account
- amount, currency, description, metadata

#### Connected Account Payments
- Track payments processed through connected accounts
- Fields: payment_intent_id, connected_account_id, registration_id
- amount, platform_fee, currency, status

### 13. Optimized Data Query Patterns

#### Registration Payment Context Query
Fetch all data needed for payment processing in one query:
- Registration details with all relationships
- Event hierarchy (parent/child events)
- Organization with Stripe account details
- All attendees with masonic profiles
- All tickets with event details
- Summary statistics (attendee breakdown, ticket types)

#### Event Ticket Hierarchy Query
- Get all tickets for parent and child events
- Include availability and eligibility
- Price calculations with package discounts

#### Lodge Registration Query
- Lodge details with grand lodge hierarchy
- Booking contact as customer (not attendee)
- Table/bulk ticket arrangements

#### RPC Functions for Performance
- get_payment_processing_data: Single query for all payment data
- get_event_ticket_hierarchy: All tickets in event family
- get_registration_summary: Aggregated statistics

### 14. Database Indexes for Performance

#### Critical Indexes
- attendees(registration_id)
- tickets(registration_id)
- tickets(ticket_type_id) - For inventory tracking
- events(parent_event_id)
- events(organiser)
- organisations(stripe_onbehalfof)
- event_tickets(event_id)

### 15. Metadata Constraints & Best Practices

#### Stripe Metadata Limits
- Maximum 50 keys per object
- Key names: max 40 characters
- Values: max 500 characters each
- Total size: 8KB limit

#### Metadata Structure Guidelines
- Use consistent key naming (lowercase, underscores)
- Truncate long values with ellipsis
- Prioritize essential data within limits
- Use JSON stringification for complex data
- Include versioning for schema evolution

## Data Access Patterns

### Public Access (No Auth)
- Browse all published events
- View event details and pricing
- Check ticket availability
- Start registration process

### Anonymous Users
- Complete registrations
- Make payments
- Receive confirmations
- No registration history

### Authenticated Users
- All anonymous capabilities
- View registration history
- Saved payment methods
- Profile management

### Admin/Organizer Access
- Event CRUD operations
- Registration management
- Financial reporting
- Attendee management

## Business Logic & Rules

### Event Hierarchy
- Parent events are containers
- Child events have actual tickets
- Registration spans multiple child events
- Packages bundle child event tickets

### Ticket Eligibility
- Eligibility rules stored in eligibility_criteria JSONB
- Supports rules for: attendee_type, registration_type, grand_lodge, mason_rank
- Multiple rules combined with AND/OR operators
- Enforced at ticket selection time

### Capacity Management
- **Automatic Inventory Tracking**:
  - Database triggers maintain accurate counts
  - Every ticket must have a ticket_type_id
  - Count fields (available, reserved, sold) are read-only
- **Availability Rules**:
  - Check available_count > 0 before creating tickets
  - Handle concurrent bookings gracefully
  - Allow negative available_count (overselling) but warn
- **Reservation Management**:
  - Tickets can be held with reservation_expires_at
  - Implement timeout for automatic cancellation
  - Status transitions automatically update counts
- **Real-time Updates**:
  - Show live availability to users
  - "Only X tickets left" warnings
  - Immediate sold-out notifications

### Registration Flow
1. Select registration type
2. Enter attendee/lodge details
3. Select tickets (skip for lodge)
4. Review order
5. Process payment
6. Receive confirmation

### Pricing Rules
- Individual ticket pricing
- Package discounts
- Table/bulk pricing for lodges
- Early bird pricing (future)

## Future Considerations

### Stripe Connect Marketplace (Full Implementation)
- **Host Onboarding**: 
  - Account creation flow (Express/Standard)
  - KYC verification process
  - Banking details collection
  - Dashboard access provisioning
  
- **Financial Management**:
  - Configurable platform fees per organization
  - Multi-currency support
  - Automated tax calculation
  - Reconciliation reports
  - Chargeback handling
  
- **Reporting Dashboard**:
  - Real-time revenue tracking
  - Payout history and schedules
  - Platform fee analytics
  - Organization performance metrics

### Enhanced Features
- Recurring events/subscriptions with Stripe Billing
- Waitlist management with automatic promotion
- Refund processing with partial refund support
- Transfer tickets between attendees
- Check-in system with QR scanning
- Group booking discounts
- Early bird pricing automation

### Data Analytics
- Event performance metrics with conversion tracking
- Attendee demographics and behavior analysis
- Revenue analytics with forecasting
- Capacity optimization algorithms
- Marketing attribution tracking
- A/B testing for pricing strategies

### Advanced Integration Features
- **Webhook Resilience**:
  - Retry logic for failed webhooks
  - Webhook event deduplication
  - Audit trail for all webhook events
  
- **Data Synchronization**:
  - Real-time sync between Stripe and database
  - Batch reconciliation processes
  - Conflict resolution strategies
  
- **Multi-tenant Architecture**:
  - Organization-specific dashboards
  - Isolated financial reporting
  - Custom branding per organization

## Data Dependencies and Relationships

### Core Entity Dependencies

#### Events Dependencies
- **Parent Event** (self-referential): parent_event_id → events.event_id
  - ON DELETE RESTRICT: Cannot delete parent events with children
  - Child events inherit organiser_id from parent via trigger
- **Organization**: organiser_id → organisations.organisation_id
  - ON DELETE SET NULL: Events remain but lose organization link
- **Location**: location_id → locations.location_id
  - ON DELETE SET NULL: Events remain but lose venue details
- **Display Scope**: display_scope_id → display_scopes.id
- **Registration Availability**: registration_availability_id → eligibility_criteria.id

#### Tickets Dependencies
- **Event** (REQUIRED): event_id → events.event_id
  - ON DELETE CASCADE: All tickets deleted when event is deleted
- **Ticket Type** (REQUIRED): ticket_type_id → event_tickets.id
  - ON DELETE RESTRICT: Cannot delete ticket types with existing tickets
- **Attendee**: attendee_id → attendees.attendee_id
  - ON DELETE SET NULL: Tickets remain but lose attendee assignment
- **Registration**: registration_id → registrations.registration_id
  - ON DELETE CASCADE: Tickets deleted with registration
- **Package**: package_id → packages.package_id
  - Optional relationship for package deals

#### Event Tickets Dependencies
- **Event** (REQUIRED): event_id → events.event_id
  - ON DELETE CASCADE: Ticket types deleted with event

#### Registrations Dependencies
- **Customer**: customer_id → customers.customer_id
  - REQUIRED: Every registration needs a customer
- **Event**: event_id → events.event_id
  - REQUIRED: Registration must be for an event
- **Organization**: organisation_id → organisations.organisation_id
  - For lodge/delegation registrations
- **Primary Attendee**: primary_attendee_id → attendees.attendee_id
  - Set after attendee creation

#### Attendees Dependencies
- **Registration** (REQUIRED): registration_id → registrations.registration_id
  - NOT CASCADE: Attendees remain if registration deleted (data integrity risk)
- **Contact**: contact_id → contacts.contact_id
  - ON DELETE SET NULL: Attendees lose contact details
- **Person**: person_id → people.person_id
  - Links to unified person record
- **Related Attendee**: related_attendee_id → attendees.attendee_id
  - Self-referential for partner relationships

#### Organizations Dependencies
- **Parent Organization**: Can reference other organizations
  - Grand Lodges are parent organizations
  - Lodges belong to Grand Lodges

#### Lodges Dependencies
- **Grand Lodge**: grand_lodge_id → grand_lodges.grand_lodge_id
  - REQUIRED: Every lodge must belong to a grand lodge
- **Organization**: organisation_id → organisations.organisation_id
  - Links to organization entity

#### Masonic Profiles Dependencies
- **Person**: person_id → people.person_id
  - ONE-TO-ONE: Each person has one masonic profile
- **Contact**: contact_id → contacts.contact_id
- **Lodge**: lodge_id → organisations.organisation_id
- **Grand Lodge**: grand_lodge_id → organisations.organisation_id

#### Packages Dependencies
- **Event**: event_id → events.event_id
  - Package belongs to specific event
- **Parent Event**: parent_event_id → events.event_id
  - Package can span parent event

### Critical Business Logic Dependencies

#### Inventory Management Chain
1. **event_tickets** defines available inventory
2. **tickets** consume from that inventory
3. Database triggers maintain count synchronization
4. Status transitions trigger count updates

#### Registration Flow Dependencies
1. **Customer** must exist before registration
2. **Registration** must exist before attendees
3. **Attendees** should exist before tickets (but not enforced)
4. **Payment** completion updates registration status

#### Event Hierarchy Rules
- Child events MUST have parent_event_id
- Parent events have parent_event_id = NULL
- Organiser inheritance from parent to child
- Tickets only on child events, not parents

### Data Integrity Safeguards Needed

1. **Orphan Prevention**:
   - Attendees without registrations (add CASCADE delete)
   - Tickets without valid attendees
   - Events without organizers

2. **Cascade Protection**:
   - Prevent deletion of events with paid tickets
   - Prevent deletion of registrations with completed payments
   - Archive instead of delete for audit trail

3. **Referential Integrity**:
   - All foreign keys should be validated
   - Consider soft deletes for critical data
   - Implement application-level checks before database constraints

## Key Implementation Notes

### Ticket System Requirements
1. **Mandatory ticket_type_id**: All new tickets MUST include a ticket_type_id
2. **Read-only count fields**: Never update count fields directly - let triggers handle it
3. **Availability checking**: Always verify available_count before creating tickets
4. **Status validation**: Only use allowed status values (available, reserved, sold, cancelled, used)
5. **Foreign key constraints**: Cannot delete ticket types with existing tickets

### Migration Considerations
- Existing tickets without ticket_type_id won't participate in inventory tracking
- Decision needed on handling legacy tickets (assign type or leave as-is)
- Consider creating a "legacy" ticket type for historical data

## Email and Document Generation

### Email Delivery
- **Not through Supabase Edge Functions** - Use existing email infrastructure
- Email templates managed within application codebase
- Triggered after successful payment and registration confirmation
- QR codes generated on-demand as part of email generation

### PDF Ticket Generation
- **Generated on-demand** after payment confirmation
- QR codes created during PDF generation process
- Not pre-generated or stored
- Delivered via email attachment or download link

## Realtime Features

### Ticket Availability Updates
- **Implementation Required**: Real-time availability during ticket selection
- When user selects ticket in UI:
  1. Create ticket record with status='reserved' immediately
  2. This triggers database count updates
  3. Other users see reduced availability in real-time
  4. If payment fails, status changes to 'cancelled' releasing the ticket
- Prevents overselling and provides accurate availability

### System Event Updates
- **Internal use only** - Not user-facing
- Application components subscribe to relevant changes
- Examples:
  - Capacity changes affect ticket selection
  - Event cancellations trigger UI updates
  - Price changes update displayed amounts

## Data Capture Strategy

### What Gets Stored Where

#### LocalStorage Only
- Form progress and draft data (existing behavior)
- UI preferences
- Session state

#### Database Storage (Supabase)
- Ticket selections (created as 'reserved' immediately)
- Completed registrations
- Payment records
- All business-critical data

#### No Database Storage
- Page view analytics
- Detailed interaction tracking
- Form field change history

### Ticket Reservation Flow
1. **Selection Phase**: User selects ticket → Create DB record with status='reserved'
2. **Payment Phase**: Payment processing → Keep status='reserved'
3. **Confirmation**: Payment success → Update status='sold'
4. **Cancellation**: Payment fails/timeout → Update status='cancelled'

This comprehensive data requirements document captures the full scope of the LodgeTix platform's data needs based on analysis of the codebase and recent database enhancements, with refined approach to edge functions, realtime features, and data capture based on actual implementation needs.