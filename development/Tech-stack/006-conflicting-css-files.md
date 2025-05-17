# Conflicting CSS Files

## Conflict Summary
Two global CSS files exist with conflicting CSS variable definitions, potentially causing inconsistent styling across the application.

## Forensic Analysis

### Files Present

1. **App Directory CSS:**
   - `/app/globals.css`
   - Contains Masonic-specific colors
   - More comprehensive variable set

2. **Styles Directory CSS:**
   - `/styles/globals.css`
   - Generic color scheme
   - Includes font family override

### Variable Conflicts

| Variable | app/globals.css | styles/globals.css |
|----------|----------------|-------------------|
| --primary | 221 80% 15% (Navy) | 0 0% 9% (Black) |
| --primary-foreground | 210 40% 98% | 0 0% 98% |
| --secondary | 42 45% 61% (Gold) | 0 0% 96.1% (Gray) |
| --foreground | 222 47% 11% | 0 0% 3.9% |
| --muted-foreground | 215.4 16.3% 46.9% | 0 0% 45.1% |

### Unique Elements

1. **app/globals.css has:**
   ```css
   /* Masonic-specific colors */
   --color-primary: 25 59 103; /* Navy Blue */
   --color-secondary: 180 159 95; /* Gold */
   --color-accent: 130 20 30; /* Deep Red */
   ```

2. **styles/globals.css has:**
   ```css
   body {
     font-family: Arial, Helvetica, sans-serif;
   }
   
   @layer utilities {
     .text-balance {
       text-wrap: balance;
     }
   }
   ```

### Import Analysis

```bash
# Check which CSS file is actually imported
grep -r "globals.css" --include="*.tsx" --include="*.ts" .
```

Most likely, Next.js App Router uses `/app/globals.css` by default.

## Recommended Remediation

### Decision: Keep `/app/globals.css` as primary

**Rationale:**
1. App directory is Next.js 13+ convention
2. Contains Masonic-specific branding colors
3. More comprehensive variable definitions
4. Properly themed for the application

### Immediate Actions

1. **Merge unique content from styles/globals.css:**
   ```css
   /* Add to app/globals.css if needed */
   body {
     font-family: Arial, Helvetica, sans-serif;
   }
   
   @layer utilities {
     .text-balance {
       text-wrap: balance;
     }
   }
   ```

2. **Remove duplicate file:**
   ```bash
   rm styles/globals.css
   ```

3. **Update any imports:**
   ```bash
   # Find and update imports
   grep -r "styles/globals.css" --include="*.tsx" --include="*.ts" .
   ```

### Detailed Migration

1. **Compare both files thoroughly:**
   ```bash
   # Use diff to find all differences
   diff app/globals.css styles/globals.css
   ```

2. **Create merged version:**
   ```css
   /* app/globals.css - Final version */
   @tailwind base;
   @tailwind components;
   @tailwind utilities;
   
   /* Custom font from styles/globals.css */
   body {
     font-family: Arial, Helvetica, sans-serif;
   }
   
   @layer utilities {
     .text-balance {
       text-wrap: balance;
     }
   }
   
   @layer base {
     :root {
       /* Keep Masonic-themed colors from app/globals.css */
       --primary: 221 80% 15%;
       --secondary: 42 45% 61%;
       /* ... rest of variables ... */
     }
   }
   ```

3. **Test visual appearance:**
   - Check all pages for styling consistency
   - Verify Masonic colors are applied correctly
   - Ensure font family is applied

### Color Scheme Analysis

**App globals.css (Masonic theme):**
- Primary: Navy Blue (221 80% 15%)
- Secondary: Gold (42 45% 61%)
- Accent: Deep Red (custom variables)

**Styles globals.css (Generic theme):**
- Primary: Black (0 0% 9%)
- Secondary: Light Gray (0 0% 96.1%)
- No brand colors

### Long-term Strategy

1. **Single Source of Truth:**
   - Only `/app/globals.css` for global styles
   - Component-specific styles in CSS modules or styled components

2. **Color Documentation:**
   ```css
   /* app/globals.css */
   @layer base {
     :root {
       /* Brand Colors - Masonic Theme */
       --primary: 221 80% 15%; /* Navy Blue */
       --secondary: 42 45% 61%; /* Gold */
       --color-accent: 130 20 30; /* Deep Red */
       
       /* UI Colors */
       --background: 0 0% 100%;
       --foreground: 222 47% 11%;
       /* ... */
     }
   }
   ```

3. **Prevent Future Conflicts:**
   ```json
   // .gitignore
   styles/globals.css
   
   // ESLint config
   {
     "rules": {
       "no-restricted-imports": ["error", {
         "patterns": ["*/styles/globals.css"]
       }]
     }
   }
   ```

## Risk Assessment

- **High Risk:** Visual inconsistencies if wrong file is used
- **Medium Risk:** Lost styling during migration
- **Low Risk:** Build failures (CSS is forgiving)

## Verification Steps

1. **Backup current state:**
   ```bash
   cp styles/globals.css styles/globals.css.backup
   ```

2. **Test with both files:**
   - Note current appearance
   - Switch imports if needed
   - Compare visual differences

3. **Merge and test:**
   ```bash
   # After merging content
   npm run dev
   # Check all pages visually
   ```

4. **Remove duplicate:**
   ```bash
   rm styles/globals.css
   rm -rf styles/  # If directory is empty
   ```

5. **Final verification:**
   - Build succeeds
   - No missing styles
   - Consistent appearance