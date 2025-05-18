# Step 15: Update Storybook/Documentation

## System Prompt
You are creating comprehensive documentation for the LodgeTix design system, including component documentation, usage examples, design tokens, and README updates.

## Implementation Checklist

### 1. Create Design System Documentation

Location: `/docs/design-system/README.md`

```markdown
# LodgeTix Design System

## Overview
The LodgeTix Design System provides a consistent, accessible, and mobile-first approach to building user interfaces for the Masonic event ticketing platform.

## Core Principles
1. **Mobile-First**: Designed for mobile, enhanced for desktop
2. **Accessible**: WCAG AA compliant, keyboard navigable
3. **Consistent**: Unified visual language across all components
4. **Performant**: Optimized for speed and efficiency
5. **Masonic Heritage**: Respectful use of traditional symbolism

## Design Tokens

### Colors
```scss
// Primary Palette
$masonic-navy: #0A2240;    // Primary brand color
$masonic-gold: #C8A870;    // Accent color
$masonic-lightgold: #E5D6B9; // Light accent
$masonic-blue: #0F3B6F;    // Secondary blue
$masonic-lightblue: #E6EBF2; // Background blue

// Semantic Colors
$primary: $masonic-navy;
$secondary: $masonic-gold;
$success: #10B981;
$error: #EF4444;
$warning: #F59E0B;
$info: #3B82F6;
```

### Typography
```scss
// Type Scale
$text-xs: 0.75rem;    // 12px
$text-sm: 0.875rem;   // 14px
$text-base: 1rem;     // 16px
$text-lg: 1.125rem;   // 18px
$text-xl: 1.25rem;    // 20px
$text-2xl: 1.5rem;    // 24px
$text-3xl: 1.875rem;  // 30px
$text-4xl: 2.25rem;   // 36px

// Font Weights
$font-normal: 400;
$font-medium: 500;
$font-semibold: 600;
$font-bold: 700;
```

### Spacing
```scss
// Spacing Scale
$space-1: 0.25rem;   // 4px
$space-2: 0.5rem;    // 8px
$space-3: 0.75rem;   // 12px
$space-4: 1rem;      // 16px
$space-5: 1.25rem;   // 20px
$space-6: 1.5rem;    // 24px
$space-8: 2rem;      // 32px
$space-10: 2.5rem;   // 40px
$space-12: 3rem;     // 48px
$space-16: 4rem;     // 64px
```

### Breakpoints
```scss
$mobile: 320px;      // Minimum supported
$mobile-lg: 375px;   // Larger phones
$tablet: 640px;      // Tablet portrait
$desktop: 1024px;    // Desktop
$desktop-lg: 1280px; // Large screens
$desktop-xl: 1536px; // Extra large
```

## Component Library

### Layout Components
- `FormGrid` - Responsive grid system
- `FieldLayout` - Form field sizing
- `ResponsiveContainer` - Max-width wrapper
- `SafeArea` - iOS safe area handling

### Form Components
- `TextField` - Text input with validation
- `SelectField` - Dropdown selection
- `TextareaField` - Multi-line input
- `CheckboxField` - Checkbox with label
- `RadioGroup` - Radio button group

### UI Components
- `Card` - Content container
- `Button` - Interactive actions
- `TouchTarget` - Mobile-optimized buttons
- `Modal` - Overlay dialogs
- `Toast` - Notifications

### Navigation
- `MobileNavigation` - Bottom nav bar
- `DesktopHeader` - Top navigation
- `Breadcrumbs` - Path indicators
- `StepIndicator` - Progress steps

## Usage Guidelines

### Mobile-First Development
```jsx
// Always start with mobile layout
<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
  <FieldLayout size="small">
    <TextField label="Title" />
  </FieldLayout>
  <FieldLayout size="small">
    <TextField label="Rank" />
  </FieldLayout>
  <FieldLayout size="medium">
    <TextField label="First Name" />
  </FieldLayout>
  <FieldLayout size="medium">
    <TextField label="Last Name" />
  </FieldLayout>
</div>
```

### Touch Targets
```jsx
// Ensure all interactive elements are touch-friendly
<TouchTarget
  variant="primary"
  size="lg" // Minimum 48px height
  onClick={handleClick}
>
  Submit Application
</TouchTarget>
```

### Responsive Images
```jsx
// Use responsive image sizing
<img
  src="/lodge-seal.jpg"
  alt="Lodge Seal"
  className="w-full max-w-md mx-auto"
  loading="lazy"
/>
```

## Accessibility

### Color Contrast
- All text meets WCAG AA standards
- Minimum 4.5:1 for normal text
- Minimum 3:1 for large text
- Focus indicators clearly visible

### Keyboard Navigation
- All interactive elements keyboard accessible
- Logical tab order maintained
- Skip links provided
- Modal focus trapped

### Screen Readers
- Semantic HTML used throughout
- ARIA labels where needed
- Form labels associated correctly
- Error messages announced

## Best Practices

### Performance
1. Lazy load images and components
2. Use CSS animations over JavaScript
3. Minimize bundle sizes
4. Optimize for Core Web Vitals

### Testing
1. Test on real devices
2. Check all breakpoints
3. Verify touch interactions
4. Validate accessibility

### Maintenance
1. Document all components
2. Use TypeScript for type safety
3. Follow naming conventions
4. Keep dependencies updated
```

### 2. Create Component Documentation Template

Location: `/docs/components/template.md`

```markdown
# Component Name

## Overview
Brief description of what the component does and when to use it.

## Usage
```jsx
import { ComponentName } from '@/components/ui/component-name'

function Example() {
  return (
    <ComponentName
      prop1="value"
      prop2={true}
      onAction={handleAction}
    >
      Content
    </ComponentName>
  )
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| prop1 | string | - | Description of prop1 |
| prop2 | boolean | false | Description of prop2 |
| onAction | function | - | Callback when action occurs |

## Variants

### Default
```jsx
<ComponentName>Default variant</ComponentName>
```

### Primary
```jsx
<ComponentName variant="primary">Primary variant</ComponentName>
```

### Secondary
```jsx
<ComponentName variant="secondary">Secondary variant</ComponentName>
```

## States

### Loading
```jsx
<ComponentName loading>Loading state</ComponentName>
```

### Disabled
```jsx
<ComponentName disabled>Disabled state</ComponentName>
```

### Error
```jsx
<ComponentName error="Error message">Error state</ComponentName>
```

## Responsive Behavior

### Mobile (< 640px)
- Behavior on mobile devices
- Touch target considerations
- Layout adjustments

### Tablet (640px - 1024px)
- Tablet-specific changes
- Grid modifications
- Interaction patterns

### Desktop (> 1024px)
- Desktop enhancements
- Hover states
- Advanced features

## Accessibility

- Keyboard navigation support
- Screen reader announcements
- ARIA attributes used
- Focus management

## Examples

### Basic Example
```jsx
<ComponentName>Basic usage</ComponentName>
```

### With Custom Styling
```jsx
<ComponentName className="custom-class">
  Styled content
</ComponentName>
```

### Complex Example
```jsx
<ComponentName
  variant="primary"
  size="large"
  icon={<Icon />}
  onAction={handleAction}
  disabled={isProcessing}
>
  Complex usage example
</ComponentName>
```

## Best Practices

1. Always provide meaningful props
2. Use semantic HTML
3. Test on mobile devices
4. Verify keyboard navigation
5. Check color contrast

## Common Pitfalls

1. Don't nest interactive elements
2. Avoid inline styles
3. Don't override touch targets
4. Remember loading states
5. Test error scenarios

## Related Components

- [RelatedComponent1](/docs/components/related-1)
- [RelatedComponent2](/docs/components/related-2)
- [RelatedComponent3](/docs/components/related-3)
```

### 3. Create Storybook Stories

Location: `/components/ui/button/button.stories.tsx`

```typescript
import type { Meta, StoryObj } from '@storybook/react'
import { Button } from './button'

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Base button component with multiple variants and sizes.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost', 'danger'],
      description: 'Visual style variant'
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Button size'
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state'
    },
    loading: {
      control: 'boolean',
      description: 'Loading state'
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

// Primary variant
export const Primary: Story = {
  args: {
    children: 'Primary Button',
    variant: 'primary',
  }
}

// Secondary variant
export const Secondary: Story = {
  args: {
    children: 'Secondary Button',
    variant: 'secondary',
  }
}

// All sizes
export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  )
}

// Mobile touch target
export const MobileTouch: Story = {
  args: {
    children: 'Touch Target',
    size: 'lg',
    className: 'min-h-[48px]'
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1'
    }
  }
}

// Loading state
export const Loading: Story = {
  args: {
    children: 'Loading...',
    loading: true,
  }
}

// With icon
export const WithIcon: Story = {
  args: {
    children: (
      <>
        <CheckIcon className="mr-2 h-4 w-4" />
        Save Changes
      </>
    ),
  }
}

// Interactive example
export const Interactive: Story = {
  render: () => {
    const [loading, setLoading] = useState(false)
    
    const handleClick = () => {
      setLoading(true)
      setTimeout(() => setLoading(false), 2000)
    }
    
    return (
      <Button
        onClick={handleClick}
        loading={loading}
        disabled={loading}
      >
        {loading ? 'Processing...' : 'Click Me'}
      </Button>
    )
  }
}
```

### 4. Create API Documentation

Location: `/docs/api/registration-store.md`

```markdown
# Registration Store API

## Overview
The registration store manages the state of the multi-step registration process using Zustand.

## Store Structure

```typescript
interface RegistrationStore {
  // State
  currentStep: number
  registrationType: 'mason' | 'guest' | null
  attendees: Attendee[]
  selections: TicketSelections
  billingDetails: BillingDetails
  
  // Actions
  setStep: (step: number) => void
  setRegistrationType: (type: 'mason' | 'guest') => void
  addAttendee: (attendee: Attendee) => void
  updateAttendee: (id: string, data: Partial<Attendee>) => void
  removeAttendee: (id: string) => void
  setTicketSelection: (attendeeId: string, ticketId: string) => void
  setBillingDetails: (details: BillingDetails) => void
  resetStore: () => void
}
```

## Usage

### Basic Usage
```typescript
import { useRegistrationStore } from '@/store/registrationStore'

function MyComponent() {
  const { currentStep, setStep } = useRegistrationStore()
  
  const handleNext = () => {
    setStep(currentStep + 1)
  }
  
  return (
    <button onClick={handleNext}>
      Next Step
    </button>
  )
}
```

### Selecting State
```typescript
// Select specific state to prevent unnecessary re-renders
const attendees = useRegistrationStore(state => state.attendees)
const currentStep = useRegistrationStore(state => state.currentStep)
```

### Actions

#### Add Attendee
```typescript
const addAttendee = useRegistrationStore(state => state.addAttendee)

const handleAddAttendee = () => {
  addAttendee({
    id: generateId(),
    type: 'mason',
    firstName: 'John',
    lastName: 'Doe',
    // ... other fields
  })
}
```

#### Update Attendee
```typescript
const updateAttendee = useRegistrationStore(state => state.updateAttendee)

const handleUpdate = (id: string) => {
  updateAttendee(id, {
    email: 'newemail@example.com'
  })
}
```

#### Set Ticket Selection
```typescript
const setTicketSelection = useRegistrationStore(state => state.setTicketSelection)

const handleTicketSelect = (attendeeId: string, ticketId: string) => {
  setTicketSelection(attendeeId, ticketId)
}
```

## Persistence

The store automatically persists to localStorage:

```typescript
const useRegistrationStore = create<RegistrationStore>()(
  persist(
    (set) => ({
      // ... store implementation
    }),
    {
      name: 'registration-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
```

## TypeScript Types

```typescript
interface Attendee {
  id: string
  type: 'mason' | 'guest'
  firstName: string
  lastName: string
  email: string
  phone?: string
  // ... other fields
}

interface TicketSelections {
  [attendeeId: string]: string // ticketId
}

interface BillingDetails {
  firstName: string
  lastName: string
  email: string
  // ... billing fields
}
```

## Advanced Usage

### Computed Values
```typescript
const totalPrice = useRegistrationStore(state => {
  return state.attendees.reduce((total, attendee) => {
    const ticketId = state.selections[attendee.id]
    const ticket = getTicketById(ticketId)
    return total + (ticket?.price || 0)
  }, 0)
})
```

### Middleware
```typescript
// Log all state changes
const useRegistrationStore = create<RegistrationStore>()(
  devtools(
    persist(
      (set) => ({
        // ... store implementation
      }),
      { name: 'registration-storage' }
    )
  )
)
```

## Best Practices

1. Always use selectors to avoid unnecessary re-renders
2. Keep actions pure and predictable
3. Use TypeScript for type safety
4. Clear sensitive data on completion
5. Handle errors gracefully

## Common Patterns

### Form Integration
```typescript
function AttendeeForm() {
  const { register, handleSubmit } = useForm()
  const addAttendee = useRegistrationStore(state => state.addAttendee)
  
  const onSubmit = (data) => {
    addAttendee({
      id: generateId(),
      ...data
    })
  }
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* form fields */}
    </form>
  )
}
```

### Route Guards
```typescript
function ProtectedRoute({ children }) {
  const hasAttendees = useRegistrationStore(state => state.attendees.length > 0)
  
  if (!hasAttendees) {
    return <Navigate to="/registration/type" />
  }
  
  return children
}
```
```

### 5. Update Main README

Location: `/README.md`

```markdown
# LodgeTix - Masonic Event Ticketing Platform

## Overview
LodgeTix is a specialized ticketing platform designed for Masonic lodges and Grand Lodges to manage event registrations, ticket sales, and attendee information.

## Design System
We use a comprehensive design system focused on:
- Mobile-first responsive design
- Accessibility (WCAG AA compliant)
- Masonic visual heritage
- Performance optimization

See [Design System Documentation](/docs/design-system/README.md) for details.

## Getting Started

### Prerequisites
- Node.js 18+
- npm or pnpm
- Supabase account
- Stripe account

### Installation
```bash
# Clone the repository
git clone https://github.com/org/lodgetix

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local

# Run development server
pnpm dev
```

### Environment Variables
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
STRIPE_SECRET_KEY=your_stripe_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_public
```

## Project Structure
```
lodgetix/
├── app/              # Next.js app directory
├── components/       # React components
│   ├── ui/          # Base UI components
│   └── register/    # Registration flow components
├── docs/            # Documentation
├── lib/             # Utilities and services
├── public/          # Static assets
├── shared/          # Shared types and utilities
└── store/           # State management
```

## Key Features

### For Attendees
- Mobile-optimized registration flow
- Multiple attendee types (Mason/Guest)
- Secure payment processing
- Digital ticket delivery
- Event information access

### For Organizers
- Event creation and management
- Attendee list management
- Financial reporting
- Check-in system
- Communication tools

## Development

### Component Development
```bash
# Start Storybook
pnpm storybook

# Run tests
pnpm test

# Type checking
pnpm type-check

# Linting
pnpm lint
```

### Database Migrations
```bash
# Create new migration
pnpm supabase migration new feature_name

# Run migrations
pnpm supabase migration up
```

### Code Style
- TypeScript for type safety
- ESLint for code quality
- Prettier for formatting
- Conventional commits

## Testing

### Unit Tests
```bash
pnpm test:unit
```

### Integration Tests
```bash
pnpm test:integration
```

### E2E Tests
```bash
pnpm test:e2e
```

## Deployment

### Production
```bash
# Build for production
pnpm build

# Start production server
pnpm start
```

### Staging
Push to `staging` branch for automatic deployment.

### Preview
Every PR gets a preview deployment.

## Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Write tests
5. Submit PR

See [Contributing Guide](/CONTRIBUTING.md) for details.

## Support

- Documentation: [/docs](/docs)
- Issues: [GitHub Issues](https://github.com/org/lodgetix/issues)
- Email: support@lodgetix.com

## License

Proprietary - see [LICENSE](/LICENSE) for details.
```

## Implementation Priority

1. **Phase 1**: Core documentation structure
2. **Phase 2**: Component documentation
3. **Phase 3**: Storybook integration
4. **Phase 4**: API documentation
5. **Phase 5**: Usage examples

## Notes

- Keep documentation close to code
- Use TypeScript for examples
- Include mobile considerations
- Document accessibility features
- Provide real-world examples
