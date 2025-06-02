import { notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Calendar,
  MapPin,
  Users,
  Ticket,
  DollarSign,
  Settings,
  BarChart3,
  Plus,
  Edit,
  Globe,
  Eye,
  EyeOff
} from 'lucide-react'
import { formatCurrency } from '@/lib/formatters'
import { publishFunction } from '@/app/(portals)/organiser/actions'
import { FunctionEventsTab } from './components/function-events-tab'
import { FunctionRegistrationsTab } from './components/function-registrations-tab'
import { FunctionAnalyticsTab } from './components/function-analytics-tab'
import { FunctionSettingsTab } from './components/function-settings-tab'
import Link from 'next/link'

interface FunctionDetailPageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function FunctionDetailPage({ params }: FunctionDetailPageProps) {
  const { slug } = await params
  const supabase = await createClient()
  
  // Get function details
  const { data: functionData, error } = await supabase
    .from('functions')
    .select(`
      *,
      location:locations(*),
      events(
        *,
        event_tickets(*)
      ),
      registrations(
        *,
        attendees(count)
      ),
      packages(*)
    `)
    .eq('slug', slug)
    .single()

  if (error || !functionData) {
    notFound()
  }

  // Verify ownership
  const { data: { user } } = await supabase.auth.getUser()
  const { data: organisation } = await supabase
    .from('organisations')
    .select('organisation_id')
    .eq('email_address', user?.email)
    .single()

  if (functionData.organiser_id !== organisation?.organisation_id) {
    notFound()
  }

  // Calculate statistics
  const totalEvents = functionData.events?.length || 0
  const totalTickets = functionData.events?.reduce(
    (sum, event) => sum + (event.event_tickets?.length || 0), 
    0
  ) || 0
  const totalRegistrations = functionData.registrations?.length || 0
  const totalAttendees = functionData.registrations?.reduce(
    (sum, reg) => sum + (reg.attendees?.[0]?.count || 0), 
    0
  ) || 0
  const totalRevenue = functionData.registrations?.reduce(
    (sum, reg) => sum + (reg.total_amount || 0), 
    0
  ) || 0

  const getStatusBadge = () => {
    const now = new Date()
    const start = new Date(functionData.start_date)
    const end = new Date(functionData.end_date)

    if (!functionData.is_published) {
      return <Badge variant="secondary">Draft</Badge>
    }
    if (now < start) {
      return <Badge variant="default">Upcoming</Badge>
    }
    if (now >= start && now <= end) {
      return <Badge variant="default" className="bg-green-600">Active</Badge>
    }
    return <Badge variant="secondary">Completed</Badge>
  }

  const stats = [
    { label: 'Events', value: totalEvents, icon: Calendar },
    { label: 'Ticket Types', value: totalTickets, icon: Ticket },
    { label: 'Registrations', value: totalRegistrations, icon: Users },
    { label: 'Total Revenue', value: formatCurrency(totalRevenue), icon: DollarSign },
  ]

  return (
    <div className="flex flex-col gap-8 p-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{functionData.name}</h1>
              {getStatusBadge()}
            </div>
            <p className="text-muted-foreground">{functionData.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/functions/${functionData.slug}`} target="_blank">
                <Globe className="mr-2 h-4 w-4" />
                View Public Page
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/organiser/functions/${functionData.function_id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Details
              </Link>
            </Button>
            <form action={async () => {
              'use server'
              await publishFunction(functionData.function_id, !functionData.is_published)
            }}>
              <Button variant="default" size="sm" type="submit">
                {functionData.is_published ? (
                  <>
                    <EyeOff className="mr-2 h-4 w-4" />
                    Unpublish
                  </>
                ) : (
                  <>
                    <Eye className="mr-2 h-4 w-4" />
                    Publish
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>

        {/* Function Info */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>
              {new Date(functionData.start_date).toLocaleDateString()} - {new Date(functionData.end_date).toLocaleDateString()}
            </span>
          </div>
          {functionData.location && (
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span>{functionData.location.name}, {functionData.location.city}</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.label}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="events" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-none">
          <TabsTrigger value="events" className="gap-2">
            <Calendar className="h-4 w-4" />
            Events
          </TabsTrigger>
          <TabsTrigger value="registrations" className="gap-2">
            <Users className="h-4 w-4" />
            Registrations
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-4">
          <FunctionEventsTab 
            functionId={functionData.function_id} 
            events={functionData.events || []}
          />
        </TabsContent>

        <TabsContent value="registrations" className="space-y-4">
          <FunctionRegistrationsTab 
            functionId={functionData.function_id}
            registrations={functionData.registrations || []}
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <FunctionAnalyticsTab 
            functionId={functionData.function_id}
            functionData={functionData}
          />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <FunctionSettingsTab 
            functionId={functionData.function_id}
            functionData={functionData}
            packages={functionData.packages || []}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}