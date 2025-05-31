# LodgeTix Platform - Comprehensive Data Requirements Document

## Executive Summary

LodgeTix is an event ticketing platform for Masonic events with a hierarchical event structure where parent events contain child events. Users register for parent events but purchase tickets to individual child events. The platform supports three distinct registration types (Individuals, Lodges, and Delegations) and was designed to become a marketplace where event hosts (organizations) receive payments through Stripe Connect

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

### 2. Tickets & Pricing

#### Ticket Types (event_tickets)
- **Basic Info**: ID, name, description, category
- **Pricing**: price, currency (AUD), original_price (for discounts)
- **Inventory**: total_capacity, sold_count, reserved_count, available_count
- **Eligibility**: eligible_attendee_types array (mason, guest, ladypartner, guestpartner)
- **Status**: is_active, availability_status
- **Sorting**: sort_order or price-based ordering

#### Individual Tickets (purchased)
- **Ownership**: attendee_id, registration_id
- **Pricing**: price_paid, original_price
- **Status**: ticket_status (reserved, completed, cancelled)
- **Metadata**: is_partner_ticket, seat_info, purchased_at, checked_in_at
- **Package Association**: package_id (if part of package)

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
- **Stripe**: stripe_onbehalfof (for future Connect integration)

#### Organization Relationships
- Organizations can host events
- Grand Lodges are organizations
- Lodges belong to Grand Lodges
- Members belong to organizations

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

#### Future Stripe Connect Requirements
- Organization stripe_onbehalfof accounts
- Platform fees/commissions
- Payout management
- Multi-currency support

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
- Real-time capacity tracking
- Reserved vs sold counts
- Availability calculations
- Reservation expiry timestamps

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
- Mason-only tickets
- Guest-only tickets
- Partner tickets
- Eligibility based on attendee_type

### Capacity Management
- Hard limits on event capacity
- Soft limits via reservations
- Automatic release of expired reservations
- Real-time availability updates

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

### Stripe Connect Marketplace
- Host onboarding flow
- Connected account management
- Platform fee structure
- Automated payouts
- Financial reporting per host

### Enhanced Features
- Recurring events/subscriptions
- Waitlist management
- Refund processing
- Transfer tickets between attendees
- Check-in system with QR scanning

### Data Analytics
- Event performance metrics
- Attendee demographics
- Revenue analytics
- Capacity optimization
- Marketing insights

This comprehensive data requirements document captures the full scope of the LodgeTix platform's data needs based on analysis of the codebase, focusing on what the system is designed to do rather than current database implementation.