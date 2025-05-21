# Testing Strategy for Supabase Order Submission

## Overview

This document outlines a comprehensive testing strategy for the Supabase order submission integration. A thorough testing approach is essential to ensure the reliability, performance, and error resilience of the registration process.

## Testing Layers

We will implement testing across multiple layers:

1. **Unit Testing**: Testing individual functions and components in isolation
2. **Integration Testing**: Testing interactions between components
3. **End-to-End Testing**: Testing the complete user flow
4. **Performance Testing**: Testing system performance under load
5. **Security Testing**: Testing for potential security vulnerabilities

## 1. Unit Testing

### Unit Test Scope

Unit tests will cover:

- Validation functions
- Data mapping functions
- Helper utilities
- Individual React components (with mocked contexts/hooks)

### Key Unit Test Areas

#### Registration Validation Tests

Test the validation logic in `/lib/api/registration-validation.ts`:

```typescript
// Example test file: /lib/api/registration-validation.test.ts
import { validateRegistrationSubmission } from './registration-validation';

describe('Registration Validation', () => {
  test('Valid registration passes validation', () => {
    const validData = {
      attendees: [
        {
          attendeeId: '123e4567-e89b-12d3-a456-426614174000',
          attendeeType: 'Mason',
          isPrimary: true,
          isPartner: null,
          title: 'Mr',
          firstName: 'John',
          lastName: 'Doe',
          primaryEmail: 'john@example.com',
          // ... other required fields
        }
      ],
      tickets: {
        total: 100,
        subtotal: 90,
        bookingFee: 10,
        ticketAssignments: {
          '123e4567-e89b-12d3-a456-426614174000': '987e6543-e21b-12d3-a456-426614174000'
        }
      },
      event: {
        id: '654e3210-e89b-12d3-a456-426614174000',
        name: 'Grand Installation'
      },
      paymentIntentId: 'pi_123456789',
      amount: 100,
      registrationType: 'individual',
      agreeToTerms: true
    };
    
    const result = validateRegistrationSubmission(validData);
    expect(result.success).toBe(true);
  });
  
  test('Missing required fields fails validation', () => {
    const invalidData = {
      // Missing attendees
      tickets: { /* ... */ },
      event: { /* ... */ },
      paymentIntentId: 'pi_123456789',
      amount: 100,
      registrationType: 'individual',
      agreeToTerms: true
    };
    
    const result = validateRegistrationSubmission(invalidData);
    expect(result.success).toBe(false);
    expect(result.error.issues.some(i => i.path.includes('attendees'))).toBe(true);
  });
  
  test('Invalid attendee data fails validation', () => {
    const invalidData = {
      attendees: [
        {
          attendeeId: '123e4567-e89b-12d3-a456-426614174000',
          attendeeType: 'Mason',
          isPrimary: true,
          isPartner: null,
          title: 'Mr',
          // Missing firstName
          lastName: 'Doe',
          // Missing primaryEmail for primary attendee
        }
      ],
      // ... other required fields
    };
    
    const result = validateRegistrationSubmission(invalidData);
    expect(result.success).toBe(false);
    expect(result.error.issues.some(i => i.path.includes('firstName'))).toBe(true);
  });
  
  // Add more specific validation test cases...
});
```

#### Client Service Tests

Test the registration service in `/lib/services/registration-service.ts`:

```typescript
// Example test file: /lib/services/registration-service.test.ts
import { submitRegistration, RegistrationSubmissionError } from './registration-service';
import fetchMock from 'jest-fetch-mock';

// Setup
beforeAll(() => {
  fetchMock.enableMocks();
});

afterEach(() => {
  fetchMock.resetMocks();
});

describe('Registration Service', () => {
  test('Successfully submits registration', async () => {
    // Mock successful API response
    fetchMock.mockResponseOnce(JSON.stringify({
      success: true,
      registrationId: '123e4567-e89b-12d3-a456-426614174000',
      confirmationNumber: 'LT-123456-7890'
    }));
    
    const validData = {
      // Valid test data
    };
    
    const result = await submitRegistration(validData);
    
    expect(result.success).toBe(true);
    expect(result.registrationId).toBeDefined();
    expect(result.confirmationNumber).toBeDefined();
    
    // Verify fetch was called correctly
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/registrations',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        })
      })
    );
  });
  
  test('Handles validation errors from server', async () => {
    fetchMock.mockResponseOnce(
      JSON.stringify({
        success: false,
        error: 'Invalid registration data',
        details: { 'attendees[0].firstName': 'First name is required' }
      }),
      { status: 400 }
    );
    
    const invalidData = {
      // Invalid test data
    };
    
    await expect(submitRegistration(invalidData))
      .rejects
      .toThrow(RegistrationSubmissionError);
  });
  
  test('Retries on network errors', async () => {
    // Mock a transient error, then success
    fetchMock
      .mockRejectOnce(new TypeError('Failed to fetch'))
      .mockResponseOnce(JSON.stringify({
        success: true,
        registrationId: '123e4567-e89b-12d3-a456-426614174000',
        confirmationNumber: 'LT-123456-7890'
      }));
    
    const validData = {
      // Valid test data
    };
    
    const result = await submitRegistration(validData);
    
    expect(result.success).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
  
  test('Handles timeouts', async () => {
    // Configure jest to control timers
    jest.useFakeTimers();
    
    // Setup a fetch that never resolves
    fetchMock.mockResponse(() => new Promise(resolve => {
      // This promise intentionally never resolves
    }));
    
    const submitPromise = submitRegistration({
      // Valid test data
    });
    
    // Advance timers to trigger timeout
    jest.advanceTimersByTime(31000);
    
    await expect(submitPromise)
      .rejects
      .toThrow('Registration request timed out');
    
    jest.useRealTimers();
  });
  
  // Add more service test cases...
});
```

#### React Component Tests

Test the Payment and Confirmation step components:

```typescript
// Example test file: /components/register/RegistrationWizard/Steps/PaymentStepUpdated.test.tsx
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { PaymentStep } from './PaymentStepUpdated';
import { useRegistrationStore } from '@/lib/registrationStore';
import { submitRegistration } from '@/lib/services/registration-service';

// Mock dependencies
jest.mock('@/lib/registrationStore');
jest.mock('@/lib/services/registration-service');
jest.mock('@stripe/react-stripe-js', () => ({
  useStripe: () => ({ /* mock stripe */ }),
  useElements: () => ({ /* mock elements */ }),
  CardElement: () => <div data-testid="card-element" />
}));

describe('PaymentStep', () => {
  beforeEach(() => {
    // Setup mock store data
    (useRegistrationStore as jest.Mock).mockReturnValue({
      attendees: [{ /* mock attendee */ }],
      tickets: { /* mock tickets */ },
      event: { /* mock event */ },
      setPaymentStatus: jest.fn()
    });
    
    // Setup mock submitRegistration
    (submitRegistration as jest.Mock).mockResolvedValue({
      success: true,
      registrationId: 'test-id',
      confirmationNumber: 'TEST-123'
    });
  });
  
  test('Renders payment form correctly', () => {
    render(<PaymentStep onNext={jest.fn()} onBack={jest.fn()} />);
    
    expect(screen.getByText(/Billing Information/i)).toBeInTheDocument();
    expect(screen.getByText(/Payment Method/i)).toBeInTheDocument();
    expect(screen.getByTestId('card-element')).toBeInTheDocument();
  });
  
  test('Handles payment success', async () => {
    const onNextMock = jest.fn();
    
    render(<PaymentStep onNext={onNextMock} onBack={jest.fn()} />);
    
    // Simulate payment success
    const submitButton = screen.getByRole('button', { name: /Pay/i });
    fireEvent.click(submitButton);
    
    // Wait for success state
    await waitFor(() => {
      expect(useRegistrationStore().setPaymentStatus).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'completed' })
      );
      expect(submitRegistration).toHaveBeenCalled();
      expect(onNextMock).toHaveBeenCalled();
    });
  });
  
  test('Handles payment errors', async () => {
    (submitRegistration as jest.Mock).mockRejectedValue(
      new Error('Payment processing failed')
    );
    
    render(<PaymentStep onNext={jest.fn()} onBack={jest.fn()} />);
    
    // Simulate payment attempt
    const submitButton = screen.getByRole('button', { name: /Pay/i });
    fireEvent.click(submitButton);
    
    // Wait for error state
    await waitFor(() => {
      expect(screen.getByText(/Payment processing failed/i)).toBeInTheDocument();
      expect(useRegistrationStore().setPaymentStatus).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'failed' })
      );
    });
  });
  
  // Add more component test cases...
});
```

## 2. Integration Testing

### Integration Test Scope

Integration tests will verify the interaction between:
- Client-side services and API endpoints
- API routes and database operations
- Payment process and registration submission

### API Route Integration Tests

Test the API route with a test database:

```typescript
// Example test file: /app/api/registrations/route.test.ts
import { POST } from './route';
import { createClient } from '@supabase/supabase-js';
import { mockSetCookie, mockGetCookie } from '../../../../test/mockCookies';

// Create a test Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Setup test data
const testPayload = {
  // Valid test registration data
};

describe('Registration API Route', () => {
  beforeAll(async () => {
    // Set up test database state
    // This could be a separate test database or transaction-wrapped tests
  });
  
  afterAll(async () => {
    // Clean up test data
  });
  
  test('Successfully creates a registration', async () => {
    // Mock request
    const request = new Request('http://localhost/api/registrations', {
      method: 'POST',
      body: JSON.stringify(testPayload),
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // Call the route handler
    const response = await POST(request);
    
    // Parse response
    const responseData = await response.json();
    
    // Assertions
    expect(response.status).toBe(200);
    expect(responseData.success).toBe(true);
    expect(responseData.registrationId).toBeDefined();
    expect(responseData.confirmationNumber).toBeDefined();
    
    // Verify database state
    const { data: registration } = await supabase
      .from('Registrations')
      .select('*')
      .eq('registrationId', responseData.registrationId)
      .single();
    
    expect(registration).toBeDefined();
    expect(registration!.stripePaymentIntentId).toBe(testPayload.paymentIntentId);
    
    // Verify attendees created
    const { data: attendees } = await supabase
      .from('Attendees')
      .select('*')
      .eq('registrationid', responseData.registrationId);
    
    expect(attendees).toHaveLength(testPayload.attendees.length);
    
    // Verify ticket assignments created
    const { data: ticketAssignments } = await supabase
      .from('attendee_ticket_assignments')
      .select('*')
      .eq('registration_id', responseData.registrationId);
    
    expect(ticketAssignments).toHaveLength(
      Object.keys(testPayload.tickets.ticketAssignments).length
    );
  });
  
  test('Handles validation errors', async () => {
    // Mock request with invalid data
    const request = new Request('http://localhost/api/registrations', {
      method: 'POST',
      body: JSON.stringify({
        // Invalid test data missing required fields
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // Call the route handler
    const response = await POST(request);
    
    // Parse response
    const responseData = await response.json();
    
    // Assertions
    expect(response.status).toBe(400);
    expect(responseData.success).toBe(false);
    expect(responseData.error).toBe('Invalid registration data');
    expect(responseData.details).toBeDefined();
  });
  
  test('Ensures transaction consistency', async () => {
    // Create payload that will fail during processing
    // (e.g., valid format but causes a constraint violation)
    const invalidPayload = {
      // ...testPayload but with data that will fail during processing
    };
    
    // Mock request
    const request = new Request('http://localhost/api/registrations', {
      method: 'POST',
      body: JSON.stringify(invalidPayload),
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // Call the route handler
    const response = await POST(request);
    
    // Parse response
    const responseData = await response.json();
    
    // Assertions
    expect(response.status).toBe(500);
    expect(responseData.success).toBe(false);
    
    // Verify no partial data was saved (transaction rolled back)
    const { data: registrations } = await supabase
      .from('Registrations')
      .select('*')
      .eq('stripePaymentIntentId', invalidPayload.paymentIntentId);
    
    expect(registrations).toHaveLength(0);
  });
  
  // Add more API integration test cases...
});
```

### End-to-End Payment Flow

Test the complete payment and registration flow:

```typescript
// Example test file: /tests/e2e/registration-flow.test.ts
import { test, expect } from '@playwright/test';

// This would typically be part of an e2e testing suite

test('Complete registration flow succeeds', async ({ page }) => {
  // Navigate to event page
  await page.goto('/events/grand-installation');
  
  // Select registration type
  await page.getByRole('button', { name: 'Register Myself' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  
  // Fill attendee details
  await page.getByLabel('First Name').fill('John');
  await page.getByLabel('Last Name').fill('Doe');
  // ... fill other required fields
  await page.getByRole('button', { name: 'Continue' }).click();
  
  // Select tickets
  await page.getByText('General Admission').click();
  await page.getByRole('button', { name: 'Continue' }).click();
  
  // Review order
  await page.getByRole('button', { name: 'Proceed to Payment' }).click();
  
  // Fill payment details
  await page.getByLabel('Card Number').fill('4242424242424242');
  await page.getByLabel('Expiry').fill('12/25');
  await page.getByLabel('CVC').fill('123');
  
  // Complete payment
  await page.getByRole('button', { name: /Pay/ }).click();
  
  // Verify confirmation page
  await expect(page.getByText('Registration Complete!')).toBeVisible();
  await expect(page.getByText(/Confirmation: /)).toBeVisible();
  
  // Verify confirmation number format
  const confirmationText = await page.getByText(/Confirmation: /).textContent();
  expect(confirmationText).toMatch(/LT-\d{6}-\d{4}/);
  
  // Optional: Verify database state if e2e tests have database access
});

test('Payment failure is handled gracefully', async ({ page }) => {
  // Navigate through registration process
  // ...
  
  // Use a card that will be declined
  await page.getByLabel('Card Number').fill('4000000000000002'); // Declined card
  await page.getByLabel('Expiry').fill('12/25');
  await page.getByLabel('CVC').fill('123');
  
  // Attempt payment
  await page.getByRole('button', { name: /Pay/ }).click();
  
  // Verify error is displayed
  await expect(page.getByText(/Your card was declined/)).toBeVisible();
  
  // Verify we're still on payment page
  await expect(page.getByText('Payment Method')).toBeVisible();
});
```

## 3. Performance Testing

### Performance Test Scope

Performance tests will assess:
- API response times under load
- Database transaction throughput
- Client-side rendering performance
- Concurrent registration handling

### Load Testing with Artillery

Example load test script for the registration API:

```yaml
# /tests/performance/registration-api-load.yml
config:
  target: "https://your-app-staging.com"
  phases:
    - duration: 60
      arrivalRate: 5
      name: "Warm up"
    - duration: 120
      arrivalRate: 10
      rampTo: 50
      name: "Ramp up load"
    - duration: 300
      arrivalRate: 50
      name: "Sustained load"
  processor: "./load-test-helpers.js"
  
scenarios:
  - name: "Register with payment"
    flow:
      - function: "generateRegistrationData"
      - post:
          url: "/api/registrations"
          json: "{{ registrationData }}"
          capture:
            - json: "$.registrationId"
              as: "registrationId"
          match:
            - json: "$.success"
              value: true
      - think: 1
      - get:
          url: "/api/registrations/{{ registrationId }}/status"
          match:
            - json: "$.status"
              value: "completed"
```

### Database Transaction Performance

Test transaction performance with varying numbers of attendees and tickets:

```typescript
// Example test file: /tests/performance/database-transaction.test.ts
import { performance } from 'perf_hooks';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_TEST_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_TEST_KEY!
);

// Helper to create test registration data with varying attendee counts
function createTestRegistration(attendeeCount: number) {
  // Create registration with specified number of attendees
}

describe('Registration Transaction Performance', () => {
  const attendeeCounts = [1, 5, 10, 20, 50];
  const iterations = 5;
  
  test.each(attendeeCounts)(
    'Performance with %i attendees',
    async (attendeeCount) => {
      const durations: number[] = [];
      
      for (let i = 0; i < iterations; i++) {
        const testData = createTestRegistration(attendeeCount);
        
        const start = performance.now();
        
        // Call the registration function
        await supabase.rpc('create_complete_registration', {
          p_registration_data: testData.registration,
          p_attendees: testData.attendees,
          p_ticket_assignments: testData.ticketAssignments
        });
        
        const end = performance.now();
        durations.push(end - start);
      }
      
      const avgDuration = durations.reduce((sum, d) => sum + d, 0) / iterations;
      console.log(`Average duration with ${attendeeCount} attendees: ${avgDuration.toFixed(2)}ms`);
      
      // Set reasonable performance expectations
      expect(avgDuration).toBeLessThan(attendeeCount * 100); // Example threshold
    }
  );
});
```

## 4. Security Testing

### Security Test Scope

Security tests will check:
- Input validation and sanitization
- Authentication and authorization
- SQL injection prevention
- Cross-site scripting protection
- Sensitive data handling

### Input Validation Tests

Test for potential injection and malicious inputs:

```typescript
// Example test file: /tests/security/registration-security.test.ts
import { validateRegistrationSubmission } from '@/lib/api/registration-validation';

describe('Registration Security Validation', () => {
  test('Rejects SQL injection attempts', () => {
    const maliciousData = {
      attendees: [{
        attendeeId: '123e4567-e89b-12d3-a456-426614174000',
        attendeeType: 'Mason',
        isPrimary: true,
        firstName: "Robert'); DROP TABLE Registrations; --",
        lastName: '<script>alert("XSS")</script>',
        // ... other required fields
      }],
      // ... other required fields
    };
    
    const result = validateRegistrationSubmission(maliciousData);
    
    // Should fail validation or sanitize inputs
    expect(result.success).toBe(false);
  });
  
  test('Handles oversized input data', () => {
    const oversizedData = {
      attendees: [{
        attendeeId: '123e4567-e89b-12d3-a456-426614174000',
        attendeeType: 'Mason',
        isPrimary: true,
        firstName: 'A'.repeat(10000),
        lastName: 'B'.repeat(10000),
        // ... other fields
      }],
      // ... other required fields
    };
    
    const result = validateRegistrationSubmission(oversizedData);
    
    // Should reject oversized inputs
    expect(result.success).toBe(false);
  });
  
  // Add more security validation tests...
});
```

### Authorization Tests

Test API endpoint authorization:

```typescript
// Example test file: /tests/security/api-authorization.test.ts
import { POST } from '@/app/api/registrations/route';

describe('Registration API Authorization', () => {
  test('Rejects unauthorized access to admin endpoints', async () => {
    // Assuming there's an admin endpoint that requires auth
    const request = new Request('http://localhost/api/admin/registrations', {
      method: 'GET'
    });
    
    const response = await GET(request);
    
    // Should reject unauthorized access
    expect(response.status).toBe(401);
  });
  
  test('Prevents registration from stealing customer data', async () => {
    // Try to create registration with someone else's customerId
    const maliciousPayload = {
      // ... valid registration data but with
      customerId: 'stolen-customer-id',
      // ... other fields
    };
    
    const request = new Request('http://localhost/api/registrations', {
      method: 'POST',
      body: JSON.stringify(maliciousPayload),
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const response = await POST(request);
    const responseData = await response.json();
    
    // Should not allow specifying customer ID directly
    expect(response.status).not.toBe(200);
    expect(responseData.success).toBe(false);
  });
  
  // Add more authorization tests...
});
```

## 5. Test Infrastructure

### CI/CD Integration

Set up testing in CI/CD pipeline:

```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test:unit
  
  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run setup:test-db
      - run: npm run test:integration
      
  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - name: Install Playwright
        run: npx playwright install --with-deps
      - run: npm ci
      - run: npm run build
      - run: npm run start & npx wait-on http://localhost:3000
      - run: npm run test:e2e
```

### Test Database Setup

Create a script to set up the test database:

```typescript
// scripts/setup-test-db.ts
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

async function setupTestDatabase() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_TEST_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  console.log('Setting up test database...');
  
  // Read SQL files
  const schemaDir = path.join(__dirname, '../supabase/schema');
  const sqlFiles = fs.readdirSync(schemaDir)
    .filter(file => file.endsWith('.sql'))
    .map(file => path.join(schemaDir, file));
  
  // Execute schema files
  for (const file of sqlFiles) {
    const sql = fs.readFileSync(file, 'utf8');
    console.log(`Executing ${path.basename(file)}...`);
    const { error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error(`Error executing ${file}:`, error);
      process.exit(1);
    }
  }
  
  // Create transaction helper functions
  console.log('Creating transaction helper functions...');
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE OR REPLACE FUNCTION public.begin_transaction()
      RETURNS json LANGUAGE plpgsql AS $$
      BEGIN
        BEGIN;
        RETURN json_build_object('status', 'transaction_started');
      EXCEPTION
        WHEN OTHERS THEN
          RETURN json_build_object('error', SQLERRM);
      END;
      $$;
      
      CREATE OR REPLACE FUNCTION public.commit_transaction()
      RETURNS json LANGUAGE plpgsql AS $$
      BEGIN
        COMMIT;
        RETURN json_build_object('status', 'transaction_committed');
      EXCEPTION
        WHEN OTHERS THEN
          ROLLBACK;
          RETURN json_build_object('error', SQLERRM);
      END;
      $$;
      
      CREATE OR REPLACE FUNCTION public.rollback_transaction()
      RETURNS json LANGUAGE plpgsql AS $$
      BEGIN
        ROLLBACK;
        RETURN json_build_object('status', 'transaction_rolled_back');
      EXCEPTION
        WHEN OTHERS THEN
          RETURN json_build_object('error', SQLERRM);
      END;
      $$;
    `
  });
  
  if (error) {
    console.error('Error creating transaction functions:', error);
    process.exit(1);
  }
  
  console.log('Test database setup complete!');
}

setupTestDatabase().catch(console.error);
```

## 6. Test Documentation

### Test Documentation Best Practices

For each test file, include:

1. **Purpose**: What the tests are verifying
2. **Dependencies**: What components/services are being tested
3. **Setup requirements**: What needs to be configured before tests run
4. **Expected outcomes**: What constitutes a successful test
5. **Troubleshooting**: Common issues and solutions

Example test documentation header:

```typescript
/**
 * Registration API Integration Tests
 * 
 * Purpose:
 * These tests verify the registration API endpoint functionality,
 * ensuring data is properly validated and stored in the database.
 * 
 * Dependencies:
 * - Supabase database (test instance)
 * - Registration validation schema
 * - Transaction management functions
 * 
 * Setup Requirements:
 * - Run `npm run setup:test-db` to initialize the test database
 * - Set environment variables:
 *   - NEXT_PUBLIC_SUPABASE_TEST_URL
 *   - NEXT_PUBLIC_SUPABASE_TEST_KEY
 *   - SUPABASE_SERVICE_ROLE_KEY (for setup only)
 * 
 * Expected Outcomes:
 * - Valid registrations are stored correctly with all related records
 * - Invalid data is rejected with appropriate error messages
 * - Transactions maintain database consistency
 * 
 * Troubleshooting:
 * - If tests fail with auth errors, check Supabase credentials
 * - If transaction tests fail, ensure pgTAP functions are installed
 */
```

## Conclusion

This comprehensive testing strategy ensures:

1. **Reliability**: Through multi-layered testing from units to end-to-end
2. **Quality**: By verifying business rules and data integrity
3. **Performance**: By establishing performance baselines and thresholds
4. **Security**: By testing for common vulnerabilities
5. **Maintainability**: Through well-documented tests integrated into CI/CD

All tests should be executed before merging changes to ensure the order submission process remains robust and reliable.