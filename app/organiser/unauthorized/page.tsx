import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ShieldAlert } from 'lucide-react'
import Link from 'next/link'

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 text-destructive">
            <ShieldAlert className="h-full w-full" />
          </div>
          <CardTitle className="text-2xl">Access Denied</CardTitle>
          <CardDescription>
            You don't have permission to access the organiser portal
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-center text-muted-foreground">
            The organiser portal is only available to authorized organisation administrators. 
            If you believe you should have access, please contact your organisation administrator.
          </p>
          <div className="flex flex-col gap-2">
            <Button asChild className="w-full">
              <Link href="/">Return to Home</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/contact">Contact Support</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}