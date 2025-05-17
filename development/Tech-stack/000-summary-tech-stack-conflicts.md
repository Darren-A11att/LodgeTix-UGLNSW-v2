# Tech Stack Conflicts Summary

This directory contains detailed forensic analysis of technology conflicts found in the LodgeTix-UGLNSW-v2 codebase. Each conflict has been documented with specific remediation steps.

## Conflicts Identified

### 1. [Package Manager Conflicts](./001-package-manager-conflicts.md)
- **Issue**: Multiple package managers (npm, pnpm, bun)
- **Impact**: Build inconsistencies, dependency conflicts
- **Solution**: Standardize on npm, remove other lock files

### 2. [Duplicate Supabase Clients](./002-duplicate-supabase-clients.md)
- **Issue**: Multiple Supabase client instances causing GoTrueClient warnings
- **Impact**: Authentication issues, memory overhead
- **Solution**: Use single shared client from `supabase-browser.ts`

### 3. [Icon Library Conflicts](./003-icon-library-conflicts.md)
- **Issue**: Four different icon libraries installed
- **Impact**: Bundle bloat, inconsistent design
- **Solution**: Standardize on lucide-react

### 4. [UI Component Library Conflicts](./004-ui-component-library-conflicts.md)
- **Issue**: Headless UI + Radix UI + shadcn/ui overlap
- **Impact**: Redundant functionality, larger bundle
- **Solution**: Remove Headless UI, use only shadcn/ui

### 5. [Duplicate Hook Files](./005-duplicate-hook-files.md)
- **Issue**: Hooks duplicated in `/hooks/` and `/components/ui/`
- **Impact**: Import confusion, maintenance overhead
- **Solution**: Keep hooks in `/hooks/` directory only

### 6. [Conflicting CSS Files](./006-conflicting-css-files.md)
- **Issue**: Two globals.css with different variables
- **Impact**: Styling inconsistencies
- **Solution**: Use only `/app/globals.css`

### 7. [React Router vs Next.js Router](./007-react-router-vs-nextjs-router.md)
- **Issue**: React Router installed but unused
- **Impact**: Unnecessary dependency
- **Solution**: Remove react-router-dom

### 8. [Environment Variable Conflicts](./008-environment-variable-conflicts.md)
- **Issue**: Vite syntax in `supabase copy.ts`
- **Impact**: Build failures
- **Solution**: Remove file, use Next.js conventions

### 9. [Version Pinning Issues](./009-version-pinning-issues.md)
- **Issue**: Packages using "latest" version
- **Impact**: Unpredictable updates
- **Solution**: Pin specific versions

## Priority Order

Based on impact and ease of implementation:

### High Priority (Do First)
1. Package Manager Conflicts - Critical for build consistency
2. Duplicate Supabase Clients - Already causing errors
3. Environment Variable Conflicts - Can cause build failures

### Medium Priority
4. Version Pinning Issues - Affects build reproducibility
5. Conflicting CSS Files - Visual inconsistencies
6. Duplicate Hook Files - Code organization

### Low Priority (Easy Wins)
7. React Router Removal - Simple uninstall
8. Icon Library Conflicts - Only 2 files to update
9. UI Component Library - Only 1 file affected

## Implementation Checklist

- [ ] Choose npm as package manager, remove other lock files
- [ ] Remove duplicate Supabase client files
- [ ] Update remaining Supabase imports
- [ ] Remove `supabase copy.ts` (Vite env vars)
- [ ] Pin package versions (remove "latest")
- [ ] Consolidate CSS files to `/app/globals.css`
- [ ] Remove duplicate hook files from `/components/ui/`
- [ ] Update hook imports in affected files
- [ ] Uninstall react-router-dom
- [ ] Replace react-icons and heroicons usage
- [ ] Uninstall unused icon libraries
- [ ] Replace Headless UI Combobox with shadcn/ui
- [ ] Uninstall @headlessui/react
- [ ] Update documentation with decisions

## Testing After Changes

1. Run `npm install` with clean node_modules
2. Build the application: `npm run build`
3. Start development server: `npm run dev`
4. Test authentication (Supabase)
5. Verify styling consistency
6. Check that all icons display correctly
7. Test combobox functionality
8. Verify mobile detection works
9. Test toast notifications

## Documentation Updates

Add to CLAUDE.md:
- Package manager choice (npm)
- Icon library standard (lucide-react)
- Hook location convention (/hooks/)
- Environment variable patterns
- Version management policy

## Long-term Maintenance

1. Regular dependency audits
2. Enforce standards via ESLint rules
3. Pre-commit hooks for version checking
4. Team education on conventions
5. Periodic tech debt reviews