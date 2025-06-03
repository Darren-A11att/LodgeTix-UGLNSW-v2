"use client"

import React, { useState, useEffect, useCallback, Suspense, lazy, useRef } from 'react'
import { useRegistrationStore, selectCurrentStep, selectRegistrationType, selectConfirmationNumber, selectAttendees, selectLastSaved, selectDraftId, selectDraftRecoveryHandled, selectAnonymousSessionEstablished } from '../../../lib/registrationStore'
import { RegistrationStepIndicator } from "./Shared/registration-step-indicator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { User } from "lucide-react"
import { resolveFunctionSlug } from '@/lib/utils/function-slug-resolver-client'
// Import the layout components
// WizardShellLayout is now handled by layout.tsx
import { WizardBodyStructureLayout } from "./Layouts/WizardBodyStructureLayout"
import DraftRecoveryModal from '../Functions/DraftRecoveryModal'
import { SessionGuard } from './SessionGuard'

// Import base component directly (it's small)
import { RegistrationTypeStep } from "./Steps/registration-type-step"

// Lazily load heavier components
const AttendeeDetailsStep = lazy(() => import('./Steps/AttendeeDetails'))
const TicketSelectionStep = lazy(() => import('./Steps/ticket-selection-step'))
const OrderReviewStep = lazy(() => import('./Steps/order-review-step'))
const PaymentStep = lazy(() => {
  console.log('🚀 Lazy loading PaymentStep...');
  return import('./Steps/payment-step').then(module => {
    console.log('🚀 PaymentStep module loaded:', module);
    return module;
  }).catch(error => {
    console.error('🚀 Failed to load PaymentStep:', error);
    throw error;
  });
})
const ConfirmationStep = lazy(() => import('./Steps/confirmation-step'))

export interface RegistrationWizardProps {
  functionSlug: string; // Function slug for the registration
  functionId?: string; // Function UUID (optional - will be resolved from slug if not provided)
  registrationId?: string; // Registration ID from URL
  isNewRegistration?: boolean; // Whether this is a new registration
}

// Helper to check for non-empty value
const isNonEmpty = (value: string | number | undefined | null): boolean => {
  if (typeof value === 'string') {
    return value.trim() !== '';
  }
  if (typeof value === 'number') {
    return true;
  }
  return false;
};

// Basic email validation
const isValidEmail = (email: string | undefined | null): boolean => {
  if (!isNonEmpty(email)) {
    // Don't log when the field is empty - this is causing UI interference
    return false;
  }

  // Only log debugging information when actually validating a non-empty email
  const pattern = "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"; // Standard email regex pattern
  try {
    const emailRegex = new RegExp(pattern);
    const result = emailRegex.test(email as string);
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
  let errors: string[] = []; // Changed from const to let
  
  console.log('[Validation] Starting validation for', attendees?.length || 0, 'attendees');
  console.log('[Validation] Attendees data:', JSON.stringify(attendees, null, 2));
  
  if (!attendees || attendees.length === 0) {
    // This should ideally be handled by ensuring a primary attendee exists.
    // errors.push("At least one attendee (Primary Mason) is required.");
    return errors; // If no attendees, no validation errors from fields. Handled by AttendeeDetails component structure.
  }

  // Get registration type to handle lodge registrations differently
  const registrationType = useRegistrationStore.getState().registrationType;
  
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
    // For lodge registrations, only validate the primary (booking contact)
    if (registrationType === 'lodge' && !attendee.isPrimary) {
      return; // Skip validation for non-primary attendees in lodge registrations
    }
    let descriptiveLabel = "";
    const normalizedType = normalizeAttendeeType(attendee.attendeeType);

    if (normalizedType === 'Mason') {
      descriptiveLabel = getMasonOrderLabel(attendee, masons);
      // Debug log for primary mason validation
      if (attendee.isPrimary) {
        console.log('[Validation] Validating Primary Mason:', {
          attendeeId: attendee.attendeeId,
          grand_lodge_id: attendee.grand_lodge_id,
          lodge_id: attendee.lodge_id,
          rank: attendee.rank,
          firstName: attendee.firstName,
          lastName: attendee.lastName
        });
      }
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
      
      // Debug grand lodge validation
      const hasGrandLodgeId = isNonEmpty(attendee.grand_lodge_id);
      console.log(`[Validation] ${descriptiveLabel} grand_lodge_id check:`, {
        value: attendee.grand_lodge_id,
        isNonEmpty: hasGrandLodgeId,
        type: typeof attendee.grand_lodge_id
      });
      
      if (!hasGrandLodgeId) errors.push(`${descriptiveLabel}: Grand Lodge is required.`);
      if (!isNonEmpty(attendee.lodge_id) && !isNonEmpty(attendee.lodgeNameNumber)) errors.push(`${descriptiveLabel}: Lodge is required.`);
      // There is no membershipNumber field in this application
    } else if (normalizedType === 'LadyPartner' || normalizedType === 'GuestPartner') { // Check if partner
      // Partner specific validation (treat as Guest generally, plus relationship)
      if (!attendee.relationship) errors.push("Partner relationship is required.");
      // Only validate email/phone if contact preference is explicitly set to "Directly"
      if (attendee.contactPreference === 'Directly' && !attendee.primaryEmail && !attendee.primaryPhone) {
          errors.push("Partner Email or Phone is required if contacting directly.");
      }
      // Do not validate these fields for other contact preference options
    } else if (normalizedType === 'Guest') {
      // Guest specific validation
      // Only validate email/phone if contact preference is explicitly set to "Directly"
      if (attendee.contactPreference === 'Directly' && !attendee.primaryEmail && !attendee.primaryPhone) {
          errors.push("Guest Email or Phone is required if contacting directly.");
      }
      // Do not validate these fields for "Via Primary Attendee" or "Provide Later"
    }

    // Contact Info for relevant types
    if (normalizedType === 'Mason' || normalizedType === 'Guest') {
      // Debug output for contact preference validation - commented out for performance
      // console.log(`CONTACT DEBUG for ${descriptiveLabel}:`, {
      //   type: normalizedType,
      //   contactPreference: attendee.contactPreference || "Empty",
      //   isPrimary: attendee.isPrimary,
      //   email: attendee.primaryEmail,
      //   phone: attendee.primaryPhone,
      //   isPartner: !!attendee.isPartner,
      //   partnerOf: attendee.partnerOf || "None"
      // });

      // NO DEFAULT VALUES
      // If contact preference is required but missing, validation will catch it
      // We don't set defaults because we want users to explicitly select values
      
      // **** PARTNER VALIDATION ****
      // No special handling or defaults - make validation consistent
      // Partners must explicitly select contact preferences just like other fields
      
      // Simplified validation logic - only validate fields that should be visible
      
      // 1. Primary attendees always need contact details
      if (attendee.isPrimary) {
        // Primary attendees must always provide contact details
        if (!isValidEmail(attendee.primaryEmail)) {
          errors.push(`${descriptiveLabel}: A valid Email is required.`);
        }
        if (!isNonEmpty(attendee.primaryPhone)) {
          errors.push(`${descriptiveLabel}: Phone Number is required.`);
        }
      } 
      // 2. Non-primary attendees need to select a contact preference
      else if (!attendee.contactPreference) {
        // If there's no contact preference, push a validation error
        errors.push(`${descriptiveLabel}: Please select a contact preference.`);
      }
      // 3. If "Directly" is selected, validate contact fields
      else if (attendee.contactPreference === 'Directly') {
        // Only when "Directly" is selected do we validate email/phone
        if (!isValidEmail(attendee.primaryEmail)) {
          errors.push(`${descriptiveLabel}: A valid Email is required when contact preference is 'Directly'.`);
        }
        if (!isNonEmpty(attendee.primaryPhone)) {
          errors.push(`${descriptiveLabel}: Phone Number is required when contact preference is 'Directly'.`);
        }
      }
      // 4. Other contact preferences (PrimaryAttendee, ProvideLater) don't need contact fields validated
      else {
        // These valid options skip email/phone validation
        // console.log(`Non-direct contact preference for ${descriptiveLabel}: ${attendee.contactPreference} - skipping contact validation`);
        
        // Clear any existing contact field validation errors for this attendee
        errors = errors.filter(err => {
          if (!err.includes(descriptiveLabel)) return true;
          
          const isEmailOrPhoneError = 
            err.includes('Email') || 
            err.includes('email') ||
            err.includes('Phone') || 
            err.includes('phone') ||
            err.includes('contact directly');
            
          return !isEmailOrPhoneError;
        });
      }
      
      // The contact preference validation above now handles all scenarios,
      // including partners with non-direct contact preferences
      // No special handling for partners needed beyond this
    }
  });
  return errors;
};

export const RegistrationWizard: React.FC<RegistrationWizardProps> = ({ functionSlug, functionId: providedFunctionId, registrationId, isNewRegistration }) => {
  const currentStep = useRegistrationStore(selectCurrentStep)
  const registrationType = useRegistrationStore(selectRegistrationType)
  const confirmationNumber = useRegistrationStore(selectConfirmationNumber)
  const draftId = useRegistrationStore(selectDraftId)
  const lastSaved = useRegistrationStore(selectLastSaved)
  const allAttendees = useRegistrationStore(selectAttendees); // Get all attendees
  const draftRecoveryHandled = useRegistrationStore(selectDraftRecoveryHandled); // Get draft recovery flag
  const anonymousSessionEstablished = useRegistrationStore(selectAnonymousSessionEstablished); // Get session status
  const goToNextStep = useRegistrationStore(state => state.goToNextStep)
  const goToPrevStep = useRegistrationStore(state => state.goToPrevStep)
  const setCurrentStep = useRegistrationStore(state => state.setCurrentStep) // Direct step setting
  const setFunctionSlug = useRegistrationStore(state => state.setFunctionSlug) // For setting the function
  const setFunctionId = useRegistrationStore(state => state.setFunctionId) // For setting the function ID
  const setSelectedEvents = useRegistrationStore(state => state.setSelectedEvents) // For setting selected events
  const startNewRegistration = useRegistrationStore(state => state.startNewRegistration)
  const clearRegistration = useRegistrationStore(state => state.clearRegistration)
  const setDraftRecoveryHandled = useRegistrationStore(state => state.setDraftRecoveryHandled)
  const setAnonymousSessionEstablished = useRegistrationStore(state => state.setAnonymousSessionEstablished)
  
  // State for Draft Recovery Modal
  const [showDraftRecoveryModal, setShowDraftRecoveryModal] = useState(false)
  
  // Track whether we're in a loading/initializing state
  const [isInitializing, setIsInitializing] = useState(true);
  
  // Function-related state
  const [functionData, setFunctionData] = useState<any>(null);
  const [selectedEvents, setSelectedEventsLocal] = useState<string[]>([]);
  const [resolvedFunctionId, setResolvedFunctionId] = useState<string | null>(providedFunctionId || null);
  
  // Effect to handle function loading and registration initialization
  useEffect(() => {
    // Development: Check for hot reload recovery first
    if (process.env.NODE_ENV === 'development') {
      const checkHotReloadRecovery = () => {
        try {
          const backupState = (window as any).__lodgetix_registration_dev_backup__;
          const currentState = localStorage.getItem('lodgetix-registration-storage');
          
          if (!currentState && backupState) {
            console.log('🔄 Dev: Detected potential hot reload data loss, attempting recovery...');
            localStorage.setItem('lodgetix-registration-storage', backupState);
            
            // Force store rehydration
            const store = useRegistrationStore.getState();
            // Trigger a re-render by updating a dummy state
            window.location.reload();
          }
        } catch (error) {
          console.warn('Failed hot reload recovery check:', error);
        }
      };
      
      checkHotReloadRecovery();
    }
    
    if (functionSlug) {
      const loadFunction = async () => {
        try {
          // Resolve function ID if not provided
          let functionId = providedFunctionId;
          if (!functionId) {
            functionId = await resolveFunctionSlug(functionSlug); // client-side
            setResolvedFunctionId(functionId);
          }
          
          // Import FunctionService dynamically
          const { FunctionService } = await import('@/lib/services/function-service');
          const functionService = new FunctionService();
          
          // Use getFunctionById instead of getFunctionBySlug
          const func = await functionService.getFunctionById(functionId);
          setFunctionData(func);
          
          const storeState = useRegistrationStore.getState();
          const hasCompletedRegistration = storeState.confirmationNumber !== null || storeState.status === 'completed';
          
          // Check if there's a completed registration (confirmationNumber exists or status is completed)
          // According to requirements: if status is paid/completed then always start a new registration
          if (hasCompletedRegistration) {
            console.log('Detected completed registration - clearing to start fresh');
            clearRegistration();
          }
          
          // Always go to registration type selection first
          console.log(`Setting up function: ${functionSlug} (ID: ${functionId})`);
          
          // Always set current step to 1 (Registration Type) on initial load
          setCurrentStep(1);
          
          setFunctionSlug(functionSlug);
          // Store the function ID in the registration store as well
          setFunctionId(functionId);
          
          // Set initializing to false to proceed to the registration type step
          setIsInitializing(false);
          // Never show modal on initial load - it's handled in registration type step
          setShowDraftRecoveryModal(false);
        } catch (error) {
          console.error('Failed to load function:', error);
          setIsInitializing(false);
        }
      };
      
      loadFunction();
    }
  }, [functionSlug, providedFunctionId, setFunctionSlug, setFunctionId, setCurrentStep, clearRegistration]);
  
  // Handler for continuing existing draft
  const handleContinueDraft = () => {
    console.log("Continuing with existing draft registration");
    setShowDraftRecoveryModal(false);
    setDraftRecoveryHandled(true);
    
    // Set the function slug and ID for the existing registration if needed
    if (functionSlug) {
      setFunctionSlug(functionSlug);
    }
    if (resolvedFunctionId) {
      setFunctionId(resolvedFunctionId);
    }
    
    // Always reset to step 1 (Registration Type) as per requirement
    setCurrentStep(1);
    
    // Initialization is complete after user makes their choice
    setIsInitializing(false);
  };
  
  // Handler for starting a new registration
  const handleStartNew = () => {
    console.log("Starting new registration, discarding previous draft");
    // Completely clear the existing registration
    clearRegistration();
    
    // Clear session state - user will need to re-verify on registration type page
    setAnonymousSessionEstablished(false);
    
    // Start fresh with the current function
    startNewRegistration('individual');
    if (functionSlug) {
      setFunctionSlug(functionSlug);
    }
    if (resolvedFunctionId) {
      setFunctionId(resolvedFunctionId);
    }
    
    // Reset to step 1 (Registration Type)
    setCurrentStep(1);
    
    setShowDraftRecoveryModal(false);
    setDraftRecoveryHandled(true);
    
    // Initialization is complete after user makes their choice
    setIsInitializing(false);
  };
  
  // Handler for canceling the modal
  const handleCancelRecovery = () => {
    // Just close the modal without changing anything
    console.log("Recovery modal canceled, maintaining current state");
    setShowDraftRecoveryModal(false);
    
    // Clear session state for fresh start
    setAnonymousSessionEstablished(false);
    
    // No existing draft, so start a new one anyway (just don't show another modal)
    startNewRegistration('individual');
    if (functionSlug) {
      setFunctionSlug(functionSlug);
    }
    setCurrentStep(1);
    setDraftRecoveryHandled(true);
    
    // Initialization is complete even if user cancels
    setIsInitializing(false);
  };

  // State for AttendeeDetailsStep props
  // Always default to false - user must explicitly agree to terms
  const [agreeToTerms, setAgreeToTerms] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  const handleAgreeToTermsChange = (checked: boolean) => {
    // Simple direct state update - no defaults, no special handling
    setAgreeToTerms(checked)
    
    // Don't save to store - agreeToTerms should always default to false
    
    // Clear errors related to terms if checked
    if (checked) {
      setValidationErrors(errors => errors.filter(e => e !== 'You must agree to the terms and conditions.'))
    }
  }
  
  // Updated validation logic
  const runValidations = React.useCallback(() => {
    let errors: string[] = [];
    if (currentStep === 2) { // Step 2 is now AttendeeDetails
      // For lodge registrations, we don't validate attendees since they use customer model
      if (registrationType === 'lodge') {
        // Lodge validation is handled by the LodgeRegistrationStore
        errors = []; // No attendee validation for lodge registrations
      } else {
        errors = validateAttendeeData(allAttendees);
      }
      // The agreeToTerms check is handled directly by the button's disabled state in AttendeeDetails.tsx
      // No need to add a specific error message for it here if the button handles it.
    }
    setValidationErrors(errors);
    return errors.length === 0;
  }, [currentStep, allAttendees, registrationType]); // Add allAttendees and registrationType to dependencies

  // Effect to ensure all attendees have default contact preferences set
  // Use a ref to track if sync has been done for this step entry
  const syncDoneRef = useRef(false);
  
  useEffect(() => {
    // Only run this on the attendee details step and if not already synced
    if (currentStep === 2 && allAttendees && allAttendees.length > 0 && !syncDoneRef.current) {
      // console.log("SYNC: Synchronizing default values for all attendees");
      const store = useRegistrationStore.getState();
      
      // Process each attendee to ensure they have proper defaults
      allAttendees.forEach(attendee => {
        const updates: Record<string, any> = {};
        let needsUpdate = false;
        
        // Check contact preference
        if (!attendee.contactPreference) {
          const defaultPreference = attendee.isPrimary ? 'Directly' : 'PrimaryAttendee';
          // console.log(`SYNC: Setting default contactPreference for ${attendee.attendeeId} to ${defaultPreference}`);
          updates.contactPreference = defaultPreference;
          needsUpdate = true;
        }
        
        // If the attendee needs updates, apply them
        if (needsUpdate && store.updateAttendee) {
          store.updateAttendee(attendee.attendeeId, updates);
        }
      });
      
      // Mark sync as done
      syncDoneRef.current = true;
    }
    
    // Reset sync flag when leaving the step
    if (currentStep !== 2) {
      syncDoneRef.current = false;
    }
  }, [currentStep, allAttendees]);

  // useEffect to run validations when attendees change or step changes to attendee details
  // Use debouncing to reduce validation frequency
  const validationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    if (currentStep === 2) {
      try {
        // Clear any existing timeout
        if (validationTimeoutRef.current) {
          clearTimeout(validationTimeoutRef.current);
        }
        
        // Debounce validation by 500ms to reduce frequency
        validationTimeoutRef.current = setTimeout(() => {
          const errors = validateAttendeeData(allAttendees); // Call it directly
          setValidationErrors(errors);
          
          // Only log in development and less frequently
          if (process.env.NODE_ENV === 'development' && errors.length > 0) {
            // console.log("VALIDATION DEBUG: Current attendee details validation errors:", errors);
            // console.log("VALIDATION DEBUG: agreeToTerms:", agreeToTerms);
            // console.log("VALIDATION DEBUG: Continue button would be disabled:", errors.length > 0 || !agreeToTerms);
            // console.log("VALIDATION DEBUG: Attendee data:", JSON.stringify(allAttendees, null, 2));
          }
        }, 500); // Increased from 100ms to 500ms
      } catch (error) {
        console.error("Error during validation effect:", error);
        // Don't block UI on error - just log it
        setValidationErrors([]);
      }
    } else {
      // Clear errors if not on the attendee details step, or if attendee details are not yet loaded
      // setValidationErrors([]); 
      // For now, let errors persist until the user moves back and then forward, or fixes them.
      // If an error from a previous step should clear when moving away, add logic here.
    }
    
    // Cleanup function
    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
    };
  }, [currentStep, allAttendees, agreeToTerms]);

  // Logic to handle step advancement, potentially with validation
  const handleNext = () => {
    // Add debug info
    console.log("handleNext called for step:", currentStep);
    
    // Step-specific validation
    if (currentStep === 2) { // Attendee Details step
      // Clear previous errors and re-run validation to ensure we have latest state
      setValidationErrors([]);
      
      try {
        // Force fresh validation against latest state
        const freshErrors = validateAttendeeData(allAttendees);
        console.log("Fresh validation errors:", freshErrors);
        
        setValidationErrors(freshErrors);
        
        // Only advance if validation passes and terms are agreed to
        if (freshErrors.length === 0 && agreeToTerms) {
          console.log("Validation passed, proceeding to next step");
          goToNextStep();
        } else {
          // You might want to scroll to errors or show a notification
          console.log("Cannot advance: validation errors or terms not agreed to");
          console.log("Validation errors:", freshErrors);
          console.log("agreeToTerms:", agreeToTerms);
          
          // Display errors near the top of the window
          const errorContainer = document.querySelector('.validation-errors');
          if (errorContainer && freshErrors.length > 0) {
            errorContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      } catch (error) {
        console.error("Error during validation:", error);
        // Fallback - show error but don't block progress
        goToNextStep();
      }
    } else {
      // For other steps, just advance
      goToNextStep();
    }
  }

  const handleBack = () => {
    goToPrevStep()
  }

  // Function to save registration data
  const saveRegistrationData = useCallback(async () => {
    try {
      console.log("📝 Saving registration data to server...")
      
      // Get the current state from the store
      const storeState = useRegistrationStore.getState()
      
      // Get the current user session (anonymous or authenticated)
      const { getBrowserClient } = await import('@/lib/supabase-singleton')
      const supabase = getBrowserClient()
      
      // First check the session
      const { data: { session } } = await supabase.auth.getSession()
      console.log("📱 Current session:", session ? `Found session for user ${session.user.id}` : "No session")
      
      // Then get the user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      console.log("👤 Current user:", user ? `Found user ${user.id}` : "No user", userError ? `Error: ${userError.message}` : "")
      
      if (!user) {
        console.error("❌ No authenticated user found")
        throw new Error('User authentication required. Please refresh the page and try again.')
      }
      
      console.log("✅ Found authenticated user:", user.id, user.is_anonymous ? '(anonymous)' : '(signed in)')
      
      const registrationData = {
        registrationType: storeState.registrationType,
        functionId: functionData?.id || resolvedFunctionId || providedFunctionId,
        functionSlug: storeState.functionSlug,
        selectedEvents: storeState.selectedEvents || selectedEvents,
        primaryAttendee: storeState.attendees.find(att => att.isPrimary),
        additionalAttendees: storeState.attendees.filter(att => !att.isPrimary),
        tickets: storeState.attendees.flatMap(attendee => {
          const attendeePackage = storeState.packages[attendee.attendeeId];
          if (!attendeePackage) return []
          const { ticketDefinitionId, selectedEvents } = attendeePackage
          
          if (ticketDefinitionId) {
            return [{
              id: `${attendee.attendeeId}-${ticketDefinitionId}`,
              attendeeId: attendee.attendeeId,
              ticketDefinitionId,
              isPackage: true,
              price: 0 // Will be calculated server-side
            }]
          } else if (selectedEvents) {
            return selectedEvents.map((eventId: string) => ({
              id: `${attendee.attendeeId}-${eventId}`,
              attendeeId: attendee.attendeeId,
              eventTicketId: eventId,
              isPackage: false,
              price: 0 // Will be calculated server-side
            }))
          }
          return []
        }),
        totalAmount: 0, // Will be calculated server-side
        billingDetails: storeState.billingDetails,
        customerId: user.id // Include the authenticated user ID
      }
      
      console.log("📤 Sending registration data with customerId:", registrationData.customerId)
      console.log("🍪 Document cookies:", document.cookie)
      
      // Use the session we already have from above
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      }
      
      // Include auth token if available
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }
      
      const response = await fetch('/api/registrations', {
        method: 'POST',
        headers,
        body: JSON.stringify(registrationData),
        credentials: 'include' // Ensure cookies are sent
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        console.error("❌ Registration save failed:", result)
        throw new Error(result.error || 'Failed to save registration')
      }
      
      console.log("✅ Registration saved successfully:", result)
      return result
      
    } catch (error: any) {
      console.error("❌ Error saving registration:", error)
      throw error
    }
  }, [functionData, selectedEvents])

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
          description: "Please select how you would like to register for this function"
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
    // Remove console.log to reduce noise - console.log('🎯 renderStepContent called, currentStep:', currentStep);
    
    // Special handling for lodge registration
    if (registrationType === 'lodge' && currentStep === 2) {
      const LodgeRegistrationStep = lazy(() => import('./Steps/LodgeRegistrationStep').then(module => ({
        default: module.LodgeRegistrationStep
      })));
      
      return (
        <Suspense fallback={<StepLoadingFallback />}>
          <LodgeRegistrationStep 
            functionId={functionData?.id || resolvedFunctionId || providedFunctionId}
            functionSlug={functionSlug}
            selectedEvents={selectedEvents}
            onPrevStep={goToPrevStep}
          />
        </Suspense>
      );
    }
    
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
        // Remove console.log to reduce noise - console.log('🎯 Rendering payment step (case 6)');
        return (
          <Suspense fallback={<StepLoadingFallback />}>
            <PaymentStep onSaveData={saveRegistrationData} />
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
    // Remove duplicate Terms & Conditions from the navigation buttons row
    // The T&C is already included in the AttendeeDetails step content
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

  // Log the entire store state whenever it changes - commented out for production performance
  // useEffect(() => {
  //   const unsubscribe = useRegistrationStore.subscribe(
  //     (newState, prevState) => {
  //       console.log("Zustand Store Updated:", newState)
  //       // You can also log prevState if you need to compare
  //       // console.log("Previous State:", prevState)
  //     }
  //   )
  //   // Cleanup subscription on component unmount
  //   return () => {
  //     unsubscribe()
  //   }
  // }, []) // Empty dependency array ensures this runs once on mount and cleans up on unmount

  // Only show the attendee summary for steps 2-6, not for step 1 (Registration Type)
  const showAttendeeSummary = currentStep > 1

  // Since we don't show the draft recovery modal here anymore,
  // we don't need to display a special loading state
  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse">Loading registration...</div>
      </div>
    );
  }

  return (
    <SessionGuard>
      {/* Draft Recovery Modal - handled by registration type step */}
      <DraftRecoveryModal 
        isOpen={false}
        onClose={handleCancelRecovery}
        onContinue={handleContinueDraft}
        onStartNew={handleStartNew}
        registrationType={registrationType}
        lastSaved={lastSaved?.toString()}
        attendeeCount={allAttendees.length}
      />

      <WizardBodyStructureLayout
        currentStep={currentStep}
        sectionTitle={title}
        sectionDescription={description}
        showStepIndicator={currentStep === 1 || currentStep === 4 || currentStep === 6} // Hide for steps using TwoColumnStepLayout
      >
        {/* Use a consistent wrapper for all steps */}
        <div className="w-full">
          {renderStepContent()}
        </div>
      </WizardBodyStructureLayout>
    </SessionGuard>
  )
}
