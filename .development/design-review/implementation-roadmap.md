# Design System Implementation Roadmap

## Overview
Based on the design review and existing elements analysis, this roadmap outlines how to leverage existing code to create a cohesive design system.

## Phase 1: Foundation Consolidation (Week 1)

### 1.1 Color System Unification
**Existing Assets to Leverage:**
- Tailwind masonic colors in `tailwind.config.ts`
- CSS variables in `/app/globals.css`

**Tasks:**
1. Create unified color palette file:
   ```typescript
   // lib/design-system/colors.ts
   export const colors = {
     brand: {
       navy: "#0A2240",    // Use existing masonic.navy
       gold: "#C8A870",    // Use existing masonic.gold
       lightgold: "#E5D6B9", // Use existing masonic.lightgold
       blue: "#0F3B6F",    // Use existing masonic.blue
       lightblue: "#E6EBF2", // Use existing masonic.lightblue
     },
     semantic: {
       primary: "var(--masonic-navy)",
       secondary: "var(--masonic-gold)",
       error: "var(--destructive)",
       success: "var(--masonic-gold)",
       warning: "var(--warning)",
     }
   }
   ```

2. Update `globals.css` to use single source:
   ```css
   :root {
     /* Brand Colors */
     --masonic-navy: #0A2240;
     --masonic-gold: #C8A870;
     /* ... rest of colors */
     
     /* Semantic Colors */
     --primary: var(--masonic-navy);
     --secondary: var(--masonic-gold);
   }
   ```

### 1.2 Typography System
**Existing Assets:**
- Font family definitions in CSS
- Heading styles using `font-serif`

**Tasks:**
1. Create typography scale:
   ```typescript
   // lib/design-system/typography.ts
   export const typography = {
     fontFamily: {
       serif: "font-serif",
       sans: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
     },
     scale: {
       h1: "text-3xl font-bold",
       h2: "text-2xl font-bold",
       h3: "text-xl font-semibold",
       body: "text-base font-normal",
       small: "text-sm font-normal",
     }
   }
   ```

2. Create Typography component:
   ```typescript
   // components/ui/typography.tsx
   import { cn } from "@/lib/utils"
   
   export function Heading({ level, className, ...props }: HeadingProps) {
     const Component = `h${level}` as const
     return (
       <Component 
         className={cn(typography.scale[`h${level}`], className)}
         {...props}
       />
     )
   }
   ```

### 1.3 Spacing System
**Existing Assets:**
- Tailwind spacing utilities
- Container patterns in `globals.css`

**Tasks:**
1. Define spacing scale:
   ```typescript
   // lib/design-system/spacing.ts
   export const spacing = {
     scale: {
       1: "0.25rem",  // 4px
       2: "0.5rem",   // 8px
       3: "0.75rem",  // 12px
       4: "1rem",     // 16px
       5: "1.5rem",   // 24px
       6: "2rem",     // 32px
       8: "3rem",     // 48px
     },
     patterns: {
       containerPadding: "px-4 sm:px-6 lg:px-8",
       sectionSpacing: "space-y-6",
       cardPadding: "p-6",
     }
   }
   ```

## Phase 2: Component Enhancement (Week 2)

### 2.1 Extend Existing shadcn/ui Components
**Existing Assets:**
- Button component with variants
- Card component structure
- Alert component

**Tasks:**
1. Create extended Button with masonic variants:
   ```typescript
   // components/ui/button-masonic.tsx
   import { Button, ButtonProps } from "@/components/ui/button"
   import { cva } from "class-variance-authority"
   
   const masonicButtonVariants = cva("", {
     variants: {
       variant: {
         primary: "bg-masonic-navy text-white hover:bg-masonic-blue",
         secondary: "bg-masonic-gold text-masonic-navy hover:bg-masonic-lightgold",
         outline: "border-masonic-navy text-masonic-navy hover:bg-masonic-lightblue",
       }
     }
   })
   
   export function MasonicButton({ variant, ...props }: ButtonProps) {
     return <Button className={masonicButtonVariants({ variant })} {...props} />
   }
   ```

2. Standardize Card usage:
   ```typescript
   // components/ui/card-masonic.tsx
   import { Card, CardProps } from "@/components/ui/card"
   import { cn } from "@/lib/utils"
   
   export function MasonicCard({ className, ...props }: CardProps) {
     return (
       <Card 
         className={cn(
           "border-masonic-navy overflow-hidden",
           "hover:shadow-lg transition-shadow",
           className
         )}
         {...props}
       />
     )
   }
   ```

### 2.2 Create Composite Components
**Existing Assets:**
- SectionHeader component
- EventCard pattern

**Tasks:**
1. Enhance SectionHeader:
   ```typescript
   // components/ui/section-header.tsx
   import { Heading } from "./typography"
   
   export function SectionHeader({ title, description, children }) {
     return (
       <div className="text-center mb-8">
         {title && <Heading level={1} className="text-masonic-navy">{title}</Heading>}
         {children || <div className="masonic-divider" />}
         {description && <p className="text-gray-600 mt-4">{description}</p>}
       </div>
     )
   }
   ```

2. Create FormField component:
   ```typescript
   // components/ui/form-field.tsx
   export function FormField({ label, error, children }) {
     return (
       <div className="space-y-2">
         <Label>{label}</Label>
         {children}
         {error && <span className="text-sm text-destructive">{error}</span>}
       </div>
     )
   }
   ```

## Phase 3: Registration Wizard Refactor (Week 3)

### 3.1 Update Step Components
**Tasks:**
1. Replace inline styles with design system:
   ```typescript
   // Before
   <h1 className="text-2xl font-bold text-masonic-navy">Title</h1>
   
   // After
   <Heading level={1}>Title</Heading>
   ```

2. Use standardized components:
   ```typescript
   // Before
   <Button className="bg-masonic-navy hover:bg-masonic-blue">
   
   // After
   <MasonicButton variant="primary">
   ```

### 3.2 Standardize Layouts
**Tasks:**
1. Create consistent step wrapper:
   ```typescript
   // components/register/step-wrapper.tsx
   export function StepWrapper({ children, title, description }) {
     return (
       <div className={spacing.patterns.sectionSpacing}>
         <SectionHeader title={title} description={description} />
         {children}
       </div>
     )
   }
   ```

## Phase 4: Documentation & Tooling (Week 4)

### 4.1 Create Storybook
**Tasks:**
1. Set up Storybook
2. Document all components
3. Create usage examples

### 4.2 Design System Documentation
**Tasks:**
1. Create style guide
2. Document patterns
3. Usage guidelines

## Implementation Checklist

### Immediate Actions
- [ ] Consolidate color definitions
- [ ] Create typography scale
- [ ] Define spacing system
- [ ] Extend shadcn/ui components

### Short-term Goals
- [ ] Refactor registration steps
- [ ] Create reusable patterns
- [ ] Update all components

### Long-term Goals
- [ ] Complete documentation
- [ ] Set up Storybook
- [ ] Create contribution guidelines
- [ ] Establish review process

## Success Metrics
1. **Consistency**: All steps use same components
2. **Maintainability**: Single source of truth
3. **Developer Experience**: Clear documentation
4. **Performance**: No duplicate styles
5. **Accessibility**: WCAG compliance

## Risk Mitigation
1. **Gradual Migration**: Update components incrementally
2. **Backward Compatibility**: Maintain existing APIs
3. **Testing**: Verify each change
4. **Documentation**: Update as you go
5. **Team Alignment**: Regular reviews

## Conclusion
By leveraging existing assets and following this roadmap, we can create a cohesive design system that:
- Builds on current code
- Minimizes breaking changes
- Provides immediate value
- Scales for future needs