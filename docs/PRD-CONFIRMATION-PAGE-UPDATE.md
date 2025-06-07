# Product Requirements Document: Confirmation Page Update

## Overview
Update the confirmation pages for individual and lodge registrations to display QR codes for tickets and improve the visual layout based on provided design inspiration.

## Goals
1. Replace placeholder QR code icons with actual QR codes for each ticket
2. Improve visual hierarchy and information display for confirmation pages
3. Differentiate between individual and lodge registration confirmations appropriately

## Requirements

### Individual Registration Confirmation
1. **Display Format**:
   - Show each attendee as a card
   - Display attendee details in the header (name, title/rank, lodge if applicable)
   - List tickets underneath each attendee
   - Display QR code for each ticket

2. **QR Code Requirements**:
   - Generate unique QR code for each ticket
   - QR code should contain ticket validation data
   - Store QR codes in Supabase storage
   - Display actual QR code image, not placeholder icon

3. **Layout**:
   - Use card-based layout similar to invoice-table design inspiration
   - QR code on left side (20% width)
   - Ticket details on right side (80% width)
   - Include ticket name, event date/time, venue
   - Show dietary requirements and special needs if applicable

### Lodge Registration Confirmation
1. **Display Format**:
   - Show lodge details in header (name, number, grand lodge)
   - Display bulk ticket information (no individual attendees)
   - Show total tables and member count
   - Display package details with QR codes

2. **QR Code Requirements**:
   - Generate QR codes for lodge package/tickets
   - May need bulk QR code or multiple codes depending on package structure
   - Store in Supabase storage

3. **Layout**:
   - Similar card-based layout to individual registration
   - Focus on package information rather than individual tickets
   - Show table count and total seats

## Technical Implementation

### QR Code Generation
1. **Use Existing Service**: Leverage `QRCodeService` in `/lib/services/qr-code-service.ts`
2. **Data Format**: Use `TicketQRDataV2` format for comprehensive ticket data
3. **Storage**: Store generated QR codes in Supabase storage buckets
4. **Caching**: Cache QR codes to avoid regeneration on each page load

### Database Integration
1. **Source of Truth**: Use database views as authoritative data source
   - `individuals_registration_confirmation_view`
   - `lodge_registration_confirmation_view`
2. **QR Code URLs**: Store QR code URLs in ticket records or generate on-demand

### Component Updates
1. **Update `confirmation-step.tsx`**:
   - Replace QrCode icon component with actual QR code images
   - Implement QR code fetching/generation logic
   - Update layout to match design inspiration

2. **Create Reusable Components**:
   - `TicketCard` component for individual ticket display
   - `AttendeeCard` component for attendee grouping
   - `QRCodeDisplay` component for QR code rendering

## Design Inspiration Integration
Based on provided files:
- Use table-like structure from `invoice-table.tsx`
- Implement card-based layout from `order-detail.tsx`
- Consider split layout from `split-image.tsx` for QR code placement
- Apply stacked detail pattern from `staked-detail-page.tsx`

## Security Considerations
1. QR codes should contain encrypted/signed data
2. Validate QR code data integrity with checksums
3. Ensure QR codes are only accessible to authorized users
4. Implement rate limiting for QR code generation

## Performance Requirements
1. QR codes should be generated asynchronously
2. Implement lazy loading for QR code images
3. Cache generated QR codes for reuse
4. Optimize page load time with progressive rendering

## Testing Requirements
1. Unit tests for QR code generation
2. Integration tests for confirmation page rendering
3. Visual regression tests for layout changes
4. Performance tests for QR code loading
5. Security tests for QR code data validation

## Success Criteria
1. All tickets display actual QR codes instead of placeholder icons
2. QR codes are scannable and contain valid ticket data
3. Page layout matches design inspiration
4. Performance remains acceptable (< 3s page load)
5. All existing functionality continues to work