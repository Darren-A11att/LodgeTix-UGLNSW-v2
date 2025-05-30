# TODO: Create Data Adapter Layer

## Overview
Create adapter functions to transform database data to match application expectations and handle naming differences.

## Adapters to Create

### 1. Event Adapter
**File**: `lib/adapters/event-adapter.ts`
- [ ] Transform database event to display format
- [ ] Compute location string from location table
- [ ] Add computed fields (minPrice, isSoldOut)
- [ ] Handle parent/child URL construction
- [ ] Format dates for display

### 2. Registration Adapter  
**File**: `lib/adapters/registration-adapter.ts`
- [ ] Map contact_id to customer_id for legacy code
- [ ] Transform British to American spellings if needed
- [ ] Flatten nested data structures
- [ ] Add computed summary fields

### 3. Attendee Adapter
**File**: `lib/adapters/attendee-adapter.ts`
- [ ] Handle partner relationships
- [ ] Merge masonic profile data
- [ ] Transform contact preferences
- [ ] Format names with titles

### 4. Ticket Adapter
**File**: `lib/adapters/ticket-adapter.ts`
- [ ] Map database status to UI status
- [ ] Calculate display prices
- [ ] Add eligibility status
- [ ] Format for selection UI

### 5. Organization Adapter
**File**: `lib/adapters/organization-adapter.ts`
- [ ] Handle organisation vs organization spelling
- [ ] Merge grand lodge data
- [ ] Format for dropdowns

## Adapter Patterns

### Input Validation
- [ ] Validate required fields exist
- [ ] Handle null/undefined gracefully  
- [ ] Provide sensible defaults

### Error Handling
- [ ] Log transformation errors
- [ ] Return partial data if possible
- [ ] Include error indicators

### Type Safety
- [ ] Define input types from database
- [ ] Define output types for UI
- [ ] Use strict TypeScript

### Performance
- [ ] Minimize object creation
- [ ] Use memoization where appropriate
- [ ] Batch transformations

## Integration Points
- [ ] Update API routes to use adapters
- [ ] Update components to expect adapted data
- [ ] Create inverse adapters for saves
- [ ] Add adapter tests

## Testing Strategy
- [ ] Unit test each adapter function
- [ ] Test with missing fields
- [ ] Test with extra fields
- [ ] Verify type safety
- [ ] Performance benchmarks