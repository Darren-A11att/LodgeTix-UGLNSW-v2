# Immutable Theme Laws

## Core Theme Requirements

These are the non-negotiable theme laws that MUST be followed in all Next.js development:

### Law 1: Design Tokens Only
- All design values must be tokens
- Never use raw color/spacing values
- Semantic naming required for tokens
- Tokens defined in single source
- Design system compliance mandatory

### Law 2: CSS Variables Required
- Use CSS custom properties for theming
- Runtime theme switching must work
- No build-time theme compilation
- Support system preference detection
- Smooth theme transitions required

### Law 3: Type-Safe Themes
- Theme structure defined in TypeScript
- All theme usage must be typed
- Compile-time theme validation
- No arbitrary theme values
- Theme interface consistency

### Law 4: Dark Mode Support
- All components support dark mode
- Respect system dark mode preference
- Manual theme toggle available
- Consistent dark mode implementation
- Test both themes thoroughly

### Law 5: Accessible Color Contrast
- WCAG AA compliance required
- 4.5:1 ratio for normal text
- 3:1 ratio for large text
- Test all color combinations
- Document contrast ratios

### Law 6: Component Theme Variants
- Components use theme tokens only
- Variant styles through theme system
- No inline style overrides
- Consistent variant naming
- Document all variants

### Law 7: Theme Context Usage
- Single theme provider at root
- Theme hook for component access
- No prop drilling theme values
- Memoized theme calculations
- Efficient theme updates

### Law 8: Responsive Design Tokens
- Breakpoint tokens required
- Consistent spacing scale
- Fluid typography system
- Container width tokens
- Mobile-first token values

### Law 9: Theme Performance
- Minimize theme switch repaints
- Lazy load theme variations
- Cache theme preferences
- Optimize theme bundle size
- Prevent flash of unstyled content

### Law 10: Theme Documentation
- Document all design tokens
- Provide theme usage examples
- Visual token reference guide
- Theme migration guides
- Component theme patterns

## Enforcement

These laws are enforced through:
1. CSS linting for hard-coded values
2. TypeScript theme validation
3. Automated contrast testing
4. Theme coverage reports
5. Design system audits

## References

- [13-theme-patterns.md](./13-theme-patterns.md) - Implementation patterns
- [Material Design Guidelines](https://material.io/design)
- [Tailwind CSS Configuration](https://tailwindcss.com/docs/configuration)