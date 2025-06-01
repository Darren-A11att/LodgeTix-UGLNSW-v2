# Storage Implementation Guide

## Overview
This document describes the storage strategy implementation for QR codes, PDFs, and other generated content in the LodgeTix platform.

## Storage Buckets

### 1. ticket-qr-codes (Public)
- **Purpose**: Store QR code images for tickets
- **Access**: Public read access
- **File Structure**: `/registrations/{registration_id}/tickets/{ticket_id}.png`
- **Max File Size**: 1MB
- **Allowed Types**: image/png

### 2. confirmations (Private)
- **Purpose**: Store confirmation and ticket PDFs
- **Access**: Authenticated users only, with signed URLs
- **File Structure**: 
  - Tickets: `/registrations/{registration_id}/tickets/{ticket_id}.pdf`
  - Confirmations: `/registrations/{registration_id}/confirmation-{timestamp}.pdf`
- **Max File Size**: 5MB
- **Allowed Types**: application/pdf

### 3. event-images (Public)
- **Purpose**: Store event banners and thumbnails
- **Access**: Public read access
- **File Structure**: `/events/{event_id}/banner.jpg`, `/events/{event_id}/thumbnail.jpg`
- **Max File Size**: 5MB
- **Allowed Types**: image/jpeg, image/jpg, image/png, image/webp

### 4. email-templates (Private)
- **Purpose**: Store email template archives
- **Access**: Admin only
- **File Structure**: `/archives/{template_name}-{timestamp}.html`
- **Max File Size**: 1MB
- **Allowed Types**: text/html, text/plain

## Services

### StorageService
Core service for file operations:
- Upload/download files
- Generate signed URLs for private content
- Delete files
- List directory contents
- Clean up old files based on retention policies

### QRCodeService
Handles QR code generation:
- Generate QR codes with ticket data
- Store in Supabase storage
- Batch generation for multiple tickets
- Verify QR code integrity with checksums

### PDFService
Manages PDF document creation:
- Generate ticket PDFs with QR codes
- Create confirmation PDFs
- Store PDFs with signed URLs
- Support for batch PDF generation

### PostPaymentService
Orchestrates post-payment processing:
- Generate QR codes for all tickets
- Create PDF documents
- Send confirmation emails
- Handle asset regeneration

## Database Schema Updates

### tickets table
```sql
ALTER TABLE tickets 
ADD COLUMN qr_code_url TEXT;
```

### registrations table
```sql
ALTER TABLE registrations 
ADD COLUMN confirmation_pdf_url TEXT;
```

## API Endpoints

### Storage Management
- `POST /api/storage/signed-url` - Generate signed URL for private files
- `GET /api/storage/signed-url` - Get signed URL with query params

### Ticket Operations
- `POST /api/tickets/{ticketId}/qr-code` - Generate/retrieve QR code
- `GET /api/tickets/{ticketId}/qr-code` - Get QR code URL

### Registration Operations
- `GET /api/registrations/{id}/confirmation.pdf` - Generate/download confirmation PDF
- `POST /api/registrations/{id}/process-post-payment` - Process all post-payment tasks
- `GET /api/registrations/{id}/process-post-payment` - Check post-payment processing status

### Admin Operations
- `POST /api/admin/storage/cleanup` - Run storage cleanup
- `GET /api/admin/storage/cleanup` - Get storage statistics

## Integration Flow

### Payment Success Flow
1. Payment confirmed via Stripe
2. Registration marked as paid
3. PostPaymentService triggered:
   - Generate QR codes for all tickets
   - Create ticket PDFs
   - Generate confirmation PDF
   - Send emails with attachments

### Asset Access Flow
1. User requests ticket/confirmation
2. System checks if assets exist
3. If missing, regenerate on-demand
4. Return signed URL for private content

## Setup Instructions

### 1. Initialize Storage Buckets
```bash
npm run init:storage
# or
node scripts/initialize-storage-buckets.ts
```

### 2. Run Database Migrations
```sql
-- Run migrations to add storage URL columns
psql -d your_database -f supabase/migrations/add_qr_code_url_to_tickets.sql
psql -d your_database -f supabase/migrations/add_confirmation_pdf_url_to_registrations.sql
```

### 3. Configure Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

### 4. Set Bucket Policies (in Supabase Dashboard)
For public buckets:
- Enable public access
- No authentication required for reads

For private buckets:
- Require authentication
- Use RLS policies for access control

## Testing

### Test Storage Services
```bash
curl http://localhost:3000/api/test-storage
```

### Test QR Code Generation
```bash
curl -X POST http://localhost:3000/api/tickets/{ticketId}/qr-code
```

### Test PDF Generation
```bash
curl http://localhost:3000/api/registrations/{id}/confirmation.pdf
```

## Cleanup and Maintenance

### Retention Policies
- QR codes: 365 days
- Confirmation PDFs: 90 days
- Event images: 730 days (2 years)
- Email template archives: 30 days

### Manual Cleanup
```bash
curl -X POST http://localhost:3000/api/admin/storage/cleanup \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json" \
  -d '{"type": "policy"}'
```

### Orphaned File Cleanup
```bash
curl -X POST http://localhost:3000/api/admin/storage/cleanup \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json" \
  -d '{"type": "orphaned"}'
```

## Security Considerations

1. **Private Files**: Always use signed URLs with expiration
2. **File Validation**: Enforce MIME type restrictions
3. **Access Control**: Verify user permissions before generating URLs
4. **Rate Limiting**: Implement rate limits on generation endpoints
5. **Audit Logging**: Log all file access and generation events

## Performance Optimization

1. **Lazy Generation**: Generate assets on-demand when possible
2. **Caching**: Cache generated QR codes (1 year cache header)
3. **Batch Processing**: Process multiple assets in parallel
4. **Background Jobs**: Consider moving generation to background jobs
5. **CDN**: Use Supabase's built-in CDN for public assets

## Monitoring

Track these metrics:
- Storage usage per bucket
- Generation success/failure rates
- Average generation time
- Cleanup effectiveness
- Error rates by service

## Troubleshooting

### Common Issues

1. **Storage bucket not found**
   - Run initialization script
   - Check Supabase dashboard

2. **QR code generation fails**
   - Check `qrcode` package is installed
   - Verify bucket permissions

3. **PDF generation fails**
   - Check `pdf-lib` package is installed
   - Verify memory limits

4. **Signed URLs not working**
   - Check bucket policies
   - Verify service role key

5. **Files not cleaning up**
   - Check cleanup service logs
   - Verify file age calculations