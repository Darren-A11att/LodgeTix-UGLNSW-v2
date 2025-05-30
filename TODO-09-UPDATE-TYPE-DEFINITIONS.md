# TODO: Update TypeScript Type Definitions

## Overview
Update all TypeScript interfaces and types to match the actual database schema and ensure type safety throughout the application.

## Type Definition Updates

### 1. Database Types
**File**: `database.types.ts` (auto-generated)
- [ ] Run Supabase type generation after schema changes
- [ ] Verify all tables included
- [ ] Check view types are generated
- [ ] Ensure RPC function types exist

### 2. Application Types
**Files**: `shared/types/*.ts`

#### Registration Types
- [ ] Change `customer_id` to `contact_id`
- [ ] Update `organization_id` to `organisation_id`
- [ ] Add missing fields from database
- [ ] Remove fields that don't exist

#### Event Types  
- [ ] Add `organiser_id` (British spelling)
- [ ] Add computed fields interface
- [ ] Update location type structure
- [ ] Add view result types

#### Attendee Types
- [ ] Fix `is_partner` type (string → boolean)
- [ ] Add masonic profile relationship
- [ ] Update contact preference enum
- [ ] Add partner relationship type

### 3. API Response Types
**File**: `lib/api/types.ts` (create if needed)
- [ ] Define view response types
- [ ] Define RPC function returns
- [ ] Create paginated response types
- [ ] Add error response types

### 4. Component Props Types
- [ ] Update props to match new data structures
- [ ] Add loading and error states
- [ ] Define callback signatures
- [ ] Add generic list/detail types

## Type Safety Improvements

### 1. Strict Null Checks
- [ ] Enable strict null checks
- [ ] Handle nullable fields properly
- [ ] Add null guards where needed
- [ ] Update optional field syntax

### 2. Discriminated Unions
- [ ] Create type guards for registration types
- [ ] Add attendee type discriminators
- [ ] Payment status type unions
- [ ] Event hierarchy types

### 3. Utility Types
```typescript
// Create common utility types
type WithTimestamps<T> = T & {
  created_at: string;
  updated_at: string;
}

type WithId<T> = T & {
  id: string;
}

type ApiResponse<T> = {
  data: T | null;
  error: Error | null;
}
```

### 4. Validation Schemas
- [ ] Create Zod schemas matching types
- [ ] Add runtime validation
- [ ] Generate types from schemas
- [ ] Add form validation types

## Migration Strategy

### 1. Gradual Migration
- [ ] Add new types alongside old
- [ ] Deprecate old types
- [ ] Update imports incrementally
- [ ] Remove old types when safe

### 2. Type Guards
```typescript
// Add type guards for safety
function isRegistration(obj: any): obj is Registration {
  return obj && typeof obj.registration_id === 'string';
}
```

### 3. Testing Types
- [ ] Add type tests
- [ ] Check compile-time errors
- [ ] Verify runtime behavior
- [ ] Test edge cases

## Documentation
- [ ] Document type changes
- [ ] Add JSDoc comments
- [ ] Create migration guide
- [ ] Update API documentation

## Tooling Setup
- [ ] Configure type generation scripts
- [ ] Add pre-commit type checks
- [ ] Set up type coverage reporting
- [ ] Add type linting rules