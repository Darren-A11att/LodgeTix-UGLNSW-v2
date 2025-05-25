# Organizer Portal Documentation Summary

## Overview

This directory contains comprehensive documentation for the LodgeTix Organizer Portal, which has been designed to support:

1. **Hierarchical Event Structure**: Functions (parent events) containing multiple Child Events
2. **Stripe Connect Integration**: For distributed payment processing
3. **Sidebar Layout Navigation**: Modern application UI with responsive design
4. **Event Management**: Create, update, close, and archive child events
5. **Customer Service Tools**: Ticket re-issue, refunds, registration modifications
6. **Email Management**: Templates, bulk sending, automation
7. **Operational Tools**: Printing, invoicing, check-in systems

## Documentation Structure

### Core Documents (v3 - Complete Feature Set)

1. **[001-product-requirements-document-v3.md](./001-product-requirements-document-v3.md)** ⭐ LATEST
   - Complete PRD with all identified requirements
   - Customer service tools specification
   - Email management system
   - Print and invoice generation
   - 24-week implementation plan

2. **[002-user-stories-workflows-v2.md](./002-user-stories-workflows-v2.md)**
   - Detailed user stories for all features
   - Visual workflows using Mermaid diagrams
   - Stripe Connect onboarding flow
   - Cross-event attendee management workflows

3. **[003-api-specifications-v2.md](./003-api-specifications-v2.md)**
   - Supabase stored procedures for hierarchical events
   - Stripe Connect integration procedures
   - Database schema with parent-child relationships
   - Financial management with platform fees

4. **[004-technical-architecture-v2.md](./004-technical-architecture-v2.md)**
   - Component architecture with sidebar layout
   - Stripe Connect integration architecture
   - State management for complex hierarchical data
   - Security and performance considerations

5. **[005-implementation-plan-v3.md](./005-implementation-plan-v3.md)** ⭐ LATEST
   - 24-week comprehensive implementation plan
   - Phase 1: Foundation & Stripe Connect (Weeks 1-4)
   - Phase 2: Event Management (Weeks 5-8)
   - Phase 3: Customer Service Tools (Weeks 9-12)
   - Phase 4: Communication System (Weeks 13-16)
   - Phase 5: Operations & Printing (Weeks 17-20)
   - Phase 6: Polish & Launch (Weeks 21-24)

### Additional Specifications

6. **[006-missing-requirements-analysis.md](./006-missing-requirements-analysis.md)**
   - Comprehensive analysis of missing features
   - Event packages and media management
   - Customer service requirements
   - Email and communication needs
   - Print management specifications

7. **[007-customer-service-components.md](./007-customer-service-components.md)**
   - Detailed component specifications
   - Ticket re-issue system
   - Refund processing workflow
   - Bulk email composer
   - Print management system
   - Invoice generation

8. **[008-email-template-system.md](./008-email-template-system.md)**
   - Complete email template architecture
   - Rich text editor implementation
   - Template analytics
   - Email scheduling system
   - Resend integration enhancements

9. **[009-ticket-types-seating-groups-v2.md](./009-ticket-types-seating-groups-v2.md)** ⭐ LATEST
   - Analysis of actual database schema
   - Ticket type categories (seated, general admission, table)
   - Venue and seat management system
   - Table booking for banquet events
   - Enhanced package pricing and components
   - Migration strategy from existing data

10. **[010-stripe-connect-requirements-document.md](./010-stripe-connect-implementation-guide.md)** ⭐ NEW
    - Stripe Connect Custom accounts requirements
    - User stories for lodge treasurers and platform admins
    - KYC verification process for Masonic organizations
    - Automatic payout requirements (money in = money out)
    - Financial dashboard specifications
    - Implementation phases and tasks
    - Success metrics and risk mitigation

### Agile Implementation Plan ⭐ NEW

### Development Approach
- **[ORGANIZER-JOBS-TO-BE-DONE.md](./ORGANIZER-JOBS-TO-BE-DONE.md)** - Analysis of what organizers actually need
- **[AGILE-ROADMAP.md](./AGILE-ROADMAP.md)** - 5-version incremental delivery plan
- **[IMPLEMENTATION-GUIDE.md](./IMPLEMENTATION-GUIDE.md)** - Week-by-week implementation schedule
- **[AGILE-APPROACH-SUMMARY.md](./AGILE-APPROACH-SUMMARY.md)** - Why this approach works

### Version Breakdown (14 weeks total)
- **[v1/](./v1/)** - "See and Export" (2 weeks) - View registrations and export data
- **[v2/](./v2/)** - "Communicate and Support" (2 weeks) - Email and customer service
- **[v3/](./v3/)** - "Get Paid" (4 weeks) - Stripe Connect and payments
- **[v4/](./v4/)** - "Create and Manage" (3 weeks) - Event creation
- **[v5/](./v5/)** - "Scale and Professionalize" (3 weeks) - Advanced features

Each version folder contains:
- Numbered TODO items (TODO-###-description.md)
- VERSION-#-SUMMARY.md explaining the version's value

### Implementation Files

11. **[components/layout/OrganizerLayout.tsx](../components/layout/OrganizerLayout.tsx)**
    - Sidebar layout component (converted from HeadlessUI to shadcn/ui)
    - Responsive design with mobile slide-out menu
    - Stripe Connect status indicator
    - Recent functions quick access

12. **[(auth)/layout.tsx](../(auth)/layout.tsx)**
    - Authentication wrapper for organizer routes
    - Role-based access control
    - Stripe Connect status checking
    - Server-side data fetching

## What We Can Reuse from Existing Codebase

### Database Tables (Verified)
- **events**: Has parent_event_id for hierarchical structure ✅
- **eventpackages**: Basic package structure exists (but needs pricing)
- **eventpackagetickets**: Links packages to tickets with quantities
- **ticket_definitions**: Has eligibility rules for attendee types
- **event_capacity**: Tracks max_capacity, reserved_count, sold_count
- **event_fees**: Fee structure with fee_types table
- **value_added_services**: VAS items for events and packages
- **grand_lodges** & **lodges**: Masonic hierarchy structure ✅

### Components
- **Form Components**: All registration form components (BasicInfo, ContactInfo, etc.)
- **Display Components**: EventCard, AttendeeCard, OrderSummary
- **PDF Generation**: Ticket PDF generator with QR codes
- **Email Service**: Basic Resend integration
- **Validation**: Existing validation patterns and business logic

### Services
- **EventAdminService**: CRUD operations for events
- **PackageService**: Basic package/reservation system
- **QR Code Generator**: For tickets and check-in

### Database Functions (Can Leverage)
- **reserve_tickets_v3**: Ticket reservation system with expiry
- **get_event_availability**: Check event capacity in real-time
- **is_event_high_demand**: Demand tracking with threshold alerts
- **cancel_reservation**: Reservation management and capacity release
- **confirm_event_capacity**: Capacity validation before booking
- **complete_reservation**: Convert reservation to confirmed ticket
- **clear_expired_reservations**: Automatic cleanup of expired holds
- **broadcast_high_demand_event**: Real-time notifications
- **create_registration**: Atomic registration with attendees and tickets
- **verify_registration_payment**: Payment status verification

### Missing Critical Features (Verified Against Database)
- ❌ Stripe Connect integration (no stripe_connect_account_id in organisations table)
- ❌ Refund processing (payment_status enum has 'refunded' but no refund tracking)
- ❌ Email template management (no email_templates table)
- ❌ Bulk operations (no bulk_operations or batch tables)
- ❌ Invoice generation (no invoices table)
- ❌ Check-in system (tickets.checked_in_at exists but no check-in management)
- ❌ Print management (no print_jobs or print_queue tables)
- ❌ Ticket type categories (ticket_definitions has no category field for seated/GA/table)
- ❌ Structured seat allocation (tickets.seat_info is just a string field)
- ❌ Table/group booking system (no groups or table_bookings tables)
- ❌ Package pricing (eventpackages exists but no price field)

## Key Concepts

### Event Hierarchy
```
Function (Parent Event)
├── Child Event 1 (e.g., Installation Ceremony)
│   ├── Mason Tickets
│   └── Guest Tickets
├── Child Event 2 (e.g., Festive Board)
│   ├── Mason Tickets
│   └── Guest Tickets
└── Registration (Booking)
    ├── Attendee 1 → Tickets to Child Events
    └── Attendee 2 → Tickets to Child Events
```

### Stripe Connect Integration Requirements

#### Account Type: Express Accounts (Recommended)
- **Why Express**: Stripe handles onboarding, verification, and compliance
- **Platform controls**: Payout schedules, fund flows, and branding
- **Stripe manages**: KYC, identity verification, and account management

#### Database Requirements
```sql
-- Add to organisations table
ALTER TABLE organisations ADD COLUMN stripe_account_id TEXT UNIQUE;
ALTER TABLE organisations ADD COLUMN stripe_account_status TEXT;
ALTER TABLE organisations ADD COLUMN stripe_onboarding_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE organisations ADD COLUMN stripe_charges_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE organisations ADD COLUMN stripe_payouts_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE organisations ADD COLUMN stripe_account_created_at TIMESTAMP;
ALTER TABLE organisations ADD COLUMN platform_fee_percentage DECIMAL DEFAULT 2.5;

-- Add to events table (already has parent_event_id)
ALTER TABLE events ADD COLUMN stripe_product_id TEXT;
ALTER TABLE events ADD COLUMN stripe_price_id TEXT;
```

#### Implementation Flow
1. **Create Express Account**
   ```typescript
   const account = await stripe.accounts.create({
     type: 'express',
     country: 'AU',
     email: organizer.email,
     capabilities: {
       card_payments: { requested: true },
       transfers: { requested: true }
     },
     business_type: 'non_profit', // for Masonic lodges
     business_profile: {
       url: `${APP_URL}/organizer/${org.slug}`,
       mcc: '8699' // Membership organizations
     }
   });
   ```

2. **Generate Account Link**
   ```typescript
   const accountLink = await stripe.accountLinks.create({
     account: account.id,
     refresh_url: `${APP_URL}/organizer/stripe/onboarding`,
     return_url: `${APP_URL}/organizer/stripe/onboarding/complete`,
     type: 'account_onboarding'
   });
   ```

3. **Handle Platform Fees**
   ```typescript
   const paymentIntent = await stripe.paymentIntents.create({
     amount: ticketPrice * 100, // in cents
     currency: 'aud',
     application_fee_amount: Math.round(ticketPrice * 2.5), // 2.5% platform fee
     transfer_data: {
       destination: event.organizer.stripe_account_id
     }
   });
   ```

4. **Required Webhooks**
   - `account.updated` - Track onboarding completion
   - `account.application.authorized` - Initial connection
   - `account.application.deauthorized` - Disconnection
   - `payment_intent.succeeded` - Payment confirmation
   - `transfer.created` - Track payouts

#### Stripe Connect Status Tracking
1. **Not Connected**: No Stripe account
2. **Onboarding**: Account created, KYC pending
3. **Active**: Charges and payouts enabled
4. **Restricted**: Action required
5. **Disabled**: Account suspended

### Key Features
- **Host a Function**: Multi-step wizard for creating parent events with child events
- **Child Event Management**: CRUD operations (create, update, close, archive)
- **Cross-Event Analytics**: View attendee distribution across all child events
- **Financial Dashboard**: Stripe Connect integration for payments and payouts
- **Sidebar Navigation**: Modern UI with quick access to functions and key features

## Next Steps

### Immediate Implementation (Sprint 1)
1. Set up database tables for hierarchical events
2. Implement Stripe Connect OAuth flow
3. Create base stored procedures
4. Build sidebar layout structure

### Phase-by-Phase Implementation

**Phase 1 (Weeks 1-4)**: Foundation & Stripe Connect
**Phase 2 (Weeks 5-8)**: Event Management & Packages
**Phase 3 (Weeks 9-12)**: Customer Service Tools
**Phase 4 (Weeks 13-16)**: Email System
**Phase 5 (Weeks 17-20)**: Operations & Printing
**Phase 6 (Weeks 21-24)**: Polish & Launch

### Critical New Requirements
1. **Customer Service Dashboard** - Central hub for all support operations
2. **Email Template Engine** - With variable substitution and scheduling
3. **Refund Processing** - Integrated with Stripe Connect
4. **Print Management** - Batch operations for tickets, badges, manifests
5. **Invoice System** - GST-compliant tax invoices

### Testing Requirements
- E2E tests for complete customer journeys
- Refund processing with various scenarios
- Email delivery and tracking
- Print output verification
- Financial accuracy testing

## Notes for Developers

1. **Always check Stripe Connect status** before allowing function creation
2. **Use stored procedures** for all database operations (security via RLS)
3. **Platform fee is 2.5%** of all transactions
4. **Child events inherit** the Stripe account from their parent function
5. **Attendees purchase tickets** to specific child events, not the function itself

## Stripe Connect Key Decisions

Based on Masonic organization requirements:

1. **Account Type**: Custom Accounts (NOT Express or Standard)
   - Platform handles all KYC and compliance
   - Complete white-label experience (no Stripe branding)
   - Custom verification process for Masonic lodges
   - Platform manages tax forms and reporting

2. **Payment Flow**: Direct charges with application fees
   - Customer pays platform account
   - Platform fee (2.5%) automatically deducted
   - Immediate automatic payouts (money in = money out)
   - Next-day arrival for Australian banks

3. **Onboarding**: Platform-built flow
   - Custom forms for lodge information
   - Document upload for lodge charter, Grand Lodge certificates
   - Officer verification (Master, Secretary, Treasurer)
   - Platform admin approval process

4. **Required Database Fields**:
   - `stripe_account_id` (unique identifier)
   - `stripe_account_status` (tracking state)
   - `kyc_status` (platform verification state)
   - `kyc_verified_at` (approval timestamp)
   - `stripe_tos_acceptance_date` (terms acceptance)
   - Additional tables for KYC documents and representatives

5. **Key Webhooks**:
   - `account.updated` (track Stripe requirements)
   - `payment_intent.succeeded` (trigger automatic payout)
   - `person.updated` (representative verification)
   - `payout.created` (track disbursements)

## Database Schema Insights (From Verified Supabase Types)

### Existing Enums
- **attendee_type**: 'mason', 'guest', 'ladypartner', 'guestpartner'
- **payment_status**: 'pending', 'completed', 'failed', 'refunded', 'partially_refunded', 'cancelled', 'expired'
- **registration_type**: 'individuals', 'groups', 'officials', 'lodge', 'delegation'
- **organisation_type**: 'lodge', 'grandlodge', 'masonicorder', 'company', 'other'
- **attendee_contact_preference**: 'directly', 'primaryattendee', 'mason', 'guest', 'providelater'

### Key Relationships Verified
- Events → parent_event_id (hierarchical structure exists ✅)
- Tickets → attendee_id, event_id, ticket_definition_id
- Registrations → customer_id (but no event_id direct link)
- Attendees → registration_id, person_id
- Organisations → No Stripe Connect fields

### Database Views
- **formatted_events**: Pre-formatted event data with calculated fields
- **registration_payments**: Payment status aggregation
- **registration_summary**: Registration overview with customer names

## Document Versions

### Current (Use These)
- **v3 Documents**: Complete feature set including all customer service tools
- 001-product-requirements-document-v3.md ⭐ **USE THIS**
- All numbered documents (006, 007, 008) are current

### Historical (Reference Only)
- **v2 Documents**: Added hierarchical events and Stripe Connect
- **v1 Documents**: Original single-event structure (deprecated)

⚠️ **Always use the latest v3 PRD for implementation**