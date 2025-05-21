# Task: Refactor Registration Type Step

## Description
Refactor the `RegistrationTypeStep` component to work with the new layout system. This component will be simplified to focus on content only, with layout, navigation, and section headers handled by parent components.

## Steps
1. Update imports and remove unused ones
2. Remove SectionHeader usage
3. Move navigation logic to parent
4. Use OneColumnStepLayout for consistent styling
5. Simplify internal structure to focus on content

## Implementation

```tsx
// Modified components/register/RegistrationWizard/Steps/registration-type-step.tsx
"use client"

import React, { useState, useCallback } from 'react';
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

// RegistrationType interface remains the same
interface RegistrationType {
  id: 'individual' | 'lodge' | 'delegation';
  title: string;
  description: string;
  icon: React.ElementType;
  minAttendees: number;
  defaultAttendeeType: 'Mason' | 'Guest';
  features: string[];
}

// REGISTRATION_TYPES array remains the same
const REGISTRATION_TYPES: RegistrationType[] = [
  // ... existing types remain unchanged
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

  // Map 'myself-others' to 'individual' for backwards compatibility
  const initialType = storeRegistrationType === 'individual' ? 'individual' : storeRegistrationType;
  const [selectedType, setSelectedType] = useState<RegistrationType['id'] | null>(initialType);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [pendingRegistrationType, setPendingRegistrationType] = useState<RegistrationType['id'] | null>(null);

  // Check for existing draft on mount
  const draftTypeInStore = useRegistrationStore.getState().registrationType;
  const draftStepInStore = useRegistrationStore.getState().currentStep;

  const initializeAttendees = useCallback((typeId: RegistrationType['id']) => {
    // Unchanged logic for initializing attendees
    clearAllAttendees();
    
    const type = REGISTRATION_TYPES.find(t => t.id === typeId);
    if (!type) return;

    if (typeId === 'lodge') {
      for (let i = 0; i < type.minAttendees; i++) {
        const attendeeId = addAttendee('Mason');
        updateAttendee(attendeeId, {
          isPrimary: i === 0,
        });
      }
    } else {
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
      // Note: We no longer advance steps here. The parent component handles navigation.
    }
  }, [storeSetRegistrationType, initializeAttendees]);

  const handleContinueDraft = () => {
    setShowDraftModal(false);
    // We don't navigate here anymore
    setPendingRegistrationType(null);
  };

  const handleStartNew = () => {
    setShowDraftModal(false);
    storeClearRegistration();
    if (pendingRegistrationType) {
      setSelectedType(pendingRegistrationType);
      storeSetRegistrationType(pendingRegistrationType);
      initializeAttendees(pendingRegistrationType);
      // We don't navigate here anymore
    }
    setPendingRegistrationType(null);
  };

  return (
    <OneColumnStepLayout>
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
    </OneColumnStepLayout>
  );
}
```

## Key Changes
1. Added import for `OneColumnStepLayout`
2. Removed the `SectionHeader` component and its related markup
3. Removed direct navigation (`storeSetCurrentStep(2)`) - this will be handled by parent
4. Wrapped content with `OneColumnStepLayout` for consistent styling
5. All selection and modal functionality remains intact
6. CardHeader section for desktops and mobile layout remains the same

## Testing
- Verify that clicking Select still selects a registration type
- Confirm the draft modal still appears when appropriate
- Check that the layout is consistent with design (margins, padding, etc.)
- Ensure responsive behavior still works correctly on mobile and desktop 

## Status
✅ Completed: Successfully refactored RegistrationTypeStep to use the OneColumnStepLayout with centralized header and navigation 