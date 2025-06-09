# Database Prerequisites

## Overview

Before the confirmation email system can work properly, several database issues must be resolved. This document outlines all database-related prerequisites in order of priority.

## Critical Prerequisites

### 1. Enable HTTP Extension ❌
**Priority**: Critical
**Issue**: The `net.http_post` function requires the HTTP extension

**Check if enabled**:
```sql
SELECT * FROM pg_extension WHERE extname = 'http';
```

**Enable if missing**:
```sql
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;
```

**Alternative**: Use Supabase Database Webhooks instead of `net.http_post`

### 2. Configure Database Settings ❌
**Priority**: Critical
**Issue**: Database settings for `app.settings` may not exist

**Check current settings**:
```sql
SHOW app.settings.supabase_url;
SHOW app.settings.supabase_service_role_key;
```

**Set if missing**:
```sql
ALTER DATABASE postgres SET app.settings.supabase_url = 'YOUR_SUPABASE_URL';
ALTER DATABASE postgres SET app.settings.supabase_service_role_key = 'YOUR_SERVICE_KEY';
```

**Security Note**: These should be set via environment variables in production

### 3. Fix Webhook Logs Table ⚠️
**Priority**: High
**Issue**: Table structure may have inconsistent columns

**Current Issues**:
- Migration tries to drop 'operation' column that may not exist
- Missing indexes for performance
- No RLS policies

**Fix Migration**:
```sql
-- Ensure webhook_logs table has correct structure
CREATE TABLE IF NOT EXISTS webhook_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    webhook_name text NOT NULL,
    table_name text NOT NULL,
    record_id text,
    event_type text NOT NULL,
    payload jsonb,
    response jsonb,
    status_code integer,
    created_at timestamptz DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_webhook_name ON webhook_logs(webhook_name);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_record_id ON webhook_logs(record_id);

-- Enable RLS
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Service role can do everything" ON webhook_logs
    FOR ALL TO service_role USING (true);

CREATE POLICY "Authenticated users can read" ON webhook_logs
    FOR SELECT TO authenticated USING (true);
```

### 4. Create Email Tracking Table ❌
**Priority**: High
**Issue**: No table to track sent confirmation emails

**Create Table**:
```sql
CREATE TABLE IF NOT EXISTS confirmation_emails (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    registration_id uuid NOT NULL REFERENCES registrations(registration_id),
    email_type text NOT NULL,
    recipient_email text NOT NULL,
    sent_at timestamptz DEFAULT now(),
    resend_id text,
    status text NOT NULL DEFAULT 'sent',
    error_message text,
    retry_count integer DEFAULT 0,
    metadata jsonb DEFAULT '{}',
    UNIQUE(registration_id, email_type, recipient_email)
);

-- Add indexes
CREATE INDEX idx_confirmation_emails_registration_id ON confirmation_emails(registration_id);
CREATE INDEX idx_confirmation_emails_sent_at ON confirmation_emails(sent_at DESC);
CREATE INDEX idx_confirmation_emails_status ON confirmation_emails(status);

-- Enable RLS
ALTER TABLE confirmation_emails ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Service role full access" ON confirmation_emails
    FOR ALL TO service_role USING (true);

CREATE POLICY "Users can read their own emails" ON confirmation_emails
    FOR SELECT TO authenticated 
    USING (
        registration_id IN (
            SELECT registration_id FROM registrations 
            WHERE customer_id = auth.uid()
        )
    );
```

### 5. Add Missing Columns to Registrations ⚠️
**Priority**: High
**Issue**: Missing tracking columns

**Check and add**:
```sql
-- Add confirmation generation timestamp if missing
ALTER TABLE registrations 
ADD COLUMN IF NOT EXISTS confirmation_generated_at timestamptz;

-- Add email sent tracking
ALTER TABLE registrations 
ADD COLUMN IF NOT EXISTS confirmation_email_sent_at timestamptz;

-- Add email status
ALTER TABLE registrations 
ADD COLUMN IF NOT EXISTS email_status text 
    CHECK (email_status IN ('pending', 'sent', 'failed', 'bounced'));
```

### 6. Fix Registration Type Enum ⚠️
**Priority**: Medium
**Issue**: Inconsistent enum values

**Current Values**: `'individuals'`, `'lodge'`, `'delegation'`
**Edge Function Expects**: `'individual'`, `'lodge'`, `'delegation'`

**Check current constraint**:
```sql
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'registrations'::regclass 
AND conname LIKE '%registration_type%';
```

**Fix if needed**:
```sql
-- Update existing data
UPDATE registrations 
SET registration_type = 'individual' 
WHERE registration_type = 'individuals';

-- Update constraint
ALTER TABLE registrations 
DROP CONSTRAINT IF EXISTS registrations_registration_type_check;

ALTER TABLE registrations 
ADD CONSTRAINT registrations_registration_type_check 
CHECK (registration_type IN ('individual', 'lodge', 'delegation'));
```

## Recommended: Switch to Database Webhooks

Instead of using `net.http_post` in triggers, use Supabase Database Webhooks:

### 1. Remove HTTP-based Trigger
```sql
DROP TRIGGER IF EXISTS registration_payment_webhook_trigger ON registrations;
DROP FUNCTION IF EXISTS should_generate_confirmation();
```

### 2. Create Simplified Trigger
```sql
CREATE OR REPLACE FUNCTION mark_for_confirmation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only proceed if payment just completed
  IF NEW.status = 'completed' AND 
     NEW.payment_status = 'completed' AND
     NEW.confirmation_number IS NULL AND
     (OLD.status IS DISTINCT FROM 'completed' OR 
      OLD.payment_status IS DISTINCT FROM 'completed') THEN
    
    -- Set a flag for webhook to pick up
    NEW.needs_confirmation = true;
    
    -- Log for debugging
    INSERT INTO webhook_logs (
      webhook_name, table_name, record_id, event_type, payload
    ) VALUES (
      'registration_needs_confirmation',
      'registrations',
      NEW.registration_id::text,
      'UPDATE',
      jsonb_build_object(
        'registration_id', NEW.registration_id,
        'registration_type', NEW.registration_type,
        'trigger_time', now()
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER registration_completion_trigger
  BEFORE UPDATE ON registrations
  FOR EACH ROW
  EXECUTE FUNCTION mark_for_confirmation();
```

### 3. Configure Database Webhook in Supabase Dashboard
- Table: `registrations`
- Events: `UPDATE`
- Filter: `needs_confirmation=true`
- URL: `{SUPABASE_URL}/functions/v1/generate-confirmation`

## Verification Queries

### Check System Status
```sql
-- Check if HTTP extension is enabled
SELECT EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'http');

-- Check database settings
SELECT current_setting('app.settings.supabase_url', true);

-- Check webhook_logs structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'webhook_logs';

-- Check recent webhook activity
SELECT * FROM webhook_logs 
ORDER BY created_at DESC 
LIMIT 10;

-- Check registrations needing confirmation
SELECT registration_id, status, payment_status, confirmation_number, created_at
FROM registrations
WHERE status = 'completed' 
  AND payment_status = 'completed'
  AND confirmation_number IS NULL
ORDER BY created_at DESC;
```

## Migration Order

1. Fix webhook_logs table structure
2. Create confirmation_emails table
3. Add missing columns to registrations
4. Fix registration_type enum values
5. Either:
   - Enable HTTP extension and set database settings, OR
   - Switch to database webhooks (recommended)

## Rollback Plan

If issues occur:
1. Disable triggers: `ALTER TABLE registrations DISABLE TRIGGER ALL;`
2. Fix issues
3. Re-enable triggers: `ALTER TABLE registrations ENABLE TRIGGER ALL;`
4. Manually process any missed confirmations