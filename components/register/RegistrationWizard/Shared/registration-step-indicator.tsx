"use client"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useIsMobile } from "@/hooks/use-mobile"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"

const steps = [
  { id: 1, name: "Registration Type", pathFn: (eventId: string) => `/events/${eventId}/register` },
  { id: 2, name: "Attendee Details", pathFn: (eventId: string) => `/events/${eventId}/register/attendee-details` },
  { id: 3, name: "Select Tickets", pathFn: (eventId: string) => `/events/${eventId}/tickets` },
  { id: 4, name: "Review Order", pathFn: (eventId: string) => `/events/${eventId}/register/review-order` },
  { id: 5, name: "Payment", pathFn: (eventId: string) => `/events/${eventId}/register/payment` },
  { id: 6, name: "Confirmation", pathFn: (eventId: string) => `/events/${eventId}/confirmation` },
]

interface RegistrationStepIndicatorProps {
  currentStep: number
}

export function RegistrationStepIndicator({ currentStep }: RegistrationStepIndicatorProps) {
  const params = useParams()
  const isMobile = useIsMobile()
  
  // Ensure eventId is treated as a string, even if it comes as string[] from params
  const eventIdParam = params?.id
  const eventId = Array.isArray(eventIdParam) ? eventIdParam[0] : eventIdParam

  // Filter steps for mobile view - show only current and next step
  const visibleSteps = isMobile 
    ? steps.filter(step => step.id === currentStep || step.id === currentStep + 1)
    : steps

  const renderStepContent = (step: typeof steps[0]) => {
    const isCompleted = step.id < currentStep
    // Ensure eventId is a string and pathFn exists before considering clickable
    const isClickable = isCompleted && typeof eventId === 'string' && eventId.length > 0 && typeof step.pathFn === 'function'
    const path = isClickable && eventId ? step.pathFn(eventId) : undefined

    const stepContent = (
      <div
        className={cn(
          "group flex flex-col border-l-4 py-2 pl-4 md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4",
          isCompleted
            ? "border-masonic-gold"
            : step.id === currentStep
              ? "border-masonic-navy"
              : "border-gray-200",
          isClickable ? "cursor-pointer hover:border-masonic-gold/80" : "",
        )}
      >
        <span
          className={cn(
            "text-sm font-medium",
            isCompleted
              ? "text-masonic-gold"
              : step.id === currentStep
                ? "text-masonic-navy"
                : "text-gray-500",
            isClickable ? "group-hover:text-masonic-gold/80" : "",
          )}
        >
          Step {step.id}
        </span>
        <span
          className={cn(
            "text-sm font-medium",
            isCompleted
              ? "text-gray-900"
              : step.id === currentStep
                ? "text-masonic-navy"
                : "text-gray-500",
            isClickable ? "group-hover:text-gray-700" : "",
          )}
        >
          {step.name}
        </span>
      </div>
    )

    return (
      <li key={step.name} className="md:flex-1">
        {isClickable && path ? (
          <Link href={path} legacyBehavior={false}>
            {stepContent}
          </Link>
        ) : (
          stepContent
        )}
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
            <div className="py-4">
              <h3 className="text-lg font-semibold mb-4">Registration Steps</h3>
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
