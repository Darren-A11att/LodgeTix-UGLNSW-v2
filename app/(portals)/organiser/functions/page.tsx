import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Calendar,
  MapPin,
  Users,
  MoreVertical,
  Eye,
  Edit,
  Trash,
  Copy,
  BarChart3
} from 'lucide-react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/formatters'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { publishFunction } from '../actions'
import { FunctionCreateDrawer } from './components/function-create-drawer'

export default async function FunctionsPage() {
  const supabase = await createClient()
  
  // Get current user's organisation
  const { data: { user } } = await supabase.auth.getUser()
  const { data: organisation } = await supabase
    .from('organisations')
    .select('*')
    .eq('email_address', user?.email)
    .single()

  if (!organisation) return null

  // Get all functions for this organiser
  const { data: functions } = await supabase
    .from('functions')
    .select(`
      *,
      location:locations(*),
      events(count),
      registrations(count)
    `)
    .eq('organiser_id', organisation.organisation_id)
    .order('start_date', { ascending: false })

  // Calculate revenue for each function
  const functionsWithStats = await Promise.all(
    functions?.map(async (func) => {
      const { data: registrations } = await supabase
        .from('registrations')
        .select('total_amount')
        .eq('function_id', func.function_id)
        .not('payment_status', 'eq', 'cancelled')

      const totalRevenue = registrations?.reduce(
        (sum, reg) => sum + (reg.total_amount || 0), 
        0
      ) || 0

      return {
        ...func,
        totalRevenue,
        eventCount: func.events?.[0]?.count || 0,
        registrationCount: func.registrations?.[0]?.count || 0
      }
    }) || []
  )

  const getStatusBadge = (startDate: string, endDate: string, isPublished: boolean) => {
    const now = new Date()
    const start = new Date(startDate)
    const end = new Date(endDate)

    if (!isPublished) {
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

  return (
    <div className="flex flex-col gap-8 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Functions</h1>
          <p className="text-muted-foreground">
            Manage your grand installations and major events
          </p>
        </div>
        <FunctionCreateDrawer />
      </div>

      {/* Functions Grid */}
      {functionsWithStats.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No functions yet</h3>
            <p className="text-muted-foreground text-center mb-6">
              Create your first function to start managing events and registrations
            </p>
            <FunctionCreateDrawer />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {functionsWithStats.map((func) => (
            <Card key={func.function_id} className="overflow-hidden">
              {func.image_url && (
                <div className="aspect-video relative">
                  <img
                    src={func.image_url}
                    alt={func.name}
                    className="object-cover w-full h-full"
                  />
                  <div className="absolute top-4 right-4">
                    {getStatusBadge(func.start_date, func.end_date, func.is_published)}
                  </div>
                </div>
              )}
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="line-clamp-1">{func.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {func.description}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href={`/organiser/functions/${func.function_id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/organiser/functions/${func.function_id}/edit`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Function
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/organiser/functions/${func.function_id}/analytics`}>
                          <BarChart3 className="mr-2 h-4 w-4" />
                          View Analytics
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        disabled={func.registrationCount > 0}
                      >
                        <Trash className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {new Date(func.start_date).toLocaleDateString()} - {new Date(func.end_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                {func.location && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{func.location.name}, {func.location.city}</span>
                  </div>
                )}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{func.eventCount}</p>
                    <p className="text-xs text-muted-foreground">Events</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{func.registrationCount}</p>
                    <p className="text-xs text-muted-foreground">Registrations</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{formatCurrency(func.totalRevenue)}</p>
                    <p className="text-xs text-muted-foreground">Revenue</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="gap-2">
                <Button variant="outline" className="flex-1" asChild>
                  <Link href={`/organiser/functions/${func.function_id}`}>
                    Manage
                  </Link>
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={async () => {
                    'use server'
                    await publishFunction(func.function_id, !func.is_published)
                  }}
                >
                  {func.is_published ? 'Unpublish' : 'Publish'}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}