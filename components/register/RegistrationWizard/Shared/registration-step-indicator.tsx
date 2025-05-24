"use client"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"

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
  const isMobile = useIsMobile()

  // Filter steps for mobile view - show only current and next step
  const visibleSteps = isMobile 
    ? steps.filter(step => step.id === currentStep || step.id === currentStep + 1)
    : steps

  const renderStepContent = (step: typeof steps[0]) => {
    const isCompleted = step.id < currentStep
    const isCurrent = step.id === currentStep

    return (
      <li key={step.name} className="md:flex-1">
        <div
          className={cn(
            "flex flex-col border-l-4 py-2 pl-4 md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4",
            isCompleted
              ? "border-masonic-gold"
              : isCurrent
                ? "border-masonic-navy"
                : "border-gray-200"
          )}
        >
          <span
            className={cn(
              "text-sm font-medium",
              isCompleted
                ? "text-masonic-gold"
                : isCurrent
                  ? "text-masonic-navy"
                  : "text-gray-500"
            )}
          >
            Step {step.id}
          </span>
          <span
            className={cn(
              "text-sm font-medium",
              isCompleted
                ? "text-gray-900"
                : isCurrent
                  ? "text-masonic-navy"
                  : "text-gray-500"
            )}
          >
            {step.name}
          </span>
        </div>
      </li>
    )
  }

  // Mobile hamburger menu with all steps
  const renderMobileMenu = () => {
    if (!isMobile) return null
    
    return (
      <div className="flex items-center mb-4">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" className="p-1 h-auto mr-2">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72">
            <SheetTitle>Registration Steps</SheetTitle>
            <SheetDescription>Navigate between registration steps</SheetDescription>
            <div className="py-4">
              <ol role="list" className="space-y-4">
                {steps.map(renderStepContent)}
              </ol>
            </div>
          </SheetContent>
        </Sheet>
        <h2 className="text-lg font-semibold">Registration</h2>
      </div>
    )
  }

  return (
    <nav aria-label="Progress" className="w-full">
      {renderMobileMenu()}
      <ol role="list" className="space-y-4 md:flex md:space-x-8 md:space-y-0">
        {visibleSteps.map(renderStepContent)}
      </ol>
    </nav>
  )
}
