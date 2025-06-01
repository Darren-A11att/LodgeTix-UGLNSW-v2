import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 text-destructive">
            <AlertCircle className="h-full w-full" />
          </div>
          <CardTitle className="text-2xl">Authentication Error</CardTitle>
          <CardDescription>
            There was a problem with the authentication link
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-center text-muted-foreground">
            The link you followed may be expired or invalid. This can happen if:
          </p>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
            <li>The link has already been used</li>
            <li>The link has expired (links expire after 24 hours)</li>
            <li>The link was incomplete or corrupted</li>
          </ul>
          <div className="flex flex-col gap-2 pt-4">
            <Button asChild className="w-full">
              <Link href="/login">Back to Login</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/auth/forgot-password">Request New Link</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}