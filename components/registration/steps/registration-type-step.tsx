"use client"

import { useState } from "react"
// import { useRegistration } from "@/contexts/registration-context" // Remove this
import { useRegistrationStore } from "@/lib/registration-store" // Add this
import type { RegistrationType } from "@/lib/registration-types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Building, Award, Check } from "lucide-react"
import { SectionHeader } from "../SectionHeader"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export function RegistrationTypeStep() {
  // const { state, dispatch } = useRegistration() // Remove this
  const initialRegistrationType = useRegistrationStore(state => state.registrationType); // Add this
  const storeSetRegistrationType = useRegistrationStore(state => state.setRegistrationType); // Add this
  // Get other actions and state needed for modal logic
  const storeResetWizard = useRegistrationStore(state => state.resetWizard);
  const storeSetCurrentStep = useRegistrationStore(state => state.setCurrentStep);
  const draftTypeInStore = useRegistrationStore.getState().registrationType; // Get once for initial check logic
  const draftStepInStore = useRegistrationStore.getState().currentStep;


  const [selectedType, setSelectedType] = useState<RegistrationType | null>(initialRegistrationType) // Modify this
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [pendingRegistrationType, setPendingRegistrationType] = useState<RegistrationType | null>(null);

  const handleSelectType = (type: RegistrationType) => {
    // Get up-to-date store state and actions inside the handler
    const currentDraftType = useRegistrationStore.getState().registrationType;
    
    // Check for a significant draft: if a registration type is already set in the store.
    if (currentDraftType !== null) {
      setPendingRegistrationType(type); // Store the type user just clicked
      setShowDraftModal(true);
    } else {
      // No significant draft, proceed as normal
      setSelectedType(type) // Keep local UI update if needed, or remove if direct store update is enough
      storeSetRegistrationType(type) 
    }
  }

  const handleContinueDraft = () => {
    setShowDraftModal(false);
    // Navigate to the step where the user left off
    // The registration type in store remains the draft's type
    storeSetCurrentStep(draftStepInStore > 1 ? draftStepInStore : 2); // Ensure they at least go to step 2
    setPendingRegistrationType(null);
  };

  const handleStartNew = () => {
    setShowDraftModal(false);
    storeResetWizard();
    if (pendingRegistrationType) {
      setSelectedType(pendingRegistrationType); // Update local UI for selected card
      storeSetRegistrationType(pendingRegistrationType);
    }
    setPendingRegistrationType(null);
  };


  return (
    <div className="space-y-6">
      <SectionHeader>
        <h1 className="text-2xl font-bold text-masonic-navy">Select Registration Type</h1>
        <div className="masonic-divider"></div>
        <p className="text-gray-600">Please select how you would like to register for this event</p>
      </SectionHeader>

      <div className="grid gap-6 md:grid-cols-3 items-stretch">
        <Card
          className={`flex flex-col h-full border-2 transition-all ${
            selectedType === "myself-others"
              ? "border-masonic-gold bg-masonic-lightblue"
              : "border-gray-200 hover:border-masonic-lightgold"
          }`}
        >
          <CardHeader className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-masonic-navy text-white">
              <Users className="h-6 w-6" />
            </div>
            <CardTitle className="mt-2">Myself & Others</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-center mb-4">
              Register yourself and optionally add other Masons, guests, or partners
            </CardDescription>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start">
                <Check className="h-4 w-4 mr-2 text-masonic-navy mt-0.5" />
                <span>Register yourself as the primary attendee</span>
              </li>
              <li className="flex items-start">
                <Check className="h-4 w-4 mr-2 text-masonic-navy mt-0.5" />
                <span>Add additional Masons, guests, or partners</span>
              </li>
              <li className="flex items-start">
                <Check className="h-4 w-4 mr-2 text-masonic-navy mt-0.5" />
                <span>Manage all tickets in a single transaction</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter className="pt-2 mt-auto">
            <Button
              onClick={() => handleSelectType("myself-others")}
              className="w-full bg-masonic-navy hover:bg-masonic-blue"
            >
              Select
            </Button>
          </CardFooter>
        </Card>

        <Card
          className={`flex flex-col h-full border-2 transition-all ${
            selectedType === "lodge"
              ? "border-masonic-gold bg-masonic-lightblue"
              : "border-gray-200 hover:border-masonic-lightgold"
          }`}
        >
          <CardHeader className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-masonic-navy text-white">
              <Building className="h-6 w-6" />
            </div>
            <CardTitle className="mt-2">Lodge Registration</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-center mb-4">
              Register on behalf of your Lodge, including multiple members and guests
            </CardDescription>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start">
                <Check className="h-4 w-4 mr-2 text-masonic-navy mt-0.5" />
                <span>Register on behalf of your Lodge</span>
              </li>
              <li className="flex items-start">
                <Check className="h-4 w-4 mr-2 text-masonic-navy mt-0.5" />
                <span>Add multiple Lodge members and their guests</span>
              </li>
              <li className="flex items-start">
                <Check className="h-4 w-4 mr-2 text-masonic-navy mt-0.5" />
                <span>Coordinate seating arrangements for your Lodge</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter className="pt-2 mt-auto">
            <Button onClick={() => handleSelectType("lodge")} className="w-full bg-masonic-navy hover:bg-masonic-blue">
              Select
            </Button>
          </CardFooter>
        </Card>

        <Card
          className={`flex flex-col h-full border-2 transition-all ${
            selectedType === "delegation"
              ? "border-masonic-gold bg-masonic-lightblue"
              : "border-gray-200 hover:border-masonic-lightgold"
          }`}
        >
          <CardHeader className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-masonic-navy text-white">
              <Award className="h-6 w-6" />
            </div>
            <CardTitle className="mt-2">Official Delegation</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-center mb-4">
              Register as part of an official Grand Lodge or Provincial delegation
            </CardDescription>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start">
                <Check className="h-4 w-4 mr-2 text-masonic-navy mt-0.5" />
                <span>Register as part of an official delegation</span>
              </li>
              <li className="flex items-start">
                <Check className="h-4 w-4 mr-2 text-masonic-navy mt-0.5" />
                <span>Coordinate with other delegation members</span>
              </li>
              <li className="flex items-start">
                <Check className="h-4 w-4 mr-2 text-masonic-navy mt-0.5" />
                <span>Access special delegation seating arrangements</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter className="pt-2 mt-auto">
            <Button
              onClick={() => handleSelectType("delegation")}
              className="w-full bg-masonic-navy hover:bg-masonic-blue"
            >
              Select
            </Button>
          </CardFooter>
        </Card>
      </div>

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
  )
}
