"use client"

import { useState } from "react"
import { useRegistrationStore } from "@/lib/registration-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Attendee, MasonAttendee } from "@/lib/registration-types"
import { User, UserPlus } from "lucide-react"
import { AttendeeCard } from "../attendee-card"
import { MasonForm } from "../forms/mason-form"
import { GuestForm } from "../forms/guest-form"
import { SectionHeader } from "../SectionHeader"

export function AttendeeDetailsStep() {
  const primaryAttendee = useRegistrationStore((state) => state.attendeeDetails.primaryAttendee);
  const additionalAttendees = useRegistrationStore((state) => state.attendeeDetails.additionalAttendees);
  const storeSetPrimaryAttendee = useRegistrationStore((state) => state.setPrimaryAttendee);
  const storeAddAdditionalAttendee = useRegistrationStore((state) => state.addAdditionalAttendee);
  const storeRemoveAdditionalAttendee = useRegistrationStore((state) => state.removeAdditionalAttendee);
  const goToNextStep = useRegistrationStore((state) => state.goToNextStep);
  const goToPrevStep = useRegistrationStore((state) => state.goToPrevStep);

  // Log relevant store state for debugging
  console.log("AttendeeDetailsStep - primaryAttendee:", primaryAttendee);
  console.log("AttendeeDetailsStep - additionalAttendees:", additionalAttendees);

  const [showAdditionalMasonForm, setShowAdditionalMasonForm] = useState(false)
  const [showGuestForm, setShowGuestForm] = useState(false)
  const [isEditingPrimary, setIsEditingPrimary] = useState(false);

  const handlePrevious = () => {
    goToPrevStep();
  }

  const handleContinue = () => {
    if (primaryAttendee) {
      goToNextStep();
    }
  }

  const handleSetPrimaryAttendee = (masonData: MasonAttendee) => {
    storeSetPrimaryAttendee(masonData);
    setIsEditingPrimary(false);
  }

  const handleAddAttendee = (attendee: Attendee) => {
    storeAddAdditionalAttendee(attendee);
    setShowAdditionalMasonForm(false)
    setShowGuestForm(false)
  }

  const handleRemoveAttendee = (id: string) => {
    storeRemoveAdditionalAttendee(id);
  }

  return (
    <div className="space-y-6">
      <SectionHeader>
        <h1 className="text-2xl font-bold text-masonic-navy">Attendee Details</h1>
        <div className="masonic-divider"></div>
        <p className="text-gray-600">Please provide details for all attendees</p>
      </SectionHeader>

      <div className="space-y-6">
        {/* Primary Attendee Section */}
        <Card className="border-masonic-navy">
          <CardHeader className="bg-masonic-navy text-white">
            <CardTitle>Primary Attendee</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {!primaryAttendee ? (
              <MasonForm
                attendeeType="primary"
                onSubmit={handleSetPrimaryAttendee}
              />
            ) : isEditingPrimary ? (
              <MasonForm
                attendeeType="primary"
                onSubmit={handleSetPrimaryAttendee}
                initialData={primaryAttendee}
                onFormClose={() => setIsEditingPrimary(false)}
              />
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="font-medium">{primaryAttendee.masonicTitle}</span>
                    <span>
                      {primaryAttendee.firstName} {primaryAttendee.lastName},
                    </span>
                    <span className="text-gray-600">Rank: {primaryAttendee.rank}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-masonic-navy border-masonic-navy hover:bg-masonic-lightblue"
                    onClick={() => setIsEditingPrimary(true)}
                  >
                    Edit
                  </Button>
                </div>
                <div className="text-sm text-gray-600">
                  <span>{primaryAttendee.grandLodge} • </span>
                  <span>
                    {primaryAttendee.lodgeName}
                    {primaryAttendee.lodgeNumber && ` No. ${primaryAttendee.lodgeNumber}`}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Display existing additional attendees */}
        {additionalAttendees.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-masonic-navy">Additional Attendees</h3>
            <div className="space-y-4">
              {additionalAttendees.map((attendee) => (
                <AttendeeCard key={attendee.id} attendee={attendee} onRemove={handleRemoveAttendee} />
              ))}
            </div>
          </div>
        )}

        {/* Add Additional Mason Form */}
        {showAdditionalMasonForm && primaryAttendee && (
          <MasonForm
            attendeeType="additional"
            onSubmit={handleAddAttendee}
            primaryMasonData={primaryAttendee}
            onFormClose={() => setShowAdditionalMasonForm(false)}
          />
        )}

        {/* Add Guest Form */}
        {showGuestForm && primaryAttendee && (
          <Card className="border-masonic-lightgold">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Add Guest</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-500 hover:text-red-600"
                  onClick={() => setShowGuestForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <GuestForm onSubmit={handleAddAttendee} />
            </CardContent>
          </Card>
        )}

        {/* Add Attendee Buttons */}
        {primaryAttendee && !showAdditionalMasonForm && !showGuestForm && (
          <div className="flex gap-4 justify-center">
            <Button onClick={() => setShowAdditionalMasonForm(true)} className="bg-masonic-navy hover:bg-masonic-blue">
              <UserPlus className="mr-2 h-4 w-4" />
              Add Mason
            </Button>
            <Button onClick={() => setShowGuestForm(true)} className="bg-masonic-navy hover:bg-masonic-blue">
              <User className="mr-2 h-4 w-4" />
              Add Guest
            </Button>
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          className="border-masonic-navy text-masonic-navy hover:bg-masonic-lightblue"
        >
          Previous
        </Button>
        <Button
          onClick={handleContinue}
          disabled={!primaryAttendee}
          className="bg-masonic-navy hover:bg-masonic-blue"
        >
          Continue to Tickets
        </Button>
      </div>
    </div>
  )
}
