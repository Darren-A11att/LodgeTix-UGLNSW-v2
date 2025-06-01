'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

export default function AuthErrorPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  const getErrorMessage = () => {
    if (errorDescription) return errorDescription
    
    switch (error) {
      case 'access_denied':
        return 'Access was denied. You may not have permission to access this resource.'
      case 'invalid_request':
        return 'The request was invalid. Please try again.'
      case 'unauthorized_client':
        return 'You are not authorized to perform this action.'
      case 'server_error':
        return 'A server error occurred. Please try again later.'
      default:
        return 'An authentication error occurred. Please try again.'
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 text-destructive">
            <AlertCircle className="h-full w-full" />
          </div>
          <CardTitle className="text-2xl">Authentication Error</CardTitle>
          <CardDescription>
            Something went wrong during authentication
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-destructive/10 p-4">
            <p className="text-sm text-destructive">
              {getErrorMessage()}
            </p>
            {error && error !== errorDescription && (
              <p className="text-xs text-muted-foreground mt-2">
                Error code: {error}
              </p>
            )}
          </div>
          
          <div className="flex flex-col gap-2">
            <Button asChild className="w-full">
              <Link href="/login">Back to Login</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/">Go to Homepage</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}