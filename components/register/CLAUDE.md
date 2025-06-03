# Registration Components Documentation

## Overview
Registration components handle the multi-step registration process for functions. All components use UUID-based function identification.

## Key Components

### Registration Wizard (`RegistrationWizard/registration-wizard.tsx`)
**Props:**
```typescript
interface RegistrationWizardProps {
  functionSlug: string;      // For URL display only
  functionId?: string;       // UUID - should always be provided
  registrationId?: string;   // Registration UUID
  isNewRegistration?: boolean;
}
```

**Important Notes:**
- Accepts both `functionSlug` and `functionId` for flexibility
- If `functionId` not provided, resolves from slug using `resolveFunctionSlug`
- Passes `functionId` to all child components

### Lodge Registration Step (`Steps/LodgeRegistrationStep.tsx`)
**Props:**
```typescript
interface LodgeRegistrationStepProps {
  functionId: string;        // Required UUID
  functionSlug?: string;     // Optional, for display
}
```

**Key Features:**
- Integrated payment processing
- Uses `LodgesForm` for attendee details
- Requires `functionId` to fetch packages

### Forms Components

#### LodgesForm (`Forms/attendee/LodgesForm.tsx`)
- **Requires**: `functionId` prop (not optional)
- **Uses**: `FunctionTicketsService` to fetch packages
- **Validates**: Function ID before making API calls

## Common Patterns

### Function ID Resolution
```typescript
// In client components
import { resolveFunctionSlug } from '@/lib/utils/function-slug-resolver-client';

const functionId = await resolveFunctionSlug(slug);
```

### Prop Passing
Always ensure functionId is passed down the component tree:
```typescript
// Page component
<RegistrationWizard 
  functionSlug={slug}
  functionId={functionData.function_id}  // Always provide this
  registrationId={registrationId}
/>

// Parent component passes to child
<LodgeRegistrationStep 
  functionId={functionId}  // Required
  functionSlug={functionSlug}
/>
```

## Error Prevention
1. **Always pass functionId** from page components
2. **Validate props** in components that require functionId
3. **Use TypeScript** to enforce required props
4. **Add null checks** before using functionId in API calls

## Testing Considerations
- Mock functionId with valid UUID format
- Test error states when functionId is missing
- Verify prop drilling through component hierarchy