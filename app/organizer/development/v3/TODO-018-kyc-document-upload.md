# TODO-018: KYC Document Upload System

## Overview
Implement secure document upload for KYC verification process.

## Acceptance Criteria
- [ ] Drag-and-drop file upload
- [ ] Support PDF and images
- [ ] Show upload progress
- [ ] Validate file types/sizes
- [ ] Secure storage
- [ ] Preview uploaded documents
- [ ] Re-upload if rejected

## Document Types
1. **Lodge Charter**
   - PDF or image
   - Must show lodge name
   
2. **Grand Lodge Certificate**
   - Current year
   - Shows good standing
   
3. **Bank Statement**
   - Recent (< 3 months)
   - Shows lodge name
   - Can redact amounts
   
4. **Officer List**
   - From Grand Lodge
   - Current year

## Technical Requirements
- Client-side encryption
- Direct to secure storage
- Virus scanning
- Max 10MB per file
- Generate thumbnails
- Track upload status

## Why This Next
Required for account verification.

## Definition of Done
- Files upload reliably
- Progress indication works
- Errors handled gracefully
- Documents stored securely
- Can view uploaded docs