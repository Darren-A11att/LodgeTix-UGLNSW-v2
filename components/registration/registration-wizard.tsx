"use client"

import { useRegistration } from "@/contexts/registration-context"
import { RegistrationStepIndicator } from "./registration-step-indicator"
import { RegistrationTypeStep } from "./steps/registration-type-step"
import { AttendeeDetailsStep } from "./steps/attendee-details-step"
import { TicketSelectionStep } from "./steps/ticket-selection-step"
import { OrderReviewStep } from "./steps/order-review-step"
import { PaymentStep } from "./steps/payment-step"
import { ConfirmationStep } from "./steps/confirmation-step"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { User } from "lucide-react"

export function RegistrationWizard() {
  const { state } = useRegistration()
  const { currentStep } = state

  // Only show the attendee summary for steps 2-6, not for step 1 (Registration Type)
  const showAttendeeSummary = currentStep > 1

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <RegistrationStepIndicator currentStep={currentStep} />

      <div className={`mt-8 ${showAttendeeSummary ? "grid grid-cols-1 lg:grid-cols-4 gap-6" : ""}`}>
        <div className={showAttendeeSummary ? "lg:col-span-4" : "w-full"}>
          {currentStep === 1 && <RegistrationTypeStep />}
          {currentStep === 2 && <AttendeeDetailsStep />}
          {currentStep === 3 && <TicketSelectionStep />}
          {currentStep === 4 && <OrderReviewStep />}
          {currentStep === 5 && <PaymentStep />}
          {currentStep === 6 && <ConfirmationStep />}
        </div>
      </div>
    </div>
  )
}
