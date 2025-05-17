# Package.json Management Patterns

## Core Principles

Managing package.json files effectively is crucial for maintainable Next.js projects.

### Law 1: Semantic Versioning Discipline
- Use exact versions for critical dependencies
- Use caret (^) for minor updates only on stable packages
- Lock versions for packages with frequent breaking changes

### Law 2: Script Organization
- Organize scripts by purpose (dev, build, test, lint, etc.)
- Use descriptive names that indicate the action
- Chain related scripts for complex workflows

### Law 3: Dependency Classification
- Separate dependencies and devDependencies correctly
- Runtime dependencies in `dependencies`
- Build tools and dev utilities in `devDependencies`

### Law 4: Version Consistency
- Keep related packages (like React and React-DOM) on same major version
- Align @types packages with their corresponding libraries
- Use `npm outdated` regularly to check for updates

## Standard Scripts Pattern

```json
{
  "scripts": {
    // Development
    "dev": "next dev",
    "dev:turbo": "next dev --turbo",
    
    // Building
    "build": "next build",
    "build:analyze": "ANALYZE=true next build",
    
    // Production
    "start": "next start",
    
    // Quality Checks
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "typecheck": "tsc --noEmit",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    
    // Testing
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "e2e": "playwright test",
    
    // Combined Commands
    "check": "npm run lint && npm run typecheck && npm run test",
    "precommit": "lint-staged",
    "prepare": "husky install"
  }
}
```

## Dependency Management Patterns

### Core Dependencies
```json
{
  "dependencies": {
    "next": "15.2.4",
    "react": "19.0.0",
    "react-dom": "19.0.0",
    "@supabase/supabase-js": "^2.38.4",
    "stripe": "^14.5.0",
    "zustand": "^4.4.7"
  }
}
```

### Development Dependencies
```json
{
  "devDependencies": {
    // TypeScript
    "@types/node": "^20.10.0",
    "@types/react": "^18.2.45",
    "@types/react-dom": "^18.2.18",
    "typescript": "^5.3.3",
    
    // Linting & Formatting
    "eslint": "^8.55.0",
    "eslint-config-next": "15.2.4",
    "prettier": "^3.1.1",
    "@typescript-eslint/parser": "^6.14.0",
    "@typescript-eslint/eslint-plugin": "^6.14.0",
    
    // Testing
    "jest": "^29.7.0",
    "@testing-library/react": "^14.1.2",
    "@testing-library/jest-dom": "^6.1.5",
    "@playwright/test": "^1.40.1",
    
    // Build Tools
    "husky": "^8.0.3",
    "lint-staged": "^15.2.0",
    "@next/bundle-analyzer": "15.2.4"
  }
}
```

## Configuration Patterns

### Engine Requirements
```json
{
  "engines": {
    "node": ">=20.0.0",
    "npm": ">=10.0.0"
  }
}
```

### Package Metadata
```json
{
  "name": "@lodgetix/web",
  "version": "1.0.0",
  "private": true,
  "description": "LodgeTix ticketing platform for Masonic events",
  "author": "LodgeTix Team",
  "license": "UNLICENSED"
}
```

### Lint-Staged Configuration
```json
{
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md,css}": [
      "prettier --write"
    ]
  }
}
```

## Version Update Strategy

### Safe Update Pattern
```bash
# Check outdated packages
npm outdated

# Update patch versions
npm update

# Update minor versions for dev dependencies
npm update --save-dev

# Update specific package
npm install package@latest

# Update all dependencies interactively
npx npm-check-updates -i
```

### Breaking Change Management
```json
{
  "overrides": {
    // Pin specific sub-dependency versions
    "package-name": "1.2.3"
  },
  "resolutions": {
    // Yarn/pnpm equivalent
    "package-name": "1.2.3"
  }
}
```

## Performance Optimization

### Bundle Size Management
```json
{
  "scripts": {
    "analyze": "ANALYZE=true next build",
    "why": "npm ls",
    "dedupe": "npm dedupe"
  }
}
```

### Selective Installation
```json
{
  "optionalDependencies": {
    // Platform-specific packages
    "@sentry/profiling-node": "^1.3.5"
  }
}
```

## Security Patterns

### Audit Commands
```json
{
  "scripts": {
    "audit": "npm audit",
    "audit:fix": "npm audit fix",
    "audit:production": "npm audit --production"
  }
}
```

### License Checking
```json
{
  "scripts": {
    "license:check": "license-checker --production --summary"
  }
}
```

## Package.json Anti-Patterns to Avoid

### L DON'T: Mix concerns
```json
{
  "scripts": {
    "do-everything": "npm run lint && npm run test && npm run build && npm run deploy"
  }
}
```

###  DO: Separate concerns
```json
{
  "scripts": {
    "check": "npm run lint && npm run typecheck && npm run test",
    "ci": "npm run check && npm run build",
    "deploy": "npm run ci && npm run deploy:prod"
  }
}
```

### L DON'T: Use wildcards for versions
```json
{
  "dependencies": {
    "react": "*",
    "lodash": "latest"
  }
}
```

###  DO: Use specific version ranges
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "lodash": "^4.17.21"
  }
}
```

## Monitoring and Maintenance

### Regular Maintenance Tasks
1. Run `npm outdated` weekly
2. Check for security advisories with `npm audit`
3. Review and update dev dependencies monthly
4. Keep major framework versions aligned
5. Document breaking changes in CHANGELOG.md

### Version Migration Strategy
1. Update dev dependencies first
2. Test thoroughly in development
3. Update production dependencies incrementally
4. Run full test suite after each update
5. Document any required code changes