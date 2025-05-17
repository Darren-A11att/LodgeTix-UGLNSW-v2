# React Hook Patterns

## Core Hook Principles

These patterns ensure consistent, performant, and maintainable custom hooks across the application.

### Law 1: Single Responsibility
- Each hook should have one clear purpose
- Complex logic should be split into multiple hooks
- Compose hooks for complex behavior

### Law 2: Prefix with 'use'
- All hooks must start with 'use' prefix
- This enables React's hooks linting rules
- Makes hooks easily identifiable

### Law 3: Pure Functions
- Hooks should be pure with predictable outputs
- Side effects must be contained in useEffect
- No direct mutations of external state

### Law 4: Dependency Arrays
- Always include all dependencies
- Use ESLint rules to catch missing dependencies
- Memoize expensive computations

## Basic Hook Patterns

### State Management Hook
```typescript
// hooks/useToggle.ts
export function useToggle(
  initialValue = false
): [boolean, () => void, (value: boolean) => void] {
  const [state, setState] = useState(initialValue);
  
  const toggle = useCallback(() => {
    setState(prev => !prev);
  }, []);
  
  const setToggle = useCallback((value: boolean) => {
    setState(value);
  }, []);
  
  return [state, toggle, setToggle];
}

// Usage
export function Component() {
  const [isOpen, toggleOpen, setOpen] = useToggle();
  
  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <button onClick={toggleOpen}>Toggle</button>
    </Dialog>
  );
}
```

### Fetch Hook with Loading State
```typescript
// hooks/useFetch.ts
interface UseFetchOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  initialData?: T;
}

export function useFetch<T>(
  url: string,
  options?: UseFetchOptions<T>
) {
  const [data, setData] = useState<T | null>(options?.initialData ?? null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    const controller = new AbortController();
    
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(url, {
          signal: controller.signal,
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const json = await response.json();
        setData(json);
        options?.onSuccess?.(json);
      } catch (err) {
        if (err.name !== 'AbortError') {
          const error = err as Error;
          setError(error);
          options?.onError?.(error);
        }
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
    
    return () => controller.abort();
  }, [url]);
  
  return { data, loading, error, refetch: fetchData };
}
```

### Local Storage Hook
```typescript
// hooks/useLocalStorage.ts
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  // Get initial value from localStorage or use provided initial value
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });
  
  // Update localStorage when state changes
  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    try {
      setStoredValue(prevValue => {
        const valueToStore = value instanceof Function ? value(prevValue) : value;
        
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
        
        return valueToStore;
      });
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key]);
  
  return [storedValue, setValue];
}
```

## Advanced Hook Patterns

### Debounce Hook
```typescript
// hooks/useDebounce.ts
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);
  
  return debouncedValue;
}

// Usage with search
export function SearchComponent() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  
  const searchResults = useSearch(debouncedSearchTerm);
  
  return (
    <input
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder="Search..."
    />
  );
}
```

### Window Event Hook
```typescript
// hooks/useWindowEvent.ts
export function useWindowEvent<K extends keyof WindowEventMap>(
  event: K,
  handler: (event: WindowEventMap[K]) => void,
  options?: AddEventListenerOptions
) {
  const savedHandler = useRef(handler);
  
  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);
  
  useEffect(() => {
    const eventListener = (event: WindowEventMap[K]) => {
      savedHandler.current(event);
    };
    
    window.addEventListener(event, eventListener, options);
    
    return () => {
      window.removeEventListener(event, eventListener, options);
    };
  }, [event, options]);
}

// Usage
export function ScrollToTopButton() {
  const [showButton, setShowButton] = useState(false);
  
  useWindowEvent('scroll', () => {
    setShowButton(window.scrollY > 300);
  });
  
  return showButton ? (
    <button onClick={() => window.scrollTo(0, 0)}>
      Back to top
    </button>
  ) : null;
}
```

### Media Query Hook
```typescript
// hooks/useMediaQuery.ts
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(
    () => window.matchMedia(query).matches
  );
  
  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };
    
    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } 
    // Legacy browsers
    else {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [query]);
  
  return matches;
}

// Predefined breakpoint hooks
export const useIsMobile = () => useMediaQuery('(max-width: 768px)');
export const useIsTablet = () => useMediaQuery('(min-width: 769px) and (max-width: 1024px)');
export const useIsDesktop = () => useMediaQuery('(min-width: 1025px)');
```

## Performance Optimization Hooks

### Intersection Observer Hook
```typescript
// hooks/useIntersectionObserver.ts
interface UseIntersectionObserverOptions extends IntersectionObserverInit {
  freezeOnceVisible?: boolean;
}

export function useIntersectionObserver(
  ref: RefObject<Element>,
  options: UseIntersectionObserverOptions = {}
): IntersectionObserverEntry | undefined {
  const {
    threshold = 0,
    root = null,
    rootMargin = '0%',
    freezeOnceVisible = false,
  } = options;
  
  const [entry, setEntry] = useState<IntersectionObserverEntry>();
  
  const frozen = entry?.isIntersecting && freezeOnceVisible;
  
  useEffect(() => {
    const node = ref?.current;
    if (!node || frozen) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => setEntry(entry),
      { threshold, root, rootMargin }
    );
    
    observer.observe(node);
    
    return () => observer.disconnect();
  }, [ref, threshold, root, rootMargin, frozen]);
  
  return entry;
}

// Usage for lazy loading
export function LazyImage({ src, alt }: { src: string; alt: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const entry = useIntersectionObserver(ref, { 
    threshold: 0.1,
    freezeOnceVisible: true 
  });
  
  return (
    <div ref={ref}>
      {entry?.isIntersecting ? (
        <img src={src} alt={alt} />
      ) : (
        <div className="skeleton" />
      )}
    </div>
  );
}
```

### Previous Value Hook
```typescript
// hooks/usePrevious.ts
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
  
  useEffect(() => {
    ref.current = value;
  }, [value]);
  
  return ref.current;
}

// Usage in component
export function PriceDisplay({ price }: { price: number }) {
  const previousPrice = usePrevious(price);
  
  const priceChange = previousPrice ? price - previousPrice : 0;
  const isIncrease = priceChange > 0;
  
  return (
    <div>
      <span className={isIncrease ? 'text-red-500' : 'text-green-500'}>
        ${price}
      </span>
      {priceChange !== 0 && (
        <span className="text-sm">
          {isIncrease ? '↑' : '↓'} ${Math.abs(priceChange)}
        </span>
      )}
    </div>
  );
}
```

## Form Hooks

### Field Validation Hook
```typescript
// hooks/useFieldValidation.ts
interface ValidationRule<T> {
  validate: (value: T) => boolean;
  message: string;
}

export function useFieldValidation<T>(
  value: T,
  rules: ValidationRule<T>[]
) {
  const [error, setError] = useState<string | null>(null);
  const [hasBlurred, setHasBlurred] = useState(false);
  
  const validate = useCallback(() => {
    for (const rule of rules) {
      if (!rule.validate(value)) {
        setError(rule.message);
        return false;
      }
    }
    setError(null);
    return true;
  }, [value, rules]);
  
  useEffect(() => {
    if (hasBlurred) {
      validate();
    }
  }, [value, hasBlurred, validate]);
  
  const onBlur = useCallback(() => {
    setHasBlurred(true);
    validate();
  }, [validate]);
  
  return {
    error: hasBlurred ? error : null,
    isValid: error === null,
    validate,
    onBlur,
  };
}
```

## State Machine Hook

```typescript
// hooks/useStateMachine.ts
type State = string;
type Event = string;
type StateConfig<S extends State, E extends Event> = {
  on?: Partial<Record<E, S>>;
  entry?: () => void;
  exit?: () => void;
};

export function useStateMachine<
  S extends State,
  E extends Event
>(
  config: Record<S, StateConfig<S, E>>,
  initialState: S
) {
  const [state, setState] = useState<S>(initialState);
  
  const transition = useCallback((event: E) => {
    const currentConfig = config[state];
    const nextState = currentConfig.on?.[event];
    
    if (nextState) {
      currentConfig.exit?.();
      config[nextState].entry?.();
      setState(nextState);
    }
  }, [state, config]);
  
  return [state, transition] as const;
}

// Usage
type AuthState = 'idle' | 'loading' | 'authenticated' | 'error';
type AuthEvent = 'LOGIN' | 'SUCCESS' | 'FAILURE' | 'LOGOUT';

const authMachine: Record<AuthState, StateConfig<AuthState, AuthEvent>> = {
  idle: {
    on: { LOGIN: 'loading' },
  },
  loading: {
    on: { SUCCESS: 'authenticated', FAILURE: 'error' },
  },
  authenticated: {
    on: { LOGOUT: 'idle' },
  },
  error: {
    on: { LOGIN: 'loading' },
  },
};

export function useAuth() {
  const [state, send] = useStateMachine(authMachine, 'idle');
  
  const login = async (credentials: LoginCredentials) => {
    send('LOGIN');
    try {
      await apiLogin(credentials);
      send('SUCCESS');
    } catch {
      send('FAILURE');
    }
  };
  
  return { state, login, logout: () => send('LOGOUT') };
}
```

## Testing Hooks

```typescript
// hooks/__tests__/useToggle.test.ts
import { renderHook, act } from '@testing-library/react-hooks';
import { useToggle } from '../useToggle';

describe('useToggle', () => {
  it('should toggle boolean state', () => {
    const { result } = renderHook(() => useToggle());
    
    expect(result.current[0]).toBe(false);
    
    act(() => {
      result.current[1](); // toggle
    });
    
    expect(result.current[0]).toBe(true);
  });
  
  it('should set specific value', () => {
    const { result } = renderHook(() => useToggle(true));
    
    expect(result.current[0]).toBe(true);
    
    act(() => {
      result.current[2](false); // setToggle
    });
    
    expect(result.current[0]).toBe(false);
  });
});
```

## Anti-Patterns to Avoid

### ❌ DON'T: Break hook rules
```typescript
// Conditional hook call - WRONG!
function Component({ shouldFetch }) {
  if (shouldFetch) {
    const data = useFetch('/api/data'); // Error!
  }
}
```

### ✅ DO: Call hooks at top level
```typescript
// Always call hooks at top level
function Component({ shouldFetch }) {
  const { data } = useFetch(shouldFetch ? '/api/data' : null);
}
```

### ❌ DON'T: Forget dependencies
```typescript
// Missing dependency - WRONG!
function useCounter(step) {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCount(c => c + step); // 'step' is missing in deps
    }, 1000);
    
    return () => clearInterval(timer);
  }, []); // Missing 'step'!
}
```

### ✅ DO: Include all dependencies
```typescript
// Correct dependency array
function useCounter(step) {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCount(c => c + step);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [step]); // Include all dependencies
}
```