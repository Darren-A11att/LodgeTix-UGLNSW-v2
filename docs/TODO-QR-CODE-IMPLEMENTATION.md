# QR Code Edge Function Implementation TODOs

## Phase 1: Database Schema Updates

### TODO-001: Add QR Code URL to Attendees Table
- [ ] Add `qr_code_url TEXT` column to `attendees` table
- [ ] Add index on `qr_code_url` for performance
- [ ] Update database types file

### TODO-002: Ensure Required Columns Exist
- [ ] Verify `auth_user_id` exists in `registrations` table
- [ ] Verify all required foreign keys are in place
- [ ] Add any missing indexes

### TODO-003: Create Storage Buckets
- [ ] Create `attendee-qr-codes` bucket in Supabase Storage
- [ ] Set appropriate RLS policies for buckets
- [ ] Configure CORS settings

## Phase 2: Edge Function Development

### TODO-004: Create Ticket QR Edge Function
- [ ] Create `/supabase/functions/generate-ticket-qr/index.ts`
- [ ] Implement QR data structure assembly
- [ ] Fetch additional data (registration, function, event names)
- [ ] Generate QR code using Deno library
- [ ] Upload to storage and update database

### TODO-005: Create Attendee QR Edge Function
- [ ] Create `/supabase/functions/generate-attendee-qr/index.ts`
- [ ] Implement attendee QR data structure
- [ ] Fetch registration and function data
- [ ] Generate QR code
- [ ] Upload and update database

### TODO-006: Implement Checksum Generation
- [ ] Create shared checksum function using SHA-256
- [ ] Include all required fields in checksum
- [ ] Add timestamp for security

## Phase 3: Database Webhooks

### TODO-007: Create Webhook Triggers
- [ ] Create trigger for `tickets` table INSERT
- [ ] Create trigger for `attendees` table INSERT
- [ ] Test trigger functionality

### TODO-008: Configure Webhook Endpoints
- [ ] Set up webhook to call ticket QR Edge Function
- [ ] Set up webhook to call attendee QR Edge Function
- [ ] Configure retry policies

## Phase 4: Update Existing Services

### TODO-009: Update QR Code Service Types
- [ ] Update `/lib/services/qr-code-service.ts` interfaces
- [ ] Add new QR data structure types
- [ ] Update checksum generation logic

### TODO-010: Update Post-Payment Service
- [ ] Modify to skip QR generation (handled by Edge Functions)
- [ ] Remove redundant QR generation code
- [ ] Update to check for QR URLs instead

## Phase 5: Testing & Deployment

### TODO-011: Create Test Scripts
- [ ] Test ticket QR generation
- [ ] Test attendee QR generation
- [ ] Test bulk operations
- [ ] Test error scenarios

### TODO-012: Deploy and Monitor
- [ ] Deploy Edge Functions to Supabase
- [ ] Set up monitoring and alerts
- [ ] Document deployment process

## Implementation Order

1. **Database Changes First** (TODO-001 to TODO-003)
   - Critical foundation for everything else
   
2. **Edge Functions** (TODO-004 to TODO-006)
   - Core functionality implementation
   
3. **Webhooks** (TODO-007 to TODO-008)
   - Connect database to Edge Functions
   
4. **Service Updates** (TODO-009 to TODO-010)
   - Update existing code to work with new system
   
5. **Testing & Deployment** (TODO-011 to TODO-012)
   - Ensure everything works before production

## Notes

- Each TODO should be completed and tested before moving to the next
- Database migrations should be reversible
- Edge Functions should be idempotent
- All changes should maintain backward compatibility during transition