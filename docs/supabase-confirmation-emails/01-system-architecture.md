# System Architecture

## Overview

The confirmation email system is designed as an event-driven architecture triggered by database changes.

## Flow Diagram

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│ Payment Gateway │────▶│ Update           │────▶│ Database Trigger    │
│ (Stripe)        │     │ Registration     │     │ (UPDATE on          │
└─────────────────┘     │ status=completed │     │  registrations)     │
                        │ payment_status=  │     └─────────┬───────────┘
                        │   completed      │               │
                        └──────────────────┘               ▼
                                                  ┌─────────────────────┐
                                                  │ generate-           │
                                                  │ confirmation        │
                                                  │ Edge Function       │
                                                  └─────────┬───────────┘
                                                           │
                                            ┌──────────────┴──────────────┐
                                            │                             │
                                            ▼                             ▼
                                  ┌─────────────────────┐      ┌─────────────────────┐
                                  │ Generate            │      │ EmailOrchestrator   │
                                  │ Confirmation Number │      │ (orchestrateEmails) │
                                  └─────────────────────┘      └─────────┬───────────┘
                                                                         │
                                                               ┌─────────┴──────────┐
                                                               │                    │
                                                               ▼                    ▼
                                                     ┌──────────────────┐ ┌──────────────────┐
                                                     │ send-confirmation│ │ send-confirmation│
                                                     │ -email           │ │ -email           │
                                                     │ (main confirm)   │ │ (attendee tix)   │
                                                     └──────────────────┘ └──────────────────┘
                                                               │                    │
                                                               ▼                    ▼
                                                         ┌──────────┐        ┌──────────┐
                                                         │  Resend  │        │  Resend  │
                                                         │   API    │        │   API    │
                                                         └──────────┘        └──────────┘
```

## Components

### 1. Database Trigger
- **Name**: `registration_payment_webhook_trigger`
- **Table**: `registrations`
- **Event**: `AFTER UPDATE`
- **Condition**: When payment completes and no confirmation exists
- **Action**: Invokes `generate-confirmation` Edge function

### 2. Generate Confirmation Edge Function
- **Purpose**: Generate unique confirmation numbers and orchestrate emails
- **Triggers**: Database webhook on registration completion
- **Responsibilities**:
  - Generate confirmation number
  - Update registration record
  - Invoke email orchestration
  - Handle errors gracefully

### 3. Email Orchestrator
- **Location**: `generate-confirmation/utils/email-orchestrator.ts`
- **Purpose**: Determine which emails to send based on registration type
- **Logic**:
  - Always send main confirmation email
  - Check attendee contact preferences
  - Send direct tickets if requested
  - Send primary contact summary if needed

### 4. Send Confirmation Email Edge Function
- **Purpose**: Actually send emails via Resend API
- **Supports**: Multiple email types and templates
- **Features**:
  - React Email templates
  - PDF attachments
  - Retry logic
  - Error handling

## Email Types

### Registration Confirmations
1. **Individual Confirmation** (`INDIVIDUAL_CONFIRMATION`)
   - Sent to: Customer
   - Contains: Registration details, tickets, payment info

2. **Lodge Confirmation** (`LODGE_CONFIRMATION`)
   - Sent to: Booking contact
   - Contains: Lodge details, package info, attendee list

3. **Delegation Confirmation** (`DELEGATION_CONFIRMATION`)
   - Sent to: Delegation leader
   - Contains: Delegation info, delegate list

### Ticket Distribution
1. **Attendee Direct Ticket** (`ATTENDEE_DIRECT_TICKET`)
   - Sent to: Individual attendees who opted for direct contact
   - Contains: Personal tickets with QR codes

2. **Primary Contact Ticket** (`PRIMARY_CONTACT_TICKET`)
   - Sent to: Primary contact for distribution
   - Contains: All tickets for attendees who chose primary contact

## Data Flow

### Registration Data Structure
```typescript
interface Registration {
  registration_id: string
  confirmation_number: string | null
  registration_type: 'individuals' | 'lodge' | 'delegation'
  status: 'pending' | 'completed' | 'cancelled'
  payment_status: 'pending' | 'completed' | 'failed'
  function_id: string
  customer_id: string
  total_amount_paid: number
  // ... other fields
}
```

### Attendee Preferences
```typescript
interface Attendee {
  attendee_id: string
  registration_id: string
  contact_preference: 'direct' | 'primary' | null
  email: string | null
  // ... other fields
}
```

## Security Considerations

1. **Authentication**: Service role key required for Edge functions
2. **RLS Policies**: Ensure proper access control
3. **Webhook Validation**: Optional signature verification
4. **Data Privacy**: No PII in logs
5. **Rate Limiting**: Built into Supabase

## Performance Requirements

- Confirmation generation: < 500ms
- Email orchestration: < 1s
- Total operation: < 3s
- Concurrent support: 100+ registrations

## Failure Handling

1. **Confirmation Generation**: Must succeed (with retries for uniqueness)
2. **Email Sending**: Best-effort with logging
3. **Partial Failures**: Track which emails succeeded
4. **Recovery**: Manual retry via admin tools