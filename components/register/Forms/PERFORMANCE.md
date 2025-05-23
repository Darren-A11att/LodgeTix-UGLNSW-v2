# Performance Best Practices

## Component Optimization

### 1. Use React.memo for Pure Components
```typescript
export const MyComponent = React.memo(({ prop1, prop2 }) => {
  // Component implementation
}, (prevProps, nextProps) => {
  // Custom comparison function
  return prevProps.prop1 === nextProps.prop1;
});
```

### 2. Lazy Loading Components
```typescript
const HeavyComponent = lazy(() => import('./HeavyComponent'));

// Use with Suspense
<Suspense fallback={<LoadingSpinner />}>
  <HeavyComponent />
</Suspense>
```

### 3. Memoize Expensive Computations
```typescript
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);
```

### 4. Use Callbacks for Event Handlers
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

### 3. Debounce Form Updates
```typescript
const debouncedUpdate = useDebouncedCallback(
  (value) => updateField('name', value),
  300
);
```

## Bundle Size Optimization

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

### 3. Code Splitting Routes
```typescript
const EventPage = lazy(() => import('./pages/EventPage'));

// In router
<Route path="/event/:id" element={
  <Suspense fallback={<PageLoader />}>
    <EventPage />
  </Suspense>
} />
```

## Form Performance

### 1. Use Debounced Inputs
```typescript
export const DebouncedInput = ({ value, onChange, delay = 300 }) => {
  const [localValue, setLocalValue] = useState(value);
  
  const debouncedChange = useDebouncedCallback(
    (value) => onChange(value),
    delay
  );
  
  const handleChange = (e) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    debouncedChange(newValue);
  };
  
  return <input value={localValue} onChange={handleChange} />;
};
```

### 2. Virtualize Large Lists
```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

export const VirtualList = ({ items }) => {
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100,
  });
  
  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            {items[virtualItem.index]}
          </div>
        ))}
      </div>
    </div>
  );
};
```

## Performance Monitoring

### 1. Measure Component Performance
```typescript
import { Profiler } from 'react';

const onRender = (id, phase, actualDuration) => {
  console.log(`${id} took ${actualDuration}ms to ${phase}`);
};

<Profiler id="MyComponent" onRender={onRender}>
  <MyComponent />
</Profiler>
```

### 2. Use Performance API
```typescript
export const measureFormSubmit = () => {
  performance.mark('form-submit-start');
  
  // Submit form
  await submitForm();
  
  performance.mark('form-submit-end');
  performance.measure(
    'form-submit',
    'form-submit-start',
    'form-submit-end'
  );
  
  const measure = performance.getEntriesByName('form-submit')[0];
  console.log(`Form submission took ${measure.duration}ms`);
};
```

## Optimization Checklist

### Components
- [ ] Use React.memo for pure components
- [ ] Implement custom comparison functions
- [ ] Lazy load heavy components
- [ ] Add Suspense boundaries

### State Management
- [ ] Use shallow selectors
- [ ] Batch state updates
- [ ] Debounce frequent updates
- [ ] Memoize computed values

### Bundle Size
- [ ] Use named imports
- [ ] Enable tree shaking
- [ ] Analyze bundle with webpack-bundle-analyzer
- [ ] Code split by route

### Forms
- [ ] Debounce input updates
- [ ] Use controlled components sparingly
- [ ] Virtualize long lists
- [ ] Lazy load form sections

### Monitoring
- [ ] Add performance marks
- [ ] Use React Profiler
- [ ] Monitor bundle size
- [ ] Track Core Web Vitals

## Common Pitfalls

1. **Unnecessary Re-renders**
   - Not using React.memo
   - Creating new objects/functions in render
   - Not using useCallback/useMemo

2. **Large Bundle Size**
   - Importing entire libraries
   - Not code splitting
   - Including unused code

3. **Slow Form Updates**
   - Not debouncing inputs
   - Too many controlled components
   - Complex validation on every keystroke

4. **Memory Leaks**
   - Not cleaning up event listeners
   - Not canceling async operations
   - Holding references to DOM elements