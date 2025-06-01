'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Search,
  Download,
  Mail,
  Eye,
  Filter,
  Users,
  Calendar,
  CreditCard,
  FileText
} from 'lucide-react'
import { format } from 'date-fns'
import { formatCurrency } from '@/lib/formatters'
import { BulkEmailDialog } from '@/components/organiser/bulk-email-dialog'
import type { Database } from '@/shared/types/database'

type Registration = Database['public']['Tables']['registrations']['Row'] & {
  attendees?: { count: number }[]
}

interface FunctionRegistrationsTabProps {
  functionId: string
  registrations: Registration[]
}

export function FunctionRegistrationsTab({ functionId, registrations }: FunctionRegistrationsTabProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedRegistrations, setSelectedRegistrations] = useState<string[]>([])
  const [emailDialogOpen, setEmailDialogOpen] = useState(false)

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-600">Paid</Badge>
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>
      case 'cancelled':
        return <Badge variant="outline">Cancelled</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const filteredRegistrations = registrations.filter(reg => {
    const matchesSearch = 
      reg.contact_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.contact_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.registration_id.includes(searchQuery)

    const matchesStatus = 
      statusFilter === 'all' || reg.payment_status === statusFilter

    return matchesSearch && matchesStatus
  })

  const totalRevenue = filteredRegistrations
    .filter(reg => reg.payment_status === 'completed')
    .reduce((sum, reg) => sum + (reg.total_amount || 0), 0)

  const totalAttendees = filteredRegistrations
    .reduce((sum, reg) => sum + (reg.attendees?.[0]?.count || 0), 0)

  const stats = [
    { 
      label: 'Total Registrations', 
      value: filteredRegistrations.length,
      icon: FileText 
    },
    { 
      label: 'Total Attendees', 
      value: totalAttendees,
      icon: Users 
    },
    { 
      label: 'Total Revenue', 
      value: formatCurrency(totalRevenue),
      icon: CreditCard 
    },
    { 
      label: 'Avg. Party Size', 
      value: (totalAttendees / filteredRegistrations.length || 0).toFixed(1),
      icon: Users 
    },
  ]

  const handleSelectAll = () => {
    if (selectedRegistrations.length === filteredRegistrations.length) {
      setSelectedRegistrations([])
    } else {
      setSelectedRegistrations(filteredRegistrations.map(r => r.registration_id))
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
              </div>
              <stat.icon className="h-8 w-8 text-muted-foreground" />
            </div>
          </Card>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="completed">Paid</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            disabled={selectedRegistrations.length === 0}
            onClick={() => setEmailDialogOpen(true)}
          >
            <Mail className="mr-2 h-4 w-4" />
            Email ({selectedRegistrations.length})
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <input
                  type="checkbox"
                  checked={selectedRegistrations.length === filteredRegistrations.length}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300"
                />
              </TableHead>
              <TableHead>Registration</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Attendees</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRegistrations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No registrations found
                </TableCell>
              </TableRow>
            ) : (
              filteredRegistrations.map((registration) => (
                <TableRow key={registration.registration_id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedRegistrations.includes(registration.registration_id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRegistrations([...selectedRegistrations, registration.registration_id])
                        } else {
                          setSelectedRegistrations(selectedRegistrations.filter(id => id !== registration.registration_id))
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        #{registration.registration_id.slice(-8).toUpperCase()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {registration.registration_type}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{registration.contact_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {registration.contact_email}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{registration.attendees?.[0]?.count || 0}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {formatCurrency(registration.total_amount || 0)}
                      </p>
                      {registration.stripe_fee && (
                        <p className="text-sm text-muted-foreground">
                          Fee: {formatCurrency(registration.stripe_fee)}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getPaymentStatusBadge(registration.payment_status || 'pending')}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>{format(new Date(registration.created_at), 'PP')}</p>
                      <p className="text-muted-foreground">
                        {format(new Date(registration.created_at), 'p')}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Email Dialog */}
      <BulkEmailDialog
        open={emailDialogOpen}
        onOpenChange={setEmailDialogOpen}
        functionId={functionId}
        recipientCount={selectedRegistrations.length}
        selectedRegistrations={selectedRegistrations}
        statusFilter={statusFilter}
      />
    </div>
  )
}