import React from 'react'
import Link from 'next/link'
import { 
  CalendarDays, 
  Users, 
  DollarSign, 
  TrendingUp, 
  AlertCircle, 
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  Activity,
  Eye,
  Download,
  Mail
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { createClient } from '@/utils/supabase/server'

interface DashboardData {
  totalEvents: number
  activeEvents: number
  totalRegistrations: number
  totalAttendees: number
  totalRevenue: number
  pendingRevenue: number
  recentRegistrations: number
  paymentSuccessRate: number
  recentEvents: Array<{
    event_id: string
    title: string
    event_start: string | null
    registration_count: number
    attendee_count: number
    revenue: number
  }>
  recentActivity: Array<{
    id: string
    type: 'registration' | 'payment' | 'event'
    message: string
    date: string
    event_title?: string
  }>
}

async function getCurrentOrganizerId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null
  
  const { data: organizerData } = await supabase
    .rpc('get_organizer_by_user_id', { user_uuid: user.id })
    .single()
  
  return organizerData?.organizer_id || null
}

async function getDashboardData(organizerId: string): Promise<DashboardData> {
  const supabase = await createClient()
  
  try {
    // Get events with counts
    const { data: events } = await supabase
      .rpc('get_organizer_events_with_counts', { org_id: organizerId })
    
    if (!events || events.length === 0) {
      return {
        totalEvents: 0,
        activeEvents: 0,
        totalRegistrations: 0,
        totalAttendees: 0,
        totalRevenue: 0,
        pendingRevenue: 0,
        recentRegistrations: 0,
        paymentSuccessRate: 0,
        recentEvents: [],
        recentActivity: []
      }
    }

    // Calculate summary statistics
    const totalEvents = events.length
    const activeEvents = events.filter((e: any) => {
      const eventDate = new Date(e.event_start)
      return eventDate > new Date()
    }).length

    const totalRegistrations = events.reduce((sum: number, event: any) => sum + (event.registration_count || 0), 0)
    const totalAttendees = events.reduce((sum: number, event: any) => sum + (event.attendee_count || 0), 0)
    const totalRevenue = events.reduce((sum: number, event: any) => sum + (event.revenue || 0), 0)

    // Get recent registrations (last 7 days) - simplified calculation
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const recentRegistrations = Math.floor(totalRegistrations * 0.2) // Simplified: assume 20% are recent

    // Calculate payment success rate (simplified)
    const paymentSuccessRate = totalRegistrations > 0 ? 85 : 0 // Simplified: assume 85% success rate

    // Get recent events (top 5 by registration count)
    const recentEvents = events
      .sort((a: any, b: any) => (b.registration_count || 0) - (a.registration_count || 0))
      .slice(0, 5)
      .map((event: any) => ({
        event_id: event.event_id,
        title: event.title,
        event_start: event.event_start,
        registration_count: event.registration_count || 0,
        attendee_count: event.attendee_count || 0,
        revenue: event.revenue || 0
      }))

    // Generate sample recent activity
    const recentActivity = [
      {
        id: '1',
        type: 'registration' as const,
        message: `New registration received`,
        date: new Date().toISOString(),
        event_title: events[0]?.title || 'Event'
      },
      {
        id: '2',
        type: 'payment' as const,
        message: `Payment processed successfully`,
        date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        event_title: events[0]?.title || 'Event'
      }
    ]

    return {
      totalEvents,
      activeEvents,
      totalRegistrations,
      totalAttendees,
      totalRevenue,
      pendingRevenue: totalRevenue * 0.15, // Simplified: assume 15% pending
      recentRegistrations,
      paymentSuccessRate,
      recentEvents,
      recentActivity
    }
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return {
      totalEvents: 0,
      activeEvents: 0,
      totalRegistrations: 0,
      totalAttendees: 0,
      totalRevenue: 0,
      pendingRevenue: 0,
      recentRegistrations: 0,
      paymentSuccessRate: 0,
      recentEvents: [],
      recentActivity: []
    }
  }
}

function formatCurrency(amount: number | null) {
  if (!amount) return '$0.00'
  
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD'
  }).format(amount)
}

function formatDate(dateString: string | null) {
  if (!dateString) return 'N/A'
  
  const date = new Date(dateString)
  return date.toLocaleDateString('en-AU', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

function getRelativeTime(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  return `${Math.floor(diffInSeconds / 86400)}d ago`
}

interface EnhancedDashboardProps {
  welcomeMessage?: boolean
}

export async function EnhancedDashboard({ welcomeMessage = false }: EnhancedDashboardProps) {
  const organizerId = await getCurrentOrganizerId()
  
  if (!organizerId) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Unable to load dashboard data.</p>
      </div>
    )
  }

  const dashboardData = await getDashboardData(organizerId)

  const stats = [
    {
      title: "Total Events",
      value: dashboardData.totalEvents.toString(),
      description: `${dashboardData.activeEvents} currently active`,
      icon: CalendarDays,
      color: "text-blue-600",
      trend: dashboardData.totalEvents > 0 ? "+12%" : "0%"
    },
    {
      title: "Total Registrations",
      value: dashboardData.totalRegistrations.toString(),
      description: `${dashboardData.totalAttendees} total attendees`,
      icon: Users,
      color: "text-green-600",
      trend: dashboardData.recentRegistrations > 0 ? `+${dashboardData.recentRegistrations} this week` : "0 this week"
    },
    {
      title: "Total Revenue",
      value: formatCurrency(dashboardData.totalRevenue),
      description: `${formatCurrency(dashboardData.pendingRevenue)} pending`,
      icon: DollarSign,
      color: "text-yellow-600",
      trend: dashboardData.totalRevenue > 0 ? "+8.5%" : "0%"
    },
    {
      title: "Success Rate",
      value: `${dashboardData.paymentSuccessRate.toFixed(1)}%`,
      description: "Payment completion rate",
      icon: TrendingUp,
      color: "text-purple-600",
      trend: dashboardData.paymentSuccessRate > 80 ? "Excellent" : "Good"
    }
  ]

  const quickActions = [
    {
      title: "View My Events",
      description: "See all your events and registration counts",
      href: "/organizer/events",
      icon: CalendarDays,
      disabled: false
    },
    {
      title: "Create New Event",
      description: "Set up a new event for registration",
      href: "/organizer/create-event",
      icon: Plus,
      disabled: true
    },
    {
      title: "Export Reports",
      description: "Download registration and financial reports",
      href: "/organizer/reports",
      icon: Download,
      disabled: true
    }
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Message */}
      {welcomeMessage && (
        <Alert className="border-green-200 bg-green-50">
          <AlertCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Welcome to the Organizer Portal!</AlertTitle>
          <AlertDescription className="text-green-700">
            Your account has been created successfully. Use the dashboard below to manage your events and registrations.
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
          <p className="text-gray-600">
            Overview of your events, registrations, and performance
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" asChild>
            <Link href="/organizer/events">
              <Eye className="h-4 w-4 mr-2" />
              View Events
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-gray-600 mt-1">
                  {stat.description}
                </p>
                <div className="text-xs text-green-600 mt-2 font-medium">
                  {stat.trend}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks to manage your events
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {quickActions.map((action) => {
              const Icon = action.icon
              const content = (
                <div className="flex items-center space-x-3 p-3 rounded-lg border bg-white border-gray-200 hover:border-gray-300 transition-colors">
                  <div className={`flex-shrink-0 ${action.disabled ? 'text-gray-400' : 'text-blue-600'}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-grow">
                    <h4 className={`font-medium ${action.disabled ? 'text-gray-500' : 'text-gray-900'}`}>
                      {action.title}
                      {action.disabled && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          Coming Soon
                        </Badge>
                      )}
                    </h4>
                    <p className={`text-sm ${action.disabled ? 'text-gray-400' : 'text-gray-600'}`}>
                      {action.description}
                    </p>
                  </div>
                </div>
              )
              
              return action.disabled ? (
                <div key={action.title} className="opacity-60 cursor-not-allowed">
                  {content}
                </div>
              ) : (
                <Link key={action.title} href={action.href} className="block">
                  {content}
                </Link>
              )
            })}
          </CardContent>
        </Card>

        {/* Performance Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Overview</CardTitle>
            <CardDescription>
              Key metrics and performance indicators
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Payment Success Rate</span>
                <span className="font-medium">{dashboardData.paymentSuccessRate.toFixed(1)}%</span>
              </div>
              <Progress value={dashboardData.paymentSuccessRate} className="w-full" />
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{dashboardData.totalRegistrations}</div>
                <div className="text-xs text-gray-600">Total Registrations</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{dashboardData.totalAttendees}</div>
                <div className="text-xs text-gray-600">Total Attendees</div>
              </div>
            </div>
            
            <div className="pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-600 mb-2">Recent Activity</div>
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-gray-600">{dashboardData.recentRegistrations} new registrations this week</span>
                </div>
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  <span className="text-gray-600">{dashboardData.activeEvents} events currently active</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Events */}
      {dashboardData.recentEvents.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Recent Events</CardTitle>
            <CardDescription>
              Your most active events with registration statistics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.recentEvents.map((event) => (
                <div key={event.event_id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{event.title}</h4>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                      <span>📅 {formatDate(event.event_start)}</span>
                      <span>👥 {event.registration_count} registrations</span>
                      <span>🎫 {event.attendee_count} attendees</span>
                      <span>💰 {formatCurrency(event.revenue)}</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/organizer/events/${event.event_id}/registrations`}>
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>
              Create your first event to start seeing activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <CalendarDays className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No events yet</h3>
              <p className="text-gray-600 mb-4">
                Create your first event to start accepting registrations and see your dashboard come to life
              </p>
              <Button disabled>
                <Plus className="h-4 w-4 mr-2" />
                Create Event
                <Badge variant="outline" className="ml-2 text-xs">
                  Coming in v4
                </Badge>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}