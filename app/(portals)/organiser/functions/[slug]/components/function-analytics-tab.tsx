'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { 
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  Ticket
} from 'lucide-react'
import { formatCurrency } from '@/lib/formatters'

interface FunctionAnalyticsTabProps {
  functionId: string
  functionData: any
}

export function FunctionAnalyticsTab({ functionId, functionData }: FunctionAnalyticsTabProps) {
  // Calculate analytics data
  const totalCapacity = functionData.events?.reduce((sum: number, event: any) => {
    return sum + (event.event_tickets?.reduce((ticketSum: number, ticket: any) => 
      ticketSum + (ticket.quantity_total || 0), 0) || 0)
  }, 0) || 0

  const ticketsSold = functionData.events?.reduce((sum: number, event: any) => {
    return sum + (event.event_tickets?.reduce((ticketSum: number, ticket: any) => 
      ticketSum + (ticket.quantity_sold || 0), 0) || 0)
  }, 0) || 0

  const soldPercentage = totalCapacity > 0 ? (ticketsSold / totalCapacity) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Sales</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ticketsSold}</div>
            <p className="text-xs text-muted-foreground">
              of {totalCapacity} available
            </p>
            <Progress value={soldPercentage} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {soldPercentage.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Tickets sold vs available
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Party Size</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.4</div>
            <p className="text-xs text-muted-foreground">
              Attendees per registration
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Target</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">68%</div>
            <p className="text-xs text-muted-foreground">
              Of projected revenue
            </p>
            <Progress value={68} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Charts Placeholder */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sales Over Time</CardTitle>
            <CardDescription>Daily registration trends</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 mx-auto mb-2" />
              <p>Sales chart visualization coming soon</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue by Event</CardTitle>
            <CardDescription>Revenue distribution across events</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 mx-auto mb-2" />
              <p>Revenue chart visualization coming soon</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Popular Events */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Events</CardTitle>
          <CardDescription>Events with highest registration rates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {functionData.events?.slice(0, 5).map((event: any) => {
              const eventCapacity = event.event_tickets?.reduce((sum: number, ticket: any) => 
                sum + (ticket.quantity_total || 0), 0) || 0
              const eventSold = event.event_tickets?.reduce((sum: number, ticket: any) => 
                sum + (ticket.quantity_sold || 0), 0) || 0
              const eventPercentage = eventCapacity > 0 ? (eventSold / eventCapacity) * 100 : 0

              return (
                <div key={event.event_id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{event.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {eventSold} of {eventCapacity} tickets sold
                      </p>
                    </div>
                    <span className="text-sm font-medium">
                      {eventPercentage.toFixed(0)}%
                    </span>
                  </div>
                  <Progress value={eventPercentage} />
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}