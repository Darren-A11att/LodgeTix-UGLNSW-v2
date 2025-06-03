# Database Column Name Mismatches - Comprehensive Fix Summary

## Overview
This document tracks all database column name mismatches found in the codebase and their fixes.

## 1. Suffix Column Mismatches
**Issue**: Code uses `suffix` but database has `suffix_1`, `suffix_2`, `suffix_3`
**Fix**: Use `suffix_1` for primary suffix

### Files to Fix:
- [ ] `/app/api/registrations/lodge/route.ts:252`
- [ ] `/app/api/registrations/route.ts:436, 454`

## 2. Registration Table: customer_id → contact_id
**Issue**: Code uses `customer_id` but registrations table uses `contact_id`
**Fix**: Replace all `customer_id` references with `contact_id`

### Files to Fix:
- [ ] `/app/api/functions/[functionId]/individual-registration/route.ts:207`
- [ ] `/app/api/functions/[functionId]/register/route.ts:149`
- [ ] `/app/api/functions/[functionId]/packages/[packageId]/lodge-registration/route.ts:392`
- [ ] `/app/api/registrations/lodge/route.ts:360, 393`
- [ ] `/app/api/registrations/route.ts:137, 219, 220, 276, 277, 345`

## 3. Phone Column References
**Issue**: Code uses generic `phone` but should use specific columns
**Fix**: Use `mobile_number` for mobile, `billing_phone` for billing

### Files to Fix:
- [ ] `/app/api/registrations/lodge/route.ts:255`
- [ ] `/app/api/registrations/route.ts:234, 319, 456`
- [ ] `/lib/services/registration-service.ts:153, 183, 298`

## 4. Tickets Table Columns
**Issue**: Code uses `ticket_price` and `ticket_status` which don't exist
**Fix**: Use `price_paid` and `status`

### Files to Fix:
- [ ] `/app/api/functions/[functionId]/tickets/route.ts:73, 83`
- [ ] `/app/api/registrations/route.ts:605`
- [ ] `/app/api/registrations/[id]/payment/route.ts:331`
- [ ] `/app/api/registrations/[id]/verify-payment/route.ts:83`
- [ ] `/app/api/stripe/webhook/route.ts:217`
- [ ] `/lib/services/function-tickets-service.ts:9, 90`

## 5. Enum Value Mismatches

### 5.1 Payment Status: 'paid' → 'completed'
**Issue**: Code uses 'paid' but enum expects 'completed'
**Fix**: Replace 'paid' with 'completed'

### Files to Fix:
- [ ] `/app/api/functions/[functionId]/individual-registration/route.ts:164`
- [ ] `/app/api/registrations/lodge/route.ts:341`
- [ ] `/app/api/registrations/[id]/verify-payment/route.ts:76`
- [ ] `/app/api/stripe/webhook/route.ts:402`

### 5.2 Registration Type: 'lodges' → 'lodge'
**Issue**: Code uses 'lodges' (plural) but enum expects 'lodge' (singular)
**Fix**: Replace 'lodges' with 'lodge'

### Files to Fix:
- [ ] `/lib/services/function-tickets-service.ts:129, 215`
- [ ] `/components/register/Forms/attendee/LodgesForm.tsx:83`
- [ ] `/components/register/RegistrationWizard/Steps/LodgeRegistrationStep.tsx:71, 87`
- [ ] `/supabase/migrations/20250103_create_upsert_lodge_registration_rpc.sql:183`

## Database Schema Reference

### contacts table
```sql
suffix_1 text,
suffix_2 text, 
suffix_3 text,
mobile_number text,
billing_phone character varying,
address_line_1 text,
address_line_2 text,
```

### registrations table
```sql
contact_id uuid, -- NOT customer_id
payment_status USER-DEFINED -- values: 'pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded', 'partially_refunded', 'expired'
registration_type USER-DEFINED -- values: 'individual', 'lodge', 'delegation'
```

### tickets table
```sql
price_paid numeric(10, 2) NOT NULL,
original_price numeric(10, 2) null,
status character varying(50) -- values: 'available', 'reserved', 'sold', 'used', 'cancelled'
-- NO ticket_price or ticket_status columns
```
EOF < /dev/null