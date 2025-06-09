# Current Issues

## Critical Issues Preventing Email Delivery

### 1. Edge Function Not Deployed ❌
**Issue**: The `send-confirmation-email` Edge function exists in the codebase but has never been deployed to Supabase.

**Location**: `/supabase/functions/send-confirmation-email/`

**Impact**: Even if called, the function doesn't exist on Supabase servers

**Evidence**:
- Function code exists locally
- No deployment history in Supabase dashboard
- Function invocation would return 404

### 2. Missing Email Orchestration Implementation ❌
**Issue**: The `generate-confirmation` Edge function doesn't invoke email sending after generating confirmation numbers.

**Location**: `/supabase/functions/generate-confirmation/index.ts`

**Current Code** (lines 169-177):
```typescript
console.log(`Generated confirmation number: ${confirmationNumber} for registration: ${registrationId}`)
response.confirmationNumber = confirmationNumber
response.success = true
response.message = 'Confirmation number generated successfully'
// MISSING: Email orchestration should happen here!
```

**What's Missing**:
```typescript
// Import statement missing at top of file
import { EmailOrchestrator } from './utils/email-orchestrator.ts'

// After line 169, should have:
const emailOrchestrator = new EmailOrchestrator(supabase)
const emailResults = await emailOrchestrator.orchestrateEmails(
  registrationId, 
  payload.record.registration_type
)
response.emailsSent = emailResults
```

### 3. Database Trigger HTTP Call Issues ⚠️
**Issue**: The database trigger attempts to use `net.http_post` which may not be properly configured.

**Location**: Migration `20250608000102_force_fix_all_triggers.sql` (lines 106-123)

**Current Implementation**:
```sql
PERFORM net.http_post(
  url := current_setting('app.settings.supabase_url') || '/functions/v1/generate-confirmation',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer ' || current_setting('app.settings.supabase_service_role_key')
  ),
  body := jsonb_build_object(
    'registration_id', NEW.registration_id,
    'registration_type', NEW.registration_type
  )
);
```

**Problems**:
- `app.settings` may not be configured
- HTTP extension might not be enabled
- No proper error handling

### 4. Incorrect Function Naming ❌
**Issue**: Database trigger calls wrong function name

**Current**: `/functions/v1/generate-confirmation`
**Should Include**: Also calling `/functions/v1/send-confirmation-email`

## Secondary Issues

### 5. Missing Environment Variables ⚠️
**Required but possibly not set**:
- `RESEND_API_KEY` - Required for Resend API
- `EMAIL_FROM_ADDRESS` - Sender email
- `EMAIL_FROM_NAME` - Sender display name
- `WEBHOOK_SECRET` - For webhook validation (optional)

### 6. Incomplete Webhook Payload Handling ⚠️
**Issue**: The `generate-confirmation` function has complex payload normalization that may fail

**Location**: `generate-confirmation/index.ts` (lines 219-267)

**Risk**: Different webhook formats might not be handled correctly

### 7. Missing Confirmation Email Tracking Table ⚠️
**Issue**: No dedicated table to track sent emails

**Impact**: 
- Can't prevent duplicate sends
- No audit trail
- Difficult to debug delivery issues

## Code Quality Issues

### 8. No Email Status Updates
The system doesn't update registration records with email send status

### 9. Limited Error Recovery
No mechanism to retry failed email sends

### 10. Missing Monitoring Integration
No alerts when email sending fails

## Impact Summary

| Issue | Severity | User Impact | Fix Complexity |
|-------|----------|-------------|----------------|
| Edge Function Not Deployed | Critical | No emails sent | Simple |
| Missing Email Orchestration | Critical | No emails triggered | Medium |
| Database Trigger Issues | High | Intermittent failures | Complex |
| Environment Variables | High | Complete failure | Simple |
| Email Tracking | Medium | No audit trail | Medium |

## Required Actions

1. **Immediate**: Deploy `send-confirmation-email` Edge function
2. **Immediate**: Add email orchestration to `generate-confirmation`
3. **High Priority**: Fix database trigger configuration
4. **High Priority**: Set all required environment variables
5. **Medium Priority**: Add email tracking table
6. **Medium Priority**: Implement proper error handling

## Verification Steps

After fixes are applied:
1. Check Edge function deployment status
2. Verify environment variables are set
3. Test database trigger firing
4. Monitor webhook_logs table
5. Confirm emails are received