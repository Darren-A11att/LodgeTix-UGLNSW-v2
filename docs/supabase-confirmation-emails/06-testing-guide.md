# Testing Guide

## Overview

This guide covers comprehensive testing procedures for the confirmation email system, from unit testing individual components to end-to-end integration testing.

## Testing Environments

### Local Development
- Uses Supabase local instance
- Email sending can be mocked or use test API keys
- Faster iteration and debugging

### Staging
- Uses separate Supabase project
- Real email sending with test addresses
- Full integration testing

### Production
- Limited testing with monitoring
- Real email delivery
- Performance testing under load

## Component Testing

### 1. Database Trigger Testing

#### Test Trigger Firing
```sql
-- Create test registration
INSERT INTO registrations (
  registration_id,
  registration_type,
  function_id,
  customer_id,
  status,
  payment_status,
  total_amount_paid,
  booking_contact_email,
  booking_contact_first_name,
  booking_contact_last_name
) VALUES (
  'test-' || gen_random_uuid(),
  'individual',
  'YOUR_FUNCTION_ID',
  'test-customer-id',
  'pending',
  'pending',
  150.00,
  'test@example.com',
  'Test',
  'User'
) RETURNING registration_id;

-- Save the registration_id for next steps
```

#### Test Trigger Conditions
```sql
-- Test 1: Payment completion should trigger
UPDATE registrations 
SET status = 'completed', payment_status = 'completed'
WHERE registration_id = 'YOUR_TEST_ID';

-- Check webhook logs
SELECT * FROM webhook_logs 
WHERE record_id = 'YOUR_TEST_ID'
ORDER BY created_at DESC;

-- Test 2: Already has confirmation (should NOT trigger)
UPDATE registrations 
SET updated_at = NOW()
WHERE registration_id = 'YOUR_TEST_ID';

-- Should see no new webhook log entries
```

### 2. Edge Function Testing

#### Test generate-confirmation Locally
```bash
# Start local Supabase
supabase start

# Serve the function
supabase functions serve generate-confirmation --no-verify-jwt

# Test with curl
curl -X POST http://localhost:54321/functions/v1/generate-confirmation \
  -H "Content-Type: application/json" \
  -d '{
    "type": "UPDATE",
    "table": "registrations",
    "record": {
      "registration_id": "test-123",
      "status": "completed",
      "payment_status": "completed",
      "registration_type": "individual",
      "confirmation_number": null
    },
    "old_record": {
      "status": "pending",
      "payment_status": "pending"
    }
  }'
```

#### Test send-confirmation-email
```bash
# Serve the function
supabase functions serve send-confirmation-email --no-verify-jwt

# Test individual confirmation
curl -X POST http://localhost:54321/functions/v1/send-confirmation-email \
  -H "Content-Type: application/json" \
  -d '{
    "type": "INDIVIDUAL_CONFIRMATION",
    "registrationId": "YOUR_TEST_REGISTRATION_ID",
    "testMode": true
  }'
```

### 3. Email Template Testing

#### Visual Testing
1. Set up a test endpoint that renders templates
2. Test with various data scenarios:
   - Minimal data
   - Maximum data
   - Special characters
   - Long names/addresses

#### Test Data Scenarios
```typescript
// Test different registration types
const testScenarios = [
  {
    name: "Individual with single ticket",
    type: "INDIVIDUAL_CONFIRMATION",
    data: { /* minimal individual data */ }
  },
  {
    name: "Lodge with full package",
    type: "LODGE_CONFIRMATION", 
    data: { /* lodge with multiple attendees */ }
  },
  {
    name: "Delegation with various preferences",
    type: "DELEGATION_CONFIRMATION",
    data: { /* delegation with mixed contact preferences */ }
  }
];
```

## Integration Testing

### End-to-End Test Script

Create a test script `test-email-system.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

async function testEmailSystem() {
  console.log('🧪 Starting email system test...')
  
  // 1. Create test registration
  const { data: registration, error: insertError } = await supabase
    .from('registrations')
    .insert({
      registration_type: 'individual',
      function_id: process.env.TEST_FUNCTION_ID,
      customer_id: 'test-customer',
      status: 'pending',
      payment_status: 'pending',
      total_amount_paid: 100.00,
      booking_contact_email: process.env.TEST_EMAIL,
      booking_contact_first_name: 'Test',
      booking_contact_last_name: 'User'
    })
    .select()
    .single()
    
  if (insertError) {
    console.error('❌ Failed to create registration:', insertError)
    return
  }
  
  console.log('✅ Created test registration:', registration.registration_id)
  
  // 2. Create test attendees
  const { error: attendeeError } = await supabase
    .from('attendees')
    .insert([
      {
        registration_id: registration.registration_id,
        first_name: 'John',
        last_name: 'Doe',
        email: process.env.TEST_EMAIL,
        contact_preference: 'direct',
        attendee_type: 'mason'
      }
    ])
    
  if (attendeeError) {
    console.error('❌ Failed to create attendees:', attendeeError)
    return
  }
  
  console.log('✅ Created test attendees')
  
  // 3. Simulate payment completion
  await new Promise(resolve => setTimeout(resolve, 2000)) // Wait for consistency
  
  const { error: updateError } = await supabase
    .from('registrations')
    .update({
      status: 'completed',
      payment_status: 'completed'
    })
    .eq('registration_id', registration.registration_id)
    
  if (updateError) {
    console.error('❌ Failed to update registration:', updateError)
    return
  }
  
  console.log('✅ Simulated payment completion')
  
  // 4. Wait and check results
  await new Promise(resolve => setTimeout(resolve, 5000)) // Wait for processing
  
  // Check confirmation number
  const { data: updated } = await supabase
    .from('registrations')
    .select('confirmation_number, confirmation_generated_at, email_status')
    .eq('registration_id', registration.registration_id)
    .single()
    
  console.log('📧 Registration status:', updated)
  
  // Check webhook logs
  const { data: logs } = await supabase
    .from('webhook_logs')
    .select('*')
    .eq('record_id', registration.registration_id)
    .order('created_at', { ascending: false })
    
  console.log('📋 Webhook logs:', logs?.length || 0, 'entries')
  
  // Check email logs
  const { data: emails } = await supabase
    .from('confirmation_emails')
    .select('*')
    .eq('registration_id', registration.registration_id)
    
  console.log('✉️ Emails sent:', emails?.length || 0)
  
  // Cleanup
  await supabase
    .from('registrations')
    .delete()
    .eq('registration_id', registration.registration_id)
    
  console.log('🧹 Cleaned up test data')
  console.log('✅ Test completed!')
}

testEmailSystem().catch(console.error)
```

Run the test:
```bash
# Set environment variables
export SUPABASE_URL=your_supabase_url
export SUPABASE_SERVICE_KEY=your_service_key
export TEST_FUNCTION_ID=your_function_id
export TEST_EMAIL=test@example.com

# Run test
npx tsx test-email-system.ts
```

## Load Testing

### Concurrent Registration Test
```typescript
async function loadTest(concurrentRegistrations: number) {
  const promises = []
  
  for (let i = 0; i < concurrentRegistrations; i++) {
    promises.push(createAndCompleteRegistration())
  }
  
  const start = Date.now()
  const results = await Promise.allSettled(promises)
  const duration = Date.now() - start
  
  const successful = results.filter(r => r.status === 'fulfilled').length
  const failed = results.filter(r => r.status === 'rejected').length
  
  console.log(`
    Load Test Results:
    - Total: ${concurrentRegistrations}
    - Successful: ${successful}
    - Failed: ${failed}
    - Duration: ${duration}ms
    - Avg per registration: ${duration / concurrentRegistrations}ms
  `)
}
```

## Test Scenarios

### 1. Individual Registration
- Single attendee
- Multiple attendees with different contact preferences
- With partner information
- With special dietary/accessibility requirements

### 2. Lodge Registration
- Small lodge (< 10 members)
- Large lodge (50+ members)
- Mixed contact preferences
- With grand lodge affiliations

### 3. Delegation Registration
- Various delegation sizes
- Different leader configurations
- Mixed attendee types

### 4. Edge Cases
- Unicode characters in names
- Very long email addresses
- Missing optional fields
- Rapid successive updates
- Concurrent registrations

## Email Delivery Testing

### 1. Check Resend Dashboard
- Login to https://resend.com
- Navigate to Emails section
- Verify delivery status
- Check for bounces or failures

### 2. Test Different Email Providers
- Gmail
- Outlook/Hotmail
- Yahoo
- Corporate email servers

### 3. Spam Testing
- Check spam scores
- Verify SPF/DKIM configuration
- Test with mail-tester.com

## Monitoring During Tests

### Real-time Log Monitoring
```bash
# Terminal 1: Monitor generate-confirmation
supabase functions logs generate-confirmation --follow

# Terminal 2: Monitor send-confirmation-email  
supabase functions logs send-confirmation-email --follow

# Terminal 3: Monitor database logs
tail -f supabase/.branches/main/logs/db.log
```

### Database Monitoring Queries
```sql
-- Real-time registration status
SELECT 
  registration_id,
  status,
  payment_status,
  confirmation_number,
  email_status,
  updated_at
FROM registrations
WHERE created_at > NOW() - INTERVAL '10 minutes'
ORDER BY updated_at DESC;

-- Function execution stats
SELECT 
  webhook_name,
  COUNT(*) as calls,
  COUNT(CASE WHEN status_code = 200 THEN 1 END) as success,
  COUNT(CASE WHEN status_code != 200 THEN 1 END) as failures,
  AVG(EXTRACT(EPOCH FROM (response->>'duration')::interval)) as avg_duration_seconds
FROM webhook_logs
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY webhook_name;
```

## Debugging Failed Tests

### 1. Check Function Logs
```bash
# Get detailed error logs
supabase functions logs generate-confirmation --limit 100 | grep ERROR
```

### 2. Database Forensics
```sql
-- Find registrations without confirmations
SELECT * FROM registrations
WHERE status = 'completed'
  AND payment_status = 'completed'
  AND confirmation_number IS NULL
  AND created_at > NOW() - INTERVAL '1 hour';

-- Check specific registration journey
WITH registration_journey AS (
  SELECT 
    r.*,
    wl.created_at as webhook_fired_at,
    wl.status_code,
    wl.response,
    ce.sent_at as email_sent_at,
    ce.status as email_status
  FROM registrations r
  LEFT JOIN webhook_logs wl ON wl.record_id = r.registration_id::text
  LEFT JOIN confirmation_emails ce ON ce.registration_id = r.registration_id
  WHERE r.registration_id = 'YOUR_TEST_ID'
)
SELECT * FROM registration_journey ORDER BY webhook_fired_at;
```

### 3. Common Issues and Solutions

| Issue | Check | Solution |
|-------|-------|----------|
| No confirmation generated | webhook_logs table | Check trigger conditions |
| Email not sent | Function logs | Verify email orchestration |
| Email not received | Resend dashboard | Check spam, verify address |
| Slow processing | Function metrics | Optimize queries, check limits |

## Test Automation

### GitHub Actions Test
```yaml
name: Test Email System
on:
  push:
    branches: [main]
  schedule:
    - cron: '0 */6 * * *' # Every 6 hours

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 18
          
      - name: Install dependencies
        run: npm install @supabase/supabase-js tsx
        
      - name: Run email system test
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
          TEST_FUNCTION_ID: ${{ secrets.TEST_FUNCTION_ID }}
          TEST_EMAIL: ${{ secrets.TEST_EMAIL }}
        run: npx tsx test-email-system.ts
```