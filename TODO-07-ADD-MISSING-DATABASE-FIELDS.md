# TODO: Add Missing Database Fields

## Overview
Add fields that are referenced in code but missing from the database schema.

## Migration Tasks

### 1. Events Table Additions
- [ ] Add `banner_image_url` TEXT column for hero images
- [ ] Add `long_description` TEXT column for detailed content
- [ ] Add `location` computed column or trigger for simple location string
- [ ] Add `stripe_product_id` if not exists (for Stripe sync)

### 2. Tickets Table Additions  
- [ ] Add `qr_code_url` TEXT column (or use storage strategy)
- [ ] Add `qr_code_generated_at` TIMESTAMP
- [ ] Consider `confirmation_sent_at` TIMESTAMP

### 3. Registrations Table Additions
- [ ] Add `confirmation_sent_at` TIMESTAMP
- [ ] Add `reminder_sent_at` TIMESTAMP
- [ ] Add `registration_metadata` JSONB for flexible data

### 4. Create Email Log Table
```sql
CREATE TABLE email_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID REFERENCES registrations(registration_id),
  email_type VARCHAR(50) NOT NULL,
  recipient_email TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'sent',
  error_message TEXT,
  metadata JSONB
);
```

### 5. Create Documents Table
```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID REFERENCES registrations(registration_id),
  document_type VARCHAR(50) NOT NULL,
  storage_path TEXT NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB
);
```

## Data Type Fixes

### 1. Fix is_partner Field
- [ ] Change from TEXT to BOOLEAN
- [ ] Migrate existing data
- [ ] Update application code

### 2. Add Check Constraints
- [ ] Ticket status values constraint
- [ ] Registration type constraint
- [ ] Payment status constraint

### 3. Add Default Values
- [ ] Set sensible defaults for counts
- [ ] Default timestamps to NOW()
- [ ] Default status fields

## Index Additions
- [ ] Add index on email_log(registration_id)
- [ ] Add index on documents(registration_id)
- [ ] Add index on events(stripe_product_id)
- [ ] Add composite indexes for common queries

## Migration Strategy
1. [ ] Create migration SQL files
2. [ ] Test on development database
3. [ ] Plan for zero-downtime migration
4. [ ] Update TypeScript types
5. [ ] Deploy in stages

## Backward Compatibility
- [ ] Ensure new fields are nullable initially
- [ ] Add defaults that won't break existing code
- [ ] Plan gradual migration of data
- [ ] Update code to handle both old and new

## Testing Checklist
- [ ] Existing queries still work
- [ ] New fields accessible via API
- [ ] Type generation includes new fields
- [ ] No breaking changes to API