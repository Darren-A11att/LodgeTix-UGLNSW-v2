# Setting Up QR Code Generation Webhooks

## Overview
This guide explains how to configure database webhooks in Supabase to automatically trigger QR code generation when tickets or attendees are created.

## Prerequisites
- Supabase project with Edge Functions deployed
- Admin access to Supabase Dashboard

## Step 1: Deploy Edge Functions

First, deploy the Edge Functions to your Supabase project:

```bash
# Deploy ticket QR generator
supabase functions deploy generate-ticket-qr

# Deploy attendee QR generator  
supabase functions deploy generate-attendee-qr
```

## Step 2: Create Webhooks via Dashboard

### Ticket QR Generation Webhook

1. Go to Supabase Dashboard > Database > Webhooks
2. Click "Create a new webhook"
3. Configure as follows:
   - **Name**: `generate-ticket-qr-webhook`
   - **Table**: `tickets`
   - **Events**: `INSERT`
   - **Type**: `HTTP Request`
   - **Method**: `POST`
   - **URL**: `https://[YOUR_PROJECT_REF].supabase.co/functions/v1/generate-ticket-qr`
   - **Headers**:
     ```
     Content-Type: application/json
     Authorization: Bearer [YOUR_ANON_KEY]
     ```
   - **Timeout**: `10000` (10 seconds)
   - **Retry**: Enable with 3 attempts

### Attendee QR Generation Webhook

1. Click "Create a new webhook" again
2. Configure as follows:
   - **Name**: `generate-attendee-qr-webhook`
   - **Table**: `attendees`
   - **Events**: `INSERT`
   - **Type**: `HTTP Request`
   - **Method**: `POST`
   - **URL**: `https://[YOUR_PROJECT_REF].supabase.co/functions/v1/generate-attendee-qr`
   - **Headers**:
     ```
     Content-Type: application/json
     Authorization: Bearer [YOUR_ANON_KEY]
     ```
   - **Timeout**: `10000` (10 seconds)
   - **Retry**: Enable with 3 attempts

## Step 3: Using Supabase CLI (Alternative)

If you prefer using the CLI:

```bash
# Create ticket webhook
supabase db webhooks create \
  --name generate-ticket-qr-webhook \
  --table tickets \
  --events INSERT \
  --url https://[YOUR_PROJECT_REF].supabase.co/functions/v1/generate-ticket-qr \
  --method POST \
  --headers "Content-Type: application/json" \
  --headers "Authorization: Bearer [YOUR_ANON_KEY]"

# Create attendee webhook
supabase db webhooks create \
  --name generate-attendee-qr-webhook \
  --table attendees \
  --events INSERT \
  --url https://[YOUR_PROJECT_REF].supabase.co/functions/v1/generate-attendee-qr \
  --method POST \
  --headers "Content-Type: application/json" \
  --headers "Authorization: Bearer [YOUR_ANON_KEY]"
```

## Step 4: Testing Webhooks

### Test Ticket QR Generation
```sql
-- Insert a test ticket
INSERT INTO tickets (
  registration_id,
  event_id,
  ticket_type_id,
  price_paid,
  status
) VALUES (
  'existing-registration-id',
  'existing-event-id',
  'existing-ticket-type-id',
  100.00,
  'reserved'
);

-- Check if QR was generated
SELECT ticket_id, qr_code_url 
FROM tickets 
WHERE ticket_id = 'newly-created-ticket-id';
```

### Test Attendee QR Generation
```sql
-- Insert a test attendee
INSERT INTO attendees (
  registration_id,
  attendee_type,
  first_name,
  last_name,
  contact_preference
) VALUES (
  'existing-registration-id',
  'guest',
  'Test',
  'User',
  'directly'
);

-- Check if QR was generated
SELECT attendee_id, qr_code_url 
FROM attendees 
WHERE attendee_id = 'newly-created-attendee-id';
```

## Monitoring

### View Webhook Logs
1. Go to Dashboard > Logs > Webhooks
2. Filter by webhook name to see execution history
3. Check for any failed attempts

### View Edge Function Logs
1. Go to Dashboard > Functions
2. Select the function
3. View logs to debug any issues

## Troubleshooting

### Common Issues

1. **Webhook not triggering**
   - Verify webhook is enabled
   - Check table and event selection
   - Ensure proper permissions

2. **Edge Function failing**
   - Check function logs for errors
   - Verify environment variables are set
   - Ensure storage buckets exist

3. **QR code not updating**
   - Check RLS policies on storage
   - Verify service role permissions
   - Check for any database constraints

### Debug Mode

To test Edge Functions directly:

```bash
# Test with sample payload
curl -X POST https://[PROJECT_REF].supabase.co/functions/v1/generate-ticket-qr \
  -H "Authorization: Bearer [ANON_KEY]" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "INSERT",
    "table": "tickets",
    "record": {
      "ticket_id": "test-id",
      "registration_id": "test-reg-id",
      "event_id": "test-event-id",
      "ticket_type_id": "test-type-id",
      "created_at": "2024-01-01T00:00:00Z"
    }
  }'
```

## Security Considerations

1. **Use ANON key for webhooks** - Never use service role key in webhook headers
2. **Validate webhook payloads** - Edge Functions should verify the request source
3. **Monitor for abuse** - Set up alerts for unusual activity
4. **Rate limiting** - Consider implementing rate limits on Edge Functions