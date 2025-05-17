# Duplicate Supabase Clients

## Conflict Summary
Multiple Supabase client implementations exist, creating the "Multiple GoTrueClient instances" error and potential authentication issues.

## Forensic Analysis

### Files Creating Supabase Clients

1. **Primary Implementation Files:**
   - `/lib/supabase-browser.ts` - Client-side implementation (CORRECT)
   - `/lib/supabase.ts` - Server-side implementation
   - `/lib/supabaseClient.ts` - Duplicate implementation
   - `/lib/supabaseClient copy.ts` - Exact duplicate
   - `/lib/supabase copy.ts` - Uses Vite env vars (INCOMPATIBLE)

### Import Analysis

1. **Files using supabase-browser.ts (CORRECT):**
   ```typescript
   // Now correctly using after fix:
   /lib/services/masonic-services.ts
   /contexts/auth-provider.tsx
   /lib/api/grandLodges.ts
   /lib/api/lodges.ts
   /lib/locationStore.ts
   ```

2. **Files using supabase.ts:**
   ```typescript
   /lib/api/adminApiService.ts: import { supabase, table, supabaseTables } from '../../supabase';
   /lib/api/admin/*.ts: import from '../../../supabase'
   ```

3. **Files using supabaseClient.ts:**
   ```typescript
   // None currently after fixes
   ```

4. **Environment Variable Conflicts:**
   - `supabase copy.ts` uses `import.meta.env.VITE_*` (Vite syntax)
   - All others use `process.env.NEXT_PUBLIC_*` (Next.js syntax)

### Specific Problems

1. **Multiple Client Instances:**
   ```typescript
   // supabase-browser.ts
   export const supabase = createBrowserClient()
   
   // auth-provider.tsx (BEFORE FIX)
   const [supabase] = useState(() => createBrowserClient())
   
   // masonic-services.ts (BEFORE FIX)
   const supabase = createClient(supabaseUrl, supabaseKey)
   ```

2. **Incompatible Environment Variables:**
   ```typescript
   // supabase copy.ts (WRONG - Vite syntax)
   const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
   
   // supabase-browser.ts (CORRECT - Next.js syntax)
   const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
   ```

3. **Duplicate Table Mappings:**
   - DB_TABLE_NAMES defined in multiple files
   - Inconsistent table name references

## Recommended Remediation

### Immediate Actions

1. **Remove Duplicate Files:**
   ```bash
   # Delete duplicate and backup files
   rm lib/supabaseClient.ts
   rm "lib/supabaseClient copy.ts"
   rm "lib/supabase copy.ts"
   ```

2. **Consolidate Table Name Mappings:**
   - Keep only in `supabase-browser.ts` and `supabase.ts`
   - Remove duplicate definitions

3. **Update All Imports:**
   ```typescript
   // For client-side components:
   import { supabase } from '@/lib/supabase-browser'
   
   // For server-side/API routes:
   import { supabase } from '@/lib/supabase'
   ```

4. **Fix Remaining Imports:**
   ```bash
   # Find files still using wrong imports
   grep -r "supabaseClient" --include="*.ts" --include="*.tsx" .
   
   # Update each file to use correct import
   ```

### File-by-File Updates

1. **Update Admin Services:**
   ```typescript
   // Change from:
   import { supabase } from '../../supabaseClient';
   
   // To:
   import { supabase } from '../../supabase';
   ```

2. **Remove Vite Environment Usage:**
   - Any file using `import.meta.env` must be updated
   - Use `process.env.NEXT_PUBLIC_*` instead

3. **Centralize Configuration:**
   ```typescript
   // Create a single config file if needed
   export const supabaseConfig = {
     url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
     anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
   }
   ```

### Long-term Strategy

1. **Establish Clear Patterns:**
   - Client components: use `supabase-browser.ts`
   - Server components/API: use `supabase.ts`
   - Document this in CLAUDE.md

2. **Add Import Rules:**
   ```json
   // .eslintrc or similar
   {
     "rules": {
       "no-restricted-imports": ["error", {
         "patterns": ["*/supabaseClient*", "*/supabase copy*"]
       }]
     }
   }
   ```

3. **Type Safety:**
   - Ensure all imports use the typed Database interface
   - Add type checks for table names

## Risk Assessment

- **High Risk:** Authentication failures
- **High Risk:** Data access issues
- **Medium Risk:** Performance degradation
- **Low Risk:** Type safety issues

## Verification Steps

1. **Check for GoTrueClient Warnings:**
   ```bash
   npm run dev
   # Open browser console, verify no multiple instance warnings
   ```

2. **Test Authentication:**
   - Login/logout functionality
   - Session persistence
   - Auth state changes

3. **Verify Data Access:**
   - Test CRUD operations
   - Check real-time subscriptions
   - Validate table name mappings