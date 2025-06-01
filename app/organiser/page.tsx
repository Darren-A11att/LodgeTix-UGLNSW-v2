import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  CalendarDays, 
  Users, 
  Ticket, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  Activity,
  Calendar
} from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { formatCurrency } from '@/lib/formatters'

export default async function OrganiserDashboard() {
  const supabase = await createClient()
  
  // Get current user's organisation
  const { data: { user } } = await supabase.auth.getUser()
  const { data: organisation } = await supabase
    .from('organisations')
    .select('*')
    .eq('email_address', user?.email)
    .single()

  if (!organisation) return null

  // Get statistics
  const { data: functions } = await supabase
    .from('functions')
    .select('*, events(*), registrations(*)')
    .eq('organiser_id', organisation.organisation_id)

  const { data: recentRegistrations } = await supabase
    .from('registrations')
    .select(`
      *,
      attendees(count),
      functions(name, slug)
    `)
    .eq('function_id', functions?.[0]?.function_id || '')
    .order('created_at', { ascending: false })
    .limit(5)

  // Calculate statistics
  const totalFunctions = functions?.length || 0
  const totalEvents = functions?.reduce((acc, func) => acc + (func.events?.length || 0), 0) || 0
  const totalRegistrations = functions?.reduce((acc, func) => acc + (func.registrations?.length || 0), 0) || 0
  const totalRevenue = functions?.reduce((acc, func) => {
    return acc + (func.registrations?.reduce((sum, reg) => sum + (reg.total_amount || 0), 0) || 0)
  }, 0) || 0

  // Get upcoming events
  const upcomingEvents = functions?.flatMap(func => 
    func.events?.map(event => ({ ...event, functionName: func.name })) || []
  ).filter(event => new Date(event.event_start) > new Date())
    .sort((a, b) => new Date(a.event_start).getTime() - new Date(b.event_start).getTime())
    .slice(0, 5) || []

  const stats = [
    {
      title: 'Total Functions',
      value: totalFunctions,
      icon: CalendarDays,
      description: 'Active functions',
      trend: '+12%',
      trendUp: true
    },
    {
      title: 'Total Events',
      value: totalEvents,
      icon: Calendar,
      description: 'Across all functions',
      trend: '+8%',
      trendUp: true
    },
    {
      title: 'Total Registrations',
      value: totalRegistrations,
      icon: Users,
      description: 'All time',
      trend: '+23%',
      trendUp: true
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(totalRevenue),
      icon: DollarSign,
      description: 'Before fees',
      trend: '+15%',
      trendUp: true
    }
  ]

  return (
    <div className="flex flex-col gap-8 p-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome back!</h1>
        <p className="text-muted-foreground">
          Here's an overview of your organisation's performance
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{stat.description}</span>
                <span className={`flex items-center gap-1 ${stat.trendUp ? 'text-green-600' : 'text-red-600'}`}>
                  {stat.trendUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {stat.trend}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Recent Registrations */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Registrations</CardTitle>
            <CardDescription>Latest registrations across your functions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentRegistrations?.map((registration) => (
              <div key={registration.registration_id} className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    {registration.contact_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {registration.functions?.name} • {registration.attendees?.count || 0} attendees
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {formatCurrency(registration.total_amount || 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(registration.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
            <Button variant="outline" className="w-full" asChild>
              <Link href="/organiser/registrations">View All Registrations</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
            <CardDescription>Your next scheduled events</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingEvents.map((event: any) => (
              <div key={event.event_id} className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">{event.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {event.functionName}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm">
                    {new Date(event.event_start).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(event.event_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            <Button variant="outline" className="w-full" asChild>
              <Link href="/organiser/events">View All Events</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <Button variant="outline" className="h-24 flex-col gap-2" asChild>
              <Link href="/organiser/functions/new">
                <CalendarDays className="h-6 w-6" />
                <span>Create Function</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-24 flex-col gap-2" asChild>
              <Link href="/organiser/events/new">
                <Calendar className="h-6 w-6" />
                <span>Add Event</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-24 flex-col gap-2" asChild>
              <Link href="/organiser/registrations">
                <Users className="h-6 w-6" />
                <span>View Registrations</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-24 flex-col gap-2" asChild>
              <Link href="/organiser/reports">
                <Activity className="h-6 w-6" />
                <span>Generate Report</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}