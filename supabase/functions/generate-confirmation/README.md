# Generate Confirmation Edge Function

This edge function automatically generates confirmation numbers and triggers email sending when a registration is marked as completed with successful payment.

## Overview

The function is triggered by a database webhook when:
- Registration status = 'completed'
- Payment status = 'completed'  
- No confirmation number exists yet

## Architecture

```
Database Update → Webhook → Edge Function → Generate Confirmation → Send Emails
```

## Confirmation Number Format

Pattern: `[TYPE][YEAR][MONTH][RANDOM]`

- `TYPE`: 3-letter prefix (IND, LDG, DEL)
- `YEAR`: 4-digit year
- `MONTH`: 2-digit month
- `RANDOM`: 2 digits + 2 letters

Examples:
- Individual: `IND20240385AC`
- Lodge: `LDG20240385BD`
- Delegation: `DEL20240385CE`

## Email Orchestration

Based on registration type and attendee preferences:

1. **Confirmation Email**: Always sent to customer/booking contact
2. **Direct Tickets**: Sent to attendees with 'direct' contact preference
3. **Primary Contact Summary**: Sent if any attendees have 'primary' preference

## Setup Instructions

### 1. Deploy the Edge Function

```bash
supabase functions deploy generate-confirmation
```

### 2. Set Environment Variables

```bash
supabase secrets set WEBHOOK_SECRET=your-webhook-secret
```

### 3. Configure Database Webhook

In Supabase Dashboard:
1. Go to Database → Webhooks
2. Create new webhook:
   - Table: `registrations`
   - Events: `UPDATE`
   - URL: `{SUPABASE_URL}/functions/v1/generate-confirmation`
   - Method: `POST`
   - Headers:
     ```
     Authorization: Bearer {SUPABASE_SERVICE_ROLE_KEY}
     Content-Type: application/json
     ```

### 4. Run Database Migrations

```bash
supabase db push
```

## Testing

### Local Testing

```bash
# Start local Supabase
supabase start

# Serve the function locally
supabase functions serve generate-confirmation

# Test with curl
curl -X POST http://localhost:54321/functions/v1/generate-confirmation \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -d '{
    "type": "UPDATE",
    "table": "registrations",
    "record": {
      "id": "test-id",
      "status": "completed",
      "payment_status": "completed",
      "registration_type": "individuals",
      "confirmation_number": null
    },
    "old_record": {
      "status": "pending",
      "confirmation_number": null
    }
  }'
```

### Production Testing

1. Create a test registration
2. Mark it as completed via admin panel
3. Check logs for confirmation generation
4. Verify emails were sent

## Monitoring

### Logs

View function logs:
```bash
supabase functions logs generate-confirmation
```

### Metrics to Track

- Confirmation generation success rate
- Email invocation success rate
- Average processing time
- Error frequency and types

### Database Queries

```sql
-- Check recent confirmations
SELECT id, confirmation_number, confirmation_generated_at
FROM registrations
WHERE confirmation_generated_at > now() - interval '1 hour'
ORDER BY confirmation_generated_at DESC;

-- Check webhook logs
SELECT * FROM webhook_logs
WHERE webhook_name = 'generate_confirmation'
ORDER BY created_at DESC
LIMIT 10;
```

## Error Handling

### Retry Logic

1. **Confirmation Generation**: No retry (must succeed)
2. **Email Sending**: Async with best-effort delivery
3. **Webhook Processing**: Can be retried by Supabase

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| Duplicate confirmation | Random collision | Automatic retry up to 10 times |
| Email invocation failed | Network or service issue | Logged but doesn't block |
| Invalid webhook payload | Schema mismatch | Check webhook configuration |

## Security

- Webhook signature validation (optional)
- Service role authentication required
- No PII logged in function logs
- Rate limiting via Supabase

## Performance

- Target: < 500ms for confirmation generation
- Email invocation is async (doesn't block)
- Supports concurrent registrations
- Indexed confirmation_number column

## Rollback Procedure

If issues occur:

1. Disable webhook in Supabase Dashboard
2. Re-enable manual email triggers in app
3. Deploy hotfix if needed
4. Investigate and fix root cause

## Future Enhancements

- [ ] Add SMS notifications
- [ ] Implement email queuing
- [ ] Add retry dead letter queue
- [ ] Support bulk confirmations
- [ ] Add A/B testing for email timing