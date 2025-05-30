import React, { Component, ReactNode } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

export class RealtimeErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[RealtimeErrorBoundary] Caught error:', error, errorInfo)
    this.setState({ errorInfo })
    
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return <>{this.props.fallback}</>
      }

      const isRealtimeError = this.state.error?.message?.toLowerCase().includes('realtime') ||
                              this.state.error?.message?.toLowerCase().includes('supabase') ||
                              this.state.error?.message?.toLowerCase().includes('websocket')

      return (
        <Alert variant="destructive" className="my-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>
            {isRealtimeError ? 'Connection Error' : 'Something went wrong'}
          </AlertTitle>
          <AlertDescription className="space-y-2">
            <p>
              {isRealtimeError
                ? 'We\'re having trouble connecting to real-time updates. The page will continue to work, but you may not see live updates.'
                : 'An unexpected error occurred. Please try refreshing the page.'}
            </p>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-2">
                <summary className="cursor-pointer text-sm font-medium">Error details</summary>
                <pre className="mt-2 text-xs overflow-auto bg-gray-100 p-2 rounded">
                  {this.state.error.message}
                  {this.state.errorInfo && '\n\n' + this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
            <div className="flex gap-2 mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={this.handleReset}
                className="gap-2"
              >
                <RefreshCw className="h-3 w-3" />
                Try Again
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )
    }

    return this.props.children
  }
}

// Hook for using error boundary
export function useRealtimeErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null)

  const resetError = React.useCallback(() => {
    setError(null)
  }, [])

  const captureError = React.useCallback((error: Error) => {
    console.error('[useRealtimeErrorHandler] Captured error:', error)
    setError(error)
  }, [])

  return { error, resetError, captureError }
}