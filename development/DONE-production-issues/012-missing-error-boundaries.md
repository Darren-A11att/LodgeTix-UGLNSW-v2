# Issue: Missing React Error Boundaries

**Status:** 🟡 YELLOW  
**Severity:** Medium  
**Category:** Error Handling / UX

## Problem Description
The application lacks React Error Boundaries to gracefully handle component crashes, relying only on console logging and a global error handler.

## Evidence
- No custom error boundaries in component tree
- Only `global-error.tsx` using Sentry for unhandled errors
- 91 files use console.error but don't show user-friendly messages
- No toast notifications for user-facing errors

## Impact
- Component crashes show white screen or broken UI
- Users don't get helpful error messages
- Difficult to recover from errors without page refresh
- Poor user experience when errors occur
- Console logs not visible to end users

## Root Cause
Error handling strategy focused on logging for developers rather than user experience. No systematic approach to displaying errors to users.

## Fix Plan

### Immediate Action
Add error boundaries around critical sections:
```typescript
// components/ui/error-boundary.tsx
export class ErrorBoundary extends Component {
  state = { hasError: false };
  
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  
  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <Alert variant="destructive">
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>
            Please refresh the page to continue.
          </AlertDescription>
        </Alert>
      );
    }
    return this.props.children;
  }
}
```

### Long-term Solution
1. Wrap key sections:
   - RegistrationWizard
   - Payment components
   - Event pages
   
2. Implement toast notifications for API errors
3. Create error recovery strategies
4. Add "retry" functionality for failed operations
5. Log errors to monitoring service (already have Sentry)

## Verification Steps
```bash
# Test error boundary
1. Add temporary throw in a component
2. Verify error boundary catches it
3. Check user sees friendly message
4. Verify error is logged

# Check production errors
# Monitor Sentry for uncaught errors
```