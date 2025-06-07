# BUG REPORT: Masonic Profile Relationship Design Ambiguity

## Bug ID: BUG-003
**Severity**: 🟠 **MEDIUM** - Design ambiguity blocking implementation  
**Priority**: P1 - BLOCKING  
**Component**: Database Schema Design  
**Discovered**: 2025-06-07  
**Reporter**: System Analysis  

## Summary
The requirements for adding masonic profile FK relationships to contacts and attendees tables contain multiple ambiguous specifications that could lead to conflicting implementations, data inconsistency, and performance issues. Critical design decisions are undefined.

## Impact Assessment
- **Implementation Risk**: Multiple valid interpretations could lead to wrong solution
- **Data Integrity Risk**: Unclear relationship rules could create inconsistent data states
- **Performance Risk**: Bidirectional relationships without clear access patterns
- **Maintenance Risk**: Ambiguous requirements lead to technical debt

## Technical Analysis

### Current Database State (CONFIRMED)
```sql
-- Existing relationship (ONE-TO-ONE):
masonic_profiles.contact_id → contacts.contact_id ✅

-- Proposed additions (AMBIGUOUS):
contacts.masonic_profile_id → masonic_profiles.masonic_profile_id ❓
attendees.masonic_profile_id → masonic_profiles.masonic_profile_id ❓
```

### Design Ambiguities Requiring Resolution

#### 1. **Bidirectional Relationship Necessity**
**AMBIGUOUS**: Why add `contacts.masonic_profile_id` when `masonic_profiles.contact_id` already provides the relationship?

**Possible Interpretations**:
- A) Performance optimization for reverse lookups
- B) Different business logic requiring bidirectional access
- C) Data migration convenience
- D) Architectural preference

**Risk**: Adding unnecessary FK could create:
- Data synchronization issues
- Circular dependency constraints
- Increased storage overhead
- Complex update logic

#### 2. **Attendees Access Pattern**
**AMBIGUOUS**: How should attendees access masonic profiles?

**Option A**: Indirect via contacts
```sql
attendees → contacts → masonic_profiles
```

**Option B**: Direct FK relationship
```sql
attendees → masonic_profiles (bypassing contacts)
```

**Option C**: Dual access paths
```sql
attendees → contacts → masonic_profiles
attendees → masonic_profiles (direct)
```

**Risk**: Wrong choice impacts:
- Query performance
- Data consistency rules
- Migration complexity
- Application logic

#### 3. **Data Consistency Rules**
**AMBIGUOUS**: How to handle inconsistent states?

**Scenario 1**: Attendee has contact_id but contact has no masonic_profile
```sql
attendees.contact_id = 'uuid-1'
contacts.masonic_profile_id = NULL
-- Should attendee.masonic_profile_id be NULL or allowed to point elsewhere?
```

**Scenario 2**: Attendee has both contact_id and masonic_profile_id pointing to different profiles
```sql
attendees.contact_id → contact_A → masonic_profile_X
attendees.masonic_profile_id → masonic_profile_Y
-- Which is authoritative? How to prevent this state?
```

**Risk**: Undefined consistency rules lead to:
- Corrupted data relationships
- Conflicting query results
- Application errors

#### 4. **Attendees Without Contacts**
**AMBIGUOUS**: Current attendees table allows `contact_id = NULL`

**Questions**:
- Can attendees without contacts have masonic profiles?
- Should masonic profiles always require contact records?
- How to handle legacy attendees without contacts?

**Risk**: Wrong approach could:
- Break existing data
- Violate business rules
- Create orphaned records

#### 5. **Masonic Profile Creation Rules**
**AMBIGUOUS**: When should masonic_profiles be created?

**Options**:
- A) Only for `attendee_type = 'mason'`
- B) Any attendee with masonic data (regardless of type)
- C) Manual creation only
- D) Based on registration type

**Risk**: Wrong rules could:
- Miss required profiles
- Create unnecessary profiles
- Inconsistent behavior

## Why This Blocks Implementation

### 1. **Cannot Write PRD Without Clarification**
Product Requirements Document requires specific:
- Relationship cardinality definitions
- Data consistency rules
- Access pattern specifications
- Performance requirements

### 2. **Test-Driven Development Impossible**
Cannot write tests without knowing:
- Expected input/output pairs
- Constraint violation scenarios
- Data validation rules
- Error handling requirements

### 3. **Migration Risk**
Database migrations require exact:
- Column specifications
- Constraint definitions
- Data migration logic
- Rollback procedures

### 4. **API Impact Unknown**
Registration APIs need defined:
- FK population logic
- Relationship validation
- Error handling
- Performance characteristics

## Required Outcomes to Unblock

### ✅ **Critical Decisions Needed**

#### **Decision 1: Bidirectional Relationship Justification**
**Question**: What specific use case requires `contacts.masonic_profile_id` when `masonic_profiles.contact_id` exists?
**Options**: 
- A) Performance optimization only
- B) Business logic requirement
- C) Not needed (use existing relationship)

#### **Decision 2: Attendees Access Pattern**
**Question**: How should attendees access masonic profiles?
**Options**:
- A) Via contacts only: `attendees → contacts → masonic_profiles`
- B) Direct FK: `attendees.masonic_profile_id → masonic_profiles`
- C) Both paths available

#### **Decision 3: Data Consistency Rules**
**Question**: What are the consistency rules for multiple FK paths?
**Required**:
- Constraint definitions
- Validation logic
- Conflict resolution rules

#### **Decision 4: Attendees Without Contacts**
**Question**: Can attendees have masonic profiles without contact records?
**Options**:
- A) Always require contacts first
- B) Allow direct masonic profiles
- C) Hybrid approach

#### **Decision 5: Creation Triggers**
**Question**: When should masonic_profiles be automatically created?
**Required**:
- Specific attendee_type rules
- Registration type behavior
- Manual vs automatic creation

### 📋 **Deliverables to Unblock**
1. **Explicit answers** to all 5 decision points above
2. **Business justification** for bidirectional relationships
3. **Data consistency specification** with constraint rules
4. **Access pattern documentation** with performance requirements
5. **Creation rule specification** with triggering conditions

### 🎯 **Format for Decisions**
Please provide answers in this format:
```
DECISION 1: [A/B/C] - [Justification]
DECISION 2: [A/B/C] - [Rationale]  
DECISION 3: [Specific rules and constraints]
DECISION 4: [A/B/C] - [Business reasoning]
DECISION 5: [Specific triggers and conditions]
```

## Dependencies
- **Blocks**: PRD creation
- **Blocks**: Database migration design
- **Blocks**: Test specification
- **Blocks**: API implementation
- **Requires**: Business stakeholder input on relationship requirements

## Timeline Impact
**BLOCKING**: Cannot proceed with any implementation until design ambiguities are resolved through explicit stakeholder decisions. Estimated to block implementation until decisions are provided.