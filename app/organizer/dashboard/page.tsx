'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { CalendarDays, Users, DollarSign, TrendingUp, AlertCircle, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'

export default function OrganizerDashboard() {
  const searchParams = useSearchParams()
  const isWelcome = searchParams.get('welcome') === 'true'

  // Placeholder data - will be replaced with real data in later TODOs
  const stats = [
    {
      title: "Active Events",
      value: "0",
      description: "Events currently accepting registrations",
      icon: CalendarDays,
      color: "text-blue-600"
    },
    {
      title: "Total Registrations",
      value: "0",
      description: "Across all events",
      icon: Users,
      color: "text-green-600"
    },
    {
      title: "Revenue (YTD)",
      value: "$0.00",
      description: "Year to date revenue",
      icon: DollarSign,
      color: "text-yellow-600"
    },
    {
      title: "Growth",
      value: "0%",
      description: "vs. last period",
      icon: TrendingUp,
      color: "text-purple-600"
    }
  ]

  const quickActions = [
    {
      title: "View My Events",
      description: "See all your events and registration counts",
      href: "/organizer/events",
      icon: CalendarDays,
      disabled: false // ✅ Implemented in TODO-003
    },
    {
      title: "View Registrations",
      description: "See all current registrations",
      href: "/organizer/registrations",
      icon: Users,
      disabled: true // Will enable in v1 TODO-004
    },
    {
      title: "Financial Reports",
      description: "View revenue and payment summaries",
      href: "/organizer/reports/financial",
      icon: DollarSign,
      disabled: true // Will enable in v1 TODO-007
    }
  ]

  const upcomingTasks = [
    "Complete Stripe Connect setup to accept payments",
    "Create your first event",
    "Review registration settings",
    "Set up email templates"
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Message */}
      {isWelcome && (
        <Alert className="border-green-200 bg-green-50">
          <AlertCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Welcome to the Organizer Portal!</AlertTitle>
          <AlertDescription className="text-green-700">
            Your account has been created successfully. Complete the setup steps below to start managing your events.
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
        <p className="text-gray-600">
          Overview of your events, registrations, and performance
        </p>
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
                <div className="flex items-center space-x-3 p-3 rounded-lg border bg-white border-gray-200 hover:border-gray-300">
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

        {/* Setup Checklist */}
        <Card>
          <CardHeader>
            <CardTitle>Setup Checklist</CardTitle>
            <CardDescription>
              Complete these steps to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingTasks.map((task, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-4 h-4 border-2 border-gray-300 rounded"></div>
                  </div>
                  <div className="text-sm text-gray-700">{task}</div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-200">
              <Button variant="outline" className="w-full" disabled>
                Complete Setup Guide
                <Badge variant="outline" className="ml-2 text-xs">
                  Coming Soon
                </Badge>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity (placeholder) */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest events and registrations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <CalendarDays className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No events yet</h3>
            <p className="text-gray-600">
              Create your first event to start seeing activity here
            </p>
            <Button className="mt-4" disabled>
              Create Event
              <Badge variant="outline" className="ml-2 text-xs">
                v4
              </Badge>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Development Note */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Development Status</AlertTitle>
        <AlertDescription>
          This dashboard shows placeholder data. Features will be progressively enabled as we implement v1-v5 TODOs.
          Current progress: Authentication & Basic Layout ✅
        </AlertDescription>
      </Alert>
    </div>
  )
}