# Task 021: Replace Any Types

**Priority**: High  
**Category**: Type Safety  
**Dependencies**: Task 011 (Enable TypeScript Strict Mode)  
**Estimated Time**: 4-6 hours  

## Problem

The codebase contains 41+ files with `any` types, which defeats the purpose of TypeScript and can lead to runtime errors. Common patterns include:
- `catch (error: any)`
- Function parameters with `any`
- API response types as `any`
- Event handlers with `any`

## Impact of `any` Types

- No compile-time type checking
- No IDE autocomplete/IntelliSense
- Potential runtime errors
- Difficult refactoring
- Hidden bugs

## Solution

Systematically replace all `any` types with proper types or `unknown` where appropriate.

## Implementation Steps

### 1. Audit Current Usage

Create script `scripts/audit-any-types.ts`:

```typescript
import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';

interface AnyTypeUsage {
  file: string;
  line: number;
  content: string;
  category: string;
}

const categories = {
  'catch': /catch\s*\([^)]*:\s*any/,
  'parameter': /\([^)]*:\s*any[,)]/,
  'return': /\):\s*any/,
  'variable': /(?:let|const|var)\s+\w+:\s*any/,
  'cast': /as\s+any/,
  'array': /:\s*any\[\]/,
  'object': /:\s*{\s*\[key:\s*string\]:\s*any\s*}/
};

function auditAnyTypes(): AnyTypeUsage[] {
  const files = glob.sync('**/*.{ts,tsx}', {
    ignore: ['node_modules/**', '.next/**', 'coverage/**']
  });

  const usages: AnyTypeUsage[] = [];

  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      if (line.includes(': any')) {
        let category = 'other';
        for (const [cat, regex] of Object.entries(categories)) {
          if (regex.test(line)) {
            category = cat;
            break;
          }
        }

        usages.push({
          file,
          line: index + 1,
          content: line.trim(),
          category
        });
      }
    });
  });

  return usages;
}

// Generate report
const usages = auditAnyTypes();
console.log(`Total 'any' usages: ${usages.length}`);
console.log('\nBy category:');
const byCategory = usages.reduce((acc, usage) => {
  acc[usage.category] = (acc[usage.category] || 0) + 1;
  return acc;
}, {} as Record<string, number>);

Object.entries(byCategory)
  .sort(([,a], [,b]) => b - a)
  .forEach(([cat, count]) => console.log(`  ${cat}: ${count}`));

// Save detailed report
fs.writeFileSync('any-types-report.json', JSON.stringify(usages, null, 2));
```

### 2. Fix Strategies by Category

#### Error Handling (catch blocks)

```typescript
// Before
catch (error: any) {
  console.error(error.message);
}

// After - Option 1: Type guard
catch (error: unknown) {
  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error('An unknown error occurred', error);
  }
}

// After - Option 2: Error utility
function isError(error: unknown): error is Error {
  return error instanceof Error;
}

function getErrorMessage(error: unknown): string {
  if (isError(error)) return error.message;
  if (typeof error === 'string') return error;
  return 'An unknown error occurred';
}

catch (error: unknown) {
  console.error(getErrorMessage(error));
}
```

#### API Responses

```typescript
// Before
const { data }: { data: any } = await supabase
  .from('events')
  .select('*');

// After
import { Tables } from '@/supabase/types';

const { data }: { data: Tables<'events'>[] | null } = await supabase
  .from('events')
  .select('*');
```

#### Event Handlers

```typescript
// Before
const handleChange = (e: any) => {
  setValue(e.target.value);
};

// After
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setValue(e.target.value);
};
```

#### Function Parameters

```typescript
// Before
function processData(data: any): void {
  // ...
}

// After - Define specific type
interface ProcessData {
  id: string;
  name: string;
  values: number[];
}

function processData(data: ProcessData): void {
  // ...
}

// Or use generic if truly dynamic
function processData<T>(data: T): void {
  // ...
}
```

### 3. Create Type Utilities

Create `lib/type-utils.ts`:

```typescript
/**
 * Type utilities for common patterns
 */

// For objects with string keys
export type StringRecord<T = unknown> = Record<string, T>;

// For API responses
export type ApiResponse<T> = {
  data: T | null;
  error: Error | null;
};

// For form data
export type FormData<T> = {
  [K in keyof T]: T[K] | undefined;
};

// Type guards
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function hasProperty<T extends object, K extends PropertyKey>(
  obj: T,
  key: K
): obj is T & Record<K, unknown> {
  return key in obj;
}

// Safe JSON parsing
export function parseJSON<T = unknown>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

// Type assertion with validation
export function assertType<T>(
  value: unknown,
  validator: (value: unknown) => value is T,
  message?: string
): asserts value is T {
  if (!validator(value)) {
    throw new TypeError(message || 'Type assertion failed');
  }
}
```

### 4. Common Replacements

Create reference guide `docs/TYPE_MIGRATION.md`:

```markdown
# Type Migration Guide

## Common Any Type Replacements

### 1. Error Handling
```typescript
// ❌ Bad
catch (error: any) { }

// ✅ Good
catch (error: unknown) { }
```

### 2. Event Handlers
```typescript
// ❌ Bad
onClick: (e: any) => void

// ✅ Good
onClick: (e: React.MouseEvent<HTMLButtonElement>) => void
onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
```

### 3. Arrays
```typescript
// ❌ Bad
const items: any[] = []

// ✅ Good
const items: Item[] = []
const items: Array<string | number> = []
const items: unknown[] = [] // if truly unknown
```

### 4. Objects
```typescript
// ❌ Bad
const config: any = {}

// ✅ Good
const config: Record<string, unknown> = {}
const config: { [key: string]: string } = {}
interface Config { /* ... */ }
const config: Config = {}
```

### 5. Function Returns
```typescript
// ❌ Bad
function getData(): any { }

// ✅ Good
function getData(): Data | null { }
function getData<T>(): T { }
function getData(): unknown { }
```
```

### 5. Automated Migration Script

Create `scripts/migrate-any-types.ts`:

```typescript
import * as ts from 'typescript';
import * as fs from 'fs';

function migrateAnyTypes(fileName: string) {
  const sourceFile = ts.createSourceFile(
    fileName,
    fs.readFileSync(fileName, 'utf8'),
    ts.ScriptTarget.Latest,
    true
  );

  const transformer = (context: ts.TransformationContext) => {
    const visit: ts.Visitor = (node) => {
      // Replace ': any' with ': unknown' in catch clauses
      if (ts.isCatchClause(node) && node.variableDeclaration) {
        const param = node.variableDeclaration;
        if (param.type && param.type.kind === ts.SyntaxKind.AnyKeyword) {
          return ts.factory.updateCatchClause(
            node,
            ts.factory.updateVariableDeclaration(
              param,
              param.name,
              param.exclamationToken,
              ts.factory.createKeywordTypeNode(ts.SyntaxKind.UnknownKeyword),
              param.initializer
            ),
            node.block
          );
        }
      }

      return ts.visitEachChild(node, visit, context);
    };

    return (node: ts.Node) => ts.visitNode(node, visit);
  };

  const result = ts.transform(sourceFile, [transformer]);
  const printer = ts.createPrinter();
  const transformed = printer.printFile(result.transformed[0] as ts.SourceFile);
  
  fs.writeFileSync(fileName, transformed);
}
```

### 6. Priority Files to Fix

Based on critical paths:

1. **API Routes** (Security critical)
   - `app/api/registrations/route.ts`
   - `app/api/stripe/create-payment-intent/route.ts`
   - `app/api/verify-turnstile-and-anon-auth/route.ts`

2. **State Management** (Core functionality)
   - `lib/registrationStore.ts`
   - `contexts/registration-context.tsx`

3. **Form Components** (User input)
   - `components/register/Forms/attendee/types.ts`
   - `components/register/RegistrationWizard/registration-wizard.tsx`

## Verification

1. Run type checking: `npm run type-check`
2. Search for remaining `any`: `grep -r ": any" --include="*.ts" --include="*.tsx"`
3. Run tests to ensure no regressions
4. Check IDE for proper autocomplete

## Benefits After Migration

- Catch type errors at compile time
- Better IDE support and autocomplete
- Easier refactoring
- Self-documenting code
- Reduced runtime errors

## Next Steps

1. Enable `noImplicitAny` in tsconfig.json
2. Add pre-commit hook to prevent new `any` types
3. Document type patterns for team
4. Consider using type generation for API responses