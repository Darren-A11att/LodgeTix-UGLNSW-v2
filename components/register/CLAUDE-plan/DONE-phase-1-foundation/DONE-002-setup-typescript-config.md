# Task 002: Setup TypeScript Configuration

## Objective
Ensure TypeScript is properly configured for the new directory structure with appropriate path aliases.

## Dependencies
- Task 001 (directory structure)

## Steps

1. Update `tsconfig.json` to include path aliases for the new structure:
```json
{
  "compilerOptions": {
    "paths": {
      "@/register/forms/*": ["./components/register/forms/*"],
      "@/register/attendee/*": ["./components/register/forms/attendee/*"],
      "@/register/shared/*": ["./components/register/forms/shared/*"]
    }
  }
}
```

2. Create `components/register/forms/tsconfig.json` for module-specific configuration:
```json
{
  "extends": "../../../tsconfig.json",
  "include": ["./**/*"],
  "exclude": ["node_modules"]
}
```

3. Add type declaration files for any custom types

## Deliverables
- Updated TypeScript configuration
- Path aliases for cleaner imports
- Module-specific TypeScript config

## Success Criteria
- TypeScript recognizes all new paths
- No type errors in new structure
- Clean import statements work