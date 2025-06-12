import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CreditCard, Receipt, Ticket, Calendar, User, Plus } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/formatters'

export default async function CustomerDashboard() {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card>
          <CardHeader>
            <CardTitle>Please Log In</CardTitle>
            <CardDescription>You need to be logged in to access your customer dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/login">Go to Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Get customer data
  const { data: customer } = await supabase
    .from('customers')
    .select('*')
    .eq('auth_user_id', user.id)
    .single()

  // Get registrations for this customer
  const { data: registrations } = await supabase
    .from('registrations')
    .select(`
      *,
      functions(name, slug),
      attendees(count),
      tickets(count)
    `)
    .eq('auth_user_id', user.id)
    .order('created_at', { ascending: false })

  // Calculate stats
  const totalRegistrations = registrations?.length || 0
  const totalPaid = registrations?.reduce((sum, reg) => sum + (reg.total_amount_paid || 0), 0) || 0
  const totalAttendees = registrations?.reduce((sum, reg) => sum + (reg.attendees?.count || 0), 0) || 0
  const totalTickets = registrations?.reduce((sum, reg) => sum + (reg.tickets?.count || 0), 0) || 0

  // Get recent registrations
  const recentRegistrations = registrations?.slice(0, 5) || []

  return (
    <div className="flex flex-col gap-8 p-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome back!</h1>
        <p className="text-muted-foreground">
          Here's your customer dashboard with your registrations and tickets
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Registrations</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRegistrations}</div>
            <p className="text-xs text-muted-foreground">
              All time registrations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPaid)}</div>
            <p className="text-xs text-muted-foreground">
              Across all registrations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Attendees</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAttendees}</div>
            <p className="text-xs text-muted-foreground">
              People registered
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTickets}</div>
            <p className="text-xs text-muted-foreground">
              Event tickets
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Recent Registrations */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Registrations</CardTitle>
            <CardDescription>Your latest registrations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentRegistrations.length > 0 ? (
              <>
                {recentRegistrations.map((registration) => (
                  <div key={registration.registration_id} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        {registration.functions?.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {registration.attendees?.count || 0} attendees • {registration.payment_status}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {formatCurrency(registration.total_amount_paid || 0)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(registration.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/customer/registrations">View All Registrations</Link>
                </Button>
              </>
            ) : (
              <div className="text-center py-8">
                <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No registrations yet</p>
                <Button asChild>
                  <Link href="/">
                    <Plus className="h-4 w-4 mr-2" />
                    Find Events to Register
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/customer/registrations" className="flex items-center gap-3">
                <Receipt className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">View Registrations</div>
                  <div className="text-xs text-muted-foreground">Manage your registrations</div>
                </div>
              </Link>
            </Button>

            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/customer/tickets" className="flex items-center gap-3">
                <Ticket className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">View Tickets</div>
                  <div className="text-xs text-muted-foreground">Access your event tickets</div>
                </div>
              </Link>
            </Button>

            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/" className="flex items-center gap-3">
                <Calendar className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">Browse Events</div>
                  <div className="text-xs text-muted-foreground">Find new events to attend</div>
                </div>
              </Link>
            </Button>

            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/portal" className="flex items-center gap-3">
                <User className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">Portal Hub</div>
                  <div className="text-xs text-muted-foreground">Access other portals</div>
                </div>
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Registration Prompt */}
      {totalRegistrations === 0 && (
        <Card className="border-dashed">
          <CardHeader className="text-center">
            <CardTitle>Get Started</CardTitle>
            <CardDescription>
              Register for your first event to start using the customer portal
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild size="lg">
              <Link href="/">
                <Plus className="h-4 w-4 mr-2" />
                Browse Available Events
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
