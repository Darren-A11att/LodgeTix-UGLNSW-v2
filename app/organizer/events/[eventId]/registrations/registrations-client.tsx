'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, Filter, Users, Table as TableIcon, Grid, Eye, Download, FileText, FileSpreadsheet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { createBrowserClient } from '@/lib/supabase-browser'
import { AttendeeDetailDrawer } from './attendee-detail-drawer'

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

interface EventRegistrationsClientProps {
  eventId: string
  initialRegistrations: Registration[]
  initialSearch: string
  initialStatus: string
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

function exportToCSV(registrations: Registration[], eventId: string) {
  if (registrations.length === 0) {
    alert('No registrations to export')
    return
  }

  // Flatten attendee data for CSV export
  const csvData = registrations.flatMap(registration => 
    registration.attendees.map(attendee => ({
      'Registration ID': registration.registration_id,
      'Customer Name': `${registration.customer_first_name} ${registration.customer_last_name}`,
      'Customer Email': registration.customer_email,
      'Customer Phone': registration.customer_phone || '',
      'Attendee Name': `${attendee.first_name} ${attendee.last_name}`,
      'Attendee Type': attendee.attendee_type,
      'Relationship': attendee.relationship || 'Primary',
      'Contact Preference': attendee.contact_preference,
      'Dietary Requirements': attendee.dietary_requirements || '',
      'Special Needs': attendee.special_needs || '',
      'Registration Type': registration.registration_type,
      'Payment Status': registration.payment_status,
      'Amount Paid': registration.total_amount_paid,
      'Registration Date': formatDate(registration.registration_date),
      'Payment ID': registration.stripe_payment_intent_id || ''
    }))
  )

  // Convert to CSV
  const headers = Object.keys(csvData[0] || {})
  const csvContent = [
    headers.join(','),
    ...csvData.map(row => 
      headers.map(header => {
        const value = row[header as keyof typeof row]
        // Escape commas and quotes in CSV data
        return typeof value === 'string' && (value.includes(',') || value.includes('"'))
          ? `"${value.replace(/"/g, '""')}"`
          : value
      }).join(',')
    )
  ].join('\n')

  // Download CSV
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `event-${eventId}-registrations-${new Date().toISOString().slice(0, 10)}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

function exportToPDF(registrations: Registration[], eventId: string) {
  if (registrations.length === 0) {
    alert('No registrations to export')
    return
  }

  // Create a printable version in a new window
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    alert('Popup blocked. Please allow popups for this site to export PDF.')
    return
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Event Registrations - ${eventId}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          font-size: 12px;
          line-height: 1.4;
          margin: 20px;
        }
        
        h1 {
          color: #1f2937;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 10px;
        }
        
        .summary {
          background-color: #f9fafb;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        
        .registration {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          margin-bottom: 15px;
          padding: 15px;
          page-break-inside: avoid;
        }
        
        .registration-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 10px;
          border-bottom: 1px solid #f3f4f6;
          padding-bottom: 8px;
        }
        
        .customer-info {
          flex: 1;
        }
        
        .customer-name {
          font-size: 16px;
          font-weight: bold;
          color: #1f2937;
        }
        
        .registration-id {
          color: #6b7280;
          font-size: 11px;
        }
        
        .payment-info {
          text-align: right;
        }
        
        .attendee {
          background-color: #f8fafc;
          padding: 10px;
          border-radius: 6px;
          margin: 8px 0;
        }
        
        .attendee-name {
          font-weight: bold;
          color: #374151;
        }
        
        .attendee-type {
          display: inline-block;
          background-color: #dbeafe;
          color: #1e40af;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 10px;
          margin-left: 8px;
        }
        
        .special-requirements {
          background-color: #fef3c7;
          border: 1px solid #f59e0b;
          padding: 8px;
          border-radius: 4px;
          margin-top: 8px;
        }
        
        .special-requirements h4 {
          margin: 0 0 4px 0;
          color: #92400e;
          font-size: 11px;
        }
        
        .details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-top: 10px;
        }
        
        .detail-item {
          font-size: 11px;
        }
        
        .detail-label {
          font-weight: bold;
          color: #4b5563;
        }
        
        @media print {
          body {
            margin: 10px;
          }
          
          .registration {
            page-break-inside: avoid;
          }
        }
      </style>
    </head>
    <body>
      <h1>Event Registrations</h1>
      
      <div class="summary">
        <p><strong>Event ID:</strong> ${eventId}</p>
        <p><strong>Total Registrations:</strong> ${registrations.length}</p>
        <p><strong>Total Attendees:</strong> ${registrations.reduce((sum, reg) => sum + reg.attendee_count, 0)}</p>
        <p><strong>Export Date:</strong> ${new Date().toLocaleDateString('en-AU', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}</p>
      </div>

      ${registrations.map(registration => `
        <div class="registration">
          <div class="registration-header">
            <div class="customer-info">
              <div class="customer-name">${registration.customer_first_name} ${registration.customer_last_name}</div>
              <div class="registration-id">Registration #${registration.registration_id.substring(0, 8)}...</div>
            </div>
            <div class="payment-info">
              <div><strong>${formatCurrency(registration.total_amount_paid)}</strong></div>
              <div style="color: ${registration.payment_status === 'paid' ? '#16a34a' : '#dc2626'}">
                ${registration.payment_status.toUpperCase()}
              </div>
            </div>
          </div>
          
          <div class="details-grid">
            <div class="detail-item">
              <span class="detail-label">Email:</span> ${registration.customer_email}
            </div>
            <div class="detail-item">
              <span class="detail-label">Phone:</span> ${registration.customer_phone || 'N/A'}
            </div>
            <div class="detail-item">
              <span class="detail-label">Registration Type:</span> ${registration.registration_type}
            </div>
            <div class="detail-item">
              <span class="detail-label">Date:</span> ${formatDate(registration.registration_date)}
            </div>
          </div>
          
          <h3 style="margin: 15px 0 10px 0; color: #374151;">Attendees (${registration.attendee_count})</h3>
          
          ${registration.attendees.map(attendee => `
            <div class="attendee">
              <div class="attendee-name">
                ${attendee.first_name} ${attendee.last_name}
                <span class="attendee-type">${attendee.attendee_type}</span>
                ${attendee.relationship ? `<span style="color: #6b7280; font-size: 11px; margin-left: 8px;">(${attendee.relationship})</span>` : ''}
              </div>
              
              ${(attendee.dietary_requirements || attendee.special_needs) ? `
                <div class="special-requirements">
                  <h4>Special Requirements</h4>
                  ${attendee.dietary_requirements ? `<p><strong>Dietary:</strong> ${attendee.dietary_requirements}</p>` : ''}
                  ${attendee.special_needs ? `<p><strong>Accessibility:</strong> ${attendee.special_needs}</p>` : ''}
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      `).join('')}
      
      <script>
        window.print();
        window.onafterprint = function() {
          window.close();
        };
      </script>
    </body>
    </html>
  `

  printWindow.document.write(htmlContent)
  printWindow.document.close()
}

function RegistrationCard({ 
  registration, 
  onViewDetails 
}: { 
  registration: Registration
  onViewDetails: (registration: Registration) => void
}) {
  const primaryAttendee = registration.attendees.find(a => !a.relationship) || registration.attendees[0]
  
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onViewDetails(registration)}>
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
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation()
                onViewDetails(registration)
              }}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="text-gray-600">
            <strong>Email:</strong> {registration.customer_email}
          </div>
          
          {registration.customer_phone && (
            <div className="text-gray-600">
              <strong>Phone:</strong> {registration.customer_phone}
            </div>
          )}
          
          <div className="text-gray-600">
            <strong>Attendees:</strong> {registration.attendee_count}
          </div>
          
          <div className="text-gray-600">
            <strong>Amount:</strong> {formatCurrency(registration.total_amount_paid)}
          </div>
          
          <div className="text-gray-600">
            <strong>Date:</strong> {formatDate(registration.registration_date)}
          </div>
          
          <div className="text-gray-600">
            <strong>Type:</strong> <span className="capitalize">{registration.registration_type}</span>
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

export function EventRegistrationsClient({
  eventId,
  initialRegistrations,
  initialSearch,
  initialStatus
}: EventRegistrationsClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [registrations, setRegistrations] = useState<Registration[]>(initialRegistrations)
  const [searchTerm, setSearchTerm] = useState(initialSearch)
  const [statusFilter, setStatusFilter] = useState(initialStatus)
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      
      if (searchTerm) {
        params.set('search', searchTerm)
      } else {
        params.delete('search')
      }
      
      if (statusFilter) {
        params.set('status', statusFilter)
      } else {
        params.delete('status')
      }
      
      router.push(`?${params.toString()}`, { scroll: false })
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [searchTerm, statusFilter, router, searchParams])

  // Filter registrations locally for immediate feedback
  const filteredRegistrations = useMemo(() => {
    return registrations.filter(registration => {
      const matchesSearch = !searchTerm || 
        `${registration.customer_first_name} ${registration.customer_last_name} ${registration.customer_email}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        registration.attendees.some(attendee => 
          `${attendee.first_name} ${attendee.last_name}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
        )
      
      const matchesStatus = !statusFilter || 
        registration.payment_status.toLowerCase() === statusFilter.toLowerCase()
      
      return matchesSearch && matchesStatus
    })
  }, [registrations, searchTerm, statusFilter])

  const handleViewDetails = (registration: Registration) => {
    setSelectedRegistration(registration)
    setDrawerOpen(true)
  }

  const handleExportCSV = () => {
    exportToCSV(filteredRegistrations, eventId)
  }

  const handleExportPDF = () => {
    exportToPDF(filteredRegistrations, eventId)
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Registrations ({filteredRegistrations.length})
            </span>
            <div className="flex items-center space-x-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleExportCSV}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportPDF}>
                    <FileText className="h-4 w-4 mr-2" />
                    Export as PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button
                variant={viewMode === 'cards' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('cards')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('table')}
              >
                <TableIcon className="h-4 w-4" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Payment Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Registrations Display */}
      {filteredRegistrations.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || statusFilter ? 'No matching registrations' : 'No registrations yet'}
            </h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter 
                ? 'Try adjusting your search or filter criteria'
                : 'Registrations will appear here once people start signing up for your event'
              }
            </p>
          </CardContent>
        </Card>
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredRegistrations.map((registration) => (
            <RegistrationCard 
              key={registration.registration_id} 
              registration={registration} 
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Attendees</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRegistrations.map((registration) => (
                  <TableRow 
                    key={registration.registration_id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleViewDetails(registration)}
                  >
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {registration.customer_first_name} {registration.customer_last_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          #{registration.registration_id.substring(0, 8)}...
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {registration.customer_email}
                        {registration.customer_phone && (
                          <div className="text-xs text-gray-500">
                            {registration.customer_phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {registration.attendee_count} attendee{registration.attendee_count !== 1 ? 's' : ''}
                        {registration.attendees[0] && (
                          <div className="text-xs text-gray-500">
                            {registration.attendees[0].first_name} {registration.attendees[0].last_name}
                            {registration.attendees.length > 1 && ` +${registration.attendees.length - 1} more`}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">
                        {formatCurrency(registration.total_amount_paid)}
                      </div>
                      <div className="text-xs text-gray-500 capitalize">
                        {registration.registration_type}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getPaymentStatusBadge(registration.payment_status)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatDate(registration.registration_date)}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      
      {/* Attendee Detail Drawer */}
      {selectedRegistration && (
        <AttendeeDetailDrawer
          registration={selectedRegistration}
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
        >
          <div />
        </AttendeeDetailDrawer>
      )}
    </div>
  )
}