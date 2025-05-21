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
  } = useRegistrationStore();

  // Ensure we properly initialize the selected type from the store
  // This is important for recognizing existing drafts, especially for 'individual' type
  const [selectedType, setSelectedType] = useState<RegistrationType['id'] | null>(storeRegistrationType);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [pendingRegistrationType, setPendingRegistrationType] = useState<RegistrationType['id'] | null>(null);

  // Check for existing draft on mount
  const draftTypeInStore = useRegistrationStore.getState().registrationType;
  const draftStepInStore = useRegistrationStore.getState().currentStep;
  const storedAttendees = useRegistrationStore.getState().attendees;
  
  // Debug - log the current state of the registration store
  useEffect(() => {
    // Check localStorage directly to see if data is being saved
    const localStorageData = localStorage.getItem('lodgetix-registration-storage');
    console.log('Registration storage from localStorage:', localStorageData ? JSON.parse(localStorageData) : 'No data');
    
    console.log('Current registration store state:', {
      registrationType: draftTypeInStore,
      currentStep: draftStepInStore,
      attendeesCount: storedAttendees.length,
      attendees: storedAttendees
    });
  }, [draftTypeInStore, draftStepInStore, storedAttendees]);

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
    
    // Check if any of the attendees have data filled in
    const hasFilledData = currentState.attendees.some(attendee => 
      attendee.firstName || attendee.lastName || attendee.primaryEmail || attendee.lodgeNameNumber);
    
    // New enhanced condition for determining if there's meaningful data
    const hasExistingData = hasExistingAttendees && (currentState.currentStep > 1 || hasFilledData);
    
    // Show draft modal if:
    // 1. There's an existing registration with a different type, OR
    // 2. There's an existing registration with the same type but with attendee data already filled
    const isDifferentType = currentDraftType !== null && currentDraftType !== type;
    const isSameTypeWithData = currentDraftType !== null && currentDraftType === type && hasExistingData;
    
    console.log("Registration type check (enhanced):", { 
      currentDraftType, 
      newType: type, 
      hasExistingAttendees, 
      hasFilledData,
      hasExistingData,
      isDifferentType,
      isSameTypeWithData,
      attendees: currentState.attendees.length
    });
    
    // Also check localStorage directly to debug persistence issues
    try {
      const storageData = localStorage.getItem('lodgetix-registration-storage');
      console.log('localStorage registration data available:', !!storageData);
    } catch (e) {
      console.error('Error checking localStorage:', e);
    }
    
    if (isDifferentType || isSameTypeWithData) {
      console.log("Showing draft modal - existing data detected");
      setPendingRegistrationType(type);
      setShowDraftModal(true);
    } else {
      console.log("No existing data or same type - proceeding with selection");
      setSelectedType(type);
      storeSetRegistrationType(type);
      
      // Check if attendees exist for this type already before initializing
      const existingMatchingTypeAttendees = 
        currentDraftType === type && hasExistingAttendees;
        
      if (!existingMatchingTypeAttendees) {
        console.log("Initializing new attendees for type:", type);
        initializeAttendees(type);
      } else {
        console.log("Keeping existing attendees for type:", type);
      }
      
      // Explicitly move to the next step when a registration type is selected
      const goToNextStep = useRegistrationStore.getState().goToNextStep;
      goToNextStep();
    }
  }, [storeSetRegistrationType, initializeAttendees]);

  const handleContinueDraft = () => {
    setShowDraftModal(false);
    
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
    
    // Always move to step 2 (attendee details) when continuing a draft
    const setCurrentStep = useRegistrationStore.getState().setCurrentStep;
    setCurrentStep(2);
    console.log("Moving to attendee details for existing draft");
    
    // Ensure the store has the current state before proceeding
    // This helps fix race conditions with localStorage rehydration
    useRegistrationStore.persist.rehydrate();
    
    setPendingRegistrationType(null);
  };

  const handleStartNew = () => {
    setShowDraftModal(false);
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