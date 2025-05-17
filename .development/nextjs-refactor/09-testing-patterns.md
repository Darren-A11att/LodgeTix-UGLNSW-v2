# Testing Patterns

## Immutable Testing Laws

### 1. Testing Pyramid

```
         E2E Tests
        /         \
      Integration   
     /            \
   Unit Tests      
```

- **Unit Tests**: 70% - Fast, isolated component/function tests
- **Integration Tests**: 20% - Component interaction tests
- **E2E Tests**: 10% - Critical user journey tests

### 2. Component Testing

#### Basic Component Test
```typescript
// __tests__/components/EventCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { EventCard } from '@/components/EventCard'

describe('EventCard', () => {
  const mockEvent = {
    id: '1',
    title: 'Test Event',
    description: 'Test Description',
    date: '2024-12-25'
  }

  it('renders event information', () => {
    render(<EventCard event={mockEvent} />)
    
    expect(screen.getByText('Test Event')).toBeInTheDocument()
    expect(screen.getByText('Test Description')).toBeInTheDocument()
  })

  it('calls onSelect when clicked', () => {
    const handleSelect = jest.fn()
    render(<EventCard event={mockEvent} onSelect={handleSelect} />)
    
    fireEvent.click(screen.getByRole('button'))
    expect(handleSelect).toHaveBeenCalledWith(mockEvent)
  })
})
```

### 3. Hook Testing

```typescript
// __tests__/hooks/useCounter.test.ts
import { renderHook, act } from '@testing-library/react'
import { useCounter } from '@/hooks/useCounter'

describe('useCounter', () => {
  it('increments counter', () => {
    const { result } = renderHook(() => useCounter())
    
    expect(result.current.count).toBe(0)
    
    act(() => {
      result.current.increment()
    })
    
    expect(result.current.count).toBe(1)
  })

  it('decrements counter', () => {
    const { result } = renderHook(() => useCounter(5))
    
    act(() => {
      result.current.decrement()
    })
    
    expect(result.current.count).toBe(4)
  })
})
```

### 4. Server Component Testing

```typescript
// __tests__/app/events/page.test.tsx
import { render } from '@testing-library/react'
import EventsPage from '@/app/events/page'

// Mock the data fetching
jest.mock('@/lib/api/events', () => ({
  fetchEvents: jest.fn().mockResolvedValue([
    { id: '1', title: 'Event 1' },
    { id: '2', title: 'Event 2' }
  ])
}))

describe('EventsPage', () => {
  it('renders events list', async () => {
    const { container } = render(await EventsPage())
    
    expect(container.textContent).toContain('Event 1')
    expect(container.textContent).toContain('Event 2')
  })
})
```

### 5. API Route Testing

```typescript
// __tests__/api/events.test.ts
import { POST, GET } from '@/app/api/events/route'
import { NextRequest } from 'next/server'

describe('/api/events', () => {
  describe('GET', () => {
    it('returns events list', async () => {
      const request = new NextRequest('http://localhost:3000/api/events')
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
    })
  })

  describe('POST', () => {
    it('creates new event', async () => {
      const request = new NextRequest('http://localhost:3000/api/events', {
        method: 'POST',
        body: JSON.stringify({
          title: 'New Event',
          description: 'Description'
        })
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(201)
      expect(data.title).toBe('New Event')
    })
  })
})
```

### 6. Integration Testing

```typescript
// __tests__/integration/event-creation.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { EventForm } from '@/components/EventForm'
import { createEvent } from '@/lib/api/events'

jest.mock('@/lib/api/events')

describe('Event Creation Flow', () => {
  it('creates event and redirects', async () => {
    const mockCreate = createEvent as jest.Mock
    mockCreate.mockResolvedValue({ id: '123' })
    
    const mockRouter = {
      push: jest.fn()
    }
    
    render(<EventForm router={mockRouter} />)
    
    // Fill form
    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'Test Event' }
    })
    
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'Test Description' }
    })
    
    // Submit
    fireEvent.click(screen.getByText('Create Event'))
    
    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith({
        title: 'Test Event',
        description: 'Test Description'
      })
      expect(mockRouter.push).toHaveBeenCalledWith('/events/123')
    })
  })
})
```

### 7. E2E Testing with Playwright

```typescript
// e2e/event-booking.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Event Booking Flow', () => {
  test('complete booking process', async ({ page }) => {
    // Navigate to event
    await page.goto('/events/grand-installation')
    
    // Click register button
    await page.click('text=Register Now')
    
    // Fill attendee information
    await page.fill('[name="name"]', 'John Doe')
    await page.fill('[name="email"]', 'john@example.com')
    
    // Select tickets
    await page.selectOption('[name="ticketType"]', 'vip')
    await page.fill('[name="quantity"]', '2')
    
    // Continue to payment
    await page.click('text=Continue to Payment')
    
    // Fill payment details
    await page.frameLocator('#stripe-frame').locator('[name="cardNumber"]').fill('4242424242424242')
    await page.frameLocator('#stripe-frame').locator('[name="cardExpiry"]').fill('12/25')
    await page.frameLocator('#stripe-frame').locator('[name="cardCvc"]').fill('123')
    
    // Complete booking
    await page.click('text=Complete Booking')
    
    // Verify confirmation
    await expect(page).toHaveURL(/\/confirmation/)
    await expect(page.locator('text=Booking Confirmed')).toBeVisible()
  })
})
```

### 8. Mocking Patterns

```typescript
// __mocks__/next/navigation.ts
export const useRouter = jest.fn(() => ({
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn()
}))

export const useSearchParams = jest.fn(() => ({
  get: jest.fn(),
  getAll: jest.fn()
}))

export const usePathname = jest.fn(() => '/current/path')

// __tests__/components/Navigation.test.tsx
import { useRouter } from 'next/navigation'

describe('Navigation', () => {
  it('navigates to correct path', () => {
    const mockPush = jest.fn()
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush })
    
    render(<Navigation />)
    fireEvent.click(screen.getByText('Events'))
    
    expect(mockPush).toHaveBeenCalledWith('/events')
  })
})
```

### 9. Testing Custom Hooks

```typescript
// hooks/useDebounce.ts
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)
  
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  
  return debouncedValue
}

// __tests__/hooks/useDebounce.test.ts
describe('useDebounce', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })
  
  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })
  
  it('debounces value changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    )
    
    expect(result.current).toBe('initial')
    
    // Change value
    rerender({ value: 'updated', delay: 500 })
    
    // Still initial value
    expect(result.current).toBe('initial')
    
    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(500)
    })
    
    // Now updated
    expect(result.current).toBe('updated')
  })
})
```

### 10. Testing Error Boundaries

```typescript
// components/ErrorBoundary.tsx
export class ErrorBoundary extends Component<Props, State> {
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback />
    }
    
    return this.props.children
  }
}

// __tests__/components/ErrorBoundary.test.tsx
describe('ErrorBoundary', () => {
  it('catches errors and displays fallback', () => {
    const ThrowError = () => {
      throw new Error('Test error')
    }
    
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    )
    
    expect(getByText('Something went wrong')).toBeInTheDocument()
  })
})
```

### 11. Performance Testing

```typescript
// __tests__/performance/EventList.perf.test.tsx
import { render } from '@testing-library/react'
import { EventList } from '@/components/EventList'

describe('EventList Performance', () => {
  it('renders large lists efficiently', () => {
    const events = Array.from({ length: 1000 }, (_, i) => ({
      id: String(i),
      title: `Event ${i}`,
      date: new Date().toISOString()
    }))
    
    const start = performance.now()
    render(<EventList events={events} />)
    const renderTime = performance.now() - start
    
    expect(renderTime).toBeLessThan(100) // Should render in < 100ms
  })
})
```

### 12. Accessibility Testing

```typescript
// __tests__/a11y/EventCard.a11y.test.tsx
import { render } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { EventCard } from '@/components/EventCard'

expect.extend(toHaveNoViolations)

describe('EventCard Accessibility', () => {
  it('has no accessibility violations', async () => {
    const { container } = render(
      <EventCard event={mockEvent} />
    )
    
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
```

### 13. Snapshot Testing

```typescript
// __tests__/components/EventCard.snapshot.test.tsx
describe('EventCard Snapshots', () => {
  it('matches snapshot', () => {
    const { container } = render(
      <EventCard event={mockEvent} />
    )
    
    expect(container.firstChild).toMatchSnapshot()
  })
  
  it('matches snapshot when selected', () => {
    const { container } = render(
      <EventCard event={mockEvent} selected />
    )
    
    expect(container.firstChild).toMatchSnapshot()
  })
})
```

### 14. Test Configuration

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$))'
  ],
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
}
```

### 15. Testing Best Practices

1. **Test behavior, not implementation**
2. **Use descriptive test names**
3. **Follow AAA pattern**: Arrange, Act, Assert
4. **Mock external dependencies**
5. **Test edge cases and errors**
6. **Keep tests isolated and independent**
7. **Use test utilities and helpers**
8. **Maintain test coverage above 80%**
9. **Run tests before committing**
10. **Use CI/CD for automated testing**

### Testing Checklist

- [ ] Write unit tests for utilities and hooks
- [ ] Test component rendering and interaction
- [ ] Test API routes with different scenarios
- [ ] Create integration tests for workflows
- [ ] Add E2E tests for critical paths
- [ ] Test error states and edge cases
- [ ] Check accessibility compliance
- [ ] Monitor performance benchmarks
- [ ] Use proper mocking strategies
- [ ] Maintain good test coverage