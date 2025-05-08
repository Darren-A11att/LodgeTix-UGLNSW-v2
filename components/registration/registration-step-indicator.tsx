"use client"
import { cn } from "@/lib/utils"

const steps = [
  { id: 1, name: "Registration Type" },
  { id: 2, name: "Attendee Details" },
  { id: 3, name: "Select Tickets" },
  { id: 4, name: "Review Order" },
  { id: 5, name: "Payment" },
  { id: 6, name: "Confirmation" },
]

interface RegistrationStepIndicatorProps {
  currentStep: number
}

export function RegistrationStepIndicator({ currentStep }: RegistrationStepIndicatorProps) {
  return (
    <nav aria-label="Progress">
      <ol role="list" className="space-y-4 md:flex md:space-x-8 md:space-y-0">
        {steps.map((step) => (
          <li key={step.name} className="md:flex-1">
            <div
              className={cn(
                "group flex flex-col border-l-4 py-2 pl-4 md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4",
                step.id < currentStep
                  ? "border-masonic-gold"
                  : step.id === currentStep
                    ? "border-masonic-navy"
                    : "border-gray-200",
              )}
            >
              <span
                className={cn(
                  "text-sm font-medium",
                  step.id < currentStep
                    ? "text-masonic-gold"
                    : step.id === currentStep
                      ? "text-masonic-navy"
                      : "text-gray-500",
                )}
              >
                Step {step.id}
              </span>
              <span
                className={cn(
                  "text-sm font-medium",
                  step.id < currentStep
                    ? "text-gray-900"
                    : step.id === currentStep
                      ? "text-masonic-navy"
                      : "text-gray-500",
                )}
              >
                {step.name}
              </span>
            </div>
          </li>
        ))}
      </ol>
    </nav>
  )
}
