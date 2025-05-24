# Issue: Inconsistent UUID Validation in API Endpoints

**Status:** 🟡 YELLOW  
**Severity:** Medium  
**Category:** API Validation

## Problem Description
API endpoints have inconsistent validation for UUID parameters, with some endpoints properly validating while others accept any string, potentially causing database errors.

## Evidence
- `POST /api/registrations` - ✅ Validates UUID format
- `GET /api/registrations/[id]` - ❌ No UUID validation
- `PUT /api/registrations/[id]/payment` - ✅ Validates UUID
- `GET /api/registrations/[id]/verify-payment` - ❌ No validation
- Different error handling approaches across endpoints

## Impact
- Database errors when invalid UUIDs are passed
- Inconsistent error messages for users
- Potential security issues with malformed inputs
- Harder to debug issues in production

## Root Cause
Validation was added ad-hoc as issues arose, rather than implementing a consistent validation strategy across all endpoints.

## Fix Plan

### Immediate Action
1. Add UUID validation to GET endpoints:
```typescript
// GET /api/registrations/[id]/route.ts
if (!isValidUUID(params.id)) {
  return NextResponse.json(
    { error: 'Invalid registration ID format' },
    { status: 400 }
  );
}
```

### Long-term Solution
1. Create shared validation middleware:
```typescript
// lib/api/validation.ts
export function validateUUID(value: string, fieldName: string) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(value)) {
    throw new ValidationError(`Invalid ${fieldName}: must be a valid UUID`);
  }
}
```

2. Apply consistently across all endpoints
3. Standardize error response format
4. Add request validation middleware

## Verification Steps
```bash
# Test with invalid IDs
curl -X GET https://yourdomain.vercel.app/api/registrations/invalid-id
curl -X GET https://yourdomain.vercel.app/api/registrations/123
curl -X GET https://yourdomain.vercel.app/api/registrations/null

# Should all return 400 Bad Request with clear error message
```