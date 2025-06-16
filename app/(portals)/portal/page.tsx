import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CalendarDays, Ticket, User, ArrowRight, UserCheck } from 'lucide-react'
import Link from 'next/link'
import { userRoleService } from '@/lib/services/user-role-service'
import { redirect } from 'next/navigation'

const iconMap = {
  'calendar-days': CalendarDays,
  'ticket': Ticket,
  'user': User,
}

export default async function PortalHub() {
  const supabase = await createClient()
  
  // Check if user is authenticated and permanent (not anonymous)
  const { data: { user } } = await supabase.auth.getUser()
  
  console.log('[Portal] User check:', user ? { id: user.id, anonymous: user.is_anonymous } : 'No user')
  
  if (!user || user.is_anonymous) {
    console.log('[Portal] Redirecting to login - no user or anonymous user')
    redirect('/login')
  }
  
  console.log('[Portal] User authenticated, showing portal hub')

  // Get available personas for the user
  const personas = await userRoleService.getAvailablePersonas()
  const availablePersonas = personas.filter(p => p.available)

  // Always show portal hub to authenticated users - let them choose their portal
  // This ensures all authenticated users can access the base portal regardless of permissions
  
  // If no personas are available, ensure customer portal is always available for new users
  const displayPersonas = availablePersonas.length > 0 ? availablePersonas : [
    {
      role: 'customer',
      title: 'Customer Portal',
      description: 'Register for events and manage your bookings',
      path: '/customer',
      icon: 'ticket',
      available: true
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <UserCheck className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back!</h1>
          <p className="text-muted-foreground mt-2">
            Choose your portal to access your account features
          </p>
        </div>

        {/* Available Personas Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {displayPersonas.map((persona) => {
            const Icon = iconMap[persona.icon as keyof typeof iconMap] || User
            
            return (
              <Card key={persona.role} className="relative group hover:shadow-lg transition-shadow">
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{persona.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {persona.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button asChild className="w-full group-hover:translate-x-1 transition-transform">
                    <Link href={persona.path} className="flex items-center justify-center gap-2">
                      Access Portal
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Additional Actions */}
        <div className="mt-12 text-center">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Need Help?</CardTitle>
              <CardDescription>
                If you're having trouble accessing your portals or need assistance
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="outline" asChild>
                <Link href="/help">
                  Visit Help Center
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/contact">
                  Contact Support
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* User Actions */}
        <div className="mt-8 flex justify-center">
          <Button variant="ghost" asChild>
            <Link href="/logout" className="text-muted-foreground hover:text-foreground">
              Sign Out
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}