'use client'

import React from 'react'
import { 
  Users, 
  Mail, 
  Phone, 
  Calendar,
  MapPin,
  CreditCard,
  AlertTriangle,
  Utensils,
  Crown,
  Building2,
  Heart
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

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

interface EventInfo {
  event_id: string
  title: string
  description: string | null
  event_start: string | null
  event_end: string | null
  location: string | null
}

interface PrintLayoutProps {
  eventInfo: EventInfo
  registrations: Registration[]
  showSummary?: boolean
  showAttendeeDetails?: boolean
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

function getPaymentStatusColor(status: string): string {
  switch (status?.toLowerCase()) {
    case 'paid': return '#16a34a'
    case 'pending': return '#eab308'
    case 'failed': return '#dc2626'
    case 'refunded': return '#6b7280'
    default: return '#6b7280'
  }
}

export function PrintLayout({ 
  eventInfo, 
  registrations, 
  showSummary = true, 
  showAttendeeDetails = true 
}: PrintLayoutProps) {
  const totalAttendees = registrations.reduce((sum, reg) => sum + reg.attendee_count, 0)
  const totalRevenue = registrations
    .filter(reg => reg.payment_status?.toLowerCase() === 'paid')
    .reduce((sum, reg) => sum + (reg.total_amount_paid || 0), 0)
  
  const paidRegistrations = registrations.filter(reg => reg.payment_status?.toLowerCase() === 'paid').length
  const pendingRegistrations = registrations.filter(reg => reg.payment_status?.toLowerCase() === 'pending').length

  return (
    <div className="print-layout">
      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          .print-layout {
            font-size: 11px;
            line-height: 1.3;
          }
          
          body {
            margin: 0;
            color: #000;
            background: white;
          }
          
          .print-hide {
            display: none !important;
          }
          
          .print-show {
            display: block !important;
          }
          
          .page-break {
            page-break-before: always;
          }
          
          .avoid-break {
            page-break-inside: avoid;
          }
          
          .print-header {
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
            margin-bottom: 20px;
          }
          
          .print-section {
            margin-bottom: 15px;
            page-break-inside: avoid;
          }
          
          .print-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
          }
          
          .print-table th,
          .print-table td {
            border: 1px solid #000;
            padding: 4px 8px;
            text-align: left;
            font-size: 10px;
          }
          
          .print-table th {
            background-color: #f0f0f0;
            font-weight: bold;
          }
          
          .print-summary-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr 1fr;
            gap: 10px;
            margin-bottom: 20px;
          }
          
          .print-summary-item {
            border: 1px solid #000;
            padding: 8px;
            text-align: center;
          }
          
          .print-registration {
            border: 1px solid #000;
            margin-bottom: 10px;
            padding: 10px;
            page-break-inside: avoid;
          }
          
          .print-attendee {
            background-color: #f8f8f8;
            border: 1px solid #ddd;
            padding: 5px;
            margin: 5px 0;
          }
          
          .print-special-req {
            background-color: #fff2cc;
            border: 1px solid #d6b656;
            padding: 5px;
            margin: 5px 0;
            font-size: 9px;
          }
        }
        
        @media screen {
          .print-layout {
            max-width: 8.5in;
            margin: 0 auto;
            padding: 1in;
            background: white;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }
        }
      `}</style>

      {/* Header */}
      <div className="print-header">
        <h1 style={{ fontSize: '18px', margin: 0, fontWeight: 'bold' }}>
          {eventInfo.title} - Event Registrations
        </h1>
        <div style={{ fontSize: '12px', marginTop: '5px', color: '#666' }}>
          {eventInfo.event_start && (
            <span>Event Date: {formatDate(eventInfo.event_start)}</span>
          )}
          {eventInfo.location && (
            <span style={{ marginLeft: '20px' }}>Location: {eventInfo.location}</span>
          )}
          <span style={{ marginLeft: '20px' }}>
            Report Generated: {new Date().toLocaleDateString('en-AU')}
          </span>
        </div>
      </div>

      {/* Summary Section */}
      {showSummary && (
        <div className="print-section">
          <h2 style={{ fontSize: '14px', margin: '0 0 10px 0', fontWeight: 'bold' }}>
            Registration Summary
          </h2>
          <div className="print-summary-grid">
            <div className="print-summary-item">
              <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{registrations.length}</div>
              <div>Total Registrations</div>
            </div>
            <div className="print-summary-item">
              <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#1e40af' }}>{totalAttendees}</div>
              <div>Total Attendees</div>
            </div>
            <div className="print-summary-item">
              <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#16a34a' }}>
                {formatCurrency(totalRevenue)}
              </div>
              <div>Total Revenue</div>
            </div>
            <div className="print-summary-item">
              <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                <span style={{ color: '#16a34a' }}>{paidRegistrations}</span>
                <span style={{ color: '#666', margin: '0 3px' }}>/</span>
                <span style={{ color: '#eab308' }}>{pendingRegistrations}</span>
              </div>
              <div>Paid / Pending</div>
            </div>
          </div>
        </div>
      )}

      {/* Registration List Table */}
      <div className="print-section">
        <h2 style={{ fontSize: '14px', margin: '0 0 10px 0', fontWeight: 'bold' }}>
          Registration List
        </h2>
        <table className="print-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Attendees</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {registrations.map((registration) => (
              <tr key={registration.registration_id}>
                <td>
                  <div style={{ fontWeight: 'bold' }}>
                    {registration.customer_first_name} {registration.customer_last_name}
                  </div>
                  <div style={{ fontSize: '9px', color: '#666' }}>
                    #{registration.registration_id.substring(0, 8)}...
                  </div>
                </td>
                <td>{registration.customer_email}</td>
                <td>{registration.customer_phone || 'N/A'}</td>
                <td style={{ textAlign: 'center' }}>{registration.attendee_count}</td>
                <td style={{ fontWeight: 'bold' }}>
                  {formatCurrency(registration.total_amount_paid)}
                </td>
                <td>
                  <span 
                    style={{ 
                      color: getPaymentStatusColor(registration.payment_status),
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      fontSize: '9px'
                    }}
                  >
                    {registration.payment_status}
                  </span>
                </td>
                <td style={{ fontSize: '9px' }}>
                  {formatDate(registration.registration_date)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detailed Attendee Information */}
      {showAttendeeDetails && (
        <div className="print-section page-break">
          <h2 style={{ fontSize: '14px', margin: '0 0 15px 0', fontWeight: 'bold' }}>
            Detailed Attendee Information
          </h2>
          
          {registrations.map((registration) => (
            <div key={registration.registration_id} className="print-registration">
              <div style={{ 
                borderBottom: '1px solid #ccc', 
                paddingBottom: '5px', 
                marginBottom: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <h3 style={{ fontSize: '12px', margin: 0, fontWeight: 'bold' }}>
                    {registration.customer_first_name} {registration.customer_last_name}
                  </h3>
                  <div style={{ fontSize: '9px', color: '#666' }}>
                    Registration #{registration.registration_id.substring(0, 8)}... • 
                    {registration.customer_email} • 
                    {registration.customer_phone || 'No phone'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '11px' }}>
                    {formatCurrency(registration.total_amount_paid)}
                  </div>
                  <div 
                    style={{ 
                      fontSize: '9px',
                      color: getPaymentStatusColor(registration.payment_status),
                      fontWeight: 'bold',
                      textTransform: 'uppercase'
                    }}
                  >
                    {registration.payment_status}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '10px' }}>
                <strong>Attendees ({registration.attendee_count}):</strong>
              </div>

              {registration.attendees.map((attendee) => (
                <div key={attendee.attendee_id} className="print-attendee">
                  <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>
                    {attendee.first_name} {attendee.last_name}
                    <span style={{ 
                      marginLeft: '8px', 
                      fontSize: '8px', 
                      backgroundColor: '#e0e7ff',
                      padding: '1px 4px',
                      borderRadius: '2px',
                      textTransform: 'capitalize'
                    }}>
                      {attendee.attendee_type}
                    </span>
                    {attendee.relationship && (
                      <span style={{ 
                        marginLeft: '4px', 
                        fontSize: '8px', 
                        color: '#666'
                      }}>
                        ({attendee.relationship})
                      </span>
                    )}
                  </div>
                  
                  {(attendee.dietary_requirements || attendee.special_needs) && (
                    <div className="print-special-req">
                      <strong style={{ fontSize: '8px' }}>Special Requirements:</strong>
                      {attendee.dietary_requirements && (
                        <div style={{ marginTop: '2px' }}>
                          <strong>Dietary:</strong> {attendee.dietary_requirements}
                        </div>
                      )}
                      {attendee.special_needs && (
                        <div style={{ marginTop: '2px' }}>
                          <strong>Accessibility:</strong> {attendee.special_needs}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div style={{ 
        marginTop: '20px', 
        paddingTop: '10px', 
        borderTop: '1px solid #ccc',
        fontSize: '9px',
        color: '#666',
        textAlign: 'center'
      }}>
        <div>Generated by LodgeTix Event Management System</div>
        <div>Report Date: {new Date().toLocaleDateString('en-AU')} at {new Date().toLocaleTimeString('en-AU')}</div>
        <div>Event ID: {eventInfo.event_id}</div>
      </div>
    </div>
  )
}