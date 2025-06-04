# Individual Registration Field Mismatch Audit

## Summary of Mismatches Found

### 1. REGISTRATIONS Table Mismatches

| Code Uses | Database Has | Status |
|-----------|--------------|--------|
| `event_id` | `function_id` | ❌ MISMATCH |
| `customer_id` | `contact_id` | ❌ MISMATCH |

**Missing from code but in database:**
- `organisation_id`
- `connected_account_id`
- `platform_fee_amount`
- `platform_fee_id`
- `confirmation_number`
- `confirmation_pdf_url`
- `created_at`
- `updated_at`

### 2. ATTENDEES Table Mismatches

**All fields appear to match correctly** ✅

**Missing from code but in database:**
- `created_at`
- `updated_at`

### 3. TICKETS Table Mismatches

**All fields being used match correctly** ✅

**Missing from code but in database:**
- `ticket_status`
- `original_price`
- `currency`
- `seat_info`
- `reservation_id`
- `reservation_expires_at`
- `purchased_at`
- `checked_in_at`
- `qr_code_url`
- `created_at`
- `updated_at`

### 4. CUSTOMERS Table Mismatches

**All fields now match correctly after our fix** ✅

**Missing from code but in database:**
- `organisation_id`
- `stripe_customer_id`

## Critical Fixes Required

1. **registrations table**:
   - Change `event_id` → `function_id`
   - Change `customer_id` → `contact_id`

2. **Timestamp fields**: Consider adding `created_at` and `updated_at` to all insert operations (though database may handle defaults)

3. **Optional enhancements**:
   - Add `confirmation_number` generation for registrations
   - Add `organisation_id` support for lodge registrations
   - Add Stripe-related fields when payment is processed