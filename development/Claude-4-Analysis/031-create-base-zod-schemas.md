# Task 031: Create Base Zod Schemas

**Priority**: High  
**Category**: Input Validation  
**Dependencies**: None  
**Estimated Time**: 3 hours  

## Problem

The application lacks comprehensive input validation, especially on API endpoints. This creates security vulnerabilities and potential for data corruption:
- No validation on registration data
- Missing validation on payment amounts
- Unvalidated user inputs can cause runtime errors
- Inconsistent validation between client and server

## Solution

Create a comprehensive set of Zod schemas for all data types, enabling:
- Runtime type validation
- Automatic TypeScript type inference
- Consistent validation across client and server
- Clear error messages

## Implementation Steps

### 1. Create Base Schema Directory

```bash
mkdir -p lib/schemas
```

### 2. Core Schemas

Create `lib/schemas/common.ts`:

```typescript
import { z } from 'zod';

/**
 * Common schemas used across the application
 */

// Email validation
export const emailSchema = z
  .string()
  .email('Invalid email address')
  .toLowerCase()
  .trim();

// Phone validation (international format)
export const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
  .optional();

// UUID validation
export const uuidSchema = z
  .string()
  .uuid('Invalid UUID format');

// Positive integer
export const positiveIntSchema = z
  .number()
  .int('Must be a whole number')
  .positive('Must be greater than 0');

// Money amount (in cents)
export const moneyAmountSchema = z
  .number()
  .int('Amount must be in cents')
  .min(0, 'Amount cannot be negative')
  .max(99999999, 'Amount too large'); // $999,999.99 max

// Date string (ISO format)
export const dateStringSchema = z
  .string()
  .datetime('Invalid date format');

// URL validation
export const urlSchema = z
  .string()
  .url('Invalid URL format');

// Safe string (no XSS)
export const safeStringSchema = z
  .string()
  .trim()
  .min(1, 'Cannot be empty')
  .max(255, 'Too long')
  .regex(/^[^<>'"]*$/, 'Contains invalid characters');

// Pagination
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// Address
export const addressSchema = z.object({
  line1: z.string().min(1, 'Address line 1 is required'),
  line2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  postalCode: z.string().min(1, 'Postal code is required'),
  country: z.string().length(2, 'Country must be 2-letter code'),
});
```

### 3. Attendee Schemas

Create `lib/schemas/attendee.ts`:

```typescript
import { z } from 'zod';
import { emailSchema, phoneSchema, safeStringSchema } from './common';

// Attendee types enum
export const attendeeTypeSchema = z.enum([
  'mason',
  'guest',
  'ladypartner',
  'guestpartner'
]);

// Contact preference enum
export const contactPreferenceSchema = z.enum([
  'directly',
  'primaryattendee',
  'mason',
  'guest',
  'providelater'
]);

// Mason rank enum
export const masonRankSchema = z.enum([
  'EA',
  'FC',
  'MM',
  'WM',
  'PM',
  'GrandOfficer',
  'PGM',
  'Other'
]);

// Base attendee schema
const baseAttendeeSchema = z.object({
  attendeeId: z.string().uuid().optional(),
  title: safeStringSchema,
  firstName: safeStringSchema,
  lastName: safeStringSchema,
  primaryEmail: emailSchema.optional(),
  primaryPhone: phoneSchema.optional(),
  dietaryRequirements: z.string().max(500).optional(),
  specialNeeds: z.string().max(500).optional(),
  contactPreference: contactPreferenceSchema,
  agreeToTerms: z.boolean(),
});

// Mason-specific schema
export const masonSchema = baseAttendeeSchema.extend({
  attendeeType: z.literal('mason'),
  rank: masonRankSchema,
  grandLodgeId: z.string().uuid(),
  lodgeId: z.string().uuid(),
  lodgeNameNumber: z.string().optional(),
  isGrandOfficer: z.boolean().default(false),
  grandOfficerTitle: z.string().optional(),
});

// Guest-specific schema
export const guestSchema = baseAttendeeSchema.extend({
  attendeeType: z.literal('guest'),
  guestOf: z.string().uuid().optional(),
});

// Partner schemas
export const partnerSchema = baseAttendeeSchema.extend({
  attendeeType: z.enum(['ladypartner', 'guestpartner']),
  partnerOf: z.string().uuid(),
  relationship: z.string().min(1, 'Relationship is required'),
});

// Union type for any attendee
export const attendeeSchema = z.discriminatedUnion('attendeeType', [
  masonSchema,
  guestSchema,
  partnerSchema,
]);

// Attendee with validation context
export const attendeeWithContextSchema = z.object({
  attendee: attendeeSchema,
  isPrimary: z.boolean(),
  registrationType: z.enum(['individuals', 'lodge', 'delegation']),
});

// Type exports
export type AttendeeType = z.infer<typeof attendeeTypeSchema>;
export type MasonData = z.infer<typeof masonSchema>;
export type GuestData = z.infer<typeof guestSchema>;
export type PartnerData = z.infer<typeof partnerSchema>;
export type AttendeeData = z.infer<typeof attendeeSchema>;
```

### 4. Registration Schemas

Create `lib/schemas/registration.ts`:

```typescript
import { z } from 'zod';
import { attendeeSchema } from './attendee';
import { uuidSchema, moneyAmountSchema, dateStringSchema } from './common';

// Registration type enum
export const registrationTypeSchema = z.enum([
  'individuals',
  'groups',
  'officials',
  'lodge',
  'delegation'
]);

// Registration status enum
export const registrationStatusSchema = z.enum([
  'draft',
  'unpaid',
  'paid',
  'cancelled',
  'refunded'
]);

// Payment status enum
export const paymentStatusSchema = z.enum([
  'pending',
  'completed',
  'failed',
  'refunded',
  'partially_refunded',
  'cancelled',
  'expired'
]);

// Ticket selection
export const ticketSelectionSchema = z.object({
  ticketDefinitionId: uuidSchema,
  attendeeId: uuidSchema,
  quantity: z.number().int().min(1).max(10),
  price: moneyAmountSchema,
});

// Registration request schema
export const registrationRequestSchema = z.object({
  eventId: uuidSchema,
  registrationType: registrationTypeSchema,
  primaryAttendee: attendeeSchema,
  additionalAttendees: z.array(attendeeSchema).default([]),
  tickets: z.array(ticketSelectionSchema).default([]),
  totalAmount: moneyAmountSchema,
  paymentIntentId: z.string().optional(),
  billingDetails: z.object({
    email: z.string().email(),
    name: z.string().min(1),
    phone: z.string().optional(),
    address: z.object({
      line1: z.string().min(1),
      line2: z.string().optional(),
      city: z.string().min(1),
      state: z.string().min(1),
      postal_code: z.string().min(1),
      country: z.string().length(2),
    }),
  }).optional(),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: 'You must agree to the terms and conditions',
  }),
  customerId: uuidSchema,
});

// Registration record schema (database)
export const registrationRecordSchema = z.object({
  registration_id: uuidSchema,
  event_id: uuidSchema,
  customer_id: uuidSchema,
  registration_date: dateStringSchema,
  status: registrationStatusSchema,
  total_amount_paid: moneyAmountSchema,
  payment_status: paymentStatusSchema,
  stripe_payment_intent_id: z.string().nullable(),
  primary_attendee_id: uuidSchema.nullable(),
  registration_type: registrationTypeSchema,
  registration_data: z.record(z.unknown()).nullable(),
  agree_to_terms: z.boolean(),
});

// Type exports
export type RegistrationType = z.infer<typeof registrationTypeSchema>;
export type RegistrationStatus = z.infer<typeof registrationStatusSchema>;
export type PaymentStatus = z.infer<typeof paymentStatusSchema>;
export type RegistrationRequest = z.infer<typeof registrationRequestSchema>;
export type RegistrationRecord = z.infer<typeof registrationRecordSchema>;
```

### 5. API Request/Response Schemas

Create `lib/schemas/api.ts`:

```typescript
import { z } from 'zod';
import { moneyAmountSchema } from './common';

// Stripe payment intent request
export const createPaymentIntentSchema = z.object({
  amount: moneyAmountSchema,
  currency: z.string().length(3, 'Currency must be 3-letter code'),
  idempotencyKey: z.string().optional(),
  metadata: z.record(z.string()).optional(),
});

// Turnstile verification request
export const turnstileVerificationSchema = z.object({
  token: z.string().min(1, 'Turnstile token is required'),
  eventId: z.string().uuid().optional(),
});

// Email confirmation request
export const sendConfirmationEmailSchema = z.object({
  registrationId: z.string().uuid(),
  recipientEmail: z.string().email(),
  recipientName: z.string().min(1),
});

// Generic API response
export const apiResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.object({
      message: z.string(),
      code: z.string().optional(),
      details: z.record(z.unknown()).optional(),
    }).optional(),
    timestamp: z.string().datetime(),
  });

// Paginated response
export const paginatedResponseSchema = <T extends z.ZodType>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    total: z.number().int().min(0),
    page: z.number().int().min(1),
    limit: z.number().int().min(1),
    hasMore: z.boolean(),
  });
```

### 6. Validation Utilities

Create `lib/schemas/utils.ts`:

```typescript
import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Validate request body against schema
 */
export async function validateRequestBody<T extends z.ZodType>(
  request: NextRequest,
  schema: T
): Promise<
  | { success: true; data: z.infer<T> }
  | { success: false; error: NextResponse }
> {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      return {
        success: false,
        error: NextResponse.json(
          {
            error: 'Validation failed',
            details: result.error.format(),
          },
          { status: 400 }
        ),
      };
    }

    return { success: true, data: result.data };
  } catch (error) {
    return {
      success: false,
      error: NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      ),
    };
  }
}

/**
 * Validate query parameters
 */
export function validateQueryParams<T extends z.ZodType>(
  searchParams: URLSearchParams,
  schema: T
): z.infer<T> | null {
  const params = Object.fromEntries(searchParams.entries());
  const result = schema.safeParse(params);
  return result.success ? result.data : null;
}

/**
 * Create validated API handler
 */
export function createValidatedHandler<T extends z.ZodType>(
  schema: T,
  handler: (data: z.infer<T>, request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const validation = await validateRequestBody(request, schema);
    
    if (!validation.success) {
      return validation.error;
    }

    try {
      return await handler(validation.data, request);
    } catch (error) {
      console.error('Handler error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}
```

### 7. Integration Example

Update API route to use schemas:

```typescript
// app/api/registrations/route.ts
import { createValidatedHandler } from '@/lib/schemas/utils';
import { registrationRequestSchema } from '@/lib/schemas/registration';

export const POST = createValidatedHandler(
  registrationRequestSchema,
  async (data, request) => {
    // data is now fully typed and validated
    const { primaryAttendee, additionalAttendees, totalAmount } = data;
    
    // Process registration...
    
    return NextResponse.json({ success: true });
  }
);
```

## Testing

Create `lib/schemas/__tests__/schemas.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { attendeeSchema, masonSchema } from '../attendee';

describe('Attendee Schemas', () => {
  it('validates mason data correctly', () => {
    const validMason = {
      attendeeType: 'mason',
      title: 'Mr',
      firstName: 'John',
      lastName: 'Doe',
      rank: 'MM',
      grandLodgeId: '123e4567-e89b-12d3-a456-426614174000',
      lodgeId: '123e4567-e89b-12d3-a456-426614174001',
      contactPreference: 'directly',
      primaryEmail: 'john@example.com',
      agreeToTerms: true,
    };

    const result = masonSchema.safeParse(validMason);
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const invalidData = {
      attendeeType: 'guest',
      primaryEmail: 'not-an-email',
      // ... other fields
    };

    const result = attendeeSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toContain('email');
  });
});
```

## Benefits

1. **Type Safety**: Automatic TypeScript types from schemas
2. **Runtime Validation**: Catch invalid data before processing
3. **Security**: Prevent injection attacks and malformed data
4. **Documentation**: Schemas serve as API documentation
5. **Error Messages**: Clear, consistent validation errors

## Next Steps

1. Implement schemas in all API routes (Task 032-033)
2. Add client-side validation using same schemas
3. Generate OpenAPI documentation from schemas
4. Add schema versioning for backwards compatibility