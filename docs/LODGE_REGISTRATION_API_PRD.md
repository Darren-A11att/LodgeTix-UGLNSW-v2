# Lodge Registration API - Product Requirements Document

## Overview
This document outlines the requirements for creating a dedicated Lodge Registration API that mirrors the functionality of the Individual Registration API but is tailored for lodge registrations without individual attendee management.

## Problem Statement
- The registrations table has been updated to use `customer_id` instead of `contact_id`
- The foreign key now references the `customers` table instead of `contacts`
- The current LodgesForm is broken due to these schema changes
- Lodge registrations need a dedicated API similar to individuals but without attendee creation

## Goals
1. Create a dedicated API route for lodge registrations (`/api/registrations/lodge`)
2. Implement proper database operations respecting the new `customer_id` schema
3. Ensure clean separation of concerns between lodge and individual registrations
4. Maintain consistency with the existing registration flow

## Technical Requirements

### Database Schema Changes
1. Ensure `registrations.customer_id` column exists with proper FK to `customers.customer_id`
2. Remove or deprecate the old `contact_id` column
3. Update all RPC functions to use `customer_id`

### API Endpoints
#### POST /api/registrations/lodge
- Creates a new lodge registration
- Creates customer record for the booking contact (lodge representative)
- Creates registration record with proper `customer_id` reference
- Returns registration ID and payment details

#### PUT /api/registrations/lodge
- Updates payment status after successful payment
- Updates registration status to 'confirmed'
- Updates payment-related timestamps

#### GET /api/registrations/lodge/[id]
- Fetches complete lodge registration details
- Returns customer information, registration data, and payment status

### RPC Function: upsert_lodge_registration
Creates the following records:
1. **customers table**: Lodge representative as booking contact
2. **registrations table**: Lodge registration with:
   - `customer_id` (FK to customers)
   - `function_id`
   - `registration_type` = 'lodge'
   - `organisation_name` (lodge name)
   - `organisation_number` (lodge number)
   - `primary_attendee` (lodge representative name)
   - `attendee_count` (number of lodge members)
   - `payment_status`
   - `auth_user_id` (for RLS)

### Key Differences from Individual Registration
- **NO attendees table records** (lodge registrations don't track individual attendees)
- **NO contacts table records** (only customers table for booking contact)
- **NO masonic_profiles** (lodge-level registration only)
- **NO tickets table records** (lodges don't purchase individual tickets)
- Simpler data model focused on lodge-level information

### Migration Order
1. First: Add `customer_id` column to registrations table
2. Second: Migrate existing data from `contact_id` to `customer_id`
3. Third: Create RPC functions that use `customer_id`
4. Fourth: Update API routes and frontend components

## Implementation Steps
1. Fix migration files to ensure proper execution order
2. Create `/api/registrations/lodge` route with POST/PUT/GET handlers
3. Create `upsert_lodge_registration` RPC function
4. Update LodgesForm component to use new API
5. Test complete registration flow
6. Clean up deprecated `contact_id` references

## Success Criteria
- Lodge registrations can be created successfully
- Payment processing works correctly
- All data is stored with proper `customer_id` references
- No references to deprecated `contact_id` remain
- Clean separation between lodge and individual registration logic