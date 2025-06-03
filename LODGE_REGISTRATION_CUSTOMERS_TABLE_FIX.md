# Lodge Registration Customers Table Fix

## Issue
The RPC function was trying to insert into a `metadata` column that doesn't exist in the `customers` table:
```
Error in upsert_lodge_registration: column "metadata" of relation "customers" does not exist 42703
```

## Root Cause
The `customers` table structure doesn't include a `metadata` column. The RPC function was trying to use it for storing lodge-specific data.

## Solution
Updated the RPC function to:
1. Remove the `metadata` column reference from the customers insert
2. Use existing columns in the customers table:
   - `business_name` - for the lodge name
   - `email` - for the contact email
   - `customer_type` - set to 'organisation'
3. Store the metadata in the `registration_data` JSONB column of the registrations table instead

## Key Changes in RPC Function

### Before:
```sql
INSERT INTO customers (
    customer_id,
    contact_id,
    stripe_customer_id,
    metadata  -- This column doesn't exist!
) VALUES (...)
```

### After:
```sql
INSERT INTO customers (
    customer_id,
    contact_id,
    stripe_customer_id,
    business_name,  -- Use existing column
    email,          -- Use existing column
    customer_type   -- Use existing column
) VALUES (
    COALESCE(v_auth_user_id, gen_random_uuid()),
    v_contact_id,
    NULL,
    p_lodge_details->>'lodgeName',
    p_booking_contact->>'email',
    'organisation'::customer_type
)
```

## To Apply
Run the migration:
```bash
supabase db push
```

This will update the RPC function to work with the actual customers table schema.