# React Context Patterns

## Core Context Principles

These patterns ensure proper use of React Context for state management and dependency injection.

### Law 1: Context Separation
- Separate contexts by domain (auth, theme, etc.)
- Don't create one giant global context
- Split frequently changing from stable values

### Law 2: Provider Composition
- Compose providers at the app level
- Create provider wrapper components
- Keep provider logic separate from UI

### Law 3: Default Values
- Always provide sensible defaults
- Make context type-safe with TypeScript
- Handle missing provider gracefully

### Law 4: Performance Optimization
- Split contexts to minimize re-renders
- Use useMemo for computed values
- Consider context alternatives for frequent updates

## Basic Context Pattern

### Simple Theme Context
```typescript
// contexts/ThemeContext.tsx
type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  
  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  }, []);
  
  const value = useMemo(
    () => ({ theme, toggleTheme }),
    [theme, toggleTheme]
  );
  
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// Custom hook for using the context
export function useTheme() {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
}

// Usage
export function App() {
  return (
    <ThemeProvider>
      <ThemedComponent />
    </ThemeProvider>
  );
}

function ThemedComponent() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <div className={theme}>
      <button onClick={toggleTheme}>Toggle theme</button>
    </div>
  );
}
```

## Advanced Context Patterns

### Split Context Pattern
```typescript
// contexts/AuthContext.tsx
// Split stable and changing values into separate contexts

interface AuthUser {
  id: string;
  email: string;
  name: string;
}

interface AuthStateContextType {
  user: AuthUser | null;
  isLoading: boolean;
}

interface AuthActionsContextType {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<AuthUser>) => Promise<void>;
}

const AuthStateContext = createContext<AuthStateContextType | undefined>(undefined);
const AuthActionsContext = createContext<AuthActionsContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Actions don't change, so they won't trigger re-renders
  const actions = useMemo<AuthActionsContextType>(
    () => ({
      login: async (email: string, password: string) => {
        setIsLoading(true);
        try {
          const user = await authApi.login(email, password);
          setUser(user);
        } finally {
          setIsLoading(false);
        }
      },
      
      logout: async () => {
        setIsLoading(true);
        try {
          await authApi.logout();
          setUser(null);
        } finally {
          setIsLoading(false);
        }
      },
      
      updateProfile: async (data: Partial<AuthUser>) => {
        if (!user) throw new Error('No user logged in');
        
        const updatedUser = await authApi.updateProfile(user.id, data);
        setUser(updatedUser);
      },
    }),
    [user]
  );
  
  const state = useMemo(
    () => ({ user, isLoading }),
    [user, isLoading]
  );
  
  return (
    <AuthStateContext.Provider value={state}>
      <AuthActionsContext.Provider value={actions}>
        {children}
      </AuthActionsContext.Provider>
    </AuthStateContext.Provider>
  );
}

// Separate hooks for state and actions
export function useAuthState() {
  const context = useContext(AuthStateContext);
  if (context === undefined) {
    throw new Error('useAuthState must be used within AuthProvider');
  }
  return context;
}

export function useAuthActions() {
  const context = useContext(AuthActionsContext);
  if (context === undefined) {
    throw new Error('useAuthActions must be used within AuthProvider');
  }
  return context;
}

// Combined hook for convenience
export function useAuth() {
  return {
    ...useAuthState(),
    ...useAuthActions(),
  };
}
```

### Context with Reducer Pattern
```typescript
// contexts/CartContext.tsx
interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  total: number;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_CART' };

const initialState: CartState = {
  items: [],
  total: 0,
};

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItem = state.items.find(item => item.id === action.payload.id);
      
      if (existingItem) {
        return {
          ...state,
          items: state.items.map(item =>
            item.id === action.payload.id
              ? { ...item, quantity: item.quantity + action.payload.quantity }
              : item
          ),
          total: state.total + (action.payload.price * action.payload.quantity),
        };
      }
      
      return {
        ...state,
        items: [...state.items, action.payload],
        total: state.total + (action.payload.price * action.payload.quantity),
      };
    }
    
    case 'REMOVE_ITEM': {
      const item = state.items.find(i => i.id === action.payload);
      if (!item) return state;
      
      return {
        ...state,
        items: state.items.filter(i => i.id !== action.payload),
        total: state.total - (item.price * item.quantity),
      };
    }
    
    case 'UPDATE_QUANTITY': {
      const item = state.items.find(i => i.id === action.payload.id);
      if (!item) return state;
      
      const quantityDiff = action.payload.quantity - item.quantity;
      
      return {
        ...state,
        items: state.items.map(i =>
          i.id === action.payload.id
            ? { ...i, quantity: action.payload.quantity }
            : i
        ),
        total: state.total + (item.price * quantityDiff),
      };
    }
    
    case 'CLEAR_CART':
      return initialState;
    
    default:
      return state;
  }
}

interface CartContextType extends CartState {
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  
  const value = useMemo(
    () => ({
      ...state,
      addItem: (item: CartItem) => dispatch({ type: 'ADD_ITEM', payload: item }),
      removeItem: (id: string) => dispatch({ type: 'REMOVE_ITEM', payload: id }),
      updateQuantity: (id: string, quantity: number) => 
        dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } }),
      clearCart: () => dispatch({ type: 'CLEAR_CART' }),
    }),
    [state]
  );
  
  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}
```

### Factory Pattern for Multiple Contexts
```typescript
// contexts/createDataContext.tsx
interface DataContextConfig<T> {
  name: string;
  defaultValue: T;
  storage?: {
    key: string;
    serialize?: (value: T) => string;
    deserialize?: (value: string) => T;
  };
}

export function createDataContext<T>({
  name,
  defaultValue,
  storage,
}: DataContextConfig<T>) {
  interface ContextType {
    value: T;
    setValue: (value: T | ((prev: T) => T)) => void;
    reset: () => void;
  }
  
  const Context = createContext<ContextType | undefined>(undefined);
  
  function Provider({ children }: { children: ReactNode }) {
    const [value, setValue] = useState<T>(() => {
      if (storage && typeof window !== 'undefined') {
        try {
          const item = window.localStorage.getItem(storage.key);
          if (item) {
            return storage.deserialize
              ? storage.deserialize(item)
              : JSON.parse(item);
          }
        } catch (error) {
          console.error(`Error loading ${name} from storage:`, error);
        }
      }
      return defaultValue;
    });
    
    useEffect(() => {
      if (storage && typeof window !== 'undefined') {
        try {
          const serialized = storage.serialize
            ? storage.serialize(value)
            : JSON.stringify(value);
          window.localStorage.setItem(storage.key, serialized);
        } catch (error) {
          console.error(`Error saving ${name} to storage:`, error);
        }
      }
    }, [value]);
    
    const contextValue = useMemo(
      () => ({
        value,
        setValue,
        reset: () => setValue(defaultValue),
      }),
      [value]
    );
    
    return (
      <Context.Provider value={contextValue}>
        {children}
      </Context.Provider>
    );
  }
  
  function useContext() {
    const context = React.useContext(Context);
    if (context === undefined) {
      throw new Error(`use${name} must be used within ${name}Provider`);
    }
    return context;
  }
  
  return {
    Provider,
    useContext,
  };
}

// Usage
const { Provider: SettingsProvider, useContext: useSettings } = createDataContext({
  name: 'Settings',
  defaultValue: {
    notifications: true,
    theme: 'light',
    language: 'en',
  },
  storage: {
    key: 'app-settings',
  },
});

export { SettingsProvider, useSettings };
```

## Performance Patterns

### Memo Context Pattern
```typescript
// contexts/ExpensiveContext.tsx
interface ExpensiveData {
  computedValues: number[];
  derivedState: Record<string, any>;
}

const ExpensiveContext = createContext<ExpensiveData | undefined>(undefined);

export function ExpensiveProvider({ 
  children,
  sourceData 
}: { 
  children: ReactNode;
  sourceData: any[];
}) {
  // Expensive computation only runs when sourceData changes
  const value = useMemo<ExpensiveData>(() => {
    const computedValues = sourceData.map(item => 
      expensiveComputation(item)
    );
    
    const derivedState = computedValues.reduce((acc, val) => {
      // Complex derivation logic
      return { ...acc, [val.id]: val };
    }, {});
    
    return { computedValues, derivedState };
  }, [sourceData]);
  
  return (
    <ExpensiveContext.Provider value={value}>
      {children}
    </ExpensiveContext.Provider>
  );
}
```

### Selective Context Updates
```typescript
// contexts/SelectiveUpdateContext.tsx
interface State {
  user: User;
  preferences: Preferences;
  notifications: Notification[];
}

type StateSlice = keyof State;

interface ContextType {
  state: State;
  updateSlice: <K extends StateSlice>(
    slice: K,
    updates: Partial<State[K]>
  ) => void;
}

const StateContext = createContext<ContextType | undefined>(undefined);

// Create separate contexts for each slice
const UserContext = createContext<User | undefined>(undefined);
const PreferencesContext = createContext<Preferences | undefined>(undefined);
const NotificationsContext = createContext<Notification[] | undefined>(undefined);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(initialState);
  
  const updateSlice = useCallback(<K extends StateSlice>(
    slice: K,
    updates: Partial<State[K]>
  ) => {
    setState(prev => ({
      ...prev,
      [slice]: { ...prev[slice], ...updates },
    }));
  }, []);
  
  return (
    <StateContext.Provider value={{ state, updateSlice }}>
      <UserContext.Provider value={state.user}>
        <PreferencesContext.Provider value={state.preferences}>
          <NotificationsContext.Provider value={state.notifications}>
            {children}
          </NotificationsContext.Provider>
        </PreferencesContext.Provider>
      </UserContext.Provider>
    </StateContext.Provider>
  );
}

// Hooks for specific slices (only re-render when that slice changes)
export const useUser = () => {
  const user = useContext(UserContext);
  if (!user) throw new Error('useUser must be used within AppStateProvider');
  return user;
};

export const usePreferences = () => {
  const preferences = useContext(PreferencesContext);
  if (!preferences) throw new Error('usePreferences must be used within AppStateProvider');
  return preferences;
};
```

## Testing Context Patterns

```typescript
// contexts/__tests__/ThemeContext.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, useTheme } from '../ThemeContext';

const TestComponent = () => {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <button onClick={toggleTheme}>Toggle</button>
    </div>
  );
};

describe('ThemeContext', () => {
  it('provides default theme', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );
    
    expect(screen.getByTestId('theme')).toHaveTextContent('light');
  });
  
  it('toggles theme', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );
    
    fireEvent.click(screen.getByText('Toggle'));
    expect(screen.getByTestId('theme')).toHaveTextContent('dark');
  });
  
  it('throws error when used outside provider', () => {
    // Suppress console.error for this test
    const spy = jest.spyOn(console, 'error').mockImplementation();
    
    expect(() => render(<TestComponent />)).toThrow(
      'useTheme must be used within a ThemeProvider'
    );
    
    spy.mockRestore();
  });
});
```

## Anti-Patterns to Avoid

### L DON'T: One giant context
```typescript
// Too much in one context - causes unnecessary re-renders
const AppContext = createContext({
  user: null,
  theme: 'light',
  cart: [],
  notifications: [],
  // ... many more values
});
```

###  DO: Split by domain
```typescript
// Separate contexts for different concerns
const UserContext = createContext(null);
const ThemeContext = createContext('light');
const CartContext = createContext([]);
const NotificationContext = createContext([]);
```

### L DON'T: Recreate context value
```typescript
// Creates new object on every render
function Provider({ children }) {
  const [user, setUser] = useState(null);
  
  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
}
```

###  DO: Memoize context value
```typescript
// Memoized value only changes when dependencies change
function Provider({ children }) {
  const [user, setUser] = useState(null);
  
  const value = useMemo(
    () => ({ user, setUser }),
    [user]
  );
  
  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}
```