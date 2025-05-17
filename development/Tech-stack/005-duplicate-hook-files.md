# Duplicate Hook Files

## Conflict Summary
Custom React hooks are duplicated between `/hooks/` and `/components/ui/` directories, creating confusion about which to import and maintain.

## Forensic Analysis

### Duplicate Files

1. **use-toast Hook:**
   - `/hooks/use-toast.ts` (194 lines)
   - `/components/ui/use-toast.ts` (194 lines)
   - **Identical content**

2. **use-mobile Hook:**
   - `/hooks/use-mobile.tsx` (19 lines)
   - `/components/ui/use-mobile.tsx` (19 lines)  
   - **Identical content**

### Current Usage

1. **use-toast imports:**
   ```typescript
   // Only one file imports it
   /components/ui/toaster.tsx: import { useToast } from "@/hooks/use-toast"
   ```

2. **use-mobile imports:**
   ```typescript
   // Two files import from different locations
   /components/ui/sidebar.tsx: import { useIsMobile } from "@/hooks/use-mobile"
   /components/ui/main-app-shell.tsx: import { useIsMobile } from '@/components/ui/use-mobile'
   ```

### Import Inconsistency

- `toaster.tsx` imports from `/hooks/`
- `sidebar.tsx` imports from `/hooks/`
- `main-app-shell.tsx` imports from `/components/ui/`

This inconsistency shows confusion about the correct location.

## Recommended Remediation

### Decision: Keep hooks in `/hooks/` directory

**Rationale:**
1. Follows React convention (hooks in dedicated directory)
2. Clear separation of concerns
3. Easy to find all custom hooks
4. `/components/ui/` should contain only UI components

### Immediate Actions

1. **Remove duplicates from /components/ui/:**
   ```bash
   rm /components/ui/use-toast.ts
   rm /components/ui/use-mobile.tsx
   ```

2. **Update imports in main-app-shell.tsx:**
   ```typescript
   // Change from:
   import { useIsMobile } from '@/components/ui/use-mobile'
   
   // To:
   import { useIsMobile } from '@/hooks/use-mobile'
   ```

3. **Verify no other imports:**
   ```bash
   # Check for any other imports from ui directory
   grep -r "from.*components/ui/use-" --include="*.tsx" --include="*.ts" .
   ```

### Implementation Steps

1. **Update main-app-shell.tsx:**
   ```bash
   # Fix the import path
   sed -i '' "s|from '@/components/ui/use-mobile'|from '@/hooks/use-mobile'|g" \
     components/ui/main-app-shell.tsx
   ```

2. **Remove duplicate files:**
   ```bash
   rm components/ui/use-toast.ts
   rm components/ui/use-mobile.tsx
   ```

3. **Test the changes:**
   ```bash
   npm run build
   # Ensure no import errors
   ```

### Long-term Strategy

1. **Establish Hook Conventions:**
   - All custom hooks in `/hooks/`
   - UI components in `/components/ui/`
   - Shared utilities in `/lib/`

2. **Update Documentation:**
   ```markdown
   # CLAUDE.md addition:
   ## Directory Structure
   - `/hooks/` - Custom React hooks (use-toast, use-mobile, etc.)
   - `/components/ui/` - Reusable UI components only
   ```

3. **Prevent Future Duplicates:**
   ```json
   // ESLint rule
   {
     "rules": {
       "no-restricted-imports": ["error", {
         "patterns": ["*/components/ui/use-*"]
       }]
     }
   }
   ```

4. **File Structure Guidelines:**
   ```
   /hooks/
   ├── use-toast.ts      # Toast notifications hook
   ├── use-mobile.tsx    # Mobile detection hook
   └── use-*.ts         # Other custom hooks
   
   /components/ui/
   ├── toast.tsx        # Toast UI component
   ├── toaster.tsx      # Toast container
   └── *.tsx           # Other UI components only
   ```

## Risk Assessment

- **Low Risk:** Simple file moves and import updates
- **Low Impact:** Only 3 files affected
- **High Benefit:** Clear project structure

## Verification Steps

1. **Remove Duplicate Files:**
   ```bash
   rm components/ui/use-toast.ts
   rm components/ui/use-mobile.tsx
   ```

2. **Update Import:**
   - Edit `main-app-shell.tsx` import path

3. **Build Test:**
   ```bash
   npm run build
   ```

4. **Runtime Test:**
   - Test mobile detection
   - Test toast notifications
   - Verify no console errors

5. **Confirm File Structure:**
   ```bash
   ls -la hooks/use-*
   ls -la components/ui/use-*  # Should be empty
   ```

## Alternative Approach

If there's a specific reason for UI directory placement:
1. Move ALL hooks to `/components/ui/`
2. Update ALL imports consistently
3. Document the decision

However, standard React convention favors `/hooks/` directory.