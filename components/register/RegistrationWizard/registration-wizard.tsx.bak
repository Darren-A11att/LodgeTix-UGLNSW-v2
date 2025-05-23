"use client"

import React, { useState, useEffect, Suspense, lazy } from 'react'
import { useRegistrationStore, selectCurrentStep, selectRegistrationType, selectConfirmationNumber, selectAttendees } from '../../../lib/registrationStore'
import { RegistrationStepIndicator } from "./Shared/registration-step-indicator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { User } from "lucide-react"
// Import the layout components
// WizardShellLayout is now handled by layout.tsx
import { WizardBodyStructureLayout } from "./Layouts/WizardBodyStructureLayout"

// Import base component directly (it's small)
import { RegistrationTypeStep } from "./Steps/registration-type-step"

// Lazily load heavier components
const AttendeeDetailsStep = lazy(() => import('./Steps/AttendeeDetails'))
const TicketSelectionStep = lazy(() => import('./Steps/ticket-selection-step'))
const OrderReviewStep = lazy(() => import('./Steps/order-review-step'))
const PaymentStep = lazy(() => import('./Steps/payment-step'))
const ConfirmationStep = lazy(() => import('./Steps/confirmation-step'))

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

// Helper function to normalize attendee type
const normalizeAttendeeType = (type: string): string => {
  const typeMap: Record<string, string> = {
    'mason': 'Mason',
    'guest': 'Guest', 
    'ladypartner': 'LadyPartner',
    'guestpartner': 'GuestPartner'
  };
  return typeMap[type.toLowerCase()] || type;
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
  
  const masons = attendees.filter(att => normalizeAttendeeType(att.attendeeType) === 'Mason');
  const guests = attendees.filter(att => normalizeAttendeeType(att.attendeeType) === 'Guest');

  attendees.forEach((attendee) => {
    let descriptiveLabel = "";
    const normalizedType = normalizeAttendeeType(attendee.attendeeType);

    if (normalizedType === 'Mason') {
      descriptiveLabel = getMasonOrderLabel(attendee, masons);
    } else if (normalizedType === 'LadyPartner') {
      const masonOwner = attendees.find(m => m.attendeeId === attendee.partnerOf);
      const masonOwnerLabel = masonOwner ? getMasonOrderLabel(masonOwner, masons) + "'s" : "Associated Mason's";
      descriptiveLabel = `${masonOwnerLabel} Lady/Partner`;
    } else if (normalizedType === 'GuestPartner') {
      const guestOwner = attendees.find(g => g.attendeeId === attendee.partnerOf);
      const guestOwnerLabel = guestOwner ? getGuestOrderLabel(guestOwner, guests) + "'s" : "Associated Guest's";
      descriptiveLabel = `${guestOwnerLabel} Partner`;
    } else if (normalizedType === 'Guest') {
      descriptiveLabel = getGuestOrderLabel(attendee, guests);
    } else {
      // Fallback for unexpected cases or if a guest is somehow a partner without a partnerType
      descriptiveLabel = `${(attendee.firstName || 'N/A')} ${(attendee.lastName || 'N/A')}`;
      console.warn("Unhandled attendee type for descriptiveLabel:", attendee);
    }

    // Common fields
    if (!isNonEmpty(attendee.title)) errors.push(`${descriptiveLabel}: Title is required.`);
    if (!isNonEmpty(attendee.firstName)) errors.push(`${descriptiveLabel}: First Name is required.`);
    if (!isNonEmpty(attendee.lastName)) errors.push(`${descriptiveLabel}: Last Name is required.`);

    // Mason specific
    if (normalizedType === 'Mason') {
      if (!isNonEmpty(attendee.rank)) errors.push(`${descriptiveLabel}: Rank is required.`);
      if (!isNonEmpty(attendee.grandLodgeId)) errors.push(`${descriptiveLabel}: Grand Lodge is required.`);
      if (!isNonEmpty(attendee.lodgeId) && !isNonEmpty(attendee.lodgeNameNumber)) errors.push(`${descriptiveLabel}: Lodge is required.`);
      // There is no membershipNumber field in this application
    } else if (normalizedType === 'LadyPartner' || normalizedType === 'GuestPartner') { // Check if partner
      // Partner specific validation (treat as Guest generally, plus relationship)
      if (!attendee.relationship) errors.push("Partner relationship is required.");
      if (attendee.contactPreference === 'Directly' && !attendee.primaryEmail && !attendee.primaryPhone) {
          errors.push("Partner Email or Phone is required if contacting directly.");
      }
    } else if (normalizedType === 'Guest') {
      // Guest specific validation
      if (attendee.contactPreference === 'Directly' && !attendee.primaryEmail && !attendee.primaryPhone) {
          errors.push("Guest Email or Phone is required if contacting directly.");
      }
    }

    // Contact Info for relevant types
    if (normalizedType === 'Mason' || normalizedType === 'Guest') {
      // If contactPreference is 'Directly', email and phone are mandatory.
      if (attendee.contactPreference === 'Directly') {
        if (!isValidEmail(attendee.primaryEmail)) {
          errors.push(`${descriptiveLabel}: A valid Email is required when contact preference is 'Directly'.`);
        }
        if (!isNonEmpty(attendee.primaryPhone)) {
          errors.push(`${descriptiveLabel}: Phone Number is required when contact preference is 'Directly'.`);
        }
      } else if (attendee.isPrimary && normalizedType === 'Mason') {
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

  // Step title and description mapping
  const getStepContent = (step: number) => {
    switch (step) {
      case 1:
        return {
          title: "Select Registration Type",
          description: "Please select how you would like to register for this event"
        }
      case 2:
        return {
          title: "Attendee Details",
          description: "Please provide information for all attendees"
        }
      case 3:
        return {
          title: "Select Tickets",
          description: "Choose tickets for each attendee"
        }
      case 4:
        return {
          title: "Review Order",
          description: "Review your registration details before payment"
        }
      case 5:
        return {
          title: "Payment",
          description: "Complete your registration payment"
        }
      case 6:
        return {
          title: "Confirmation",
          description: "Registration successful"
        }
      default:
        return {
          title: "Registration",
          description: ""
        }
    }
  }

  // Updated renderStep function - now just returns the content without wrappers
  const renderStepContent = () => {
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

  // Terms and conditions for step 2
  const renderAdditionalButtonContent = () => {
    if (currentStep === 2) {
      return (
        <div className="flex items-center">
          <input
            type="checkbox"
            id="agree-terms"
            checked={agreeToTerms}
            onChange={(e) => handleAgreeToTermsChange(e.target.checked)}
            className="mr-2"
          />
          <label htmlFor="agree-terms" className="text-sm">
            I agree to the terms and conditions
          </label>
        </div>
      );
    }
    return null;
  };

  // Get current step info
  const { title, description } = getStepContent(currentStep);
  
  // Determine if next button should be disabled
  const isNextDisabled = () => {
    if (currentStep === 2) {
      return validationErrors.length > 0 || !agreeToTerms;
    }
    return false;
  };

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
    <WizardBodyStructureLayout
      currentStep={currentStep}
      sectionTitle={title}
      sectionDescription={description}
      onBack={currentStep > 1 ? handleBack : undefined}
      onNext={currentStep < 6 ? handleNext : undefined}
      disableNext={isNextDisabled()}
      hideBack={currentStep === 1 || currentStep === 6}
      additionalButtonContent={renderAdditionalButtonContent()}
    >
      <div className={`${showAttendeeSummary ? "grid grid-cols-1 lg:grid-cols-4 gap-6" : ""}`}>
        <div className={showAttendeeSummary ? "lg:col-span-4" : "w-full"}>
          {renderStepContent()}
        </div>
      </div>
    </WizardBodyStructureLayout>
  )
}
