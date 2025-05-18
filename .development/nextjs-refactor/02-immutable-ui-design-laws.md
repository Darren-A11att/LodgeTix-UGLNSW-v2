# Immutable UI Design Laws

## Core Laws for User Interface

These are the non-negotiable UI laws that MUST be followed in all Next.js development:

### Law 1: Component Composition Hierarchy
- Components must be composed from smaller, single-responsibility units
- Each component serves exactly one purpose
- Parent components only orchestrate child components
- Never duplicate component logic - extract and reuse
- Maximum component file size: 200 lines

### Law 2: Mobile-First Responsive Design
- All UI must be designed for mobile screens first
- Desktop layouts extend mobile designs, never replace
- Use CSS logical properties for international support
- Test all breakpoints in development
- Never use fixed pixel widths for containers

### Law 3: Accessibility is Mandatory
- Every interactive element must be keyboard accessible
- All images require meaningful alt text
- Color alone must never convey information
- Focus indicators must be clearly visible
- ARIA labels required for non-text content

### Law 4: User Feedback for Every Action
- All user actions must provide immediate feedback
- Loading states required for async operations
- Error messages must be actionable
- Success confirmations must be clear
- Progress indicators for multi-step processes

### Law 5: Consistent Design System Usage
- Only use tokens from the design system
- Never hardcode colors, spacing, or typography
- All components must use theme variables
- Custom styles require design system extension
- Component variants must be documented

### Law 6: Performance-First Rendering
- Lazy load all below-fold components
- Images must use Next.js Image component
- Minimize client-side JavaScript
- Code-split at route boundaries
- Implement virtual scrolling for long lists

### Law 7: State Management Proximity
- State must live closest to where it's used
- Lift state only when required by multiple components
- Global state only for truly global data
- Form state must be isolated per form
- Never store derived state

### Law 8: Error Boundaries Required
- Every page must have an error boundary
- Major UI sections need their own boundaries
- Error fallbacks must match brand design
- User data must survive error states
- Error recovery actions must be provided

### Law 9: Separation of Concerns
- UI components handle presentation only
- Business logic must live in separate files
- Styling, markup, and behavior clearly separated
- Data fetching separated from display
- Event handlers extracted when complex

### Law 10: Testing Coverage Requirements
- All components must have visual regression tests
- Interactive elements require interaction tests
- Accessibility tests for every component
- Responsive behavior must be tested
- Error states must have test coverage

## Enforcement

These laws are enforced through:
1. Component design reviews before implementation
2. Automated accessibility testing in CI
3. Performance budgets in build pipeline
4. Visual regression testing
5. Code review checklist requirements

## References

- [07-component-patterns.md](./07-component-patterns.md) - Detailed implementation
- [15-accessibility-patterns.md](./15-accessibility-patterns.md) - WCAG compliance
- [16-performance-patterns.md](./16-performance-patterns.md) - Performance guidelines