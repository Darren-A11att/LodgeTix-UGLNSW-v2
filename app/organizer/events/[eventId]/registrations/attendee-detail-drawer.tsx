'use client'

import React from 'react'
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  CreditCard,
  Users,
  AlertTriangle,
  Utensils,
  Crown,
  Building2,
  Heart,
  Info,
  Printer,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

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

interface AttendeeDetailDrawerProps {
  registration: Registration
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

function formatDate(dateString: string | null) {
  if (!dateString) return 'N/A'
  
  const date = new Date(dateString)
  return date.toLocaleDateString('en-AU', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
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

function AttendeeCard({ attendee, isPrimary }: { 
  attendee: Registration['attendees'][0], 
  isPrimary: boolean 
}) {
  const isMason = attendee.attendee_type?.toLowerCase() === 'mason'
  const isGuest = attendee.attendee_type?.toLowerCase() === 'guest'
  const hasSpecialRequirements = attendee.dietary_requirements || attendee.special_needs
  
  return (
    <Card className="relative">
      {isPrimary && (
        <div className="absolute top-2 right-2">
          <Badge variant="outline" className="text-xs">
            Primary
          </Badge>
        </div>
      )}
      
      <CardHeader className="pb-3">
        <div className="flex items-start space-x-3">
          <div className={`p-2 rounded-full ${isMason ? 'bg-blue-100' : 'bg-gray-100'}`}>
            {isMason ? (
              <Crown className="h-5 w-5 text-blue-600" />
            ) : (
              <User className="h-5 w-5 text-gray-600" />
            )}
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg">
              {attendee.first_name} {attendee.last_name}
            </CardTitle>
            <CardDescription className="flex items-center space-x-2">
              <Badge variant={isMason ? 'default' : 'secondary'} className="text-xs">
                {attendee.attendee_type}
              </Badge>
              {attendee.relationship && (
                <Badge variant="outline" className="text-xs">
                  <Heart className="h-3 w-3 mr-1" />
                  {attendee.relationship}
                </Badge>
              )}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Contact Information */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900 flex items-center">
            <Info className="h-4 w-4 mr-2" />
            Contact Information
          </h4>
          <div className="ml-6 space-y-1 text-sm text-gray-600">
            <div className="flex items-center">
              <span className="font-medium w-24">Preference:</span>
              <span className="capitalize">{attendee.contact_preference?.replace(/([A-Z])/g, ' $1').toLowerCase()}</span>
            </div>
          </div>
        </div>
        
        {/* Mason-specific Information */}
        {isMason && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-900 flex items-center">
              <Building2 className="h-4 w-4 mr-2" />
              Masonic Information
            </h4>
            <div className="ml-6 space-y-1 text-sm text-gray-600">
              <div className="flex items-center">
                <span className="font-medium w-24">Lodge:</span>
                <span>Lodge information will be available when linked to mason profiles</span>
              </div>
              <div className="flex items-center">
                <span className="font-medium w-24">Rank:</span>
                <span>Rank information will be available when linked to mason profiles</span>
              </div>
            </div>
          </div>
        )}
        
        {/* Special Requirements */}
        {hasSpecialRequirements && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-900 flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2 text-orange-500" />
              Special Requirements
            </h4>
            <div className="ml-6 space-y-2">
              {attendee.dietary_requirements && (
                <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex items-start space-x-2">
                    <Utensils className="h-4 w-4 text-orange-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-orange-800">Dietary Requirements</p>
                      <p className="text-sm text-orange-700 mt-1">{attendee.dietary_requirements}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {attendee.special_needs && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">Accessibility Requirements</p>
                      <p className="text-sm text-blue-700 mt-1">{attendee.special_needs}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Ticket Information Placeholder */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900 flex items-center">
            <CreditCard className="h-4 w-4 mr-2" />
            Ticket Information
          </h4>
          <div className="ml-6 text-sm text-gray-500">
            <p>Ticket type information will be available when ticket assignments are implemented</p>
            <Badge variant="outline" className="text-xs mt-1">Coming in v4</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function AttendeeDetailDrawer({ 
  registration, 
  open, 
  onOpenChange, 
  children 
}: AttendeeDetailDrawerProps) {
  const primaryAttendee = registration.attendees.find(a => !a.relationship) || registration.attendees[0]
  const partnerAttendees = registration.attendees.filter(a => a.relationship)
  
  const handlePrint = () => {
    window.print()
  }
  
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <SheetTitle className="text-xl">
                {registration.customer_first_name} {registration.customer_last_name}
              </SheetTitle>
              <SheetDescription>
                Registration #{registration.registration_id.substring(0, 8)}... • {registration.attendee_count} attendee{registration.attendee_count !== 1 ? 's' : ''}
              </SheetDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePrint}
                className="print:hidden"
              >
                <Printer className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Registration Summary */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Payment Status</p>
              <div>{getPaymentStatusBadge(registration.payment_status)}</div>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Amount</p>
              <p className="text-lg font-semibold">{formatCurrency(registration.total_amount_paid)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Registration Date</p>
              <p className="text-sm">{formatDate(registration.registration_date)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Registration Type</p>
              <p className="text-sm capitalize">{registration.registration_type}</p>
            </div>
          </div>
        </SheetHeader>
        
        <Separator className="my-6" />
        
        {/* Customer Contact Information */}
        <div className="space-y-4 mb-6">
          <h3 className="text-lg font-semibold flex items-center">
            <Mail className="h-5 w-5 mr-2" />
            Contact Information
          </h3>
          
          <div className="space-y-3 ml-7">
            <div className="flex items-center space-x-3">
              <Mail className="h-4 w-4 text-gray-400" />
              <span className="text-sm">{registration.customer_email}</span>
            </div>
            
            {registration.customer_phone && (
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-gray-400" />
                <span className="text-sm">{registration.customer_phone}</span>
              </div>
            )}
          </div>
        </div>
        
        <Separator className="my-6" />
        
        {/* Attendee Details */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Attendee Details
          </h3>
          
          {/* Primary Attendee */}
          {primaryAttendee && (
            <div className="space-y-2">
              <h4 className="text-md font-medium text-gray-700">Primary Attendee</h4>
              <AttendeeCard attendee={primaryAttendee} isPrimary={true} />
            </div>
          )}
          
          {/* Partner/Additional Attendees */}
          {partnerAttendees.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-md font-medium text-gray-700">
                {partnerAttendees.length === 1 ? 'Partner' : 'Additional Attendees'}
              </h4>
              <div className="space-y-4">
                {partnerAttendees.map((attendee) => (
                  <AttendeeCard 
                    key={attendee.attendee_id} 
                    attendee={attendee} 
                    isPrimary={false} 
                  />
                ))}
              </div>
            </div>
          )}
        </div>
        
        <Separator className="my-6" />
        
        {/* Payment Details */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center">
            <CreditCard className="h-5 w-5 mr-2" />
            Payment Details
          </h3>
          
          <div className="ml-7 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Payment Status:</span>
              <div>{getPaymentStatusBadge(registration.payment_status)}</div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Amount Paid:</span>
              <span className="font-medium">{formatCurrency(registration.total_amount_paid)}</span>
            </div>
            
            {registration.total_price_paid !== registration.total_amount_paid && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Price:</span>
                <span className="font-medium">{formatCurrency(registration.total_price_paid)}</span>
              </div>
            )}
            
            {registration.stripe_payment_intent_id && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Payment ID:</span>
                <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                  {registration.stripe_payment_intent_id}
                </span>
              </div>
            )}
          </div>
        </div>
        
        {/* Print Styles */}
        <style jsx global>{`
          @media print {
            .print\\:hidden {
              display: none !important;
            }
            
            body {
              font-size: 12px;
              line-height: 1.4;
            }
            
            h1, h2, h3 {
              page-break-after: avoid;
            }
            
            .space-y-4 > * + * {
              margin-top: 1rem;
            }
            
            .space-y-6 > * + * {
              margin-top: 1.5rem;
            }
          }
        `}</style>
      </SheetContent>
    </Sheet>
  )
}