"use client"

import React, { useState, useCallback, useEffect } from 'react';
import { useRegistrationStore } from '@/lib/registrationStore';
import type { RegistrationType as StoreRegistrationType } from '@/lib/registrationStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Users, Building, Award, Check, User, Shield } from 'lucide-react';
import { SectionHeader } from '../Shared/SectionHeader';
import { cn } from '@/lib/utils';
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
    title: 'Individual Registration',
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
    setCurrentStep: storeSetCurrentStep,
    clearAllAttendees,
    addAttendee,
    updateAttendee,
  } = useRegistrationStore();

  // Map 'myself-others' to 'individual' for backwards compatibility
  const initialType = storeRegistrationType === 'individual' ? 'individual' : storeRegistrationType;
  const [selectedType, setSelectedType] = useState<RegistrationType['id'] | null>(initialType);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [pendingRegistrationType, setPendingRegistrationType] = useState<RegistrationType['id'] | null>(null);

  // Check for existing draft on mount
  const draftTypeInStore = useRegistrationStore.getState().registrationType;
  const draftStepInStore = useRegistrationStore.getState().currentStep;

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
    const currentDraftType = useRegistrationStore.getState().registrationType;
    
    if (currentDraftType !== null && currentDraftType !== type) {
      setPendingRegistrationType(type);
      setShowDraftModal(true);
    } else {
      setSelectedType(type);
      storeSetRegistrationType(type);
      initializeAttendees(type);
      storeSetCurrentStep(2);
    }
  }, [storeSetRegistrationType, storeSetCurrentStep, initializeAttendees]);

  const handleContinueDraft = () => {
    setShowDraftModal(false);
    storeSetCurrentStep(draftStepInStore > 1 ? draftStepInStore : 2);
    setPendingRegistrationType(null);
  };

  const handleStartNew = () => {
    setShowDraftModal(false);
    storeClearRegistration();
    if (pendingRegistrationType) {
      setSelectedType(pendingRegistrationType);
      storeSetRegistrationType(pendingRegistrationType);
      initializeAttendees(pendingRegistrationType);
      storeSetCurrentStep(2);
    }
    setPendingRegistrationType(null);
  };

  return (
    <div className="space-y-6">
      <SectionHeader>
        <h1 className="text-2xl font-bold text-masonic-navy whitespace-nowrap">Select Registration Type</h1>
        <div className="masonic-divider"></div>
        <p className="text-gray-600 hidden md:block">Please select how you would like to register for this event</p>
      </SectionHeader>

      <RadioGroup
        value={selectedType || ''}
        onValueChange={handleSelectType}
      >
        <div className="grid gap-6 md:grid-cols-3 items-stretch">
          {REGISTRATION_TYPES.map((type) => {
            const Icon = type.icon;
            const isSelected = selectedType === type.id;

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
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Draft Registration Found</AlertDialogTitle>
              <AlertDialogDescription>
                You have a registration in progress. Would you like to continue with your current draft or start a new registration?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setPendingRegistrationType(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleContinueDraft} className="bg-masonic-navy hover:bg-masonic-blue">
                Continue Draft
              </AlertDialogAction>
              <AlertDialogAction
                onClick={handleStartNew}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Start New
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}