'use client'

import React, { useState } from 'react'
import { BarChart3, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { FinancialSummary } from './financial-summary'

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

interface FinancialSummaryWrapperProps {
  registrations: Registration[]
}

export function FinancialSummaryWrapper({ registrations }: FinancialSummaryWrapperProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                <div>
                  <CardTitle>Financial Summary</CardTitle>
                  <CardDescription>
                    Detailed revenue metrics and payment analytics
                  </CardDescription>
                </div>
              </div>
              <Button variant="ghost" size="icon">
                {isOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <FinancialSummary registrations={registrations} />
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}