# BUG REPORT: Critical Data Loss in Individual Registration - Masonic Profiles Not Created

## Bug ID: BUG-001
**Severity**: 🔴 **CRITICAL** - Complete data loss of masonic information  
**Priority**: P0 - BLOCKING  
**Component**: Individual Registration API  
**Discovered**: 2025-06-07  
**Reporter**: System Analysis  

## Summary
The current individual registration API (`/api/registrations/individuals/route.ts`) is using a "basic working" RPC function that completely ignores all masonic profile data captured in the frontend Zustand store, resulting in 100% data loss of masonic information for individual registrations.

## Impact Assessment
- **Data Loss**: All masonic profile data (rank, grand officer status, lodge affiliations) is permanently lost
- **Business Impact**: Mason attendees cannot be properly identified or served based on their masonic status
- **Compliance Impact**: Registration system fails to capture required masonic organizational data
- **User Experience**: Users complete extensive masonic forms but data disappears

## Technical Analysis

### Current Broken State
**File**: `/api/registrations/individuals/route.ts`
**RPC Function**: `upsert_individual_registration` (Migration: 20250608000037)

```sql
-- Current "basic working" function only does minimal processing:
INSERT INTO registrations (
    registration_id, customer_id, function_id,
    registration_type, payment_status, registration_data
) VALUES (...);
-- NO attendee processing
-- NO masonic_profiles creation
-- NO contact linking
```

### Expected vs Actual Behavior

**EXPECTED** (Based on Zustand Store Data):
```typescript
// Frontend captures extensive masonic data:
{
  rank: "MM",
  grandOfficerStatus: "Present", 
  presentGrandOfficerRole: "Grand Secretary",
  grand_lodge_id: "3e893fa6-2cc2-448c-be9c-e3858cc90e11",
  lodge_id: "4c1479ba-cbaa-2072-f77a-87882c81f1be",
  lodgeNameNumber: "The Leichhardt Lodge No. 133",
  postNominals: "PDDGM",
  // ... 20+ additional masonic fields
}
```

**ACTUAL** (Current Database State):
```sql
-- Registration record created with raw JSONB dump
-- NO masonic_profiles record created
-- NO attendees records created  
-- NO contact records linked to masonic data
-- Result: Complete masonic data loss
```

## Root Cause Analysis

### 1. Migration History Issue
- **Comprehensive Function** (20250607000100): Properly creates masonic_profiles
- **Current Function** (20250608000037): "Basic working" version that strips all masonic processing
- **Problem**: Comprehensive function was replaced with minimal version to fix other issues

### 2. Missing Implementation
The current RPC function lacks:
- Attendee record creation from registration data
- Masonic profile extraction and creation logic
- Contact-to-masonic-profile linking
- JSONB masonic data processing

### 3. Development Priority Mismatch
- Bug fixes prioritized basic functionality over data completeness
- Comprehensive masonic processing was sacrificed for "working" registration

## Evidence Files

**Broken Implementation**:
- `/supabase/migrations/20250608000037_basic_working_registration.sql`
- `/api/registrations/individuals/route.ts` (calls broken RPC)

**Working Implementation** (Historical):
- `/supabase/migrations/20250607000100_comprehensive_individual_registration.sql`

**Test Evidence**:
- `/tests/api/registrations/complete-zustand-store-capture.test.ts` (expects masonic data capture)

## Reproduction Steps
1. Navigate to individual registration form
2. Complete masonic profile section with rank, lodge, grand officer details
3. Submit registration successfully
4. Query database for `masonic_profiles` table
5. **OBSERVE**: No masonic_profiles record created for the attendee

## Why This Blocks Masonic Profile Relationships Implementation

### 1. **Foundational Data Missing**
Cannot implement FK relationships when the source data (masonic_profiles) isn't being created.

### 2. **Inconsistent Data Architecture**  
Adding FK columns to point to non-existent records creates broken referential integrity.

### 3. **Test-Driven Development Impossible**
Cannot write meaningful tests for relationships when the underlying data creation is broken.

### 4. **Migration Dependencies**
FK column additions depend on having actual masonic_profiles records to reference.

## Required Outcomes to Unblock

### ✅ **Immediate Requirements**
1. **Restore Comprehensive RPC Function**: Replace basic function with comprehensive masonic processing
2. **Verify Masonic Profile Creation**: Ensure all mason attendees get masonic_profiles records
3. **Maintain Data Consistency**: Both JSONB and normalized table storage working
4. **Test Validation**: Confirm no data loss in end-to-end registration flow

### 📋 **Specific Deliverables**
1. Working `upsert_individual_registration` that creates masonic_profiles
2. Database migration to restore comprehensive functionality
3. API test confirming masonic data persistence
4. Zustand store to database mapping verification

### 🔧 **Technical Specifications**
```sql
-- Required RPC function behavior:
CREATE OR REPLACE FUNCTION upsert_individual_registration(...)
RETURNS JSONB AS $$
BEGIN
  -- 1. Create/update registration
  -- 2. Process attendees array from registration_data
  -- 3. For each mason attendee:
  --    a. Create contact record
  --    b. Extract masonic data from attendee
  --    c. Create masonic_profiles record linked to contact
  --    d. Create attendees record with contact_id
  -- 4. Return confirmation with all created IDs
END;
$$;
```

## Dependencies
- **Migration**: Must replace 20250608000037 with comprehensive version
- **Testing**: Requires working individual registration before FK testing
- **Data Integrity**: Must maintain both JSONB and normalized storage
- **API Contract**: Must preserve existing API interface while fixing backend

## Timeline Impact
**BLOCKING**: Cannot proceed with masonic profile FK relationships until this fundamental data creation issue is resolved. Estimated to block implementation by 1-2 days minimum.