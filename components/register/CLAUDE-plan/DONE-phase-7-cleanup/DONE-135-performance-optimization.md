# Task 135: Performance Optimization

## Objective
Optimize the performance of the new forms architecture through code splitting, memoization, and lazy loading.

## Dependencies
- All components implemented
- Testing complete

## Steps

1. Implement code splitting for form layouts:
```typescript
// components/register/forms/attendee/AttendeeWithPartner.tsx
import React, { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';

// Lazy load form components
const MasonForm = lazy(() => import('../mason/layouts/MasonForm').then(module => ({
  default: module.MasonForm
})));
const GuestForm = lazy(() => import('../guest/layouts/GuestForm').then(module => ({
  default: module.GuestForm
})));

const FormLoadingFallback = () => (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="w-6 h-6 animate-spin" />
  </div>
);

export const AttendeeWithPartner: React.FC<AttendeeWithPartnerProps> = ({ 
  attendeeId, 
  attendeeNumber, 
  isPrimary = false,
  allowPartner = true,
}) => {
  // ... existing logic ...

  const renderForm = () => {
    if (!attendee) return null;

    const FormComponent = attendee.attendeeType === 'Mason' ? MasonForm : GuestForm;

    return (
      <Suspense fallback={<FormLoadingFallback />}>
        <FormComponent
          attendeeId={attendeeId}
          attendeeNumber={attendeeNumber}
          isPrimary={isPrimary}
        />
      </Suspense>
    );
  };

  // ... rest of component
};
```

2. Add memoization to expensive computations:
```typescript
// components/register/forms/attendee/lib/useAttendeeData.ts
import { useMemo } from 'react';

export const useAttendeeData = (attendeeId: string) => {
  const { attendees, updateAttendee, removeAttendee } = useRegistrationStore(
    useShallow((state) => ({
      attendees: state.attendees,
      updateAttendee: state.updateAttendee,
      removeAttendee: state.removeAttendee,
    }))
  );

  // Memoize attendee lookup
  const attendee = useMemo(
    () => attendees.find((a) => a.attendeeId === attendeeId),
    [attendees, attendeeId]
  );

  // Memoize update functions to prevent recreating on every render
  const updateField = useCallback(
    (field: string, value: any) => {
      updateAttendee(attendeeId, { [field]: value });
    },
    [attendeeId, updateAttendee]
  );

  const updateMultipleFields = useCallback(
    (updates: Partial<AttendeeData>) => {
      updateAttendee(attendeeId, updates);
    },
    [attendeeId, updateAttendee]
  );

  return {
    attendee,
    updateField,
    updateMultipleFields,
    deleteAttendee: useCallback(() => removeAttendee(attendeeId), [attendeeId, removeAttendee]),
  };
};
```

3. Optimize re-renders with React.memo:
```typescript
// components/register/forms/basic-details/BasicInfo.tsx
import React, { memo } from 'react';

export const BasicInfo = memo<SectionProps>(({ 
  data, 
  type, 
  isPrimary, 
  onChange 
}) => {
  // Component implementation
}, (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  return (
    prevProps.data.title === nextProps.data.title &&
    prevProps.data.firstName === nextProps.data.firstName &&
    prevProps.data.lastName === nextProps.data.lastName &&
    prevProps.data.rank === nextProps.data.rank &&
    prevProps.type === nextProps.type &&
    prevProps.isPrimary === nextProps.isPrimary
  );
});
```

4. Implement debounced field updates:
```typescript
// components/register/forms/shared/DebouncedInput.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { useDebouncedCallback } from 'use-debounce';

interface DebouncedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string;
  onValueChange: (value: string) => void;
  debounceMs?: number;
}

export const DebouncedInput: React.FC<DebouncedInputProps> = ({
  value,
  onValueChange,
  debounceMs = 300,
  ...props
}) => {
  const [localValue, setLocalValue] = useState(value);

  const debouncedChange = useDebouncedCallback(
    (value: string) => {
      onValueChange(value);
    },
    debounceMs
  );

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    debouncedChange(newValue);
  }, [debouncedChange]);

  return (
    <Input
      {...props}
      value={localValue}
      onChange={handleChange}
    />
  );
};
```

5. Optimize bundle size with tree shaking:
```typescript
// components/register/forms/index.ts
// Export only what's needed to enable tree shaking

export { AttendeeWithPartner } from './attendee/AttendeeWithPartner';
export { IndividualsForm } from './attendee/IndividualsForm';
export { LodgesForm } from './attendee/LodgesForm';
export { DelegationsForm } from './attendee/DelegationsForm';

// Don't export internal components that aren't used externally
```

6. Add performance monitoring:
```typescript
// components/register/forms/utils/performance.ts
export const measureFormPerformance = () => {
  if (typeof window !== 'undefined' && window.performance) {
    // Measure form interaction time
    performance.mark('form-interaction-start');
    
    return {
      end: () => {
        performance.mark('form-interaction-end');
        performance.measure(
          'form-interaction',
          'form-interaction-start',
          'form-interaction-end'
        );
        
        const measure = performance.getEntriesByName('form-interaction')[0];
        console.log(`Form interaction took ${measure.duration}ms`);
      }
    };
  }
  
  return { end: () => {} };
};

// Usage in components
export const BasicInfo: React.FC<SectionProps> = ({ onChange, ...props }) => {
  const handleChange = useCallback((field: string, value: any) => {
    const perf = measureFormPerformance();
    onChange(field, value);
    perf.end();
  }, [onChange]);
  
  // ... rest of component
};
```

7. Optimize state updates:
```typescript
// lib/registrationStore.ts
import { immer } from 'zustand/middleware/immer';

const useRegistrationStore = create<RegistrationState>()(
  immer((set) => ({
    attendees: [],
    
    // Batch updates for better performance
    updateAttendee: (attendeeId: string, updates: Partial<AttendeeData>) =>
      set((state) => {
        const attendeeIndex = state.attendees.findIndex(
          (a) => a.attendeeId === attendeeId
        );
        
        if (attendeeIndex !== -1) {
          // Use immer for immutable updates
          state.attendees[attendeeIndex] = {
            ...state.attendees[attendeeIndex],
            ...updates,
          };
        }
      }),
    
    // Batch multiple attendee updates
    updateMultipleAttendees: (updates: Array<{ id: string; data: Partial<AttendeeData> }>) =>
      set((state) => {
        updates.forEach(({ id, data }) => {
          const index = state.attendees.findIndex((a) => a.attendeeId === id);
          if (index !== -1) {
            state.attendees[index] = {
              ...state.attendees[index],
              ...data,
            };
          }
        });
      }),
  }))
);
```

8. Add virtualization for large lists:
```typescript
// components/register/forms/attendee/IndividualsForm.tsx
import { VirtualList } from '@tanstack/react-virtual';

export const IndividualsForm: React.FC<IndividualsFormProps> = ({
  maxAttendees = 10,
  allowPartners = true,
  onComplete,
}) => {
  const { attendees } = useRegistrationStore();
  const primaryAttendees = attendees.filter(a => !a.isPartner);

  // Use virtualization for large attendee lists
  const virtualizer = useVirtualizer({
    count: primaryAttendees.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200,
    overscan: 3,
  });

  return (
    <div ref={parentRef} className="h-[600px] overflow-auto">
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const attendee = primaryAttendees[virtualItem.index];
          return (
            <div
              key={attendee.attendeeId}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <AttendeeWithPartner
                attendeeId={attendee.attendeeId}
                attendeeNumber={virtualItem.index + 1}
                isPrimary={virtualItem.index === 0}
                allowPartner={allowPartners}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
```

9. Create performance best practices guide:
```markdown
# components/register/forms/PERFORMANCE.md

# Performance Best Practices

## Component Optimization

### 1. Use React.memo for Pure Components
```typescript
export const MyComponent = memo(({ prop1, prop2 }) => {
  // Component implementation
}, (prevProps, nextProps) => {
  // Custom comparison function
  return prevProps.prop1 === nextProps.prop1;
});
```

### 2. Memoize Expensive Computations
```typescript
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);
```

### 3. Use Callbacks for Event Handlers
```typescript
const handleClick = useCallback(() => {
  doSomething();
}, [dependency]);
```

## State Management

### 1. Use Shallow Comparisons
```typescript
const { attendees, updateAttendee } = useRegistrationStore(
  useShallow((state) => ({
    attendees: state.attendees,
    updateAttendee: state.updateAttendee,
  }))
);
```

### 2. Batch State Updates
```typescript
// Instead of multiple updates
updateAttendee(id, { field1: value1 });
updateAttendee(id, { field2: value2 });

// Use single update
updateAttendee(id, { field1: value1, field2: value2 });
```

## Loading Optimization

### 1. Lazy Load Heavy Components
```typescript
const HeavyComponent = lazy(() => import('./HeavyComponent'));
```

### 2. Use Suspense Boundaries
```typescript
<Suspense fallback={<LoadingSpinner />}>
  <HeavyComponent />
</Suspense>
```

## Bundle Size

### 1. Use Named Imports
```typescript
// Good - allows tree shaking
import { Button } from '@/components/ui/button';

// Bad - imports entire module
import * as UI from '@/components/ui';
```

### 2. Dynamic Imports for Optional Features
```typescript
const loadOptionalFeature = async () => {
  const module = await import('./OptionalFeature');
  return module.default;
};
```
```

## Deliverables
- Code splitting implementation
- Memoization strategies
- Debounced inputs
- Performance monitoring
- Optimization guide

## Success Criteria
- Form interactions are smooth
- Bundle size is minimized
- No unnecessary re-renders
- Loading is optimized
- Performance metrics are good