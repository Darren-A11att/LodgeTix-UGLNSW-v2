# Troubleshooting Guide

## Quick Diagnostics

### System Health Check Script
```sql
-- Run this query to get a quick system health overview
WITH system_status AS (
  SELECT 
    -- Check if functions exist
    (SELECT COUNT(*) FROM pg_proc WHERE proname = 'should_generate_confirmation') as trigger_function_exists,
    -- Check if trigger exists
    (SELECT COUNT(*) FROM pg_trigger WHERE tgname = 'registration_payment_webhook_trigger') as trigger_exists,
    -- Check recent confirmations
    (SELECT COUNT(*) FROM registrations 
     WHERE confirmation_generated_at > NOW() - INTERVAL '1 hour') as recent_confirmations,
    -- Check recent failures
    (SELECT COUNT(*) FROM webhook_logs 
     WHERE created_at > NOW() - INTERVAL '1 hour' 
     AND status_code != 200) as recent_failures,
    -- Check pending confirmations
    (SELECT COUNT(*) FROM registrations 
     WHERE status = 'completed' 
     AND payment_status = 'completed' 
     AND confirmation_number IS NULL) as pending_confirmations
)
SELECT 
  CASE WHEN trigger_function_exists > 0 THEN '✅' ELSE '❌' END as "Trigger Function",
  CASE WHEN trigger_exists > 0 THEN '✅' ELSE '❌' END as "Database Trigger",
  recent_confirmations as "Recent Confirmations (1h)",
  recent_failures as "Recent Failures (1h)",
  pending_confirmations as "Pending Confirmations"
FROM system_status;
```

## Common Issues and Solutions

### 1. No Confirmation Numbers Generated

#### Symptoms
- Registrations complete but `confirmation_number` remains NULL
- No entries in `webhook_logs` table

#### Diagnosis
```sql
-- Check if trigger is enabled
SELECT 
  tgname,
  tgenabled,
  tgisinternal
FROM pg_trigger 
WHERE tgrelid = 'registrations'::regclass;

-- Check recent registration updates
SELECT 
  registration_id,
  status,
  payment_status,
  confirmation_number,
  updated_at
FROM registrations
WHERE updated_at > NOW() - INTERVAL '1 hour'
ORDER BY updated_at DESC
LIMIT 10;
```

#### Solutions
1. **Trigger Disabled**
   ```sql
   ALTER TABLE registrations ENABLE TRIGGER registration_payment_webhook_trigger;
   ```

2. **Wrong Trigger Conditions**
   - Verify status and payment_status values match expected values
   - Check if confirmation_number is already set

3. **Database Webhook Not Configured**
   - Check Supabase Dashboard → Database → Webhooks
   - Ensure webhook is active and properly configured

### 2. Edge Function Not Found (404)

#### Symptoms
- Webhook logs show 404 errors
- Function invocation fails

#### Diagnosis
```bash
# Check deployed functions
supabase functions list

# Check function logs for errors
supabase functions logs generate-confirmation --limit 50
```

#### Solutions
1. **Deploy Missing Functions**
   ```bash
   supabase functions deploy send-confirmation-email
   supabase functions deploy generate-confirmation
   ```

2. **Verify Function Names**
   - Ensure webhook URL matches function name exactly
   - Check for typos in configuration

### 3. Authentication Errors (401/403)

#### Symptoms
- Webhook logs show 401 or 403 status codes
- "Invalid JWT" or "Unauthorized" errors

#### Diagnosis
```sql
-- Check webhook configuration
SELECT * FROM webhook_logs 
WHERE status_code IN (401, 403)
ORDER BY created_at DESC
LIMIT 5;
```

#### Solutions
1. **Fix Service Role Key**
   ```sql
   -- Update database settings
   ALTER DATABASE postgres 
   SET app.settings.supabase_service_role_key = 'YOUR_CORRECT_SERVICE_KEY';
   ```

2. **Use Database Webhooks**
   - Configure webhook in Supabase Dashboard with proper Authorization header

### 4. Emails Not Being Sent

#### Symptoms
- Confirmation numbers generated but no emails received
- No email entries in logs

#### Diagnosis
```bash
# Check send-confirmation-email logs
supabase functions logs send-confirmation-email --limit 50

# Look for specific errors
supabase functions logs send-confirmation-email | grep -i error
```

#### Solutions
1. **Missing Email Orchestration**
   - Update generate-confirmation to call EmailOrchestrator
   - See [Edge Functions Guide](./04-edge-functions-guide.md)

2. **Missing Environment Variables**
   ```bash
   # Set Resend API key
   supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxxx
   
   # Verify it's set
   supabase secrets list
   ```

3. **Invalid Email Addresses**
   ```sql
   -- Check for invalid emails
   SELECT 
     registration_id,
     booking_contact_email,
     booking_contact_email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' as is_valid_email
   FROM registrations
   WHERE confirmation_number IS NOT NULL
     AND email_status IS NULL;
   ```

### 5. Duplicate Confirmation Numbers

#### Symptoms
- Constraint violation errors
- Same confirmation number for multiple registrations

#### Diagnosis
```sql
-- Find duplicates
SELECT 
  confirmation_number,
  COUNT(*) as count
FROM registrations
WHERE confirmation_number IS NOT NULL
GROUP BY confirmation_number
HAVING COUNT(*) > 1;
```

#### Solutions
1. **Add Unique Constraint**
   ```sql
   ALTER TABLE registrations 
   ADD CONSTRAINT unique_confirmation_number 
   UNIQUE (confirmation_number);
   ```

2. **Increase Retry Logic**
   - Update generate-confirmation to retry more times
   - Add more entropy to random generation

### 6. Slow Performance

#### Symptoms
- Confirmation generation takes > 3 seconds
- Timeouts in function execution

#### Diagnosis
```sql
-- Check average processing time
SELECT 
  webhook_name,
  AVG(EXTRACT(EPOCH FROM (response->>'duration')::interval)) as avg_seconds,
  MAX(EXTRACT(EPOCH FROM (response->>'duration')::interval)) as max_seconds,
  COUNT(*) as total_calls
FROM webhook_logs
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY webhook_name;
```

#### Solutions
1. **Add Database Indexes**
   ```sql
   CREATE INDEX IF NOT EXISTS idx_registrations_status_payment 
   ON registrations(status, payment_status) 
   WHERE confirmation_number IS NULL;
   ```

2. **Optimize Email Orchestration**
   - Make email sending asynchronous
   - Batch similar email types

### 7. Email Delivery Issues

#### Symptoms
- Emails sent but not received
- Emails in spam folder

#### Diagnosis
- Check Resend dashboard for delivery status
- Verify SPF/DKIM records
- Test email content for spam triggers

#### Solutions
1. **Domain Verification**
   - Add SPF record: `v=spf1 include:amazonses.com ~all`
   - Configure DKIM in Resend dashboard

2. **Improve Email Content**
   - Avoid spam trigger words
   - Include unsubscribe link
   - Use proper HTML structure

## Debug Queries

### Registration Journey Trace
```sql
-- Trace a specific registration through the system
CREATE OR REPLACE FUNCTION trace_registration(p_registration_id UUID)
RETURNS TABLE (
  event_time TIMESTAMPTZ,
  event_type TEXT,
  details JSONB
) AS $$
BEGIN
  RETURN QUERY
  -- Registration creation
  SELECT 
    created_at,
    'Registration Created',
    jsonb_build_object(
      'status', status,
      'payment_status', payment_status,
      'type', registration_type
    )
  FROM registrations
  WHERE registration_id = p_registration_id
  
  UNION ALL
  
  -- Registration updates
  SELECT 
    updated_at,
    'Registration Updated',
    jsonb_build_object(
      'status', status,
      'payment_status', payment_status,
      'confirmation_number', confirmation_number
    )
  FROM registrations
  WHERE registration_id = p_registration_id
  
  UNION ALL
  
  -- Webhook logs
  SELECT 
    created_at,
    'Webhook ' || webhook_name,
    jsonb_build_object(
      'status_code', status_code,
      'response', response
    )
  FROM webhook_logs
  WHERE record_id = p_registration_id::text
  
  UNION ALL
  
  -- Email logs
  SELECT 
    sent_at,
    'Email Sent: ' || email_type,
    jsonb_build_object(
      'recipient', recipient_email,
      'status', status,
      'resend_id', resend_id
    )
  FROM confirmation_emails
  WHERE registration_id = p_registration_id
  
  ORDER BY event_time;
END;
$$ LANGUAGE plpgsql;

-- Usage
SELECT * FROM trace_registration('YOUR_REGISTRATION_ID');
```

### System Metrics Dashboard
```sql
-- Create a view for monitoring
CREATE OR REPLACE VIEW email_system_metrics AS
WITH hourly_stats AS (
  SELECT 
    date_trunc('hour', created_at) as hour,
    COUNT(*) as registrations_created,
    COUNT(CASE WHEN confirmation_number IS NOT NULL THEN 1 END) as confirmations_generated,
    COUNT(CASE WHEN email_status = 'sent' THEN 1 END) as emails_sent,
    AVG(EXTRACT(EPOCH FROM (confirmation_generated_at - updated_at))) as avg_confirmation_time
  FROM registrations
  WHERE created_at > NOW() - INTERVAL '24 hours'
  GROUP BY date_trunc('hour', created_at)
)
SELECT 
  hour,
  registrations_created,
  confirmations_generated,
  emails_sent,
  ROUND(avg_confirmation_time::numeric, 2) as avg_seconds_to_confirm,
  ROUND(100.0 * confirmations_generated / NULLIF(registrations_created, 0), 2) as confirmation_rate,
  ROUND(100.0 * emails_sent / NULLIF(confirmations_generated, 0), 2) as email_rate
FROM hourly_stats
ORDER BY hour DESC;

-- Usage
SELECT * FROM email_system_metrics;
```

## Emergency Procedures

### 1. Stop All Email Sending
```sql
-- Disable all triggers
ALTER TABLE registrations DISABLE TRIGGER ALL;

-- Re-enable when fixed
ALTER TABLE registrations ENABLE TRIGGER ALL;
```

### 2. Process Backlog of Failed Confirmations
```sql
-- Identify backlog
CREATE TEMP TABLE confirmation_backlog AS
SELECT registration_id
FROM registrations
WHERE status = 'completed'
  AND payment_status = 'completed'
  AND confirmation_number IS NULL
  AND created_at > NOW() - INTERVAL '7 days';

-- Process manually (requires custom script)
-- Or trigger reprocessing by updating records
UPDATE registrations
SET updated_at = NOW()
WHERE registration_id IN (SELECT registration_id FROM confirmation_backlog);
```

### 3. Resend Failed Emails
```typescript
// Script to resend failed emails
async function resendFailedEmails() {
  const { data: failed } = await supabase
    .from('registrations')
    .select('registration_id')
    .not('confirmation_number', 'is', null)
    .is('email_status', null)
    .limit(100)
    
  for (const reg of failed) {
    await supabase.functions.invoke('send-confirmation-email', {
      body: {
        type: 'INDIVIDUAL_CONFIRMATION',
        registrationId: reg.registration_id
      }
    })
    
    // Rate limit
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
}
```

## Getting Help

### 1. Collect Diagnostic Information
```bash
# Export recent logs
supabase functions logs generate-confirmation --limit 1000 > confirmation-logs.txt
supabase functions logs send-confirmation-email --limit 1000 > email-logs.txt

# Database state
psql $DATABASE_URL -c "SELECT * FROM email_system_metrics" > metrics.csv
```

### 2. Check Documentation
- Review all files in this documentation folder
- Check Supabase Edge Functions documentation
- Review Resend API documentation

### 3. Support Channels
- Supabase Discord/Support
- Resend Support
- Internal team escalation