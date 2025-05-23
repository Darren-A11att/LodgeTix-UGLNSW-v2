# Task 012: Enable ESLint Checks

**Priority**: High  
**Category**: Code Quality  
**Dependencies**: None (can be done in parallel with TypeScript)  
**Estimated Time**: 1 hour setup + ongoing fixes  

## Problem

ESLint is currently disabled during builds with `ignoreDuringBuilds: true` in `next.config.mjs`. This prevents catching:
- Code style inconsistencies
- Potential bugs and anti-patterns
- Security vulnerabilities
- Performance issues
- Accessibility problems

## Solution

1. Enable ESLint in build process
2. Configure comprehensive ESLint rules
3. Fix critical linting errors
4. Set up auto-fix on save

## Implementation Steps

### 1. Update Next.js Configuration

Update `next.config.mjs`:

```diff
const nextConfig = {
  eslint: {
-   ignoreDuringBuilds: true,
+   ignoreDuringBuilds: false,
+   dirs: ['app', 'components', 'lib', 'contexts', 'shared', 'hooks']
  },
  // ... rest of config
}
```

### 2. Create Comprehensive ESLint Configuration

Create `.eslintrc.js`:

```javascript
module.exports = {
  extends: [
    'next/core-web-vitals',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended',
    'plugin:security/recommended'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2023,
    sourceType: 'module',
    project: './tsconfig.json'
  },
  plugins: [
    '@typescript-eslint',
    'react',
    'react-hooks',
    'jsx-a11y',
    'security',
    'import'
  ],
  rules: {
    // TypeScript specific rules
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/explicit-function-return-type': ['warn', {
      allowExpressions: true,
      allowTypedFunctionExpressions: true
    }],
    '@typescript-eslint/no-unused-vars': ['error', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_'
    }],
    '@typescript-eslint/no-non-null-assertion': 'error',
    '@typescript-eslint/strict-boolean-expressions': 'warn',
    
    // React specific rules
    'react/prop-types': 'off', // We use TypeScript
    'react/react-in-jsx-scope': 'off', // Next.js handles this
    'react/jsx-uses-react': 'off',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    
    // Security rules
    'security/detect-object-injection': 'warn',
    'security/detect-non-literal-regexp': 'warn',
    'security/detect-unsafe-regex': 'error',
    
    // General code quality
    'no-console': ['error', { allow: ['warn', 'error'] }],
    'no-debugger': 'error',
    'no-alert': 'error',
    'no-var': 'error',
    'prefer-const': 'error',
    'eqeqeq': ['error', 'always'],
    'curly': ['error', 'all'],
    
    // Import rules
    'import/order': ['error', {
      'groups': [
        'builtin',
        'external',
        'internal',
        'parent',
        'sibling',
        'index'
      ],
      'newlines-between': 'always',
      'alphabetize': {
        'order': 'asc',
        'caseInsensitive': true
      }
    }],
    'import/no-duplicates': 'error',
    
    // Complexity rules
    'complexity': ['warn', 10],
    'max-lines': ['warn', 300],
    'max-lines-per-function': ['warn', 50],
    'max-depth': ['warn', 4],
    'max-nested-callbacks': ['warn', 3]
  },
  overrides: [
    {
      // Test files
      files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        'max-lines-per-function': 'off'
      }
    },
    {
      // Configuration files
      files: ['*.config.js', '*.config.ts'],
      rules: {
        'import/no-default-export': 'off'
      }
    },
    {
      // API routes
      files: ['**/api/**/*.ts'],
      rules: {
        'max-lines-per-function': ['warn', 100]
      }
    }
  ],
  settings: {
    react: {
      version: 'detect'
    },
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true
      }
    }
  },
  ignorePatterns: [
    '.next',
    'node_modules',
    'public',
    'coverage',
    '*.min.js',
    'generated'
  ]
};
```

### 3. Install Required Dependencies

```bash
npm install --save-dev \
  @typescript-eslint/parser \
  @typescript-eslint/eslint-plugin \
  eslint-plugin-react \
  eslint-plugin-react-hooks \
  eslint-plugin-jsx-a11y \
  eslint-plugin-security \
  eslint-plugin-import \
  eslint-import-resolver-typescript
```

### 4. Create ESLint Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "lint:report": "next lint --output-file eslint-report.json --format json",
    "lint:strict": "next lint --max-warnings 0"
  }
}
```

### 5. VS Code Integration

Create `.vscode/settings.json`:

```json
{
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ],
  "eslint.format.enable": true,
  "editor.formatOnSave": true,
  "[javascript]": {
    "editor.defaultFormatter": "dbaeumer.vscode-eslint"
  },
  "[typescript]": {
    "editor.defaultFormatter": "dbaeumer.vscode-eslint"
  },
  "[javascriptreact]": {
    "editor.defaultFormatter": "dbaeumer.vscode-eslint"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "dbaeumer.vscode-eslint"
  }
}
```

### 6. Gradual Fix Strategy

Since enabling ESLint will reveal many issues:

#### Phase 1: Generate Error Report
```bash
npm run lint:report
node -e "
  const report = require('./eslint-report.json');
  const summary = {};
  report.forEach(file => {
    file.messages.forEach(msg => {
      summary[msg.ruleId] = (summary[msg.ruleId] || 0) + 1;
    });
  });
  console.log('ESLint Error Summary:');
  Object.entries(summary)
    .sort(([,a], [,b]) => b - a)
    .forEach(([rule, count]) => console.log(\`  \${rule}: \${count}\`));
"
```

#### Phase 2: Auto-fix Safe Issues
```bash
# Auto-fix formatting issues
npm run lint:fix

# Review changes
git diff
```

#### Phase 3: Create Fix Priority List

Create `eslint-migration.md`:

```markdown
# ESLint Migration Progress

## Auto-fixed Issues
- [x] Import ordering
- [x] Trailing commas
- [x] Quote consistency
- [x] Semicolons

## Critical Issues (Fix First)
- [ ] no-explicit-any in API routes
- [ ] no-console in production code
- [ ] Security vulnerabilities

## Medium Priority
- [ ] Complexity warnings
- [ ] Missing return types
- [ ] Unused variables

## Low Priority
- [ ] Line length
- [ ] File size warnings
```

### 7. Pre-commit Integration

Update `.husky/pre-commit`:

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Run ESLint on staged files
npx lint-staged
```

Update `package.json`:

```json
{
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": [
      "eslint --fix",
      "eslint --max-warnings 0"
    ]
  }
}
```

### 8. CI Integration

Create `.github/workflows/lint.yml`:

```yaml
name: Lint

on: [push, pull_request]

jobs:
  eslint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint:strict
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: eslint-report
          path: eslint-report.json
```

## Common Fixes

### Replace console.log
```typescript
// Before
console.log('Debug info', data);

// After
import { logger } from '@/lib/debug-logger';
logger.log('Debug info', data);
```

### Fix any Types
```typescript
// Before
function handleError(error: any) {}

// After
function handleError(error: unknown) {}
```

### Add Return Types
```typescript
// Before
function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// After
function calculateTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}
```

## Verification

1. Run `npm run lint` and verify errors are reported
2. Run `npm run lint:fix` and verify auto-fixes work
3. Save a file in VS Code and verify auto-formatting
4. Create a commit with linting errors and verify pre-commit hook blocks it

## Impact

- **Immediate**: Build may fail due to linting errors
- **Short-term**: Need to fix critical errors before deployment
- **Long-term**: Consistent code style, fewer bugs, better maintainability

## Next Steps

1. Fix all critical ESLint errors
2. Add custom rules for project-specific patterns
3. Document coding standards
4. Set up ESLint plugins for specific libraries (e.g., React Query, Zustand)