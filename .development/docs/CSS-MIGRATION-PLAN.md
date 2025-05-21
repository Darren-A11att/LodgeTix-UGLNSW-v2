# CSS Consolidation Migration Plan

## Current State
- CSS variables are defined in multiple files:
  - `style/styles/globals.css`: Main theme variables (--primary, --secondary, etc.)
  - `style/styles/globals.css`: Overlapping theme variables with different values
  - `shared/theme/index.css`: Additional masonic color variables (--color-primary, etc.)
- Inconsistent usage of color values:
  - Direct Tailwind colors (`bg-slate-50`, `border-slate-300`)
  - HSL variables (`bg-primary`, `text-primary-foreground`)
  - RGB variables (`rgba(var(--color-primary), 0.5)`)

## Migration Plan

### Phase 1: Consolidate Variables into style/styles/globals.css

1. **Keep only ONE globals.css file**
   - Use `style/styles/globals.css` as the single source of truth
   - Remove duplicate variable declarations from `style/styles/globals.css`
   - Move unique variables from `style/styles/globals.css` to `style/styles/globals.css`

2. **Standardize variable format**
   - Convert all variables to HSL format (current shadcn/ui standard)
   - Rename --color-primary to --masonic-navy
   - Rename --color-secondary to --masonic-gold
   - Rename --color-accent to --masonic-red

3. **Consolidate masonic theme**
   - Add HSL equivalents of masonic colors from tailwind.config.ts
   - Ensure named variables match the existing tailwind theme

### Phase 2: Update Component References

1. **Update imports**
   - Remove imports for deleted CSS files
   - Ensure all components import only `style/styles/globals.css`

2. **Standardize color usage**
   - Replace direct Tailwind colors with CSS variable equivalents
   - Use consistent format for referencing variables (hsl(var(--variable)))

3. **Update tailwind.config.ts**
   - Ensure all theme colors reference the CSS variables
   - Remove redundant color definitions

### Phase 3: Cleanup & Documentation

1. **Remove obsolete files**
   - Delete `style/styles/globals.css` after migration
   - Move any unique non-variable styles from `shared/theme/index.css` to `style/styles/globals.css`
   - Retain phone input styling in a separate file (scope: later task)

2. **Document color system**
   - Create documentation for the consolidated color system
   - Include usage examples for developers

## Implementation Steps

1. Create consolidated CSS variables in `style/styles/globals.css`
2. Incrementally migrate components to use the new variables
3. Test thoroughly in multiple browsers
4. Clean up obsolete files after full migration