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
import { createClient } from '@/utils/supabase/client';

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
  
  // Session state is now handled by SessionGuard wrapper

  // Check for existing draft on mount
  const draftTypeInStore = useRegistrationStore.getState().registrationType;
  const draftStepInStore = useRegistrationStore.getState().currentStep;
  const storedAttendees = useRegistrationStore.getState().attendees;
  
  // Check if we should show draft recovery modal on mount
  useEffect(() => {
    const storeState = useRegistrationStore.getState();
    const hasCompletedRegistration = storeState.status === 'completed' || storeState.confirmationNumber !== null;
    const hasIncompleteRegistration = storeState.registrationType !== null && 
                                     storeState.confirmationNumber === null &&
                                     storeState.status !== 'completed';
    const hasFilledData = storeState.attendees.some(att => 
      att.firstName || att.lastName || att.primaryEmail
    );
    
    console.log('Registration type step mount check:', {
      hasCompletedRegistration,
      hasIncompleteRegistration,
      hasFilledData,
      registrationType: storeState.registrationType,
      status: storeState.status,
      confirmationNumber: storeState.confirmationNumber
    });
    
    // If there's a completed registration, it should have been cleared by the wizard
    // Just ensure we start fresh
    if (hasCompletedRegistration) {
      console.log('Completed registration detected in type step - should have been cleared by wizard');
      setSelectedType(null);
      return;
    }
    
    // Show draft recovery modal if we have an incomplete registration with data
    if (hasIncompleteRegistration && hasFilledData && !draftRecoveryHandled) {
      console.log('Showing draft recovery modal on mount - detected incomplete registration');
      setShowDraftModal(true);
      // Don't set selected type yet - let user choose
    }
  }, [draftRecoveryHandled]);
  
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

  // Session check removed - handled by SessionGuard wrapper

  // Turnstile removed - handled by SessionGuard

  // Turnstile effect removed - handled by SessionGuard


  // Turnstile handler removed - handled by SessionGuard

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
    
    // Check if we're already on the selected type with existing data
    const isSelectingCurrentType = currentDraftType === type;
    
    // Simplified draft detection:
    // Show modal if there's an incomplete registration (draft)
    // But don't show it if the user is selecting the same type they already have
    // And don't show it for completed registrations
    const hasIncompleteDraft = currentDraftType !== null && 
                               confirmationNumber === null && 
                               currentState.status !== 'completed' &&
                               (hasExistingAttendees || currentStep > 1 || hasFilledData) &&
                               !isSelectingCurrentType; // Don't show modal if selecting the same type
    
    console.log("Registration type selection check:", { 
      currentDraftType, 
      newType: type, 
      hasExistingAttendees, 
      hasFilledData,
      currentStep,
      confirmationNumber,
      draftRecoveryHandled,
      hasIncompleteDraft,
      isSelectingCurrentType,
      attendees: currentState.attendees.length
    });
    
    if (hasIncompleteDraft) {
      console.log("Showing draft modal - incomplete registration detected");
      setPendingRegistrationType(type);
      setShowDraftModal(true);
    } else if (isSelectingCurrentType && hasExistingAttendees) {
      // If selecting the same type and we have attendees, just proceed without reinitializing
      console.log("Selecting current type with existing data - proceeding without reinitializing");
      setSelectedType(type);
      
      // Mark draft recovery as handled since user is continuing with existing data
      setDraftRecoveryHandled(true);
      
      // Move to the next step
      const goToNextStep = useRegistrationStore.getState().goToNextStep;
      goToNextStep();
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
  }, [storeSetRegistrationType, initializeAttendees, setDraftRecoveryHandled]);

  const handleContinueDraft = () => {
    setShowDraftModal(false);
    setDraftRecoveryHandled(true);
    
    // When continuing with a draft, go to step 2 (attendee details)
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
    
    // Always go to step 2 (attendee details) when continuing a draft
    const goToNextStep = useRegistrationStore.getState().goToNextStep;
    goToNextStep();
    console.log(`Moving to attendee details for existing draft`);
    
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
        
        {/* Turnstile Widget removed - session is now handled by SessionGuard */}
      </RadioGroup>


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