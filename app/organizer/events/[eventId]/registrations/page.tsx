import React from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Users, 
  Search, 
  Filter, 
  Download,
  Mail,
  Phone,
  CreditCard,
  Clock,
  Eye,
  MoreHorizontal,
  BarChart3,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/utils/supabase/server'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { EventRegistrationsClient } from './registrations-client'
import { FinancialSummaryWrapper } from './financial-summary-wrapper'

interface Registration {
  registration_id: string
  customer_id: string
  customer_first_name: string
  customer_last_name: string
  customer_email: string
  customer_phone: string
  payment_status: string
  registration_status: string
  registration_type: string
  registration_date: string
  total_amount_paid: number
  total_price_paid: number
  stripe_payment_intent_id: string
  attendee_count: number
  attendees: Array<{
    attendee_id: string
    attendee_type: string
    first_name: string
    last_name: string
    dietary_requirements: string | null
    special_needs: string | null
    relationship: string | null
    contact_preference: string
  }>
}

interface RegistrationStats {
  total_registrations: number
  total_attendees: number
  paid_registrations: number
  pending_registrations: number
  total_revenue: number
  average_order_value: number
}

interface EventInfo {
  event_id: string
  title: string
  description: string | null
  event_start: string | null
  event_end: string | null
  location: string | null
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

async function getEventInfo(eventId: string, organizerId: string): Promise<EventInfo | null> {
  const supabase = await createClient()
  
  // Get event info and verify ownership
  const { data: events } = await supabase
    .rpc('get_organizer_events_with_counts', { org_id: organizerId })
  
  const event = events?.find((e: any) => e.event_id === eventId)
  
  if (!event) return null
  
  return {
    event_id: event.event_id,
    title: event.title,
    description: event.description,
    event_start: event.event_start,
    event_end: event.event_end,
    location: event.location
  }
}

async function getRegistrationStats(eventId: string): Promise<RegistrationStats> {
  const supabase = await createClient()
  
  const { data: stats, error } = await supabase
    .rpc('get_event_registration_stats', { event_uuid: eventId })
    .single()
  
  if (error || !stats) {
    console.error('Error fetching registration stats:', error)
    return {
      total_registrations: 0,
      total_attendees: 0,
      paid_registrations: 0,
      pending_registrations: 0,
      total_revenue: 0,
      average_order_value: 0
    }
  }
  
  return stats
}

async function getRegistrations(
  eventId: string, 
  searchTerm?: string, 
  paymentStatus?: string
): Promise<Registration[]> {
  const supabase = await createClient()
  
  const { data: registrations, error } = await supabase
    .rpc('get_event_registrations', {
      event_uuid: eventId,
      search_term: searchTerm || null,
      payment_status_filter: paymentStatus || null,
      limit_count: 50,
      offset_count: 0
    })
  
  if (error) {
    console.error('Error fetching registrations:', error)
    return []
  }
  
  return registrations || []
}

function formatDate(dateString: string | null) {
  if (!dateString) return 'N/A'
  
  const date = new Date(dateString)
  return date.toLocaleDateString('en-AU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatCurrency(amount: number | null) {
  if (!amount) return '$0.00'
  
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD'
  }).format(amount)
}

function getPaymentStatusBadge(status: string) {
  const variants = {
    paid: { variant: 'default' as const, label: 'Paid', className: 'bg-green-100 text-green-800' },
    pending: { variant: 'secondary' as const, label: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
    failed: { variant: 'destructive' as const, label: 'Failed', className: 'bg-red-100 text-red-800' },
    refunded: { variant: 'outline' as const, label: 'Refunded', className: 'bg-gray-100 text-gray-800' }
  }
  
  const config = variants[status?.toLowerCase() as keyof typeof variants] || variants.pending
  
  return (
    <Badge variant={config.variant} className={config.className}>
      {config.label}
    </Badge>
  )
}

function RegistrationCard({ registration }: { registration: Registration }) {
  const primaryAttendee = registration.attendees.find(a => !a.relationship) || registration.attendees[0]
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">
              {registration.customer_first_name} {registration.customer_last_name}
            </CardTitle>
            <CardDescription>
              Registration #{registration.registration_id.substring(0, 8)}...
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            {getPaymentStatusBadge(registration.payment_status)}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem disabled>
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                  <Badge variant="outline" className="ml-2 text-xs">TODO-005</Badge>
                </DropdownMenuItem>
                <DropdownMenuItem disabled>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email
                  <Badge variant="outline" className="ml-2 text-xs">v2</Badge>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="flex items-center space-x-2 text-gray-600">
            <Mail className="h-4 w-4" />
            <span className="truncate">{registration.customer_email}</span>
          </div>
          
          {registration.customer_phone && (
            <div className="flex items-center space-x-2 text-gray-600">
              <Phone className="h-4 w-4" />
              <span>{registration.customer_phone}</span>
            </div>
          )}
          
          <div className="flex items-center space-x-2 text-gray-600">
            <Users className="h-4 w-4" />
            <span>{registration.attendee_count} attendee{registration.attendee_count !== 1 ? 's' : ''}</span>
          </div>
          
          <div className="flex items-center space-x-2 text-gray-600">
            <CreditCard className="h-4 w-4" />
            <span>{formatCurrency(registration.total_amount_paid)}</span>
          </div>
          
          <div className="flex items-center space-x-2 text-gray-600">
            <Clock className="h-4 w-4" />
            <span>{formatDate(registration.registration_date)}</span>
          </div>
          
          <div className="flex items-center space-x-2 text-gray-600">
            <span className="capitalize">{registration.registration_type} registration</span>
          </div>
        </div>
        
        {primaryAttendee && (
          <div className="pt-2 border-t border-gray-100">
            <p className="text-sm font-medium text-gray-900 mb-1">Primary Attendee:</p>
            <p className="text-sm text-gray-600">
              {primaryAttendee.first_name} {primaryAttendee.last_name} 
              <span className="ml-2 text-xs text-gray-500 capitalize">
                ({primaryAttendee.attendee_type})
              </span>
            </p>
            
            {registration.attendees.length > 1 && (
              <p className="text-xs text-gray-500 mt-1">
                +{registration.attendees.length - 1} additional attendee{registration.attendees.length > 2 ? 's' : ''}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default async function EventRegistrationsPage({ 
  params,
  searchParams
}: { 
  params: { eventId: string }
  searchParams: { search?: string; status?: string }
}) {
  const organizerId = await getCurrentOrganizerId()
  
  if (!organizerId) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Unable to load organizer data.</p>
      </div>
    )
  }
  
  const eventInfo = await getEventInfo(params.eventId, organizerId)
  
  if (!eventInfo) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Event not found or you don't have access to it.</p>
        <Button variant="outline" asChild className="mt-4">
          <Link href="/organizer/events">← Back to Events</Link>
        </Button>
      </div>
    )
  }
  
  const stats = await getRegistrationStats(params.eventId)
  const registrations = await getRegistrations(
    params.eventId, 
    searchParams.search, 
    searchParams.status
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/organizer/events">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              {eventInfo.title}
            </h1>
            <p className="text-gray-600">
              Event Registrations
              {eventInfo.event_start && (
                <span className="ml-2">• {formatDate(eventInfo.event_start)}</span>
              )}
              {eventInfo.location && (
                <span className="ml-2">• {eventInfo.location}</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" disabled>
            <Download className="h-4 w-4 mr-2" />
            Export
            <Badge variant="outline" className="ml-2 text-xs">TODO-006</Badge>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Registrations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_registrations}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Attendees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.total_attendees}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.total_revenue)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Paid / Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              <span className="text-green-600">{stats.paid_registrations}</span>
              <span className="text-gray-400 mx-1">/</span>
              <span className="text-yellow-600">{stats.pending_registrations}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Summary */}
      <FinancialSummaryWrapper registrations={registrations} />

      {/* Search and Filter */}
      <EventRegistrationsClient 
        eventId={params.eventId}
        initialRegistrations={registrations}
        initialSearch={searchParams.search || ''}
        initialStatus={searchParams.status || ''}
      />
    </div>
  )
}