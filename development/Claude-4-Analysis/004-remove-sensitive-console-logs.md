# Task 004: Remove Sensitive Console Logs

**Priority**: High  
**Category**: Security  
**Dependencies**: Task 013 (Setup Structured Logging) - but can be done first  
**Estimated Time**: 2-3 hours  

## Problem

The codebase contains 58+ files with console.log statements that potentially expose sensitive data:
- User personal information
- Payment details
- API responses with sensitive data
- Database query results
- Authentication tokens

## Affected Areas

Based on grep analysis, console.log statements are found in:
- API routes (registration, payment, authentication)
- Form components (attendee data)
- Service layers (database queries)
- Utility functions

## Solution

1. Remove all console.log statements that output sensitive data
2. Replace necessary logging with structured logging service
3. Use debug-only logging for development
4. Implement proper log sanitization

## Implementation Steps

### 1. Identify and Categorize Console Logs

Run audit script to find all console statements:

```bash
# Find all console.log, console.error, console.warn
grep -r "console\.\(log\|error\|warn\)" \
  --include="*.ts" \
  --include="*.tsx" \
  --exclude-dir=node_modules \
  --exclude-dir=.next \
  -n
```

### 2. Create Debug Logger Utility

Create `lib/debug-logger.ts`:

```typescript
/**
 * Debug logger that only logs in development
 * and sanitizes sensitive data
 */

const isDevelopment = process.env.NODE_ENV === 'development';

// List of sensitive keys to redact
const SENSITIVE_KEYS = [
  'password',
  'token',
  'secret',
  'apiKey',
  'api_key',
  'authorization',
  'cookie',
  'session',
  'stripe',
  'payment',
  'card',
  'email',
  'phone',
  'firstName',
  'lastName',
  'address',
  'ssn',
  'dob',
  'dateOfBirth',
];

// Sanitize sensitive data from objects
function sanitizeData(data: any): any {
  if (typeof data !== 'object' || data === null) {
    return data;
  }
  
  if (Array.isArray(data)) {
    return data.map(sanitizeData);
  }
  
  const sanitized: any = {};
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    
    // Check if key contains sensitive terms
    const isSensitive = SENSITIVE_KEYS.some(term => 
      lowerKey.includes(term.toLowerCase())
    );
    
    if (isSensitive) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object') {
      sanitized[key] = sanitizeData(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

export const debug = {
  log: (message: string, data?: any) => {
    if (!isDevelopment) return;
    
    const sanitized = data ? sanitizeData(data) : undefined;
    console.log(`[DEBUG] ${message}`, sanitized || '');
  },
  
  error: (message: string, error?: any) => {
    if (!isDevelopment) return;
    
    const sanitized = error ? sanitizeData(error) : undefined;
    console.error(`[ERROR] ${message}`, sanitized || '');
  },
  
  warn: (message: string, data?: any) => {
    if (!isDevelopment) return;
    
    const sanitized = data ? sanitizeData(data) : undefined;
    console.warn(`[WARN] ${message}`, sanitized || '');
  },
  
  // Special method for performance timing
  time: (label: string) => {
    if (!isDevelopment) return;
    console.time(label);
  },
  
  timeEnd: (label: string) => {
    if (!isDevelopment) return;
    console.timeEnd(label);
  },
};

// Export a no-op logger for production
export const prodLogger = {
  log: () => {},
  error: () => {},
  warn: () => {},
  time: () => {},
  timeEnd: () => {},
};

// Auto-select based on environment
export const logger = isDevelopment ? debug : prodLogger;
```

### 3. Replace Console Logs in Critical Files

Priority files to update:

#### API Routes
- `app/api/registrations/route.ts`
- `app/api/stripe/create-payment-intent/route.ts`
- `app/api/verify-turnstile-and-anon-auth/route.ts`
- `app/api/send-confirmation-email/route.ts`

Example replacement:

```diff
- console.log("Received registration data:", JSON.stringify(data, null, 2));
+ logger.log("Received registration data", data);

- console.error("Error saving registration:", registrationError);
+ logger.error("Error saving registration", registrationError);
```

#### Form Components
- `components/register/RegistrationWizard/registration-wizard.tsx`
- `components/register/Forms/attendee/lib/useAttendeeData.ts`

Example replacement:

```diff
- console.log(`CONTACT DEBUG for ${descriptiveLabel}:`, {
-   type: normalizedType,
-   contactPreference: attendee.contactPreference,
-   email: attendee.primaryEmail,
-   phone: attendee.primaryPhone,
- });
+ logger.log(`Contact validation for ${descriptiveLabel}`, {
+   type: normalizedType,
+   hasContact: !!attendee.primaryEmail || !!attendee.primaryPhone,
+ });
```

### 4. Create ESLint Rule

Add to `.eslintrc.js`:

```javascript
module.exports = {
  rules: {
    'no-console': ['error', {
      allow: ['time', 'timeEnd']
    }],
  },
  overrides: [
    {
      files: ['*.dev.ts', '*.dev.tsx', 'scripts/**/*'],
      rules: {
        'no-console': 'off'
      }
    }
  ]
};
```

### 5. Migration Script

Create `scripts/remove-console-logs.js`:

```javascript
const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Files to process
const files = glob.sync('**/*.{ts,tsx}', {
  ignore: ['node_modules/**', '.next/**', 'scripts/**']
});

let totalRemoved = 0;
let totalReplaced = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const originalContent = content;
  
  // Remove simple console.logs
  content = content.replace(/console\.log\([^)]*\);?\n?/g, (match) => {
    totalRemoved++;
    return '';
  });
  
  // Replace console.error with logger.error
  content = content.replace(/console\.error/g, (match) => {
    totalReplaced++;
    return 'logger.error';
  });
  
  if (content !== originalContent) {
    // Add import if logger is used
    if (content.includes('logger.')) {
      const importStatement = "import { logger } from '@/lib/debug-logger';\n";
      if (!content.includes(importStatement)) {
        content = importStatement + content;
      }
    }
    
    fs.writeFileSync(file, content);
    console.log(`Updated: ${file}`);
  }
});

console.log(`Total removed: ${totalRemoved}`);
console.log(`Total replaced: ${totalReplaced}`);
```

## Verification

1. Run the migration script
2. Build the application to check for errors
3. Test in development mode - verify debug logs appear
4. Test in production mode - verify no console output
5. Review logs for any remaining sensitive data

## Special Cases

### Keep These Console Statements
- Build scripts output
- CLI tool output
- Intentional user-facing messages

### Convert These to Structured Logging
- Error tracking
- Performance monitoring
- Audit logs
- Security events

## Next Steps

After removing console logs:
1. Implement proper structured logging (Task 013)
2. Set up log aggregation service
3. Configure alerts for error patterns
4. Implement audit logging for sensitive operations

## Security Impact

- **Before**: Sensitive data potentially exposed in browser console and server logs
- **After**: No sensitive data in logs, debug info only in development
- **Additional Benefit**: Cleaner production bundle without debug code