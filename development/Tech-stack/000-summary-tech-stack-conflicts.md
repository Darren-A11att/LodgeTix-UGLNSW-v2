# Tech Stack Conflicts Summary

This directory contains detailed forensic analysis of technology conflicts found in the LodgeTix-UGLNSW-v2 codebase. Each conflict has been documented with specific remediation steps.

## Conflicts Identified

### Active Issues

#### 1. [Package Manager Conflicts](./001-package-manager-conflicts.md)
- **Issue**: Multiple package managers (npm, pnpm, bun)
- **Impact**: Build inconsistencies, dependency conflicts
- **Solution**: Standardize on npm, remove other lock files

#### 2. [Duplicate Supabase Clients](./002-duplicate-supabase-clients.md)
- **Issue**: Multiple Supabase client instances causing GoTrueClient warnings
- **Impact**: Authentication issues, memory overhead
- **Solution**: Use single shared client from `supabase-browser.ts`

#### 4. [UI Component Library Conflicts](./004-ui-component-library-conflicts.md)
- **Issue**: Headless UI + Radix UI + shadcn/ui overlap
- **Impact**: Redundant functionality, larger bundle
- **Solution**: Remove Headless UI, use only shadcn/ui

#### 6. [Conflicting CSS Files](./006-conflicting-css-files.md)
- **Issue**: Two globals.css with different variables
- **Impact**: Styling inconsistencies
- **Solution**: Use only `/app/globals.css`

#### 8. [Environment Variable Conflicts](./008-environment-variable-conflicts.md)
- **Issue**: Vite syntax in `supabase copy.ts`
- **Impact**: Build failures
- **Solution**: Remove file, use Next.js conventions

#### 9. [Version Pinning Issues](./009-version-pinning-issues.md)
- **Issue**: Packages using "latest" version
- **Impact**: Unpredictable updates
- **Solution**: Pin specific versions

### Resolved Issues ✅

#### 3. [Icon Library Conflicts](./DONE-icon-library-conflicts.md) ✅
- **Issue**: Four different icon libraries installed
- **Impact**: Bundle bloat, inconsistent design
- **Solution**: Standardized on lucide-react

#### 5. [Duplicate Hook Files](./DONE-duplicate-hook-files.md) ✅
- **Issue**: Hooks duplicated in `/hooks/` and `/components/ui/`
- **Impact**: Import confusion, maintenance overhead
- **Solution**: Kept hooks in `/hooks/` directory only

#### 7. [React Router vs Next.js Router](./DONE-react-router-vs-nextjs-router.md) ✅
- **Issue**: React Router installed but unused
- **Impact**: Unnecessary dependency
- **Solution**: Removed react-router-dom

## Priority Order

Based on impact and ease of implementation:

### High Priority (Do First)
1. Package Manager Conflicts - Critical for build consistency
2. Duplicate Supabase Clients - Already causing errors
3. Environment Variable Conflicts - Can cause build failures

### Medium Priority
4. Version Pinning Issues - Affects build reproducibility
5. Conflicting CSS Files - Visual inconsistencies
9. UI Component Library - Only 1 file affected

### Low Priority (Easy Wins) - ✅ COMPLETED
6. ✅ Duplicate Hook Files - Code organization
7. ✅ React Router Removal - Simple uninstall
8. ✅ Icon Library Conflicts - Only 2 files to update

## Implementation Checklist

### Completed ✅
- [x] Remove duplicate hook files from `/components/ui/`
- [x] Update hook imports in affected files
- [x] Uninstall react-router-dom
- [x] Replace react-icons and heroicons usage
- [x] Uninstall unused icon libraries

### Remaining Tasks
- [ ] Choose npm as package manager, remove other lock files
- [ ] Remove duplicate Supabase client files
- [ ] Update remaining Supabase imports
- [ ] Remove `supabase copy.ts` (Vite env vars)
- [ ] Pin package versions (remove "latest")
- [ ] Consolidate CSS files to `/app/globals.css`
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