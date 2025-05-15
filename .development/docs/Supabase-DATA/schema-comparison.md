# Schema Comparison: Existing vs. Proposed

This document compares the existing Supabase database schema with the proposed schema from the SUPABASE_DATA_POINTS.md document, highlighting similarities, differences, and recommendations for alignment.

## Overview

The application requires a database schema to support event ticketing and registration for Masonic events. There are two schema versions to compare:

1. **Existing Schema**: Currently implemented in the Supabase project with ID `pwwpcjbbxotmiqrisjvf`
2. **Proposed Schema**: Detailed in the SUPABASE_DATA_POINTS.md document

## Table Comparison Summary

| Domain | Existing Tables | Proposed Tables | Status |
|--------|----------------|-----------------|--------|
| **Events** | Events, event_vas_options | events, event_venues | Partial Match |
| **Tickets** | ticket_definitions, EventTickets, Tickets | ticket_definitions, attendee_tickets | Partial Match |
| **Packages** | packages, package_events, package_vas_options | - | Existing Only |
| **Pricing** | price_tiers, ticket_type_price_tiers | - | Existing Only |
| **Registration** | Registrations, registration_vas | registrations, registration_value_added_services | Close Match |
| **Attendees** | Attendees, attendee_ticket_assignments | attendees, attendee_tickets | Close Match |
| **Organizations** | organisations, OrganisationMemberships | organizations, organizer_accounts | Partial Match |
| **Masonic** | grand_lodges, lodges, MasonicProfiles | grand_lodges, lodges | Close Match |
| **People** | people, Customers | users | Different Approach |
| **Locations** | locations | event_venues | Different Names |
| **Value-Added** | value_added_services | value_added_services | Match |
| **Payments** | - | payments | Proposed Only |
| **Reservations** | - | ticket_reservations | Implemented via Functions |
| **Analytics** | - | event_analytics | Proposed Only |
| **Check-in** | - | check_in_records | Proposed Only |
| **System** | DisplayScopes, registration_availabilities | - | Existing Only |
| **Fees** | fee_types, event_fees | - | Existing Only |

## Detailed Table Comparisons

### Events

**Existing Tables:**
- `Events`: Stores event information with fields for title, description, dates, location, etc.
- `event_vas_options`: Maps value-added services to events

**Proposed Tables:**
- `events`: Similar to existing Events table but with more detailed fields
- `event_venues`: Separate table for venue information

**Key Differences:**
1. Naming convention: Pascal case (Events) vs. snake case (events)
2. The proposed schema separates venue information into its own table
3. The existing schema has more fields for event categorization and display
4. The proposed schema includes more detailed fields for event schedule and documentation

**Recommendation:**
- Maintain the existing Events table structure but consider adding additional fields from the proposed schema
- Consider separating venue information into a dedicated table for better organization

### Tickets

**Existing Tables:**
- `ticket_definitions`: Defines ticket types available for events
- `EventTickets`: Tracks availability and status of event tickets
- `Tickets`: Records of actual tickets issued to attendees

**Proposed Tables:**
- `ticket_definitions`: Similar to existing table
- `attendee_tickets`: Maps tickets to attendees

**Key Differences:**
1. The existing schema has separate tables for definitions, availability, and issued tickets
2. The proposed schema combines availability and issued tickets functionality
3. Naming differences: EventTickets/Tickets vs. attendee_tickets

**Recommendation:**
- Keep the separation of concerns in the existing schema
- Consider standardizing naming conventions

### Packages

**Existing Tables:**
- `packages`: Defines packages of multiple events
- `package_events`: Maps events to packages
- `package_vas_options`: Maps value-added services to packages

**Proposed Tables:**
- No dedicated package tables; packages are handled through ticket_definitions with is_package=true

**Key Differences:**
1. The existing schema has a dedicated structure for packages
2. The proposed schema handles packages as special ticket definitions

**Recommendation:**
- Maintain the existing dedicated package structure, which allows for more flexibility
- Consider adding the is_package flag to ticket_definitions for API compatibility

### Registration

**Existing Tables:**
- `Registrations`: Stores registration data for events
- `registration_vas`: Tracks value-added services purchased with registrations

**Proposed Tables:**
- `registrations`: Similar to existing Registrations table
- `registration_value_added_services`: Similar to existing registration_vas table

**Key Differences:**
1. Naming convention differences
2. The proposed schema includes more detailed billing and payment fields
3. The existing schema has simpler payment tracking

**Recommendation:**
- Keep the existing structure but consider adding additional fields from the proposed schema
- Standardize naming conventions where possible

### Attendees

**Existing Tables:**
- `Attendees`: Stores attendee information
- `attendee_ticket_assignments`: Links attendees to tickets

**Proposed Tables:**
- `attendees`: Similar to existing Attendees table but with more fields
- `attendee_tickets`: Similar to attendee_ticket_assignments but with more status fields

**Key Differences:**
1. The proposed schema has more detailed fields for Mason-specific information
2. The existing schema splits some Mason information into a separate MasonicProfiles table
3. Naming and relationship differences between ticket assignment tables

**Recommendation:**
- Maintain the existing separation of concerns with MasonicProfiles
- Consider adding additional fields from the proposed schema
- Standardize naming conventions

### People and Customers

**Existing Tables:**
- `people`: Stores personal information
- `Customers`: Stores customer information for billing

**Proposed Tables:**
- `users`: Combines personal information with authentication

**Key Differences:**
1. The existing schema separates people from customers
2. The proposed schema combines user identity with personal information
3. The existing schema has more detailed customer information for billing

**Recommendation:**
- Keep the existing separation of people, customers, and authentication
- This separation provides more flexibility for various use cases

### Organizations

**Existing Tables:**
- `organisations`: Stores organization information
- `OrganisationMemberships`: Tracks memberships of people in organizations

**Proposed Tables:**
- `organizations`: Similar to existing organisations table
- `organizer_accounts`: Links users to organizations with roles

**Key Differences:**
1. Slight naming differences
2. The proposed schema focuses on organizer roles rather than general memberships

**Recommendation:**
- Maintain both concepts: general memberships and specific organizer roles
- Consider implementing organizer_accounts alongside OrganisationMemberships

### Missing in Existing Schema

Several components from the proposed schema are not present in the existing schema:

1. **Payments Table**:
   - The existing schema handles payments via Stripe integration without a dedicated table
   - Consider adding a payments table for better tracking

2. **Check-in System**:
   - The existing schema doesn't have a dedicated check_in_records table
   - Consider implementing this for event attendance tracking

3. **Analytics**:
   - The existing schema doesn't have a dedicated event_analytics table
   - Consider implementing this for better reporting

4. **Explicit Reservation Table**:
   - The existing schema handles reservations through database functions rather than a dedicated table
   - Consider whether a dedicated table would improve transparency and debugging

### Missing in Proposed Schema

Several components from the existing schema are not present in the proposed schema:

1. **Fee Management**:
   - The existing schema has fee_types and event_fees tables
   - These should be maintained for flexible fee management

2. **Display Scopes**:
   - The existing DisplayScopes table provides visibility control
   - This should be maintained for access control

3. **Registration Availabilities**:
   - Controls registration availability options
   - Should be maintained for flexible event configuration

4. **Price Tiers**:
   - The existing price_tiers and ticket_type_price_tiers tables provide advanced pricing
   - These should be maintained for flexible pricing strategies

## Database Functions Comparison

The existing schema includes several database functions not mentioned in the proposed schema:

1. **Ticket Reservation System**:
   - reserve_tickets, complete_reservation, cancel_reservation, etc.
   - These should be maintained for reliable reservation handling

2. **Ticket Availability**:
   - get_ticket_availability, is_ticket_high_demand
   - These provide important functionality for the front-end

3. **Search Functions**:
   - search_grand_lodges, search_lodges
   - These improve user experience for lodge selection

**Recommendation:**
- Maintain all existing database functions
- Implement any additional functions needed from the proposed schema

## Naming Conventions

There are inconsistencies in naming conventions between the existing and proposed schemas:

1. **Case Style**:
   - Existing: Mix of PascalCase (Events, Tickets) and snake_case (value_added_services)
   - Proposed: Consistently snake_case

2. **ID Field Names**:
   - Existing: Mix of formats (id, eventId, ticket_definition_id)
   - Proposed: Consistently snake_case (event_id, ticket_definition_id)

**Recommendation:**
- Consider standardizing naming conventions, but approach carefully to avoid breaking changes
- Document naming patterns for future development

## Integration Recommendations

To align the existing and proposed schemas:

1. **Short-Term Actions**:
   - Add missing fields to existing tables where needed
   - Implement missing tables for critical functionality (payments, check_in_records)
   - Create views to provide the expected structure for the application

2. **Medium-Term Actions**:
   - Standardize naming conventions through careful migrations
   - Enhance database functions to support all proposed functionality
   - Implement analytics and reporting capabilities

3. **Long-Term Actions**:
   - Consider restructuring venue information into a dedicated table
   - Evaluate whether to maintain separate people/customers tables vs. consolidated users
   - Implement comprehensive RLS policies for security

## SQL Migration Approach

When implementing changes, consider the following approach:

1. **Use Explicit Transactions**:
   ```sql
   BEGIN;
   -- Migration SQL here
   COMMIT;
   ```

2. **Create Before Modify**:
   - Add new tables and columns before modifying existing ones
   - This allows easier rollback if needed

3. **Views for Compatibility**:
   - Create views that map between different naming conventions
   - This allows gradual transition without breaking existing code

4. **Function Versioning**:
   - Keep existing function versions alongside new ones
   - Gradually transition to new versions

5. **Test Thoroughly**:
   - Create a test environment with production data
   - Verify all migrations before applying to production

## Conclusion

The existing schema provides a solid foundation but could benefit from some additions from the proposed schema. Rather than replacing the existing schema, a gradual enhancement approach is recommended to maintain stability while improving functionality.

Key recommendations:
1. Maintain the existing table structure and relationships
2. Add missing tables and fields from the proposed schema
3. Standardize naming conventions where possible
4. Implement comprehensive RLS policies
5. Enhance with additional analytics and reporting capabilities