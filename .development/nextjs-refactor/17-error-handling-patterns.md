# Immutable Error Handling Laws

## Core Principles

These are the non-negotiable error handling laws that MUST be followed in all Next.js development:

### Law 1: Every Component Must Have Error Boundaries
- **ALL** page components must be wrapped in error boundaries
- Nested components should have their own boundaries for isolation
- Error boundaries must provide meaningful fallback UI
- Never let errors bubble to the root without handling

### Law 2: User-Friendly Error Messages
- Never expose technical details to users
- Provide actionable recovery instructions
- Include support contact information when appropriate
- Maintain brand voice even in error states

### Law 3: Comprehensive Error Logging
- Log all errors with full context
- Include user actions that led to the error
- Capture environment information
- Use structured logging for searchability

### Law 4: Graceful Degradation
- Application must remain partially functional during errors
- Provide fallback functionality where possible
- Cache critical data for offline scenarios
- Never lose user data due to errors

### Law 5: Server and Client Error Parity
- Handle errors consistently on server and client
- Use the same error types across boundaries
- Maintain error context during hydration
- Provide equivalent recovery options

### Law 6: Type-Safe Error Handling
- Define error types with TypeScript
- Use discriminated unions for error states
- Never use generic `Error` without context
- Validate error shapes at runtime

### Law 7: Network Error Resilience
- Implement retry logic for transient failures
- Use exponential backoff strategies
- Provide offline state indicators
- Queue failed requests when appropriate

### Law 8: Form Error Management
- Validate on both client and server
- Display field-level error messages
- Preserve user input during errors
- Provide clear correction instructions

### Law 9: API Error Standardization
- Use consistent error response format
- Include error codes for client handling
- Provide helpful error descriptions
- Return appropriate HTTP status codes

### Law 10: Performance During Errors
- Error handling must not degrade performance
- Lazy load error UI components
- Minimize error boundary re-renders
- Cache error states appropriately

## Implementation Patterns

### Error Boundary Pattern
```typescript
// components/ErrorBoundary.tsx
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<
  { children: ReactNode; fallback?: ComponentType<ErrorFallbackProps> },
  ErrorBoundaryState
> {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }
  
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to error reporting service
    logger.error('React Error Boundary caught error', {
      error: error.toString(),
      errorInfo: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    });
    
    this.setState({ errorInfo });
  }
  
  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      
      return (
        <FallbackComponent
          error={this.state.error}
          resetError={() => this.setState({ hasError: false, error: null })}
        />
      );
    }
    
    return this.props.children;
  }
}

// Usage in pages
export default function Page() {
  return (
    <ErrorBoundary fallback={PageErrorFallback}>
      <PageContent />
    </ErrorBoundary>
  );
}
```

### Async Error Handling
```typescript
// lib/api/client.ts
export class APIError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export async function apiClient<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const maxRetries = 3;
  let lastError: Error;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(`/api${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new APIError(
          error.message || 'An error occurred',
          error.code || 'UNKNOWN_ERROR',
          response.status,
          error.details
        );
      }
      
      return await response.json();
    } catch (error) {
      lastError = error;
      
      // Don't retry on client errors
      if (error instanceof APIError && error.status < 500) {
        throw error;
      }
      
      // Exponential backoff
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => 
          setTimeout(resolve, Math.pow(2, attempt) * 1000)
        );
      }
    }
  }
  
  throw lastError;
}
```

### Form Error Handling
```typescript
// components/forms/ErrorHandler.tsx
interface FormErrors {
  [field: string]: string | string[];
  _form?: string[];
}

export function useFormErrors() {
  const [errors, setErrors] = useState<FormErrors>({});
  
  const setFieldError = (field: string, message: string) => {
    setErrors(prev => ({ ...prev, [field]: message }));
  };
  
  const setFormError = (message: string) => {
    setErrors(prev => ({
      ...prev,
      _form: [...(prev._form || []), message],
    }));
  };
  
  const clearErrors = () => setErrors({});
  
  const getFieldError = (field: string): string | undefined => {
    const error = errors[field];
    return Array.isArray(error) ? error[0] : error;
  };
  
  return {
    errors,
    setFieldError,
    setFormError,
    clearErrors,
    getFieldError,
  };
}

// Form component
export function ContactForm() {
  const { errors, setFieldError, setFormError, clearErrors } = useFormErrors();
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearErrors();
    
    try {
      const formData = new FormData(e.currentTarget);
      const response = await apiClient('/contact', {
        method: 'POST',
        body: JSON.stringify(Object.fromEntries(formData)),
      });
      
      // Success handling
    } catch (error) {
      if (error instanceof APIError) {
        if (error.details?.fieldErrors) {
          Object.entries(error.details.fieldErrors).forEach(([field, msg]) => {
            setFieldError(field, msg as string);
          });
        } else {
          setFormError(error.message);
        }
      } else {
        setFormError('An unexpected error occurred. Please try again.');
      }
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {errors._form && (
        <div role="alert" className="error-message">
          {errors._form[0]}
        </div>
      )}
      
      <FormField
        name="email"
        error={getFieldError('email')}
        required
      />
      
      <button type="submit">Submit</button>
    </form>
  );
}
```

### Global Error Handler
```typescript
// lib/errors/handler.ts
interface ErrorContext {
  user?: User;
  route?: string;
  action?: string;
  metadata?: Record<string, any>;
}

class GlobalErrorHandler {
  private static instance: GlobalErrorHandler;
  
  static getInstance(): GlobalErrorHandler {
    if (!GlobalErrorHandler.instance) {
      GlobalErrorHandler.instance = new GlobalErrorHandler();
    }
    return GlobalErrorHandler.instance;
  }
  
  handleError(error: Error, context?: ErrorContext): void {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error:', error);
      console.error('Context:', context);
    }
    
    // Send to error tracking service
    if (typeof window !== 'undefined' && window.Sentry) {
      window.Sentry.captureException(error, {
        contexts: {
          app: context,
        },
      });
    }
    
    // Show user notification for certain error types
    if (error instanceof APIError && error.status >= 500) {
      showNotification({
        type: 'error',
        message: 'A server error occurred. Please try again later.',
      });
    }
  }
  
  handleAsyncError(error: Error, context?: ErrorContext): void {
    this.handleError(error, context);
    
    // Additional async error handling
    if (error.name === 'ChunkLoadError') {
      // Handle lazy loading failures
      window.location.reload();
    }
  }
}

export const errorHandler = GlobalErrorHandler.getInstance();

// Global error listeners
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    errorHandler.handleError(event.error, {
      route: window.location.pathname,
    });
  });
  
  window.addEventListener('unhandledrejection', (event) => {
    errorHandler.handleAsyncError(
      new Error(event.reason),
      { route: window.location.pathname }
    );
  });
}
```

### Next.js Error Pages
```typescript
// pages/_error.tsx
interface ErrorPageProps {
  statusCode: number;
  hasGetInitialPropsRun?: boolean;
  err?: Error;
}

function ErrorPage({ statusCode, hasGetInitialPropsRun, err }: ErrorPageProps) {
  if (!hasGetInitialPropsRun && err) {
    errorHandler.handleError(err, {
      route: 'error-page',
      metadata: { statusCode },
    });
  }
  
  return (
    <div className="error-page">
      <h1>
        {statusCode
          ? `A ${statusCode} error occurred on server`
          : 'An error occurred on client'}
      </h1>
      <p>
        {statusCode === 404
          ? 'This page could not be found.'
          : 'We apologize for the inconvenience. Please try again later.'}
      </p>
      <Link href="/">
        <a>Return Home</a>
      </Link>
    </div>
  );
}

ErrorPage.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode, hasGetInitialPropsRun: true };
};

export default ErrorPage;
```

### Error Recovery Patterns
```typescript
// hooks/useErrorRecovery.ts
export function useErrorRecovery() {
  const [error, setError] = useState<Error | null>(null);
  const [isRecovering, setIsRecovering] = useState(false);
  
  const recover = useCallback(async () => {
    if (!error) return;
    
    setIsRecovering(true);
    
    try {
      // Attempt recovery based on error type
      if (error.name === 'NetworkError') {
        // Wait for network to be available
        await waitForNetwork();
      } else if (error.name === 'ChunkLoadError') {
        // Reload the page
        window.location.reload();
      } else {
        // Generic recovery: clear error and retry
        setError(null);
      }
    } finally {
      setIsRecovering(false);
    }
  }, [error]);
  
  return { error, setError, recover, isRecovering };
}
```

## Testing Patterns

### Error Boundary Testing
```typescript
describe('ErrorBoundary', () => {
  it('should catch and display errors', () => {
    const ThrowError = () => {
      throw new Error('Test error');
    };
    
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );
    
    expect(getByText(/something went wrong/i)).toBeInTheDocument();
  });
  
  it('should reset error state', () => {
    const { getByText, rerender } = render(
      <ErrorBoundary>
        <div>Content</div>
      </ErrorBoundary>
    );
    
    // Trigger error
    rerender(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );
    
    fireEvent.click(getByText(/try again/i));
    
    expect(getByText('Content')).toBeInTheDocument();
  });
});
```

## Enforcement

These laws are enforced through:
1. TypeScript strict mode
2. ESLint rules for error handling
3. Code review requirements
4. Error monitoring dashboards
5. Automated error tracking

## References

- [React Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [Next.js Error Handling](https://nextjs.org/docs/advanced-features/error-handling)
- [Error Handling Best Practices](https://www.toptal.com/nodejs/node-js-error-handling)