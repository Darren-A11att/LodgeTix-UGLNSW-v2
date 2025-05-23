# Task 011: Enable TypeScript Strict Mode

**Priority**: High  
**Category**: Code Quality  
**Dependencies**: None  
**Estimated Time**: 30 minutes (enabling) + ongoing fixes  

## Problem

TypeScript build errors are currently ignored with `ignoreBuildErrors: true` in `next.config.mjs`. This prevents catching type errors during build time and reduces the benefits of using TypeScript.

Current issues:
- Type errors not caught during build
- `any` types used extensively (41+ files)
- Missing type definitions
- Potential runtime errors from type mismatches

## Solution

1. Enable TypeScript strict mode
2. Remove `ignoreBuildErrors` flag
3. Fix critical type errors incrementally
4. Set up pre-commit hooks to prevent new type errors

## Implementation Steps

### 1. Update TypeScript Configuration

Update `tsconfig.json`:

```json
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "target": "ES6",
    "skipLibCheck": true,
    "strict": true,  // Enable all strict type checking options
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    
    // Additional strict options (included in "strict": true)
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    
    // Additional helpful options
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"],
      "@/register/Forms/*": ["./components/register/Forms/*"],
      "@/register/attendee/*": ["./components/register/Forms/attendee/*"],
      "@/register/shared/*": ["./components/register/Forms/shared/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### 2. Update Next.js Configuration

Update `next.config.mjs`:

```diff
const nextConfig = {
  eslint: {
-   ignoreDuringBuilds: true,
+   ignoreDuringBuilds: false,
  },
  typescript: {
-   ignoreBuildErrors: true,
+   // Start with ignoring errors, then gradually fix
+   ignoreBuildErrors: false,
  },
  // ... rest of config
}
```

### 3. Create Type Check Script

Add to `package.json`:

```json
{
  "scripts": {
    "type-check": "tsc --noEmit",
    "type-check:watch": "tsc --noEmit --watch",
    "type-check:report": "tsc --noEmit > type-errors.log 2>&1 || true"
  }
}
```

### 4. Gradual Migration Strategy

Since enabling strict mode will likely reveal many errors, use a gradual approach:

#### Phase 1: Assess Current State
```bash
# Generate type error report
npm run type-check:report

# Count errors by category
grep -E "(TS[0-9]+):" type-errors.log | sed 's/.*\(TS[0-9]\+\):.*/\1/' | sort | uniq -c | sort -nr
```

#### Phase 2: Create Migration Tracking

Create `type-migration-progress.md`:

```markdown
# TypeScript Migration Progress

## Error Summary
- Total files with errors: X
- Total errors: Y

## Common Error Types
- TS2339: Property does not exist on type
- TS7006: Parameter implicitly has an 'any' type
- TS2345: Argument of type X is not assignable to parameter of type Y

## Migration Status

### Critical Files (Fix First)
- [ ] app/api/registrations/route.ts
- [ ] app/api/stripe/create-payment-intent/route.ts
- [ ] lib/supabase-singleton.ts
- [ ] contexts/registration-context.tsx

### High Priority
- [ ] components/register/RegistrationWizard/registration-wizard.tsx
- [ ] lib/registrationStore.ts

### Medium Priority
- [ ] All API routes
- [ ] All form components
```

#### Phase 3: Incremental Fixes

Start with critical paths and work outward:

1. **Fix API Routes First**
   ```typescript
   // Before
   export async function POST(request: Request) {
     const data = await request.json();
     // data is 'any'
   
   // After
   interface RegistrationRequest {
     registrationType: string;
     primaryAttendee: AttendeeData;
     // ... etc
   }
   
   export async function POST(request: Request) {
     const data: RegistrationRequest = await request.json();
   ```

2. **Add Type Guards**
   ```typescript
   function isValidRegistrationType(type: unknown): type is RegistrationType {
     return typeof type === 'string' && 
       ['individuals', 'groups', 'officials', 'lodge', 'delegation'].includes(type);
   }
   ```

3. **Use Unknown Instead of Any**
   ```typescript
   // Before
   catch (error: any) {
     console.error(error.message);
   }
   
   // After
   catch (error: unknown) {
     const message = error instanceof Error ? error.message : 'Unknown error';
     console.error(message);
   }
   ```

### 5. Add Pre-commit Hook

Install husky and lint-staged:

```bash
npm install --save-dev husky lint-staged
npx husky install
```

Add to `package.json`:

```json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "tsc-files --noEmit"
    ]
  }
}
```

Create `.husky/pre-commit`:

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
```

### 6. CI/CD Integration

Add type checking to CI pipeline:

```yaml
# .github/workflows/type-check.yml
name: Type Check

on: [push, pull_request]

jobs:
  type-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run type-check
```

## Verification

1. Run `npm run type-check` and verify errors are reported
2. Fix one critical file and verify build succeeds
3. Check that pre-commit hook prevents committing type errors
4. Verify CI fails on type errors

## Common Fixes

### Fix "any" Types
```typescript
// Before
function processData(data: any) { }

// After
interface DataType {
  id: string;
  value: number;
}
function processData(data: DataType) { }
```

### Fix Implicit Any Parameters
```typescript
// Before
attendees.forEach((attendee) => { })

// After
attendees.forEach((attendee: UnifiedAttendeeData) => { })
```

### Fix Null/Undefined Checks
```typescript
// Before
if (user.email) { }

// After
if (user?.email) { }
```

## Impact

- **Immediate**: Build may fail initially due to existing type errors
- **Short-term**: Need to fix critical type errors before deployment
- **Long-term**: Catch bugs at compile time, better IDE support, safer refactoring

## Next Steps

After enabling TypeScript strict mode:
1. Fix all critical path type errors (Task 021)
2. Add missing type definitions (Task 022)
3. Replace all `any` types with proper types (Task 023)
4. Document type patterns and conventions