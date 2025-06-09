# Deployment Guide

## Pre-Deployment Checklist

### 1. Database Prerequisites ✓
Ensure all database issues are fixed first:
- [ ] HTTP extension enabled OR using Database Webhooks
- [ ] webhook_logs table has correct structure
- [ ] confirmation_emails table created
- [ ] Missing columns added to registrations table
- [ ] Registration type enum values fixed

See [Database Prerequisites](./03-database-prerequisites.md) for details.

### 2. Environment Variables ✓
Ensure you have:
- [ ] Resend API key from https://resend.com/api-keys
- [ ] Supabase project URL
- [ ] Supabase service role key
- [ ] From email address configured in Resend

### 3. Code Fixes ✓
- [ ] Email orchestration added to generate-confirmation function
- [ ] Import statements fixed
- [ ] Error handling implemented

## Step-by-Step Deployment

### Step 1: Set Environment Variables

```bash
# Set required secrets
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxxx

# Optional: Set custom sender details
supabase secrets set EMAIL_FROM_ADDRESS=noreply@yourdomain.com
supabase secrets set EMAIL_FROM_NAME="Your Company Name"

# Verify secrets are set
supabase secrets list
```

### Step 2: Fix generate-confirmation Function

Before deploying, update the code:

1. Open `/supabase/functions/generate-confirmation/index.ts`
2. Add import at the top:
   ```typescript
   import { EmailOrchestrator } from './utils/email-orchestrator.ts'
   ```
3. Add email orchestration after line 169 (see [Edge Functions Guide](./04-edge-functions-guide.md))

### Step 3: Deploy Edge Functions

```bash
# Deploy in this order:

# 1. Deploy send-confirmation-email first (it's a dependency)
supabase functions deploy send-confirmation-email

# 2. Deploy generate-confirmation
supabase functions deploy generate-confirmation

# 3. Deploy QR generators (optional but recommended)
supabase functions deploy generate-attendee-qr
supabase functions deploy generate-ticket-qr

# Or deploy all at once
supabase functions deploy
```

### Step 4: Configure Database Webhook

#### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard
2. Navigate to Database → Webhooks
3. Click "Create a new webhook"
4. Configure:
   - **Name**: `registration-completion`
   - **Table**: `registrations`
   - **Events**: Check only `UPDATE`
   - **HTTP Request**:
     - Method: `POST`
     - URL: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/generate-confirmation`
   - **HTTP Headers**:
     ```
     Authorization: Bearer YOUR_SERVICE_ROLE_KEY
     Content-Type: application/json
     ```
   - **Webhook Payload**: Keep default

5. Click "Create webhook"

#### Option B: Using SQL Trigger (Alternative)

If using the SQL trigger approach, ensure database settings are configured:

```sql
-- Set your Supabase URL and service role key
ALTER DATABASE postgres SET app.settings.supabase_url = 'https://YOUR_PROJECT_REF.supabase.co';
ALTER DATABASE postgres SET app.settings.supabase_service_role_key = 'YOUR_SERVICE_ROLE_KEY';

-- Reload configuration
SELECT pg_reload_conf();
```

### Step 5: Verify Deployment

#### Check Functions are Deployed
```bash
# List all deployed functions
supabase functions list

# Should show:
# - generate-confirmation
# - send-confirmation-email
# - generate-attendee-qr
# - generate-ticket-qr
```

#### Check Function Logs
```bash
# Monitor logs during testing
supabase functions logs generate-confirmation --follow
supabase functions logs send-confirmation-email --follow
```

## Testing the Deployment

### 1. Create Test Registration

```sql
-- Insert a test registration in pending state
INSERT INTO registrations (
  registration_id,
  registration_type,
  function_id,
  customer_id,
  status,
  payment_status,
  total_amount_paid
) VALUES (
  gen_random_uuid(),
  'individual',
  'YOUR_FUNCTION_ID',
  'YOUR_CUSTOMER_ID',
  'pending',
  'pending',
  100.00
) RETURNING registration_id;
```

### 2. Simulate Payment Completion

```sql
-- Update to trigger the webhook
UPDATE registrations 
SET 
  status = 'completed',
  payment_status = 'completed'
WHERE registration_id = 'YOUR_TEST_REGISTRATION_ID';
```

### 3. Verify Results

```sql
-- Check if confirmation number was generated
SELECT 
  registration_id,
  confirmation_number,
  confirmation_generated_at,
  email_status
FROM registrations 
WHERE registration_id = 'YOUR_TEST_REGISTRATION_ID';

-- Check webhook logs
SELECT * FROM webhook_logs 
WHERE record_id = 'YOUR_TEST_REGISTRATION_ID'
ORDER BY created_at DESC;

-- Check email logs (if confirmation_emails table exists)
SELECT * FROM confirmation_emails
WHERE registration_id = 'YOUR_TEST_REGISTRATION_ID';
```

### 4. Check Email Delivery

1. Check the recipient's inbox
2. Check spam/junk folder
3. Verify in Resend dashboard: https://resend.com/emails

## Production Deployment

### Additional Steps for Production

1. **Enable Webhook Signature Verification**
   ```bash
   supabase secrets set WEBHOOK_SECRET=your_webhook_secret
   ```

2. **Set Production Email Details**
   ```bash
   supabase secrets set EMAIL_FROM_ADDRESS=official@yourdomain.com
   supabase secrets set EMAIL_FROM_NAME="Your Official Company Name"
   ```

3. **Configure Rate Limits**
   - Set appropriate rate limits in Supabase Dashboard
   - Configure Resend rate limits

4. **Set Up Monitoring**
   - Configure alerts for function failures
   - Set up email delivery monitoring
   - Create dashboard for email metrics

### Production Checklist

- [ ] All functions deployed successfully
- [ ] Environment variables set for production
- [ ] Database webhook configured and tested
- [ ] Email templates reviewed and approved
- [ ] From email address verified in Resend
- [ ] SPF/DKIM records configured for domain
- [ ] Rate limits configured appropriately
- [ ] Monitoring and alerts set up
- [ ] Rollback plan documented

## Rollback Procedure

If issues occur after deployment:

### 1. Immediate Rollback
```bash
# Disable the webhook in Supabase Dashboard
# OR disable via SQL:
ALTER TABLE registrations DISABLE TRIGGER registration_payment_webhook_trigger;
```

### 2. Fix Issues
- Review function logs
- Check webhook_logs table
- Fix any code issues
- Re-test in staging

### 3. Re-Deploy
```bash
# Re-deploy fixed functions
supabase functions deploy generate-confirmation
supabase functions deploy send-confirmation-email

# Re-enable webhook
ALTER TABLE registrations ENABLE TRIGGER registration_payment_webhook_trigger;
```

## Post-Deployment Verification

### Health Checks
```sql
-- Recent successful confirmations
SELECT COUNT(*) as successful_confirmations
FROM registrations
WHERE confirmation_generated_at > NOW() - INTERVAL '1 hour'
  AND confirmation_number IS NOT NULL;

-- Recent failures
SELECT * FROM webhook_logs
WHERE status_code != 200
  AND created_at > NOW() - INTERVAL '1 hour';

-- Email delivery status
SELECT 
  email_status,
  COUNT(*) as count
FROM registrations
WHERE created_at > NOW() - INTERVAL '1 day'
GROUP BY email_status;
```

### Monitoring Queries
```sql
-- Average confirmation generation time
SELECT 
  AVG(EXTRACT(EPOCH FROM (confirmation_generated_at - updated_at))) as avg_seconds
FROM registrations
WHERE confirmation_generated_at IS NOT NULL
  AND updated_at IS NOT NULL;

-- Email types sent
SELECT 
  email_type,
  COUNT(*) as count,
  COUNT(DISTINCT registration_id) as unique_registrations
FROM confirmation_emails
WHERE sent_at > NOW() - INTERVAL '1 day'
GROUP BY email_type;
```