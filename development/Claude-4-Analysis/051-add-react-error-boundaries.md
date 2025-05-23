# Task 051: Add React Error Boundaries

**Priority**: High  
**Category**: Error Handling  
**Dependencies**: Task 013 (Setup Structured Logging)  
**Estimated Time**: 3 hours  

## Problem

The application lacks React Error Boundaries, meaning:
- JavaScript errors in components crash the entire app
- Users see a white screen with no recovery option
- No error reporting for React component failures
- Poor user experience when errors occur
- Difficult debugging of production issues

## Solution

Implement a comprehensive error boundary system with:
1. Global error boundary for app-wide protection
2. Route-specific error boundaries
3. Component-level boundaries for critical features
4. Error reporting integration
5. User-friendly error UI with recovery options

## Implementation Steps

### 1. Create Base Error Boundary

Create `components/error-handling/ErrorBoundary.tsx`:

```typescript
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { logger } from '@/lib/structured-logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  level?: 'page' | 'section' | 'component';
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const errorId = `ERR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError, level = 'component' } = this.props;
    const { errorId } = this.state;

    // Log error with context
    logger.error('React Error Boundary Caught Error', {
      errorId,
      level,
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
      errorInfo: {
        componentStack: errorInfo.componentStack,
      },
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    });

    // Call custom error handler if provided
    if (onError) {
      onError(error, errorInfo);
    }

    // Update state with error info
    this.setState({ errorInfo });

    // Report to error tracking service (e.g., Sentry)
    if (typeof window !== 'undefined' && window.Sentry) {
      window.Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
        tags: {
          error_boundary: true,
          error_boundary_level: level,
          error_id: errorId,
        },
      });
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    const { hasError, error, errorInfo, errorId } = this.state;
    const { children, fallback, level = 'component', showDetails = false } = this.props;

    if (hasError && error) {
      // Use custom fallback if provided
      if (fallback) {
        return <>{fallback}</>;
      }

      // Default error UI based on level
      if (level === 'page') {
        return (
          <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
            <Card className="max-w-lg w-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="h-6 w-6" />
                  Oops! Something went wrong
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600">
                  We're sorry, but something unexpected happened. This error has been reported 
                  and we'll look into it.
                </p>
                
                {showDetails && (
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                      Error details (for developers)
                    </summary>
                    <div className="mt-2 p-4 bg-gray-100 rounded-md overflow-auto">
                      <p className="text-xs font-mono text-gray-700">
                        Error ID: {errorId}
                      </p>
                      <p className="text-xs font-mono text-red-600 mt-2">
                        {error.toString()}
                      </p>
                      {errorInfo && (
                        <pre className="text-xs mt-2 whitespace-pre-wrap">
                          {errorInfo.componentStack}
                        </pre>
                      )}
                    </div>
                  </details>
                )}
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button onClick={this.handleReload} variant="default">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reload Page
                </Button>
                <Button onClick={this.handleGoHome} variant="outline">
                  <Home className="h-4 w-4 mr-2" />
                  Go Home
                </Button>
              </CardFooter>
            </Card>
          </div>
        );
      }

      if (level === 'section') {
        return (
          <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-800">
                  This section couldn't be loaded
                </h3>
                <p className="text-sm text-red-600 mt-1">
                  Error ID: {errorId}
                </p>
                <Button
                  onClick={this.handleReset}
                  size="sm"
                  variant="outline"
                  className="mt-3"
                >
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        );
      }

      // Component level error
      return (
        <div className="inline-flex items-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded-md text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>Failed to load</span>
          <button
            onClick={this.handleReset}
            className="underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      );
    }

    return children;
  }
}
```

### 2. Create Async Error Boundary

Create `components/error-handling/AsyncErrorBoundary.tsx`:

```typescript
import { Component, ReactNode } from 'react';
import { ErrorBoundary } from './ErrorBoundary';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  asyncError: Error | null;
}

export class AsyncErrorBoundary extends Component<Props, State> {
  state: State = {
    asyncError: null,
  };

  static getDerivedStateFromError(error: Error): State {
    return { asyncError: error };
  }

  componentDidMount() {
    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection);
  }

  componentWillUnmount() {
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
  }

  handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    const error = new Error(
      event.reason?.message || 'Unhandled Promise Rejection'
    );
    error.stack = event.reason?.stack;
    
    this.setState({ asyncError: error });
    
    // Prevent default browser handling
    event.preventDefault();
  };

  render() {
    const { asyncError } = this.state;
    const { children, fallback } = this.props;

    if (asyncError) {
      throw asyncError;
    }

    return (
      <ErrorBoundary fallback={fallback} level="section">
        {children}
      </ErrorBoundary>
    );
  }
}
```

### 3. Create Form Error Boundary

Create `components/error-handling/FormErrorBoundary.tsx`:

```typescript
import { ErrorBoundary } from './ErrorBoundary';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface FormErrorBoundaryProps {
  children: React.ReactNode;
  formName: string;
}

export function FormErrorBoundary({ children, formName }: FormErrorBoundaryProps) {
  return (
    <ErrorBoundary
      level="component"
      fallback={
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Form Error</AlertTitle>
          <AlertDescription>
            The {formName} form encountered an error and couldn't be displayed.
            Please refresh the page or contact support if the issue persists.
          </AlertDescription>
        </Alert>
      }
      onError={(error, errorInfo) => {
        // Log form-specific error context
        logger.error('Form Error', {
          formName,
          error: error.message,
          componentStack: errorInfo.componentStack,
        });
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
```

### 4. Update App Layout

Update `app/layout.tsx`:

```typescript
import { ErrorBoundary } from '@/components/error-handling/ErrorBoundary';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'LodgeTix',
  description: 'Masonic Event Registration',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary 
          level="page" 
          showDetails={process.env.NODE_ENV === 'development'}
        >
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
```

### 5. Protect Critical Components

Update registration wizard in `components/register/RegistrationWizard/registration-wizard.tsx`:

```typescript
import { ErrorBoundary } from '@/components/error-handling/ErrorBoundary';
import { FormErrorBoundary } from '@/components/error-handling/FormErrorBoundary';

export function RegistrationWizard({ eventId }: RegistrationWizardProps) {
  return (
    <ErrorBoundary level="section">
      <WizardBodyStructureLayout>
        {/* Protect each step individually */}
        {currentStep === 0 && (
          <FormErrorBoundary formName="Registration Type">
            <RegistrationTypeStep onNext={handleNext} />
          </FormErrorBoundary>
        )}
        
        {currentStep === 1 && (
          <FormErrorBoundary formName="Attendee Details">
            <AttendeeDetailsStep onNext={handleNext} onBack={handleBack} />
          </FormErrorBoundary>
        )}
        
        {/* ... other steps ... */}
      </WizardBodyStructureLayout>
    </ErrorBoundary>
  );
}
```

### 6. Create Error Recovery Hook

Create `hooks/useErrorRecovery.ts`:

```typescript
import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

interface UseErrorRecoveryOptions {
  onRecover?: () => void;
  fallbackUrl?: string;
}

export function useErrorRecovery(options: UseErrorRecoveryOptions = {}) {
  const router = useRouter();
  const [isRecovering, setIsRecovering] = useState(false);

  const recover = useCallback(async () => {
    setIsRecovering(true);
    
    try {
      // Clear any cached data that might be corrupted
      if (typeof window !== 'undefined') {
        // Clear specific localStorage items
        localStorage.removeItem('registration-draft');
        sessionStorage.clear();
      }

      // Call custom recovery function if provided
      if (options.onRecover) {
        await options.onRecover();
      }

      // Navigate to fallback URL or refresh
      if (options.fallbackUrl) {
        router.push(options.fallbackUrl);
      } else {
        window.location.reload();
      }
    } catch (error) {
      console.error('Recovery failed:', error);
      // Last resort - go home
      window.location.href = '/';
    } finally {
      setIsRecovering(false);
    }
  }, [options, router]);

  return { recover, isRecovering };
}
```

### 7. Add Error Monitoring Dashboard

Create `app/admin/errors/page.tsx`:

```typescript
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getErrorLogs } from '@/lib/api/admin/errorService';

interface ErrorLog {
  id: string;
  timestamp: string;
  level: string;
  message: string;
  errorId: string;
  url: string;
  userAgent: string;
  stack?: string;
}

export default function ErrorDashboard() {
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadErrors();
  }, []);

  const loadErrors = async () => {
    try {
      const data = await getErrorLogs({ limit: 50 });
      setErrors(data);
    } catch (error) {
      console.error('Failed to load error logs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading error logs...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Error Monitoring</h1>
      
      <div className="grid gap-4">
        {errors.map((error) => (
          <Card key={error.id}>
            <CardHeader>
              <CardTitle className="text-lg">
                {error.message}
              </CardTitle>
              <p className="text-sm text-gray-500">
                {new Date(error.timestamp).toLocaleString()} • {error.errorId}
              </p>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <dt className="font-medium">URL:</dt>
                <dd className="truncate">{error.url}</dd>
                
                <dt className="font-medium">User Agent:</dt>
                <dd className="truncate">{error.userAgent}</dd>
              </dl>
              
              {error.stack && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-medium">
                    Stack Trace
                  </summary>
                  <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-auto">
                    {error.stack}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

## Testing

Create tests for error boundaries:

```typescript
// __tests__/error-boundary.test.tsx
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '@/components/error-handling/ErrorBoundary';

const ThrowError = () => {
  throw new Error('Test error');
};

describe('ErrorBoundary', () => {
  it('catches errors and displays fallback UI', () => {
    render(
      <ErrorBoundary level="component">
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Failed to load/i)).toBeInTheDocument();
    expect(screen.getByText(/Retry/i)).toBeInTheDocument();
  });

  it('recovers when retry is clicked', () => {
    const { rerender } = render(
      <ErrorBoundary level="component">
        <ThrowError />
      </ErrorBoundary>
    );

    const retryButton = screen.getByText(/Retry/i);
    fireEvent.click(retryButton);

    // Component should attempt to render again
    rerender(
      <ErrorBoundary level="component">
        <div>Recovered content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Recovered content')).toBeInTheDocument();
  });
});
```

## Benefits

1. **User Experience**: No more white screens of death
2. **Error Visibility**: All React errors are logged and tracked
3. **Recovery Options**: Users can retry or navigate away
4. **Debugging**: Error IDs and stack traces for developers
5. **Granular Protection**: Different error UIs for different contexts

## Next Steps

1. Implement retry mechanisms (Task 052)
2. Create structured error responses (Task 053)
3. Add error analytics dashboard
4. Implement error replay for debugging