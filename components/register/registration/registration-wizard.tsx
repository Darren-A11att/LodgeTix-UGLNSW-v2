"use client"

import React, { useState, useEffect, Suspense, lazy } from 'react'
import { useRegistrationStore, selectCurrentStep, selectRegistrationType, selectConfirmationNumber, selectAttendees } from '../../../lib/registrationStore'
import { RegistrationStepIndicator } from "./registration-step-indicator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { User } from "lucide-react"

// Import base component directly (it's small)
import { RegistrationTypeStep } from "../steps/registration-type-step"

// Lazily load heavier components
const AttendeeDetailsStep = lazy(() => import('../attendee/AttendeeDetails'))
const TicketSelectionStep = lazy(() => import('../steps/ticket-selection-step').then(mod => ({ default: mod.TicketSelectionStep })))
const OrderReviewStep = lazy(() => import('../order/order-review-step').then(mod => ({ default: mod.OrderReviewStep })))
const PaymentStep = lazy(() => import('../steps/payment-step').then(mod => ({ default: mod.PaymentStep })))
const ConfirmationStep = lazy(() => import('../order/confirmation-step').then(mod => ({ default: mod.ConfirmationStep })))

export interface RegistrationWizardProps {
  // eventId: string; // Example: if event context is needed
}

// Helper to check for non-empty string
const isNonEmpty = (value: string | undefined | null): boolean => {
  return typeof value === 'string' && value.trim() !== '';
};

// Basic email validation
const isValidEmail = (email: string | undefined | null): boolean => {
  if (!isNonEmpty(email)) {
    console.log(`isValidEmail: Input '${String(email)}' is considered empty or not a string by isNonEmpty.`);
    return false;
  }

  // Log character codes for the email string
  const charCodes = (email as string).split('').map(char => char.charCodeAt(0));
  console.log(`isValidEmail: Email string for validation: '${email}', Length: ${(email as string).length}, CharCodes: ${charCodes.join(',')}`);

  const pattern = "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"; // Standard email regex pattern
  try {
    const emailRegex = new RegExp(pattern);
    const result = emailRegex.test(email as string);
    console.log(`isValidEmail: Testing '${email}' with pattern '${pattern}'. Result: ${result}`);
    return result;
  } catch (e) {
    console.error(`isValidEmail: Error creating or using RegExp with pattern '${pattern}' for email '${email}'.`, e);
    return false;
  }
};

// Function to validate attendee data
// Make sure UnifiedAttendeeData is imported or available in this scope
// For now, assuming it's available via registrationStore imports or globally
const validateAttendeeData = (attendees: ReturnType<typeof selectAttendees>): string[] => {
  const errors: string[] = [];
  if (!attendees || attendees.length === 0) {
    // This should ideally be handled by ensuring a primary attendee exists.
    // errors.push("At least one attendee (Primary Mason) is required.");
    return errors; // If no attendees, no validation errors from fields. Handled by AttendeeDetails component structure.
  }

  const getMasonOrderLabel = (attendee: any, allMasons: any[]) => {
    if (attendee.isPrimary) return "Primary Mason";
    const nonPrimaryMasons = allMasons.filter(m => !m.isPrimary);
    const index = nonPrimaryMasons.indexOf(attendee);
    return `Additional Mason ${index + 1}`;
  };

  const getGuestOrderLabel = (attendee: any, allGuests: any[]) => {
    const index = allGuests.indexOf(attendee);
    return `Guest ${index + 1}`;
  };
  
  const masons = attendees.filter(att => att.attendeeType === 'mason');
  const guests = attendees.filter(att => att.attendeeType === 'guest');

  attendees.forEach((attendee) => {
    let descriptiveLabel = "";

    if (attendee.attendeeType === 'mason') {
      descriptiveLabel = getMasonOrderLabel(attendee, masons);
    } else if (attendee.attendeeType === 'lady_partner') {
      const masonOwner = attendees.find(m => m.attendeeId === attendee.relatedAttendeeId);
      const masonOwnerLabel = masonOwner ? getMasonOrderLabel(masonOwner, masons) + "'s" : "Associated Mason's";
      descriptiveLabel = `${masonOwnerLabel} Lady/Partner`;
    } else if (attendee.attendeeType === 'guest') {
      descriptiveLabel = getGuestOrderLabel(attendee, guests);
    } else if (attendee.attendeeType === 'guest_partner') {
      const guestOwner = attendees.find(g => g.attendeeId === attendee.relatedAttendeeId);
      const guestOwnerLabel = guestOwner ? getGuestOrderLabel(guestOwner, guests) + "'s" : "Associated Guest's";
      descriptiveLabel = `${guestOwnerLabel} Partner`;
    } else {
      // Fallback for other types, though not focus of current validation
      descriptiveLabel = `${attendee.attendeeType.replace(/_/g, ' ')} (${attendee.firstName || 'N/A'})`;
    }

    // Common fields
    if (!isNonEmpty(attendee.title)) errors.push(`${descriptiveLabel}: Title is required.`);
    if (!isNonEmpty(attendee.firstName)) errors.push(`${descriptiveLabel}: First Name is required.`);
    if (!isNonEmpty(attendee.lastName)) errors.push(`${descriptiveLabel}: Last Name is required.`);

    // Mason specific
    if (attendee.attendeeType === 'mason') {
      if (!isNonEmpty(attendee.rank)) errors.push(`${descriptiveLabel}: Rank is required.`);
      if (!isNonEmpty(attendee.grandLodgeId)) errors.push(`${descriptiveLabel}: Grand Lodge is required.`);
      if (!isNonEmpty(attendee.lodgeId) && !isNonEmpty(attendee.lodgeNameNumber)) errors.push(`${descriptiveLabel}: Lodge is required.`);
      // Member Number: Assuming it's mandatory if the field is there.
      // This might need adjustment based on specific GL rules (e.g., for EAs).
      // if (!isNonEmpty(attendee.memberNumber)) errors.push(`${descriptiveLabel}: Member Number is required.`); // Temporarily commented out for testing
    }

    // Partner specific (Lady Partner or Guest Partner)
    if (attendee.attendeeType === 'lady_partner' || attendee.attendeeType === 'guest_partner') {
      if (!isNonEmpty(attendee.relationship)) errors.push(`${descriptiveLabel}: Relationship is required.`);
    }

    // Contact Info for relevant types
    if (['mason', 'lady_partner', 'guest', 'guest_partner'].includes(attendee.attendeeType)) {
      // If contactPreference is 'Directly', email and phone are mandatory.
      if (attendee.contactPreference === 'Directly') {
        if (!isValidEmail(attendee.primaryEmail)) {
          errors.push(`${descriptiveLabel}: A valid Email is required when contact preference is 'Directly'.`);
        }
        if (!isNonEmpty(attendee.primaryPhone)) {
          errors.push(`${descriptiveLabel}: Phone Number is required when contact preference is 'Directly'.`);
        }
      } else if (attendee.isPrimary && attendee.attendeeType === 'mason') {
        // This block specifically validates the Primary Mason's email and phone,
        // as their fields are always visible and marked required on the form,
        // and their contactPreference defaults to 'Directly'.
        // This ensures their fields are checked even if, hypothetically, their contactPreference was changed from 'Directly'.
        if (!isValidEmail(attendee.primaryEmail)) {
          errors.push(`${descriptiveLabel}: Email Address is required.`);
        }
        if (!isNonEmpty(attendee.primaryPhone)) {
          errors.push(`${descriptiveLabel}: Mobile Number is required.`);
        }
      }
      // No validation error is raised for the contactPreference field itself if it's 'Please Select' or another non-'Directly' option.
    }
  });
  return errors;
};

export const RegistrationWizard: React.FC<RegistrationWizardProps> = (props) => {
  const currentStep = useRegistrationStore(selectCurrentStep)
  const registrationType = useRegistrationStore(selectRegistrationType)
  const confirmationNumber = useRegistrationStore(selectConfirmationNumber)
  const allAttendees = useRegistrationStore(selectAttendees); // Get all attendees
  const goToNextStep = useRegistrationStore(state => state.goToNextStep)
  const goToPrevStep = useRegistrationStore(state => state.goToPrevStep)
  const setCurrentStep = useRegistrationStore(state => state.setCurrentStep) // Direct step setting

  useEffect(() => {
    // This effect runs once on mount, after Zustand has likely rehydrated from localStorage.
    const storeState = useRegistrationStore.getState();
    const hasExistingIncompleteRegistration = storeState.registrationType !== null && storeState.confirmationNumber === null;

    if (hasExistingIncompleteRegistration && storeState.currentStep !== 1) {
      console.log("Existing incomplete registration found. Forcing step to 1.");
      setCurrentStep(1);
    }
  }, [setCurrentStep]); // Added setCurrentStep to dependency array as it's used inside.

  // State for AttendeeDetailsStep props
  const [agreeToTerms, setAgreeToTerms] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  const handleAgreeToTermsChange = (checked: boolean) => {
    setAgreeToTerms(checked)
    // Potentially clear certain validation errors when terms are agreed/disagreed
    if (checked) {
      setValidationErrors(errors => errors.filter(e => e !== 'You must agree to the terms and conditions.'))
    } else {
      // Optionally add a validation error if unchecked, or handle in AttendeeDetailsStep
    }
  }
  
  // Updated validation logic
  const runValidations = React.useCallback(() => {
    let errors: string[] = [];
    if (currentStep === 2) { // Assuming step 2 is AttendeeDetails
      errors = validateAttendeeData(allAttendees);
      // The agreeToTerms check is handled directly by the button's disabled state in AttendeeDetails.tsx
      // No need to add a specific error message for it here if the button handles it.
    }
    setValidationErrors(errors);
    return errors.length === 0;
  }, [currentStep, allAttendees]); // Add allAttendees to dependencies

  // useEffect to run validations when attendees change or step changes to attendee details
  useEffect(() => {
    if (currentStep === 2) {
      const errors = validateAttendeeData(allAttendees); // Call it directly
      setValidationErrors(errors);
      console.log("!!!!!!!!!!!! VALIDATION ERRORS !!!!!!!!!!!!:", errors);
      console.log("!!!!!!!!!!!! ALL ATTENDEES FOR VALIDATION !!!!!!!!!!!!:", JSON.stringify(allAttendees, null, 2));
    } else {
      // Clear errors if not on the attendee details step, or if attendee details are not yet loaded
      // setValidationErrors([]); 
      // For now, let errors persist until the user moves back and then forward, or fixes them.
      // If an error from a previous step should clear when moving away, add logic here.
    }
  }, [currentStep, allAttendees]);

  // Logic to handle step advancement, potentially with validation
  const handleNext = () => {
    // Validation is now run reactively, and errors are in validationErrors.
    // The button in AttendeeDetailsStep will be enabled/disabled based on validationErrors and agreeToTerms.
    // So, if handleNext is called, it implies the button was enabled.
    // However, it's good practice to ensure, or rely on AttendeeDetails.tsx to gate this.
    // For safety, we could re-run or check here, but it might be redundant
    // if AttendeeDetails.tsx's button is the sole enabler of this call.
    // if (runValidations() && agreeToTerms) { // This check is effectively done by the button's disabled state
      goToNextStep()
    // }
  }

  const handleBack = () => {
    goToPrevStep()
  }

  // useEffect to reset agreeToTerms if user goes back from a step after AttendeeDetails
  // This is just an example of managing shared state across steps.
  // useEffect(() => {
  //   if (currentStep < 2) { // Assuming step 2 is AttendeeDetails
  //     setAgreeToTerms(false)
  //   }
  // }, [currentStep])
  
  // Loading fallback component
  const StepLoadingFallback = () => (
    <div className="w-full py-8 text-center animate-pulse">
      <div className="h-8 bg-slate-200 rounded w-1/3 mx-auto mb-4"></div>
      <div className="h-4 bg-slate-200 rounded w-1/2 mx-auto mb-3"></div>
      <div className="h-4 bg-slate-200 rounded w-2/3 mx-auto mb-3"></div>
      <div className="h-10 bg-slate-200 rounded w-1/4 mx-auto mt-6"></div>
    </div>
  )

  // --- Render Current Step ---
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <RegistrationTypeStep />
      case 2:
        return (
          <Suspense fallback={<StepLoadingFallback />}>
            <AttendeeDetailsStep
              agreeToTerms={agreeToTerms}
              onAgreeToTermsChange={handleAgreeToTermsChange}
              nextStep={handleNext}
              prevStep={handleBack}
              validationErrors={validationErrors}
            />
          </Suspense>
        )
      case 3:
        return (
          <Suspense fallback={<StepLoadingFallback />}>
            <TicketSelectionStep />
          </Suspense>
        )
      case 4:
        return (
          <Suspense fallback={<StepLoadingFallback />}>
            <OrderReviewStep />
          </Suspense>
        )
      case 5:
        return (
          <Suspense fallback={<StepLoadingFallback />}>
            <PaymentStep />
          </Suspense>
        )
      case 6:
        return (
          <Suspense fallback={<StepLoadingFallback />}>
            <ConfirmationStep />
          </Suspense>
        )
      default:
        return <p>Unknown step</p>
    }
  }

  // Log the entire store state whenever it changes
  useEffect(() => {
    const unsubscribe = useRegistrationStore.subscribe(
      (newState, prevState) => {
        console.log("Zustand Store Updated:", newState)
        // You can also log prevState if you need to compare
        // console.log("Previous State:", prevState)
      }
    )
    // Cleanup subscription on component unmount
    return () => {
      unsubscribe()
    }
  }, []) // Empty dependency array ensures this runs once on mount and cleans up on unmount

  // Only show the attendee summary for steps 2-6, not for step 1 (Registration Type)
  const showAttendeeSummary = currentStep > 1

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <RegistrationStepIndicator currentStep={currentStep} />

      <div className={`mt-8 ${showAttendeeSummary ? "grid grid-cols-1 lg:grid-cols-4 gap-6" : ""}`}>
        <div className={showAttendeeSummary ? "lg:col-span-4" : "w-full"}>
          {renderStep()}
        </div>
      </div>
    </div>
  )
}
