# LodgeTix Design System Refactor - Implementation Plan

## SYSTEM PROMPT

You are a Front-End Engineer tasked with implementing a comprehensive design system refactor for the LodgeTix ticketing platform. This refactor focuses on creating consistent, mobile-first responsive layouts with proper typography, color, and spacing systems. The primary goal is to improve the mobile user experience while maintaining desktop efficiency.

## CRITICAL REQUIREMENTS

1. **Mobile-First Approach**: All implementations must work excellently on mobile devices first
2. **Touch-Friendly**: Minimum 48px touch targets with proper spacing
3. **Two-Column Mobile Layout**: Implement consistent 2-column layouts on mobile where appropriate
4. **Design System Consistency**: Use existing Tailwind masonic colors and shadcn/ui components
5. **Progressive Enhancement**: Build from mobile up to desktop, not desktop down

## IMPLEMENTATION CHECKLIST

### Phase 1: Foundation Setup

- [ ] **Step 01**: Set up Tailwind configuration
  - [ ] Review 01-tailwind-configuration.md
  - [ ] Ensure masonic color palette is properly configured
  - [ ] Add custom spacing scale if needed
  - [ ] Configure typography scale
  - [ ] Add responsive breakpoints

- [ ] **Step 02**: Create core layout components
  - [ ] Review 02-form-layout-components.md
  - [ ] Implement FormGrid component
  - [ ] Implement FieldLayout component (small/medium/large)
  - [ ] Create mobile-first responsive grid utilities
  - [ ] Test touch targets and spacing

### Phase 2: Typography & Colors

- [ ] **Step 03**: Implement typography system
  - [ ] Review 03-typography-system.md
  - [ ] Create typography scale with CSS variables
  - [ ] Update all headings to use consistent sizes
  - [ ] Implement text components for consistent styling
  - [ ] Replace inline text styles

- [ ] **Step 04**: Consolidate color usage
  - [ ] Review 04-color-consolidation.md
  - [ ] Audit current color usage across components
  - [ ] Remove duplicate color definitions
  - [ ] Update components to use masonic palette
  - [ ] Create semantic color mappings

### Phase 3: Core Components Update

- [ ] **Step 05**: Refactor form fields
  - [ ] Review 05-form-field-redesign.md
  - [ ] Update form fields to use new layout system
  - [ ] Implement responsive field sizing
  - [ ] Add proper labels and error states
  - [ ] Ensure touch-friendly inputs

- [ ] **Step 06**: Update card components
  - [ ] Review 06-card-component-system.md
  - [ ] Standardize card padding and spacing
  - [ ] Implement consistent borders and shadows
  - [ ] Add proper header/content/footer structure
  - [ ] Ensure mobile responsiveness

### Phase 4: Registration Flow Updates

- [ ] **Step 07**: Refactor Mason form
  - [ ] Review 07-mason-form-refactor.md
  - [ ] Implement new grid layout
  - [ ] Apply field sizing system
  - [ ] Update sections to use consistent spacing
  - [ ] Test mobile experience

- [ ] **Step 08**: Refactor Guest form
  - [ ] Review 08-guest-form-refactor.md
  - [ ] Apply same patterns as Mason form
  - [ ] Ensure consistent field layouts
  - [ ] Update partner forms
  - [ ] Test mobile experience

### Phase 5: Step Components

- [ ] **Step 09**: Update attendee cards
  - [ ] Review 09-attendee-card-redesign.md
  - [ ] Implement two-column mobile layout
  - [ ] Fix touch targets for remove button
  - [ ] Update partner information display
  - [ ] Test collapsible sections

- [ ] **Step 10**: Refactor ticket selection
  - [ ] Review 10-ticket-selection-redesign.md
  - [ ] Replace table layouts with responsive flex/grid
  - [ ] Implement sticky order summary
  - [ ] Update mobile collapsed views
  - [ ] Fix touch targets

- [ ] **Step 11**: Update order review
  - [ ] Review 11-order-review-redesign.md
  - [ ] Implement sidebar layout on desktop
  - [ ] Create mobile-friendly summary
  - [ ] Update attendee review cards
  - [ ] Test responsive behavior

### Phase 6: Modal & Mobile Optimizations

- [ ] **Step 12**: Update modals for mobile
  - [ ] Review 12-modal-mobile-optimization.md
  - [ ] Implement dvh units for mobile
  - [ ] Add proper close buttons
  - [ ] Ensure content scrollability
  - [ ] Test on various devices

- [ ] **Step 13**: Responsive utilities
  - [ ] Review 13-responsive-utilities.md
  - [ ] Create mobile detection hooks
  - [ ] Implement responsive helper components
  - [ ] Add touch gesture support
  - [ ] Update navigation patterns

### Phase 7: Testing & Documentation

- [ ] **Step 14**: Cross-browser testing
  - [ ] Review 14-testing-checklist.md
  - [ ] Test on iOS Safari
  - [ ] Test on Android Chrome
  - [ ] Test on desktop browsers
  - [ ] Document any issues found

- [ ] **Step 15**: Update Storybook/Documentation
  - [ ] Review 15-documentation-updates.md
  - [ ] Create component documentation
  - [ ] Add usage examples
  - [ ] Document design tokens
  - [ ] Update README files

## TESTING CHECKLIST

### Mobile Testing (Priority 1)
- [ ] iPhone SE (375px) - smallest common device
- [ ] iPhone 14 Pro (390px)
- [ ] Samsung Galaxy S21 (384px)
- [ ] iPad Mini (768px)

### Desktop Testing
- [ ] Laptop (1366px)
- [ ] Desktop (1920px)
- [ ] Wide screen (2560px)

### Accessibility Testing
- [ ] Keyboard navigation
- [ ] Screen reader compatibility
- [ ] Color contrast ratios
- [ ] Touch target sizes

### Performance Testing
- [ ] Page load times
- [ ] JavaScript bundle size
- [ ] CSS file size
- [ ] Interaction responsiveness

## SUCCESS CRITERIA

1. **Mobile Experience**: Users can complete registration on mobile without zooming
2. **Touch Friendly**: All interactive elements meet 48px minimum touch target
3. **Visual Consistency**: All pages use the same color palette and typography
4. **Responsive**: Layouts adapt smoothly from 320px to 2560px
5. **Performance**: No degradation in load times or interactivity

## NOTES FOR IMPLEMENTATION

- Start with the foundation (Steps 1-2) before moving to specific components
- Test each phase thoroughly on mobile before proceeding
- Keep the existing functionality intact while improving the UI
- Document any breaking changes or API updates
- Use existing shadcn/ui components wherever possible
- Leverage the masonic color palette already in Tailwind config

## RESOURCES

- Design System Documentation: `.development/design-review/`
- Tailwind Config: `tailwind.config.ts`
- shadcn/ui Components: `/components/ui/`
- Existing Masonic Styles: `/app/globals.css`

---

**Remember**: Mobile-first, touch-friendly, consistent design system. When in doubt, prioritize the mobile experience.