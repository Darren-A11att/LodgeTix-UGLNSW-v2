# BUG REPORT: Delegation Registration Masonic Profiles Not Created

## Bug ID: BUG-002
**Severity**: 🟡 **HIGH** - Partial data loss and inconsistent masonic profile creation  
**Priority**: P1 - BLOCKING  
**Component**: Delegation Registration API  
**Discovered**: 2025-06-07  
**Reporter**: System Analysis  

## Summary
The delegation registration API (`/api/registrations/delegation/route.ts`) stores masonic data in `attendees.masonic_status` JSONB but fails to create corresponding normalized `masonic_profiles` records, resulting in inconsistent data architecture and broken relationships.

## Impact Assessment
- **Data Inconsistency**: Masonic data exists in JSONB but not in normalized tables
- **Relationship Integrity**: Cannot create FK relationships to non-existent masonic_profiles
- **Query Performance**: Complex JSONB queries required instead of efficient table joins
- **Data Normalization**: Violates database normalization principles

## Technical Analysis

### Current Implementation Gap
**File**: `/api/registrations/delegation/route.ts`
**RPC Function**: `create_delegation_registration`

```sql
-- Current behavior:
INSERT INTO attendees (
    ...,
    masonic_status -- JSONB column with masonic data
) VALUES (...);

-- Missing behavior:
-- NO INSERT INTO masonic_profiles (...)
-- NO contact-to-masonic-profile linking
-- NO normalized masonic data structure
```

### Data Storage Inconsistency

**STORED** (In attendees.masonic_status JSONB):
```json
{
  "rank": "MM",
  "grandOfficerStatus": "Present",
  "presentGrandOfficerRole": "Grand Master",
  "grand_lodge_id": "uuid-here",
  "lodge_id": "uuid-here"
}
```

**NOT STORED** (Missing masonic_profiles record):
```sql
-- This record should exist but doesn't:
INSERT INTO masonic_profiles (
    masonic_profile_id,
    contact_id,
    masonic_title,
    rank,
    grand_rank,
    grand_officer,
    grand_office,
    lodge_id,
    grand_lodge_id
) VALUES (...);
```

## Root Cause Analysis

### 1. Incomplete Implementation
The delegation registration RPC was built to handle bulk/organizational registrations but lacks individual masonic profile processing logic.

### 2. JSONB-Only Approach
- Stores masonic data as unstructured JSONB for simplicity
- Skips normalized table creation for performance
- Creates architectural inconsistency with individual registrations

### 3. Missing Business Logic
No logic to:
- Extract masonic data from delegation members
- Create individual masonic_profiles for delegates
- Link delegates to their masonic profiles
- Maintain referential integrity

## Evidence Files

**Current Implementation**:
- `/api/registrations/delegation/route.ts`
- `/supabase/migrations/20250608000016_create_delegation_registration_rpc.sql`

**Expected Data Structure**:
- `/shared/types/mason.ts` (masonic profile type definitions)
- `/lib/delegationRegistrationStore.ts` (captures masonic data)

## Reproduction Steps
1. Navigate to delegation registration
2. Complete delegation leader masonic profile
3. Add delegation members with masonic details
4. Submit registration successfully
5. Query `attendees` table - JSONB masonic_status populated ✅
6. Query `masonic_profiles` table - NO records created ❌

## Why This Blocks Masonic Profile Relationships Implementation

### 1. **Inconsistent Data Architecture**
- Individual registrations: Should create masonic_profiles (but currently broken)
- Delegation registrations: Only JSONB, no masonic_profiles
- Lodge registrations: No individual masonic data captured

### 2. **FK Relationship Gaps**
Cannot create `attendees.masonic_profile_id` FK when delegation attendees have no masonic_profiles records to reference.

### 3. **Query Complexity**
Mixed data access patterns:
```sql
-- Some attendees (individual): JOIN masonic_profiles
-- Other attendees (delegation): Parse JSONB masonic_status
-- Result: Complex, inefficient queries
```

### 4. **Test Coverage Impossible**
Cannot write comprehensive tests for FK relationships when data creation is inconsistent across registration types.

## Required Outcomes to Unblock

### ✅ **Immediate Requirements**
1. **Update Delegation RPC**: Add masonic_profiles creation for all mason delegates
2. **Maintain JSONB Storage**: Keep existing JSONB for performance while adding normalized records
3. **Contact Integration**: Create/link contact records for delegates with masonic profiles
4. **Data Consistency**: Ensure both storage methods contain same information

### 📋 **Specific Deliverables**
1. Enhanced `create_delegation_registration` RPC function
2. Database migration to add masonic profile processing
3. API test confirming both JSONB and normalized storage
4. Delegation store to masonic_profiles mapping verification

### 🔧 **Technical Specifications**
```sql
-- Required RPC function enhancement:
CREATE OR REPLACE FUNCTION create_delegation_registration(...)
RETURNS JSONB AS $$
BEGIN
  -- Existing delegation creation logic...
  
  -- NEW: For each delegate with masonic data:
  FOR delegate IN SELECT * FROM jsonb_array_elements(p_delegates) LOOP
    IF delegate->>'attendee_type' = 'mason' AND delegate->'masonic_data' IS NOT NULL THEN
      -- Create contact record for delegate
      -- Extract masonic data from delegate JSON
      -- Create masonic_profiles record
      -- Link attendee to both contact and masonic_profile
      -- Store masonic data in BOTH masonic_status JSONB AND masonic_profiles table
    END IF;
  END LOOP;
  
  -- Return enhanced response with masonic_profile_ids
END;
$$;
```

### 🎯 **Success Criteria**
1. All mason delegates get masonic_profiles records
2. Both JSONB and normalized storage contain identical masonic data
3. Contact records properly linked to masonic profiles
4. API returns masonic_profile_ids for verification

## Dependencies
- **Contact Creation**: Must create contact records before masonic profiles
- **Data Validation**: Must validate masonic data before normalized storage
- **Migration Safety**: Must preserve existing JSONB data during enhancement
- **Performance**: Must maintain acceptable delegation registration performance

## Relationship to Other Bugs
- **Depends on**: BUG-001 resolution (need consistent masonic profile creation pattern)
- **Blocks**: Masonic profile FK relationships implementation
- **Related to**: Any future lodge registration masonic profile requirements

## Timeline Impact
**BLOCKING**: Cannot implement consistent FK relationships until delegation registrations create masonic_profiles records. Estimated to block implementation by 1 day after BUG-001 resolution.