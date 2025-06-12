# Edge Functions Guide

## Overview

This guide covers all Edge functions in the confirmation email system, their purposes, configurations, and interactions.

## 1. generate-confirmation

### Purpose
Generates unique confirmation numbers and orchestrates email sending when registrations complete.

### Location
`/supabase/functions/generate-confirmation/`

### Files
```
generate-confirmation/
├── index.ts                    # Main function entry point
├── deno.json                   # Deno configuration
├── README.md                   # Function documentation
├── types/
│   └── webhook.ts             # TypeScript types
└── utils/
    ├── confirmation-generator.ts  # Confirmation number logic
    └── email-orchestrator.ts     # Email orchestration logic
```

### Current Issues
- ❌ Missing import of EmailOrchestrator in index.ts
- ❌ Email orchestration not called after confirmation generation

### Required Fix
```typescript
// Add to imports in index.ts
import { EmailOrchestrator } from './utils/email-orchestrator.ts'

// Add after line 169 (after confirmation number generation)
try {
  const emailOrchestrator = new EmailOrchestrator(supabase)
  const emailResults = await emailOrchestrator.orchestrateEmails(
    registrationId,
    mapRegistrationType(payload.record.registration_type)
  )
  
  response.emailsSent = emailResults
  
  // Update registration with email status
  await supabase
    .from('registrations')
    .update({ 
      confirmation_email_sent_at: new Date().toISOString(),
      email_status: emailResults.errors.length > 0 ? 'partial' : 'sent'
    })
    .eq('registration_id', registrationId)
    
} catch (emailError) {
  console.error('Email orchestration error:', emailError)
  response.errors?.push(`Email sending failed: ${emailError.message}`)
  // Don't fail the whole operation
}
```

### Confirmation Number Format
- Pattern: `[TYPE][YEAR][MONTH][RANDOM]`
- Types:
  - `IND` - Individual registrations
  - `LDG` - Lodge registrations  
  - `DEL` - Delegation registrations
- Example: `IND20240385AC`

## 2. send-confirmation-email

### Purpose
Sends confirmation emails using Resend API with React Email templates.

### Location
`/supabase/functions/send-confirmation-email/`

### Files
```
send-confirmation-email/
├── index.ts                    # Main function entry point
├── deno.json                   # Deno configuration
├── components/
│   └── email_layout.tsx       # Shared email layout
├── services/
│   └── resend-client.ts       # Resend API integration
├── templates/                  # Email templates
│   ├── attendee_direct_ticket_template.tsx
│   ├── delegation_confirmation_template.tsx
│   ├── individuals_confirmation_template.tsx
│   ├── lodge_confirmation_template.tsx
│   └── primary_contact_ticket_template.tsx
├── types/
│   └── email.ts               # Email type definitions
└── utils/
    ├── email-helpers.ts       # Email utility functions
    ├── formatters.ts          # Data formatting
    ├── logger.ts              # Logging utilities
    └── qr-code.ts            # QR code generation
```

### Status
- ✅ Code complete and ready
- ❌ Not deployed to Supabase
- ❌ Never invoked by generate-confirmation

### Email Types Supported
```typescript
enum EmailType {
  INDIVIDUAL_CONFIRMATION = 'INDIVIDUAL_CONFIRMATION',
  LODGE_CONFIRMATION = 'LODGE_CONFIRMATION',
  DELEGATION_CONFIRMATION = 'DELEGATION_CONFIRMATION',
  ATTENDEE_DIRECT_TICKET = 'ATTENDEE_DIRECT_TICKET',
  PRIMARY_CONTACT_TICKET = 'PRIMARY_CONTACT_TICKET'
}
```

### Required Environment Variables
```bash
RESEND_API_KEY=re_xxxxxxxxxxxxx          # Required
EMAIL_FROM_ADDRESS=noreply@lodgetix.com  # Optional
EMAIL_FROM_NAME=LodgeTix                 # Optional
```

### API Interface
```typescript
interface EmailRequestPayload {
  type: EmailType
  registrationId: string
  testMode?: boolean
}

interface EmailResponse {
  success: boolean
  emailId?: string
  error?: string
}
```

## 3. generate-attendee-qr

### Purpose
Generates QR codes for attendee identification.

### Location
`/supabase/functions/generate-attendee-qr/`

### Status
- ✅ Appears to be working
- Used for attendee check-in QR codes

## 4. generate-ticket-qr

### Purpose
Generates QR codes for individual tickets.

### Location
`/supabase/functions/generate-ticket-qr/`

### Status
- ✅ Appears to be working
- Used for ticket validation QR codes

## Function Interactions

```
┌─────────────────────┐
│ Database Trigger    │
└──────────┬──────────┘
           │ Invokes
           ▼
┌─────────────────────┐     ┌─────────────────────┐
│ generate-           │────▶│ EmailOrchestrator   │
│ confirmation        │     │ (determines which   │
└─────────────────────┘     │  emails to send)    │
                            └──────────┬──────────┘
                                       │ Invokes
                                       ▼
                            ┌─────────────────────┐
                            │ send-confirmation-  │
                            │ email               │
                            │ (multiple times)    │
                            └─────────────────────┘
```

## Deployment Commands

### Deploy Individual Functions
```bash
# Deploy generate-confirmation
supabase functions deploy generate-confirmation

# Deploy send-confirmation-email (REQUIRED!)
supabase functions deploy send-confirmation-email

# Deploy QR generators
supabase functions deploy generate-attendee-qr
supabase functions deploy generate-ticket-qr
```

### Deploy All Functions
```bash
# Deploy all functions at once
supabase functions deploy
```

### Set Secrets
```bash
# Set required secrets
supabase secrets set RESEND_API_KEY=your_resend_api_key
supabase secrets set EMAIL_FROM_ADDRESS=noreply@yourdomain.com
supabase secrets set EMAIL_FROM_NAME="Your Company"
```

## Local Development

### Serve Functions Locally
```bash
# Serve individual function
supabase functions serve generate-confirmation

# Serve with hot reload
supabase functions serve generate-confirmation --no-verify-jwt
```

### Test Locally
```bash
# Test generate-confirmation
curl -X POST http://localhost:54321/functions/v1/generate-confirmation \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "type": "UPDATE",
    "table": "registrations",
    "record": {
      "registration_id": "test-123",
      "status": "completed",
      "payment_status": "completed",
      "registration_type": "individuals"
    }
  }'

# Test send-confirmation-email
curl -X POST http://localhost:54321/functions/v1/send-confirmation-email \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "type": "INDIVIDUAL_CONFIRMATION",
    "registrationId": "test-123"
  }'
```

## Monitoring

### View Logs
```bash
# View logs for specific function
supabase functions logs generate-confirmation

# Follow logs in real-time
supabase functions logs generate-confirmation --follow

# View logs with limit
supabase functions logs send-confirmation-email --limit 100
```

### Check Deployment Status
```bash
# List deployed functions
supabase functions list
```

## Common Issues

### 1. Function Not Found (404)
- **Cause**: Function not deployed
- **Fix**: Run `supabase functions deploy [function-name]`

### 2. Authentication Error (401)
- **Cause**: Missing or invalid service role key
- **Fix**: Check Authorization header includes service role key

### 3. Environment Variable Missing
- **Cause**: Secrets not set
- **Fix**: Run `supabase secrets set KEY=value`

### 4. Import Errors
- **Cause**: Incorrect import paths or missing dependencies
- **Fix**: Check deno.json import map configuration