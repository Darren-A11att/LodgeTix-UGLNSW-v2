'use client'

import React, { useMemo } from 'react'
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  CreditCard,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

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

interface FinancialSummaryProps {
  registrations: Registration[]
}

function formatCurrency(amount: number | null) {
  if (!amount) return '$0.00'
  
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD'
  }).format(amount)
}

export function FinancialSummary({ registrations }: FinancialSummaryProps) {
  const financialMetrics = useMemo(() => {
    const totalRegistrations = registrations.length
    const totalAttendees = registrations.reduce((sum, reg) => sum + reg.attendee_count, 0)
    
    // Payment status breakdown
    const paymentBreakdown = registrations.reduce((acc, reg) => {
      const status = reg.payment_status?.toLowerCase() || 'unknown'
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    // Revenue calculations
    const totalRevenue = registrations
      .filter(reg => reg.payment_status?.toLowerCase() === 'paid')
      .reduce((sum, reg) => sum + (reg.total_amount_paid || 0), 0)
    
    const pendingRevenue = registrations
      .filter(reg => reg.payment_status?.toLowerCase() === 'pending')
      .reduce((sum, reg) => sum + (reg.total_amount_paid || 0), 0)
    
    const totalPotentialRevenue = registrations
      .reduce((sum, reg) => sum + (reg.total_amount_paid || 0), 0)
    
    // Average revenue per registration
    const avgRevenuePerRegistration = totalRegistrations > 0 
      ? totalRevenue / totalRegistrations 
      : 0
    
    // Average revenue per attendee
    const avgRevenuePerAttendee = totalAttendees > 0 
      ? totalRevenue / totalAttendees 
      : 0
    
    // Registration type breakdown
    const registrationTypeBreakdown = registrations.reduce((acc, reg) => {
      const type = reg.registration_type || 'unknown'
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    // Recent registrations (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const recentRegistrations = registrations.filter(reg => {
      const regDate = new Date(reg.registration_date)
      return regDate >= sevenDaysAgo
    }).length
    
    return {
      totalRegistrations,
      totalAttendees,
      paymentBreakdown,
      totalRevenue,
      pendingRevenue,
      totalPotentialRevenue,
      avgRevenuePerRegistration,
      avgRevenuePerAttendee,
      registrationTypeBreakdown,
      recentRegistrations
    }
  }, [registrations])
  
  const paymentSuccessRate = financialMetrics.totalRegistrations > 0 
    ? ((financialMetrics.paymentBreakdown.paid || 0) / financialMetrics.totalRegistrations) * 100 
    : 0

  return (
    <div className="space-y-6">
      {/* Revenue Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(financialMetrics.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              From {financialMetrics.paymentBreakdown.paid || 0} paid registrations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Revenue</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {formatCurrency(financialMetrics.pendingRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              From {financialMetrics.paymentBreakdown.pending || 0} pending payments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg per Registration</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(financialMetrics.avgRevenuePerRegistration)}
            </div>
            <p className="text-xs text-muted-foreground">
              Average revenue per registration
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg per Attendee</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(financialMetrics.avgRevenuePerAttendee)}
            </div>
            <p className="text-xs text-muted-foreground">
              Average revenue per attendee
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Success Rate */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="h-5 w-5 mr-2" />
            Payment Success Rate
          </CardTitle>
          <CardDescription>
            Success rate of payment completions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Success Rate</span>
            <span className="text-2xl font-bold">{paymentSuccessRate.toFixed(1)}%</span>
          </div>
          <Progress value={paymentSuccessRate} className="w-full" />
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="space-y-1">
              <div className="flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  Paid
                </Badge>
              </div>
              <div className="text-lg font-semibold">{financialMetrics.paymentBreakdown.paid || 0}</div>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center justify-center">
                <Clock className="h-4 w-4 text-yellow-600 mr-1" />
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                  Pending
                </Badge>
              </div>
              <div className="text-lg font-semibold">{financialMetrics.paymentBreakdown.pending || 0}</div>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center justify-center">
                <AlertCircle className="h-4 w-4 text-red-600 mr-1" />
                <Badge variant="outline" className="bg-red-50 text-red-700">
                  Failed
                </Badge>
              </div>
              <div className="text-lg font-semibold">{financialMetrics.paymentBreakdown.failed || 0}</div>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center justify-center">
                <RefreshCw className="h-4 w-4 text-gray-600 mr-1" />
                <Badge variant="outline" className="bg-gray-50 text-gray-700">
                  Refunded
                </Badge>
              </div>
              <div className="text-lg font-semibold">{financialMetrics.paymentBreakdown.refunded || 0}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Registration Types Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Registration Types
            </CardTitle>
            <CardDescription>
              Breakdown by registration type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(financialMetrics.registrationTypeBreakdown).map(([type, count]) => {
                const percentage = financialMetrics.totalRegistrations > 0 
                  ? (count / financialMetrics.totalRegistrations) * 100 
                  : 0
                
                return (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="capitalize">
                        {type}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                    <span className="font-semibold">{count}</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Registration activity in the last 7 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Recent Registrations</span>
                <span className="text-2xl font-bold">{financialMetrics.recentRegistrations}</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total Registrations:</span>
                  <span className="font-medium">{financialMetrics.totalRegistrations}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total Attendees:</span>
                  <span className="font-medium">{financialMetrics.totalAttendees}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Potential Revenue:</span>
                  <span className="font-medium">{formatCurrency(financialMetrics.totalPotentialRevenue)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}