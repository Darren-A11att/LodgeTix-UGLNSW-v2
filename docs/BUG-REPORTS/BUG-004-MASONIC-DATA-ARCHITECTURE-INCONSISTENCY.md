# BUG REPORT: Masonic Data Architecture Inconsistency Across Registration Types

## Bug ID: BUG-004
**Severity**: 🟡 **HIGH** - Systemic architectural inconsistency  
**Priority**: P1 - BLOCKING  
**Component**: Overall Data Architecture  
**Discovered**: 2025-06-07  
**Reporter**: System Analysis  

## Summary
The current system has three different approaches to masonic data storage across registration types, creating architectural inconsistency that prevents unified FK relationship implementation and violates database normalization principles.

## Impact Assessment
- **Architectural Debt**: Multiple patterns for same data type
- **Query Complexity**: Different access methods for different registration types
- **Maintenance Burden**: Multiple codepaths for masonic data operations
- **Data Integrity**: Inconsistent validation and constraint application
- **Performance Impact**: Cannot optimize queries across registration types

## Technical Analysis

### Current Inconsistent Architecture

#### **Individual Registrations** (BROKEN)
```sql
-- INTENDED: masonic_profiles table + attendees.masonic_status JSONB
-- ACTUAL: Only registration_data JSONB (data loss)
Status: ❌ BROKEN - No masonic persistence
```

#### **Delegation Registrations** (PARTIAL)
```sql
-- CURRENT: Only attendees.masonic_status JSONB
-- MISSING: masonic_profiles table records
Status: 🟡 PARTIAL - JSONB only, no normalization
```

#### **Lodge Registrations** (MINIMAL)
```sql
-- CURRENT: Organization-level lodge data only
-- MISSING: Individual member masonic profiles
Status: 🔴 MINIMAL - No individual masonic data
```

### Data Storage Pattern Inconsistency

**Storage Pattern Comparison**:
```sql
-- Pattern 1: Normalized + JSONB (INTENDED but broken)
masonic_profiles table: ❌ Not created
attendees.masonic_status: ❌ Not populated
registration_data JSONB: ✅ Raw dump only

-- Pattern 2: JSONB Only (CURRENT delegation)
masonic_profiles table: ❌ Not created  
attendees.masonic_status: ✅ Populated
registration_data JSONB: ✅ Raw dump

-- Pattern 3: Minimal (CURRENT lodge)
masonic_profiles table: ❌ Not applicable
attendees.masonic_status: ❌ Not populated
organisation data: ✅ Lodge details only
```

## Root Cause Analysis

### 1. **Evolution Without Unification**
Different registration types were developed at different times with different approaches:
- Individual: Comprehensive design (broken in implementation)
- Delegation: Pragmatic JSONB approach
- Lodge: Organizational focus without individual profiles

### 2. **Incomplete Migration Strategy**
- Comprehensive individual registration function exists but was replaced with "basic working" version
- Delegation registration never implemented normalized storage
- Lodge registration scope doesn't include individual masonic data

### 3. **Missing Architectural Standards**
No defined standards for:
- When to use normalized vs JSONB storage
- How to maintain consistency between storage methods
- Validation rules across registration types
- Performance optimization strategies

## Evidence Files

**Individual Registration**:
- `/supabase/migrations/20250608000037_basic_working_registration.sql` (broken)
- `/supabase/migrations/20250607000100_comprehensive_individual_registration.sql` (comprehensive but disabled)

**Delegation Registration**:
- `/supabase/migrations/20250608000016_create_delegation_registration_rpc.sql` (JSONB only)
- `/api/registrations/delegation/route.ts`

**Lodge Registration**:
- `/api/registrations/lodge/route.ts` (minimal masonic data)

## Why This Blocks FK Relationships Implementation

### 1. **No Universal Data Target**
Cannot create `attendees.masonic_profile_id` FK when:
- Individual attendees: No masonic_profiles created
- Delegation attendees: No masonic_profiles created  
- Lodge attendees: No individual masonic data

### 2. **Inconsistent Query Patterns**
```sql
-- Current reality requires different queries per registration type:

-- Individual attendees (when fixed):
SELECT a.*, mp.* FROM attendees a 
JOIN contacts c ON a.contact_id = c.contact_id
JOIN masonic_profiles mp ON c.contact_id = mp.contact_id

-- Delegation attendees:
SELECT a.*, a.masonic_status::jsonb FROM attendees a 
WHERE registration_type = 'delegation'

-- Lodge attendees:
SELECT a.*, o.organisation_name FROM attendees a
JOIN organisations o ON a.organisation_id = o.organisation_id
```

### 3. **Migration Complexity**
Cannot design unified FK migrations when source data patterns are inconsistent:
- Some attendees will have masonic_profiles to reference
- Others will only have JSONB data
- Others will have no individual masonic data

### 4. **Test Coverage Impossible**
Cannot write comprehensive tests for FK relationships when different registration types have completely different data storage patterns.

## Required Outcomes to Unblock

### ✅ **Architectural Unification Required**

#### **Phase 1: Fix Individual Registrations**
1. Restore comprehensive individual registration RPC
2. Ensure masonic_profiles creation for all mason attendees
3. Maintain both normalized and JSONB storage

#### **Phase 2: Enhance Delegation Registrations**  
1. Add masonic_profiles creation to delegation RPC
2. Maintain existing JSONB storage for compatibility
3. Link delegation attendees to normalized profiles

#### **Phase 3: Define Lodge Registration Scope**
1. Determine if lodge registrations should capture individual masonic profiles
2. If yes: Add individual masonic profile capture
3. If no: Document scope limitations

#### **Phase 4: Establish Unified Standards**
1. Define when to use normalized vs JSONB storage
2. Establish consistency validation rules
3. Create performance optimization guidelines
4. Document architectural decisions

### 📋 **Specific Technical Requirements**

#### **Unified Storage Pattern**:
```sql
-- Target architecture for ALL registration types:
masonic_profiles table: ✅ Normalized masonic data
attendees.masonic_status: ✅ JSONB performance cache
attendees.masonic_profile_id: ✅ FK to normalized data (NEW)
contacts.masonic_profile_id: ✅ Bidirectional FK (NEW)
```

#### **Consistent API Behavior**:
```typescript
// All registration types should return:
{
  attendees: [{
    attendee_id: "uuid",
    contact_id: "uuid", 
    masonic_profile_id: "uuid", // NEW - consistent across all types
    masonic_status: { /* JSONB cache */ }
  }]
}
```

#### **Validation Rules**:
```sql
-- Constraints that apply to ALL registration types:
CHECK (attendee_type = 'mason' OR masonic_profile_id IS NULL)
CHECK (masonic_profile_id IS NULL OR contact_id IS NOT NULL)
FOREIGN KEY (masonic_profile_id) REFERENCES masonic_profiles(masonic_profile_id)
```

### 🎯 **Success Criteria**
1. All registration types create masonic_profiles for mason attendees
2. Consistent FK relationships across all attendee records
3. Unified query patterns for masonic data access
4. Comprehensive test coverage for all registration types
5. Performance benchmarks meet requirements

## Dependencies
- **Requires**: BUG-001 resolution (individual registration fix)
- **Requires**: BUG-002 resolution (delegation registration enhancement)
- **Requires**: BUG-003 resolution (design decisions)
- **Blocks**: FK relationship implementation
- **Blocks**: Unified masonic data querying

## Timeline Impact
**BLOCKING**: Cannot implement FK relationships until architectural consistency is achieved across all registration types. Estimated to require 2-3 days after other bugs are resolved, as this requires coordinated changes across multiple registration systems.