"use client"

import React, { useState, useCallback, useEffect } from 'react';
import { useRegistrationStore } from '@/lib/registrationStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Users, Building, Award, Check, User, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OneColumnStepLayout } from '../Layouts/OneColumnStepLayout';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { getBrowserClient } from '@/lib/supabase-singleton';

interface RegistrationType {
  id: 'individual' | 'lodge' | 'delegation';
  title: string;
  description: string;
  icon: React.ElementType;
  minAttendees: number;
  defaultAttendeeType: 'Mason' | 'Guest';
  features: string[];
}

const REGISTRATION_TYPES: RegistrationType[] = [
  {
    id: 'individual',
    title: 'Myself & Others',
    description: 'Register yourself and optional additional attendees',
    icon: User,
    minAttendees: 1,
    defaultAttendeeType: 'Mason',
    features: [
      'Register yourself as the primary attendee',
      'Add additional Masons, guests, or partners',
      'Manage all tickets in a single transaction',
      'Flexible attendee types (Mason or Guest)',
    ],
  },
  {
    id: 'lodge',
    title: 'Lodge Registration',
    description: 'Register on behalf of your Lodge, including multiple members and guests',
    icon: Building,
    minAttendees: 3,
    defaultAttendeeType: 'Mason',
    features: [
      'Register on behalf of your Lodge',
      'Add multiple Lodge members and their guests',
      'Coordinate seating arrangements for your Lodge',
      'Partners can be added for each member',
    ],
  },
  {
    id: 'delegation',
    title: 'Official Delegation',
    description: 'Register as part of an official Grand Lodge or Provincial delegation',
    icon: Shield,
    minAttendees: 1,
    defaultAttendeeType: 'Mason',
    features: [
      'Register as part of an official delegation',
      'Coordinate with other delegation members',
      'Access special delegation seating arrangements',
      'Formal delegation requirements',
    ],
  },
];

export function RegistrationTypeStep() {
  const { 
    registrationType: storeRegistrationType,
    setRegistrationType: storeSetRegistrationType,
    clearRegistration: storeClearRegistration,
    clearAllAttendees,
    addAttendee,
    updateAttendee,
    setDraftRecoveryHandled,
    anonymousSessionEstablished,
    setAnonymousSessionEstablished,
  } = useRegistrationStore();

  // Ensure we properly initialize the selected type from the store
  // This is important for recognizing existing drafts, especially for 'individual' type
  const [selectedType, setSelectedType] = useState<RegistrationType['id'] | null>(storeRegistrationType);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [pendingRegistrationType, setPendingRegistrationType] = useState<RegistrationType['id'] | null>(null);
  
  // Turnstile and anonymous session state
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [isVerifyingTurnstileAndAuth, setIsVerifyingTurnstileAndAuth] = useState(false);
  const [turnstileAuthError, setTurnstileAuthError] = useState<string | null>(null);
  const [showTurnstile, setShowTurnstile] = useState(true); // Always show initially

  // Check for existing draft on mount
  const draftTypeInStore = useRegistrationStore.getState().registrationType;
  const draftStepInStore = useRegistrationStore.getState().currentStep;
  const storedAttendees = useRegistrationStore.getState().attendees;
  
  // Debug - log the current state of the registration store
  useEffect(() => {
    // Test localStorage functionality
    try {
      const testKey = 'lodgetix-test';
      const testValue = 'test-data';
      localStorage.setItem(testKey, testValue);
      const retrievedValue = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      
      if (retrievedValue !== testValue) {
        console.error('⚠️ localStorage is not functioning properly!');
      } else {
        console.log('✅ localStorage is working correctly');
      }
    } catch (error) {
      console.error('❌ localStorage access failed:', error);
    }
    
    // Check registration storage directly
    try {
      const localStorageData = localStorage.getItem('lodgetix-registration-storage');
      const parsedData = localStorageData ? JSON.parse(localStorageData) : null;
      console.log('📦 Registration storage from localStorage:', parsedData);
      
      if (parsedData && parsedData.state) {
        console.log('📦 Anonymous session in storage:', parsedData.state.anonymousSessionEstablished);
      }
    } catch (error) {
      console.error('❌ Failed to read registration storage:', error);
    }
    
    console.log('🏪 Current registration store state:', {
      registrationType: draftTypeInStore,
      currentStep: draftStepInStore,
      attendeesCount: storedAttendees.length,
      attendees: storedAttendees,
      draftId: useRegistrationStore.getState().draftId,
      draftRecoveryHandled: useRegistrationStore.getState().draftRecoveryHandled
    });
  }, [draftTypeInStore, draftStepInStore, storedAttendees]);

  // Check for existing anonymous session on mount
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        const { data: { session }, error } = await getBrowserClient().auth.getSession();
        if (error) {
          console.error("Error checking existing session:", error);
        } else if (session && session.user.is_anonymous) {
          console.log("✅ Existing anonymous session found, hiding Turnstile");
          setAnonymousSessionEstablished(true);
          setShowTurnstile(false);
        } else {
          console.log("⚠️ No anonymous session found, Turnstile required");
          setAnonymousSessionEstablished(false);
          setShowTurnstile(true);
        }
      } catch (error) {
        console.error("Error checking session:", error);
        setShowTurnstile(true); // Show Turnstile on error
      }
    };
    
    checkExistingSession();
  }, [setAnonymousSessionEstablished]);

  // Get site key from environment, with localhost override
  const getSiteKey = () => {
    const isLocalhost = typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    
    if (isLocalhost) {
      // Use demo key for localhost that's guaranteed to work
      return '1x00000000000000000000AA';
    }
    
    return process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY;
  };

  // Set up global callback for managed widget
  useEffect(() => {
    const siteKey = getSiteKey();
    console.log("🔐 Setting up Turnstile managed widget callback");
    console.log("🔐 Anonymous session established:", anonymousSessionEstablished);
    console.log("🔐 Environment:", typeof window !== 'undefined' ? window.location.hostname : 'server');
    console.log("🔐 Site key:", siteKey);
    
    // Check if Cloudflare Turnstile script is loaded
    console.log("🔐 Turnstile object exists:", !!(window as any).turnstile);
    console.log("🔐 DOM container exists:", !!document.querySelector('.cf-turnstile'));
    
    // Set up global callback for the managed widget
    (window as any).onTurnstileCallback = (token: string) => {
      console.log("🔐 Managed widget callback triggered with token:", token);
      handleTurnstileToken(token);
    };

    // Add error callback for debugging
    (window as any).onTurnstileError = (errorCode: string) => {
      console.error("🔐 Managed widget error callback:", errorCode);
      setTurnstileAuthError(`Security verification failed: ${errorCode}`);
    };

    // Check if managed widget rendered after a delay
    if (!anonymousSessionEstablished && (window as any).turnstile) {
      const timeoutId = setTimeout(() => {
        const container = document.querySelector('.cf-turnstile');
        if (container) {
          const hasContent = container.innerHTML.trim();
          const hasHiddenInput = container.querySelector('input[type="hidden"]');
          
          console.log("🔐 Widget check - hasContent:", !!hasContent, "hasHiddenInput:", !!hasHiddenInput);
          
          // Only render if container is truly empty (no hidden inputs from managed widget)
          if (!hasContent || !hasHiddenInput) {
            console.log("🔐 Managed widget appears empty, trying explicit render as fallback");
            
            // Clear container first to avoid conflicts
            container.innerHTML = '';
            
            try {
              const widgetId = (window as any).turnstile.render(container, {
                sitekey: siteKey,
                callback: (token: string) => {
                  console.log("🔐 Explicit render callback triggered");
                  handleTurnstileToken(token);
                },
                'error-callback': (errorCode: string) => {
                  console.error("🔐 Explicit render error:", errorCode);
                  setTurnstileAuthError(`Security verification failed: ${errorCode}`);
                }
              });
              console.log("🔐 Explicit render attempted, widget ID:", widgetId);
            } catch (error) {
              console.error("🔐 Explicit render failed:", error);
            }
          } else {
            console.log("🔐 Managed widget has rendered successfully");
          }
        }
      }, 2000); // Longer delay to let managed widget fully load
      
      return () => clearTimeout(timeoutId);
    }

    return () => {
      // Cleanup
      delete (window as any).onTurnstileCallback;
      delete (window as any).onTurnstileError;
    };
  }, [anonymousSessionEstablished]);


  const handleTurnstileToken = async (token: string) => {
    setTurnstileToken(token);
    setIsVerifyingTurnstileAndAuth(true);
    setTurnstileAuthError(null);

    try {
      console.log("🔐 Verifying Turnstile token...");
      const response = await fetch('/api/verify-turnstile-and-anon-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      // Check if response is ok before parsing
      if (!response.ok) {
        console.error(`❌ API response error: ${response.status} ${response.statusText}`);
        setTurnstileAuthError(`Server error: ${response.status}. Please try again.`);
        return;
      }

      const result = await response.json();

      // Check if result exists before accessing properties
      if (!result) {
        console.error('❌ Empty response from verification API');
        setTurnstileAuthError('Invalid server response. Please try again.');
        return;
      }

      if (result.success && result.turnstileVerified) {
        console.log('✅ Turnstile verified successfully');
        
        // Now create anonymous session client-side
        console.log('🔐 Creating anonymous session...');
        const { data: authData, error: authError } = await getBrowserClient().auth.signInAnonymously();
        
        if (authError) {
          console.error('❌ Failed to create anonymous session:', authError);
          setTurnstileAuthError(`Failed to create session: ${authError.message}`);
          return;
        }
        
        if (authData.user && authData.session) {
          console.log('✅ Anonymous session created:', authData.user.id);
          setAnonymousSessionEstablished(true);
          setTurnstileAuthError(null);
          
          console.log('🔍 Session details:', {
            userId: authData.user.id,
            isAnonymous: authData.user.is_anonymous,
            expiresAt: authData.session.expires_at
          });
          
          // Test localStorage immediately after session creation
          setTimeout(() => {
            const storageData = localStorage.getItem('lodgetix-registration-storage');
            const parsed = storageData ? JSON.parse(storageData) : null;
            console.log('🔬 Storage check 2 seconds after session:', parsed?.state?.anonymousSessionEstablished);
          }, 2000);
        } else {
          console.error('❌ Anonymous session created but missing user/session data');
          setTurnstileAuthError('Failed to establish session. Please try again.');
        }
      } else {
        console.error('❌ Turnstile verification failed:', result.error, result.errorCodes);
        setTurnstileAuthError(result.error || 'Security verification failed. Please try again.');
        setTurnstileToken(null);
      }
    } catch (error: any) {
      console.error('❌ Error during Turnstile verification:', error);
      setTurnstileAuthError('An unexpected error occurred during verification. Please try again.');
      setTurnstileToken(null);
    } finally {
      setIsVerifyingTurnstileAndAuth(false);
    }
  };

  const initializeAttendees = useCallback((typeId: RegistrationType['id']) => {
    // Clear existing attendees when changing type
    clearAllAttendees();
    
    // Initialize attendees based on type
    const type = REGISTRATION_TYPES.find(t => t.id === typeId);
    if (!type) return;

    // For lodge registration, create initial required members
    if (typeId === 'lodge') {
      for (let i = 0; i < type.minAttendees; i++) {
        const attendeeId = addAttendee('Mason');
        updateAttendee(attendeeId, {
          isPrimary: i === 0,
        });
      }
    } 
    // For other types, create one primary attendee
    else {
      const attendeeId = addAttendee(type.defaultAttendeeType);
      updateAttendee(attendeeId, {
        isPrimary: true,
      });
    }
  }, [clearAllAttendees, addAttendee, updateAttendee]);

  const handleSelectType = useCallback((type: RegistrationType['id']) => {
    const currentState = useRegistrationStore.getState();
    const currentDraftType = currentState.registrationType;
    const hasExistingAttendees = currentState.attendees && currentState.attendees.length > 0;
    const currentStep = currentState.currentStep;
    const confirmationNumber = currentState.confirmationNumber;
    const draftRecoveryHandled = currentState.draftRecoveryHandled;
    
    // Check if any of the attendees have data filled in
    const hasFilledData = currentState.attendees.some(attendee => 
      (attendee.firstName && attendee.firstName.trim()) || 
      (attendee.lastName && attendee.lastName.trim()) || 
      (attendee.primaryEmail && attendee.primaryEmail.trim()) || 
      (attendee.lodgeNameNumber && attendee.lodgeNameNumber.trim()));
    
    // Simplified draft detection:
    // Show modal if there's an incomplete registration (draft) that hasn't been handled yet
    const hasIncompleteDraft = currentDraftType !== null && 
                               confirmationNumber === null && 
                               !draftRecoveryHandled &&
                               (hasExistingAttendees || currentStep > 1 || hasFilledData);
    
    console.log("Registration type selection check:", { 
      currentDraftType, 
      newType: type, 
      hasExistingAttendees, 
      hasFilledData,
      currentStep,
      confirmationNumber,
      draftRecoveryHandled,
      hasIncompleteDraft,
      attendees: currentState.attendees.length
    });
    
    if (hasIncompleteDraft) {
      console.log("Showing draft modal - incomplete registration detected");
      setPendingRegistrationType(type);
      setShowDraftModal(true);
    } else {
      console.log("No incomplete draft - proceeding with selection");
      setSelectedType(type);
      storeSetRegistrationType(type);
      
      // Initialize attendees for the new type
      console.log("Initializing new attendees for type:", type);
      initializeAttendees(type);
      
      // Explicitly move to the next step when a registration type is selected
      const goToNextStep = useRegistrationStore.getState().goToNextStep;
      goToNextStep();
    }
  }, [storeSetRegistrationType, initializeAttendees]);

  const handleContinueDraft = () => {
    setShowDraftModal(false);
    setDraftRecoveryHandled(true);
    
    // When continuing with a draft, always go to step 2 (attendee details)
    const currentState = useRegistrationStore.getState();
    const registrationType = currentState.registrationType;
    const hasAttendees = currentState.attendees && currentState.attendees.length > 0;
    
    console.log("Continuing with existing draft - detailed info:", {
      registrationType,
      attendeesCount: currentState.attendees.length,
      attendees: currentState.attendees
    });
    
    // Make sure the registration type is properly set in the UI state
    setSelectedType(registrationType);
    
    // Extra verification step - check if we need to reinitialize attendees
    if (!hasAttendees && registrationType) {
      console.log("No attendees found for draft, reinitializing");
      initializeAttendees(registrationType);
    }
    
    // Resume at the saved step or move to step 2 (attendee details) when continuing a draft
    const setCurrentStep = useRegistrationStore.getState().setCurrentStep;
    const savedStep = currentState.currentStep;
    const targetStep = savedStep > 1 ? savedStep : 2;
    setCurrentStep(targetStep);
    console.log(`Moving to step ${targetStep} for existing draft (was at step ${savedStep})`);
    
    // Ensure the store has the current state before proceeding
    // This helps fix race conditions with localStorage rehydration
    useRegistrationStore.persist.rehydrate();
    
    setPendingRegistrationType(null);
  };

  const handleStartNew = () => {
    setShowDraftModal(false);
    setDraftRecoveryHandled(true);
    console.log("Starting new registration - clearing existing data");
    storeClearRegistration();
    
    if (pendingRegistrationType) {
      console.log("Setting new registration type:", pendingRegistrationType);
      setSelectedType(pendingRegistrationType);
      storeSetRegistrationType(pendingRegistrationType);
      initializeAttendees(pendingRegistrationType);
      
      // Explicitly go to step 2 (attendee details)
      const setCurrentStep = useRegistrationStore.getState().setCurrentStep;
      setCurrentStep(2);
    }
    setPendingRegistrationType(null);
  };

  return (
    <OneColumnStepLayout>
      <RadioGroup
        value={storeRegistrationType || selectedType || ''}
        onValueChange={handleSelectType}
      >
        <div className="grid gap-6 md:grid-cols-3 items-stretch">
          {REGISTRATION_TYPES.map((type) => {
            const Icon = type.icon;
            // Enhanced selection check - verify against both local state and store state
            const storeType = useRegistrationStore.getState().registrationType;
            const isSelected = (storeType === type.id) || (selectedType === type.id);

            return (
              <label
                key={type.id}
                htmlFor={type.id}
                className="cursor-pointer"
              >
                <Card className={cn(
                  "flex flex-col h-full border-2 transition-all",
                  isSelected
                    ? "border-masonic-gold bg-masonic-lightblue"
                    : "border-gray-200 hover:border-masonic-lightgold"
                )}>
                  {/* Mobile Horizontal Layout - Only visible on mobile */}
                  <div className="md:hidden flex p-4">
                    <div className="mr-4 flex-shrink-0">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-masonic-navy text-white">
                        <Icon className="h-6 w-6" />
                      </div>
                    </div>
                    <div className="flex flex-col flex-1">
                      <CardTitle className="text-lg mb-1">{type.title}</CardTitle>
                      <CardDescription className="text-sm mb-2">{type.description}</CardDescription>
                      <Button
                        type="button"
                        onClick={() => handleSelectType(type.id)}
                        className="mt-auto self-start bg-masonic-navy hover:bg-masonic-blue"
                      >
                        Select
                      </Button>
                    </div>
                  </div>
                  
                  {/* Desktop Vertical Layout - Only visible on desktop */}
                  <CardHeader className="text-center hidden md:block">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-masonic-navy text-white">
                      <Icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="mt-2">{type.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="hidden md:block">
                    <CardDescription className="text-center mb-4">
                      {type.description}
                    </CardDescription>
                    <ul className="space-y-2 text-sm">
                      {type.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <Check className="h-4 w-4 mr-2 text-masonic-navy mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter className="pt-2 mt-auto hidden md:block">
                    <Button
                      type="button"
                      onClick={() => handleSelectType(type.id)}
                      className="w-full bg-masonic-navy hover:bg-masonic-blue"
                    >
                      Select
                    </Button>
                  </CardFooter>
                </Card>
              </label>
            );
          })}
        </div>
        
        {/* Turnstile Widget - Matches card layout */}
        {!anonymousSessionEstablished && (
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            <div className="md:col-start-2">
              <div>
                <div
                  className="cf-turnstile"
                  data-sitekey={getSiteKey()}
                  data-size="flexible"
                  data-callback="onTurnstileCallback"
                  data-error-callback="onTurnstileError"
                ></div>
              </div>
            </div>
          </div>
        )}
      </RadioGroup>

      
      {isVerifyingTurnstileAndAuth && (
        <div className="mt-4 text-center">
          <p className="text-sm">Verifying...</p>
        </div>
      )}
      
      {turnstileAuthError && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
          <p className="text-red-800 text-sm">{turnstileAuthError}</p>
        </div>
      )}
      

      {showDraftModal && (
        <AlertDialog open={showDraftModal} onOpenChange={setShowDraftModal}>
          <AlertDialogContent className="w-[90%] max-w-md sm:w-full rounded-lg">
            <AlertDialogHeader className="space-y-3">
              <AlertDialogTitle className="text-xl text-center">Draft Registration Found</AlertDialogTitle>
              <AlertDialogDescription className="text-center text-base">
                You have a registration in progress. Would you like to continue with your current draft or start a new registration?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-3 pt-4">
              <AlertDialogCancel 
                onClick={() => setPendingRegistrationType(null)}
                className="w-full text-base font-normal"
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleStartNew}
                className="w-full bg-red-600 hover:bg-red-700 text-white p-3 text-base font-medium"
              >
                Start New
              </AlertDialogAction>
              <AlertDialogAction
                onClick={handleContinueDraft}
                className="w-full bg-masonic-navy hover:bg-masonic-blue text-white p-3 text-base font-medium"
              >
                Continue Draft
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </OneColumnStepLayout>
  );
}