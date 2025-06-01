'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Building2, Loader2, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { getBrowserClient } from '@/lib/supabase-singleton'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = getBrowserClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
        return
      }

      if (data.user) {
        // Check if user is an organiser
        const { data: orgUser } = await supabase
          .from('organisation_users')
          .select('organisation_id')
          .eq('user_id', data.user.id)
          .single()

        if (orgUser) {
          router.push('/organiser')
        } else {
          setError('You do not have access to the organiser portal.')
          await supabase.auth.signOut()
        }
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 text-primary">
            <Building2 className="h-full w-full" />
          </div>
          <CardTitle className="text-2xl">Organiser Portal</CardTitle>
          <CardDescription>
            Sign in to manage your events and registrations
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>

            <div className="text-center text-sm">
              <Link 
                href="/auth/forgot-password" 
                className="text-primary underline-offset-4 hover:underline"
              >
                Forgot your password?
              </Link>
            </div>
          </CardContent>
        </form>
        <CardFooter className="flex flex-col gap-2 text-sm text-center">
          <p className="text-muted-foreground">
            Access to the organiser portal is restricted to authorized users only.
          </p>
          <Link 
            href="/contact" 
            className="text-primary underline-offset-4 hover:underline"
          >
            Need access? Contact support
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}