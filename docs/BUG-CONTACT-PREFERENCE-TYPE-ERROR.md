# BUG: Contact Preference Type Error

## Error Description
```
Failed to create registration: Individual registration failed: type "contact_preference_type" does not exist
```

## Root Cause Analysis

### What Happened
The RPC function `upsert_individual_registration` is attempting to cast a value to an enum type `contact_preference_type` that doesn't exist in the database.

### Why It Happened
The migration assumed the existence of a database enum type without verifying its actual name or existence in the schema.

### Error Classification
**Schema Assumption Error** - Making assumptions about database schema (types, enums, columns) without verification.

## Business Logic Context
- Attendees have a `contact_preference` field
- Contacts do NOT have a `contact_preference` field
- Contact creation rules:
  - Create contact if attendee is PRIMARY
  - Create contact if contact preference is "DIRECTLY"
  - DO NOT create contact if preference is "primary attendee" or "provide later"

## Impact
- Registration process fails at payment stage
- Users cannot complete registration
- Data is not properly stored in database

## Fix Required
1. Identify correct enum type name for contact preferences
2. Update RPC function to use correct type or handle as text
3. Ensure contact creation logic follows business rules
4. Add validation to prevent invalid enum values