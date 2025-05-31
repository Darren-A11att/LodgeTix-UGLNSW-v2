# TODO: Update Code Field Names to Match Database

## Overview
Update all code references to match the actual database column names to ensure consistency and prevent mapping errors.

## Tasks

### 1. Update Registration Field References
- [ ] Find all references to `customer_id` in registration contexts
- [ ] Replace with `contact_id` to match database column
- [ ] Update type definitions in `shared/types/register.ts`
- [ ] Update any API calls or queries using `customer_id`

### 2. Update Organization Spelling
- [ ] Search codebase for `organization` (American spelling)
- [ ] Replace with `organisation` (British spelling) to match database
- [ ] Update all related fields: `organization_id` → `organisation_id`
- [ ] Check imports and type definitions

### 3. Update Event Organizer References
- [ ] Find references to `organizer_id` 
- [ ] Replace with `organiser_id` (British spelling)
- [ ] Update related fields like `organizer_name` → `organiser_name`

### 4. Update Ticket Availability Fields
- [ ] Replace `tickets_available` with `available_count`
- [ ] Replace `tickets_sold` with `sold_count`
- [ ] Replace `tickets_reserved` with `reserved_count`
- [ ] Update type definitions to match

### 5. Fix Partner Field Type
- [ ] Change `is_partner` references from string to boolean handling
- [ ] Add type conversion where needed since DB stores as TEXT

### 6. Update Location References
- [ ] Remove direct `location` string field references
- [ ] Use location relationship or create computed field
- [ ] Update components expecting simple location string

## Files to Check
- `/components/register/Forms/**/*.tsx`
- `/lib/api/**/*.ts`
- `/shared/types/*.ts`
- `/app/api/**/*.ts`
- `/contexts/*.tsx`
- `/lib/services/*.ts`

## Testing Required
- [ ] Registration flow still works with updated field names
- [ ] API calls return expected data
- [ ] Type checking passes
- [ ] No runtime errors from field mismatches