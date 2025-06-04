# Lodge Registration API Implementation Summary

## Overview
This document summarizes the implementation of the dedicated Lodge Registration API, which mirrors the functionality of the Individual Registration API but is tailored for lodge registrations without individual attendee management.

## Key Changes Made

### 1. Database Schema Updates

#### Migration: `20250607_001_update_registrations_customer_id.sql` (New)
- Adds `customer_id` column to registrations table if it doesn't exist
- Updates foreign key constraints to reference customers table
- Updates RLS policies to use customer_id and auth_user_id
- Note: No data migration needed as registrations table doesn't have contact_id column

#### Migration: `20250607_002_update_lodge_rpc_customer_id.sql` (New)
- Updates `upsert_lodge_registration` RPC function to use customer_id
- Removes all references to contacts table
- Creates customer records directly for lodge representatives
- Stores lodge details in both dedicated columns and registration_data JSONB

#### Migration: `20250607_005_add_missing_columns_to_registrations.sql` (New)
- Adds missing columns to registrations table:
  - `organisation_name` (TEXT)
  - `organisation_number` (TEXT)
  - `primary_attendee` (TEXT)
  - `attendee_count` (INTEGER)
- Adds indexes for performance
- Migrates existing data from registration_data JSONB to new columns

#### Migration: `20250607_006_create_lodge_registration_view.sql` (New)
- Creates `lodge_registration_complete_view` for comprehensive lodge data
- Uses new columns with fallback to registration_data JSONB
- Includes customer, function, and lodge details

### 2. API Route Structure

#### `/api/registrations/lodge/route.ts` (New)
- **POST**: Creates new lodge registrations
  - Validates auth, function, package, and lodge details
  - Creates customer record for booking contact
  - Calls `upsert_lodge_registration` RPC
  - Returns registration ID and confirmation details
  
- **PUT**: Updates payment status after successful payment
  - Validates registration exists
  - Updates payment status to 'completed'
  - Preserves existing registration data
  
- **GET**: Fetches complete lodge registration details
  - Returns registration with customer information
  - Filters by registration_type = 'lodge'

### 3. Main Registration Route Update
- Updated `/api/registrations/route.ts` to redirect lodge registrations to `/api/registrations/lodge`
- Similar to how individuals are redirected to their dedicated endpoint

### 4. Payment Route Update
- Updated `/api/registrations/[id]/payment/route.ts` to handle lodge payments
- Calls dedicated lodge endpoint for payment completion
- Ensures proper status updates after successful payment

## Key Differences from Individual Registration

1. **No Attendees Table Records**
   - Lodge registrations don't track individual attendees
   - Total attendee count stored in registrations.attendee_count

2. **No Contacts Table Records**
   - Only customers table used for booking contact
   - All contact info stored in customers table

3. **No Tickets Table Records**
   - Lodges purchase packages, not individual tickets
   - Package details stored in registration_data JSONB

4. **Simplified Data Model**
   - Focus on lodge-level information
   - Representative details in customers table
   - Lodge details in registration fields

## Data Flow

1. **Registration Creation**:
   ```
   LodgesForm → POST /api/registrations/lodge → upsert_lodge_registration RPC → customers + registrations tables
   ```

2. **Payment Processing**:
   ```
   Payment Form → PUT /api/registrations/[id]/payment → PUT /api/registrations/lodge → upsert_lodge_registration RPC (update)
   ```

3. **Data Retrieval**:
   ```
   GET /api/registrations/lodge?registrationId=xxx → lodge_registration_complete_view
   ```

## RPC Function Parameters

The `upsert_lodge_registration` function accepts:
- `p_function_id`: UUID of the function
- `p_package_id`: UUID of the selected package
- `p_table_count`: Number of tables/packages ordered
- `p_booking_contact`: JSONB with contact details
- `p_lodge_details`: JSONB with lodge information
- `p_payment_status`: Payment status (pending/completed)
- `p_stripe_payment_intent_id`: Stripe payment ID
- `p_registration_id`: For updates (optional)
- `p_total_amount`: Total amount in dollars
- `p_subtotal`: Subtotal amount
- `p_stripe_fee`: Stripe processing fee
- `p_metadata`: Additional metadata

## Next Steps

To complete the lodge registration flow:

1. **Update LodgesForm Component**:
   - Change API endpoint from `/api/registrations` to `/api/registrations/lodge`
   - Update request payload structure to match new API
   - Remove attendee-related logic

2. **Test End-to-End Flow**:
   - Test registration creation
   - Test payment processing
   - Test data retrieval
   - Verify customer_id references work correctly

3. **Migration Deployment**:
   - Run migrations in order:
     1. `20250607_001_update_registrations_customer_id.sql`
     2. `20250607_002_update_lodge_rpc_customer_id.sql`
     3. `20250607_005_add_missing_columns_to_registrations.sql`
     4. `20250607_006_create_lodge_registration_view.sql`

## Benefits

1. **Clean Separation**: Lodge logic completely separate from individual registrations
2. **Consistent Architecture**: Follows same pattern as individuals API
3. **Proper FK References**: Uses customer_id throughout
4. **No Breaking Changes**: Existing registrations continue to work
5. **Simplified Logic**: No complex attendee/ticket management for lodges