# Product Requirements Document: QR Code Generation via Supabase Edge Functions

## Executive Summary
This PRD outlines the implementation of an automated QR code generation system using Supabase Edge Functions. The system will automatically generate QR codes for both tickets and attendees when they are created in the database, storing the QR codes in Supabase Storage and updating the database with the QR code URLs.

## Goals
1. Automate QR code generation for tickets and attendees
2. Reduce server load by offloading QR generation to Edge Functions
3. Ensure data integrity with checksums
4. Support both assigned and unassigned tickets
5. Enable efficient check-in processes

## Requirements

### Functional Requirements

#### FR1: Ticket QR Code Generation
- Generate QR code automatically when a ticket is created
- Include all required data fields in QR code
- Store QR code image in Supabase Storage
- Update ticket record with QR code URL

#### FR2: Attendee QR Code Generation
- Generate QR code automatically when an attendee is created
- Include attendee-specific data (excluding ticket fields)
- Store QR code image in Supabase Storage
- Update attendee record with QR code URL

#### FR3: Data Structure Requirements

**Ticket QR Code Data:**
```json
{
  "type": "TICKET",
  "fid": "function_id",
  "tid": "ticket_id",
  "rid": "registration_id",
  "ttid": "ticket_type_id",
  "pid": "package_id",
  "tca": "ticket_created_at",
  "qca": "qr_code_created_at",
  "spi": "stripe_payment_intent_id",
  "rt": "registration_type",
  "uid": "auth_user_id",
  "fn": "function_name",
  "en": "event_name",
  "checksum": "hash"
}
```

**Attendee QR Code Data:**
```json
{
  "type": "ATTENDEE",
  "fid": "function_id",
  "aid": "attendee_id",
  "rid": "registration_id",
  "qca": "qr_code_created_at",
  "spi": "stripe_payment_intent_id",
  "rt": "registration_type",
  "uid": "auth_user_id",
  "fn": "function_name",
  "checksum": "hash"
}
```

### Non-Functional Requirements

#### NFR1: Performance
- QR code generation should complete within 2 seconds
- Support concurrent generation for bulk operations
- Cache function and event names for efficiency

#### NFR2: Reliability
- Automatic retry on failure
- Idempotent operations (safe to retry)
- Error logging and monitoring

#### NFR3: Security
- Use SHA-256 for checksum generation
- Include timestamp to prevent replay attacks
- Secure storage bucket configuration

#### NFR4: Scalability
- Handle thousands of concurrent QR generations
- Efficient storage path structure
- Cleanup old/unused QR codes

## Technical Architecture

### Components

1. **Database Schema Updates**
   - Add `qr_code_url` to `attendees` table
   - Add `auth_user_id` to `registrations` table (if missing)
   - Create indexes for performance

2. **Edge Functions**
   - `generate-ticket-qr`: Handles ticket QR generation
   - `generate-attendee-qr`: Handles attendee QR generation

3. **Database Webhooks**
   - Webhook on `tickets` INSERT
   - Webhook on `attendees` INSERT

4. **Storage Buckets**
   - `ticket-qr-codes`: For ticket QR images
   - `attendee-qr-codes`: For attendee QR images

### Data Flow

1. Record inserted into database
2. Database webhook triggers Edge Function
3. Edge Function fetches additional data (registration, function, event)
4. Edge Function generates QR code with all required data
5. QR code uploaded to Storage
6. Database record updated with QR code URL

## Implementation Plan

### Phase 1: Database Setup
- Add missing columns
- Create storage buckets
- Set up RLS policies

### Phase 2: Edge Function Development
- Create QR generation functions
- Implement data fetching logic
- Add checksum generation

### Phase 3: Webhook Configuration
- Set up database webhooks
- Configure retry policies
- Test webhook triggers

### Phase 4: Testing & Deployment
- Unit test Edge Functions
- Integration testing
- Performance testing
- Production deployment

## Success Metrics

1. **Automation Rate**: 100% of tickets/attendees have QR codes
2. **Generation Speed**: < 2 seconds per QR code
3. **Error Rate**: < 0.1% generation failures
4. **Storage Efficiency**: Optimized image sizes

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Edge Function timeout | QR codes not generated | Implement efficient queries, add timeout handling |
| Storage quota exceeded | Generation fails | Implement cleanup, monitor usage |
| Data inconsistency | Invalid QR codes | Use transactions, add validation |
| Performance degradation | Slow check-ins | Add caching, optimize queries |

## Dependencies

- Supabase Edge Functions runtime
- Deno QR code library
- Supabase Storage
- Database webhook support

## Timeline

- **Week 1**: Database schema updates and Edge Function development
- **Week 2**: Webhook configuration and testing
- **Week 3**: Production deployment and monitoring

## Approval

This PRD requires approval from:
- Technical Lead
- Database Administrator
- Security Team