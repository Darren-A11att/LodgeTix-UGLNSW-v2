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

        {showAttendeeSummary && (
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="bg-masonic-navy text-white">
                <CardTitle className="text-lg">Attendee Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {state.primaryAttendee ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium text-masonic-navy">Primary Attendee</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <User className="h-4 w-4 text-masonic-navy" />
                        <span>
                          {state.primaryAttendee.masonicTitle} {state.primaryAttendee.firstName}{" "}
                          {state.primaryAttendee.lastName}
                        </span>
                      </div>
                    </div>

                    {state.additionalAttendees.length > 0 && (
                      <div>
                        <h3 className="font-medium text-masonic-navy">Additional Attendees</h3>
                        <ul className="mt-1 space-y-2">
                          {state.additionalAttendees.map((attendee) => (
                            <li key={attendee.id} className="flex items-center gap-2">
                              <User className="h-4 w-4 text-masonic-navy" />
                              <span>
                                {attendee.type === "mason"
                                  ? `${attendee.masonicTitle} ${attendee.firstName} ${attendee.lastName}`
                                  : `${attendee.firstName} ${attendee.lastName}`}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {state.selectedTickets.length > 0 && (
                      <div>
                        <h3 className="font-medium text-masonic-navy">Tickets</h3>
                        <p className="text-sm text-gray-600 mt-1">{state.selectedTickets.length} ticket(s) selected</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No attendees added yet</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
