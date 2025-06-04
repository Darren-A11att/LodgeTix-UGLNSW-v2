# Deploying QR Code Edge Functions

## Quick Start

### 1. Run Database Migrations
```bash
# Apply the migration to add QR code columns and storage buckets
supabase db push
```

### 2. Deploy Edge Functions
```bash
# Deploy both Edge Functions
supabase functions deploy generate-ticket-qr
supabase functions deploy generate-attendee-qr
```

### 3. Configure Webhooks
Follow the instructions in [SETUP-QR-WEBHOOKS.md](./SETUP-QR-WEBHOOKS.md) to configure database webhooks via the Supabase Dashboard.

## Complete Deployment Steps

### Prerequisites
- Supabase CLI installed and configured
- Project linked to your Supabase instance
- Admin access to Supabase Dashboard

### Step 1: Database Setup
```bash
# Push the new migration
supabase db push

# Verify the migration
supabase db diff
```

### Step 2: Deploy Edge Functions
```bash
# Deploy ticket QR generator
cd supabase/functions/generate-ticket-qr
supabase functions deploy

# Deploy attendee QR generator
cd ../generate-attendee-qr
supabase functions deploy
```

### Step 3: Set Environment Variables
The Edge Functions will automatically have access to:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

No additional configuration needed.

### Step 4: Configure Webhooks
1. Go to your Supabase Dashboard
2. Navigate to Database > Webhooks
3. Create webhooks as described in [SETUP-QR-WEBHOOKS.md](./SETUP-QR-WEBHOOKS.md)

### Step 5: Test the System

#### Test Ticket QR Generation
```sql
-- Create a test registration first
INSERT INTO registrations (
  registration_id,
  function_id,
  registration_type,
  auth_user_id,
  stripe_payment_intent_id
) VALUES (
  gen_random_uuid(),
  'your-function-id',
  'individuals',
  'your-auth-user-id',
  'pi_test123'
);

-- Create a test ticket
INSERT INTO tickets (
  registration_id,
  event_id,
  ticket_type_id,
  price_paid,
  status
) VALUES (
  'registration-id-from-above',
  'your-event-id',
  'your-ticket-type-id',
  100.00,
  'reserved'
);

-- Check if QR was generated (wait a few seconds)
SELECT ticket_id, qr_code_url 
FROM tickets 
WHERE registration_id = 'registration-id-from-above';
```

#### Test Attendee QR Generation
```sql
-- Create a test attendee
INSERT INTO attendees (
  registration_id,
  attendee_type,
  first_name,
  last_name,
  contact_preference
) VALUES (
  'registration-id-from-above',
  'guest',
  'Test',
  'Attendee',
  'directly'
);

-- Check if QR was generated (wait a few seconds)
SELECT attendee_id, qr_code_url 
FROM attendees 
WHERE registration_id = 'registration-id-from-above';
```

### Step 6: Monitor Deployment

#### Check Edge Function Status
```bash
# View function logs
supabase functions logs generate-ticket-qr
supabase functions logs generate-attendee-qr
```

#### Monitor in Dashboard
1. Go to Functions section to see execution metrics
2. Check Logs > Webhooks for webhook execution
3. Review Storage bucket for generated QR codes

## Rollback Instructions

If you need to rollback:

### 1. Disable Webhooks
Go to Dashboard > Webhooks and disable both webhooks

### 2. Remove Edge Functions
```bash
supabase functions delete generate-ticket-qr
supabase functions delete generate-attendee-qr
```

### 3. Rollback Database (Optional)
```sql
-- Remove QR code URLs from existing records
UPDATE tickets SET qr_code_url = NULL;
UPDATE attendees SET qr_code_url = NULL;

-- Drop the columns if needed
ALTER TABLE attendees DROP COLUMN IF EXISTS qr_code_url;
```

## Production Checklist

- [ ] Database migration applied successfully
- [ ] Edge Functions deployed and accessible
- [ ] Webhooks configured and enabled
- [ ] Storage buckets created with proper permissions
- [ ] Test QR generation working for tickets
- [ ] Test QR generation working for attendees
- [ ] Monitoring and alerts configured
- [ ] Documentation updated for team

## Troubleshooting

### QR Codes Not Generating
1. Check webhook logs in Dashboard
2. Verify Edge Function logs for errors
3. Ensure storage bucket exists and has proper permissions
4. Check that all required data exists (registration, function, event)

### Performance Issues
1. Monitor Edge Function execution time
2. Check for database query optimization needs
3. Consider adding indexes if queries are slow
4. Review concurrent execution limits

### Storage Issues
1. Check storage bucket quota
2. Verify RLS policies allow service role access
3. Ensure file naming doesn't conflict
4. Monitor storage usage trends