# Environment Variable Conflicts

## Conflict Summary
One file uses Vite-style environment variables (`import.meta.env.VITE_*`) which are incompatible with Next.js.

## Forensic Analysis

### Conflicting File

1. **Vite Syntax (INCOMPATIBLE):**
   ```typescript
   // lib/supabase copy.ts
   const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
   const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
   ```

2. **Next.js Syntax (CORRECT):**
   ```typescript
   // All other files use:
   const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
   const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
   ```

### Environment Variable Patterns

| Feature | Vite | Next.js |
|---------|------|---------|
| Access Method | `import.meta.env` | `process.env` |
| Public Prefix | `VITE_` | `NEXT_PUBLIC_` |
| File Location | `.env` | `.env.local` |
| Build Time | Yes | Yes |
| Runtime | No | No |

### Why This File Exists

The `supabase copy.ts` file appears to be:
1. Copied from a Vite project
2. Backup of an old implementation
3. Accidental duplication during migration

## Recommended Remediation

### Immediate Actions

1. **Remove Incompatible File:**
   ```bash
   rm "lib/supabase copy.ts"
   ```

2. **Verify No Other Vite Usage:**
   ```bash
   # Search for any Vite references
   grep -r "import\.meta\.env" --include="*.ts" --include="*.tsx" .
   grep -r "VITE_" --include="*.ts" --include="*.tsx" .
   grep -r "vite" --include="*.json" .
   ```

3. **Check Environment Files:**
   ```bash
   # List all env files
   ls -la .env*
   # Should have: .env.local, .env.example
   # Should NOT have: .env (with VITE_ vars)
   ```

### Environment Variable Standards

1. **Next.js Conventions:**
   ```bash
   # .env.local
   # Server-side only
   DATABASE_URL=postgresql://...
   STRIPE_SECRET_KEY=sk_...
   
   # Client-side (public)
   NEXT_PUBLIC_SUPABASE_URL=https://...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
   ```

2. **Access Patterns:**
   ```typescript
   // Server Components/API Routes
   const secretKey = process.env.STRIPE_SECRET_KEY
   
   // Client Components
   const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
   ```

### Migration Guide (If Needed)

If migrating from Vite to Next.js:

```typescript
// Before (Vite)
import.meta.env.VITE_API_URL
import.meta.env.VITE_PUBLIC_KEY

// After (Next.js)
process.env.NEXT_PUBLIC_API_URL
process.env.NEXT_PUBLIC_PUBLIC_KEY
```

### Long-term Strategy

1. **Environment Documentation:**
   ```markdown
   # .env.example
   # Next.js Environment Variables
   
   # Server-side only (no prefix)
   DATABASE_URL=
   STRIPE_SECRET_KEY=
   
   # Client-side (NEXT_PUBLIC_ prefix)
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   ```

2. **Type Safety:**
   ```typescript
   // types/env.d.ts
   declare namespace NodeJS {
     interface ProcessEnv {
       DATABASE_URL: string
       NEXT_PUBLIC_SUPABASE_URL: string
       NEXT_PUBLIC_SUPABASE_ANON_KEY: string
     }
   }
   ```

3. **Validation:**
   ```typescript
   // lib/env-check.ts
   const requiredEnvVars = [
     'NEXT_PUBLIC_SUPABASE_URL',
     'NEXT_PUBLIC_SUPABASE_ANON_KEY',
   ]
   
   export function checkEnv() {
     for (const varName of requiredEnvVars) {
       if (!process.env[varName]) {
         throw new Error(`Missing required env var: ${varName}`)
       }
     }
   }
   ```

## Risk Assessment

- **High Risk:** Build failures if Vite syntax used
- **Medium Risk:** Missing environment variables
- **Low Risk:** File is duplicate, not imported

## Verification Steps

1. **Remove File:**
   ```bash
   rm "lib/supabase copy.ts"
   ```

2. **Verify Build:**
   ```bash
   npm run build
   # Should succeed
   ```

3. **Check Env Access:**
   ```bash
   # Ensure all env vars are accessible
   grep -r "process\.env\." --include="*.ts" --include="*.tsx" . | sort | uniq
   ```

4. **Runtime Test:**
   - Start development server
   - Check Supabase connection
   - Verify no console errors about missing env vars

## Summary

This conflict is easily resolved by:
1. Removing the incompatible file
2. Using Next.js environment variable conventions
3. Ensuring all files use `process.env`

The file appears to be an artifact from either:
- A Vite to Next.js migration
- Copy-paste from another project
- Backup file that shouldn't exist