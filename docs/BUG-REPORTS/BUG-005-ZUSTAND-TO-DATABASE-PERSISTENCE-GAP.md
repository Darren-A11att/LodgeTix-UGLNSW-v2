# BUG REPORT: Zustand Store to Database Persistence Gap for Masonic Profiles

## Bug ID: BUG-005
**Severity**: 🟡 **HIGH** - Complete implementation gap in data persistence layer  
**Priority**: P1 - BLOCKING  
**Component**: Data Persistence Layer  
**Discovered**: 2025-06-07  
**Reporter**: System Analysis  

## Summary
While Zustand stores comprehensively capture masonic profile data (50+ fields per attendee), the persistence layer fails to map this rich data to the normalized `masonic_profiles` table structure, resulting in a complete implementation gap between frontend state management and database storage.

## Impact Assessment
- **Data Loss**: Rich masonic data captured but not persisted in queryable format
- **Business Logic Gap**: Frontend captures data that backend cannot process
- **Performance Impact**: Complex JSONB queries required instead of efficient normalized lookups
- **Feature Completeness**: Masonic profile features cannot be fully implemented

## Technical Analysis

### Current Zustand Store Coverage (COMPREHENSIVE)

**Individual Registration Store** (`/lib/registrationStore.ts`):
```typescript
// Captures 50+ masonic fields per attendee:
interface UnifiedAttendeeData {
  // Basic masonic info
  rank: string; // EAF, FCF, MM, IM, GL
  title: string; // Bro, W Bro, RW Bro, MW Bro
  
  // Grand Lodge affiliation  
  grand_lodge_id: string | number | null;
  grandLodgeName: string;
  grandLodgeOrganisationId: string;
  
  // Lodge affiliation
  lodge_id: string | number | null;
  lodgeName: string;
  lodgeNameNumber: string;
  lodgeOrganisationId: string;
  useSameLodge: boolean;
  
  // Grand Officer status
  grandOfficerStatus: string; // Past/Present  
  presentGrandOfficerRole: string;
  otherGrandOfficerRole: string;
  isGrandOfficer: boolean;
  grandOfficerRole: string;
  
  // Additional masonic details
  postNominals: string; // PDDGM, etc.
  masonicOrder: string;
  // ... additional fields
}
```

**Lodge Registration Store** (`/lib/lodgeRegistrationStore.ts`):
```typescript
interface Customer {
  title: string;
  rank?: string;
  grandOfficerStatus?: string;
  presentGrandOfficerRole?: string;
  otherGrandOfficerRole?: string;
}

interface LodgeDetails {
  grand_lodge_id: string;
  grandLodgeName?: string;
  lodge_id: string;
  lodgeName?: string;
  lodgeNumber?: string;
  organisationId?: string;
}
```

**Delegation Registration Store** (`/lib/delegationRegistrationStore.ts`):
```typescript
interface DelegationLeader {
  rank: string;
  grandOfficerStatus?: 'Present' | 'Past';
  presentGrandOfficerRole?: string;
  otherGrandOfficerRole?: string;
}

interface DelegationDetails {
  delegationType: 'grand_lodge' | 'masonic-order';
  grand_lodge_id: string;
  grandLodgeName?: string;
  orderName?: string;
}
```

### Database Persistence Gap (BROKEN)

**Target Database Structure** (`masonic_profiles` table):
```sql
CREATE TABLE masonic_profiles (
    masonic_profile_id UUID PRIMARY KEY,
    contact_id UUID REFERENCES contacts(contact_id),
    masonic_title VARCHAR(50),
    rank VARCHAR(50), 
    grand_rank VARCHAR(50),
    grand_officer VARCHAR(50),
    grand_office VARCHAR(100),
    lodge_id UUID REFERENCES organisations(organisation_id),
    grand_lodge_id UUID REFERENCES organisations(organisation_id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Current Persistence Reality**:
```sql
-- Individual registrations: NO masonic_profiles created ❌
-- Delegation registrations: NO masonic_profiles created ❌  
-- Lodge registrations: NO individual masonic data ❌
-- Result: Rich Zustand data → Database void
```

## Data Mapping Analysis

### Required Zustand → Database Mapping

**Field Mapping Requirements**:
```typescript
// Zustand Store → masonic_profiles table mapping needed:
{
  // Direct mappings:
  rank → masonic_profiles.rank
  title → masonic_profiles.masonic_title
  grandOfficerRole → masonic_profiles.grand_office
  
  // Complex mappings:
  grandOfficerStatus + presentGrandOfficerRole → grand_officer + grand_office
  grandLodgeOrganisationId → grand_lodge_id (UUID conversion)
  lodgeOrganisationId → lodge_id (UUID conversion)
  
  // Derived fields:
  isGrandOfficer + grandOfficerStatus → grand_rank calculation
  postNominals → potentially grand_rank or separate field
  
  // Validation required:
  Ensure either lodge_id OR grand_lodge_id is populated
  Validate rank values against enum
  Validate grand officer combinations
}
```

### Missing Persistence Logic

**Individual Registration** (Most Critical):
```sql
-- NEEDED: Extract masonic data from Zustand store and create:
INSERT INTO masonic_profiles (
    masonic_profile_id,
    contact_id, 
    masonic_title,
    rank,
    grand_officer,
    grand_office,
    lodge_id,
    grand_lodge_id
) VALUES (
    -- Extract from attendee data in registration_data JSONB
    -- Map Zustand fields to normalized columns
    -- Handle UUID conversions and validations
);
```

**Delegation Registration** (Enhancement Needed):
```sql
-- NEEDED: Process delegation members and create masonic_profiles
FOR delegate IN delegation_members LOOP
    IF delegate.attendee_type = 'mason' THEN
        -- Extract masonic data from delegate
        -- Create masonic_profiles record
        -- Link to contact and attendee records
    END IF;
END LOOP;
```

## Root Cause Analysis

### 1. **Implementation Incomplete**
- Zustand stores were built with comprehensive masonic data capture
- Database schema designed for normalized masonic storage
- **Missing**: Mapping/transformation layer between the two

### 2. **Simplified "Working" Approach**
- Complex masonic processing was simplified to get "basic working" registrations
- Rich data capture preserved but persistence logic removed
- No roadmap to restore comprehensive persistence

### 3. **API Layer Abstraction Gap**
- Registration APIs receive rich Zustand data
- RPC functions built for minimal processing
- No extraction/mapping service for masonic data

## Evidence Files

**Rich Data Capture**:
- `/lib/registrationStore.ts` (comprehensive masonic fields)
- `/lib/lodgeRegistrationStore.ts` (lodge masonic data)
- `/lib/delegationRegistrationStore.ts` (delegation masonic data)

**Broken Persistence**:
- `/supabase/migrations/20250608000037_basic_working_registration.sql` (minimal processing)
- `/api/registrations/individuals/route.ts` (calls broken RPC)

**Missing Service Layer**:
- No `masonic-profile-persistence-service.ts` 
- No Zustand-to-database mapping utilities
- No masonic data validation service

## Why This Blocks FK Relationships Implementation

### 1. **No Source Data for FK Targets**
Cannot create `attendees.masonic_profile_id` FK when masonic_profiles table is empty due to persistence gaps.

### 2. **Rich Data Availability Without Utilization**
Frontend captures comprehensive masonic data but cannot reference it via FKs because it's not persisted in normalized format.

### 3. **Testing Impossible**
Cannot write tests for FK relationships when the data flow from capture to persistence is broken.

### 4. **Performance Requirements Unmet**
Complex JSONB queries required instead of efficient FK joins due to persistence gaps.

## Required Outcomes to Unblock

### ✅ **Comprehensive Persistence Layer**

#### **1. Masonic Profile Persistence Service**
```typescript
// NEW: /lib/services/masonic-profile-persistence-service.ts
interface MasonicProfilePersistenceService {
  extractMasonicDataFromAttendee(attendee: UnifiedAttendeeData): MasonicProfileData;
  validateMasonicData(data: MasonicProfileData): ValidationResult;
  createMasonicProfile(contactId: string, data: MasonicProfileData): Promise<string>;
  linkAttendeeToMasonicProfile(attendeeId: string, masonicProfileId: string): Promise<void>;
}
```

#### **2. Enhanced RPC Functions**
```sql
-- Enhanced individual registration RPC:
CREATE OR REPLACE FUNCTION upsert_individual_registration(...)
RETURNS JSONB AS $$
DECLARE
    masonic_profile_id UUID;
BEGIN
    -- Existing registration logic...
    
    -- NEW: For each mason attendee
    FOR attendee IN SELECT * FROM process_attendees(p_registration_data) LOOP
        IF attendee.attendee_type = 'mason' THEN
            -- Extract masonic data from attendee
            masonic_profile_id := create_masonic_profile_from_attendee(attendee);
            -- Link attendee to masonic profile
            UPDATE attendees SET masonic_profile_id = masonic_profile_id 
            WHERE attendee_id = attendee.attendee_id;
        END IF;
    END LOOP;
END;
$$;
```

#### **3. Data Mapping Utilities**
```typescript
// NEW: /lib/utils/masonic-data-mapping.ts
export function mapZustandToMasonicProfile(attendee: UnifiedAttendeeData): MasonicProfileCreateInput;
export function validateMasonicDataConsistency(data: MasonicProfileCreateInput): ValidationResult;
export function handleUUIDConversions(data: any): any;
```

### 📋 **Specific Implementation Requirements**

1. **Zustand Store Integration**: Direct mapping from store fields to database schema
2. **Data Validation**: Comprehensive validation before database insertion  
3. **UUID Handling**: Proper conversion from string/number IDs to UUIDs
4. **Constraint Compliance**: Ensure CHECK constraints are satisfied
5. **Performance Optimization**: Efficient bulk processing for multiple attendees
6. **Error Handling**: Graceful failure with detailed error messages
7. **Transaction Safety**: All-or-nothing persistence for data integrity

### 🎯 **Success Criteria**
1. All mason attendees from Zustand stores get masonic_profiles records
2. 100% data fidelity between Zustand capture and database storage
3. Efficient query performance via normalized table access
4. Comprehensive test coverage for all mapping scenarios
5. Clear error messages for validation failures

## Dependencies
- **Requires**: BUG-001 resolution (working individual registration)
- **Requires**: BUG-002 resolution (delegation masonic profiles)
- **Requires**: BUG-003 resolution (design decisions)
- **Blocks**: FK relationship implementation
- **Blocks**: Masonic profile querying features

## Timeline Impact
**BLOCKING**: Cannot implement FK relationships until rich Zustand data can be properly persisted in normalized masonic_profiles table. Estimated to require 1-2 days after RPC functions are fixed, as this requires building the complete persistence layer.