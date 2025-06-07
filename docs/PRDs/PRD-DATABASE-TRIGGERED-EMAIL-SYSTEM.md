# Product Requirements Document: Database-Triggered Email System

## Executive Summary
Implement an automated email sending system triggered by database events, specifically when a registration is marked as completed with successful payment. This eliminates manual email invocation from the application layer and ensures every completed registration receives appropriate confirmation emails.

## Problem Statement
Currently, the email sending process requires explicit invocation from the Next.js application after payment processing. This creates:
- Multiple points of failure
- Potential for missed emails if the app fails after payment
- Additional complexity in the application code
- Inconsistent email delivery if developers forget to invoke

## Solution Overview
Create a database-triggered edge function that:
1. Generates confirmation numbers when registrations complete
2. Automatically invokes the email sending edge function
3. Handles all email types based on registration data
4. Provides atomic operation guarantees

## Architecture

### System Flow
```
1. Payment Gateway → Webhook → Update Registration
                                    ↓
2. Database Trigger → generate-confirmation edge function
                                    ↓
3. Edge Function:
   - Generate confirmation number
   - Update registration record
   - Determine required emails
   - Invoke send-confirmation-email
                                    ↓
4. Email Edge Function → Send emails via Resend
```

### Components

#### 1. Database Webhook
- **Trigger**: When `status = 'completed'` AND `payment_status = 'completed'`
- **Condition**: Only when `confirmation_number IS NULL`
- **Action**: Call generate-confirmation edge function

#### 2. Generate Confirmation Edge Function
- **Name**: `generate-confirmation`
- **Responsibilities**:
  - Generate unique confirmation number
  - Update registration record
  - Analyze registration type and attendee preferences
  - Invoke appropriate email sends
  - Handle errors gracefully

#### 3. Email Orchestration Logic
- **Individual Registration**:
  - Send confirmation to customer
  - Send direct tickets to applicable attendees
  - Send primary contact summary if needed
  
- **Lodge Registration**:
  - Send lodge confirmation to booking contact
  - Handle member distribution based on preferences
  
- **Delegation Registration**:
  - Send delegation confirmation
  - Handle delegate distribution

## Technical Specifications

### Database Webhook Configuration
```json
{
  "webhook_name": "registration_completion",
  "table": "registrations",
  "events": ["UPDATE"],
  "conditions": {
    "new.status": "completed",
    "new.payment_status": "completed",
    "old.confirmation_number": null
  },
  "url": "{SUPABASE_URL}/functions/v1/generate-confirmation"
}
```

### Edge Function Interface
```typescript
interface GenerateConfirmationRequest {
  type: 'UPDATE'
  table: 'registrations'
  record: Registration
  old_record: Registration
}

interface GenerateConfirmationResponse {
  success: boolean
  confirmationNumber: string
  emailsSent: {
    confirmation: boolean
    directTickets: number
    primaryContact: boolean
  }
  errors?: string[]
}
```

### Confirmation Number Format
- Pattern: `[TYPE][YEAR][MONTH][RANDOM]`
- Examples:
  - Individual: `IND20240385AC`
  - Lodge: `LDG20240385BD`
  - Delegation: `DEL20240385CE`
- Uniqueness: Enforced by database constraint

## Error Handling

### Retry Strategy
1. **Confirmation Generation**: No retry (must succeed)
2. **Email Sending**: 
   - Async invocation with retry
   - Log failures for manual intervention
   - Don't block confirmation number generation

### Failure Scenarios
1. **Database Update Fails**: Return error, no emails sent
2. **Email Invocation Fails**: Log error, return success with warning
3. **Partial Email Failure**: Track which emails succeeded

## Security Considerations
- Service role key for database operations
- Webhook signature validation
- Rate limiting on edge function
- Audit logging for all operations

## Performance Requirements
- Confirmation generation: < 500ms
- Total operation: < 3 seconds
- Concurrent handling: Support 100 simultaneous registrations

## Monitoring & Analytics
- Track confirmation generation success rate
- Monitor email invocation success
- Alert on repeated failures
- Dashboard for email delivery metrics

## Migration Strategy
1. Deploy new edge function
2. Set up database webhook
3. Test with staging data
4. Enable in production
5. Remove old email code from app
6. Monitor for 24 hours
7. Clean up deprecated code

## Success Metrics
- 100% of completed registrations have confirmation numbers
- 99.9% email delivery success rate
- 50% reduction in payment-to-email time
- Zero manual email triggers required

## Future Enhancements
- Add SMS notifications
- Implement email scheduling
- Support email template versioning
- Add customer preference management
- Implement bounce handling

## Dependencies
- Existing send-confirmation-email edge function
- Supabase database webhooks feature
- Service role authentication
- Resend email service

## Timeline
- Phase 1: Edge function development (2 days)
- Phase 2: Database webhook setup (1 day)
- Phase 3: Testing & validation (2 days)
- Phase 4: Production deployment (1 day)
- Phase 5: Monitoring & cleanup (2 days)

Total: 8 days

## Risks & Mitigation
| Risk | Impact | Mitigation |
|------|--------|------------|
| Email service downtime | High | Queue failed emails for retry |
| Duplicate emails | Medium | Idempotency checks |
| Performance degradation | Medium | Async email invocation |
| Webhook failures | High | Monitoring and alerts |