"use client"

import { useState } from "react"
import { useRegistration } from "@/contexts/registration-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Attendee } from "@/lib/registration-types"
import { User, UserPlus } from "lucide-react"
import { AttendeeCard } from "../attendee-card"
import { PrimaryMasonForm } from "../forms/primary-mason-form"
import { AdditionalMasonForm } from "../forms/additional-mason-form"
import { GuestForm } from "../forms/guest-form"

export function AttendeeDetailsStep() {
  const { state, dispatch } = useRegistration()
  const [showAdditionalMasonForm, setShowAdditionalMasonForm] = useState(false)
  const [showGuestForm, setShowGuestForm] = useState(false)

  const handlePrevious = () => {
    dispatch({ type: "PREV_STEP" })
  }

  const handleContinue = () => {
    if (state.primaryAttendee) {
      dispatch({ type: "NEXT_STEP" })
    }
  }

  const handleAddAttendee = (attendee: Attendee) => {
    dispatch({ type: "ADD_ATTENDEE", payload: attendee })
    setShowAdditionalMasonForm(false)
    setShowGuestForm(false)
  }

  const handleRemoveAttendee = (id: string) => {
    dispatch({ type: "REMOVE_ATTENDEE", payload: id })
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-masonic-navy">Attendee Details</h1>
        <div className="masonic-divider"></div>
        <p className="text-gray-600">Please provide details for all attendees</p>
      </div>

      <div className="space-y-6">
        {/* Primary Attendee Section */}
        <Card className="border-masonic-navy">
          <CardHeader className="bg-masonic-navy text-white">
            <CardTitle>Primary Attendee</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {!state.primaryAttendee ? (
              <PrimaryMasonForm />
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="font-medium">{state.primaryAttendee.masonicTitle}</span>
                    <span>
                      {state.primaryAttendee.firstName} {state.primaryAttendee.lastName},
                    </span>
                    <span className="text-gray-600">Rank: {state.primaryAttendee.rank}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-masonic-navy border-masonic-navy hover:bg-masonic-lightblue"
                    onClick={() => dispatch({ type: "SET_PRIMARY_ATTENDEE", payload: null })}
                  >
                    Edit
                  </Button>
                </div>
                <div className="text-sm text-gray-600">
                  <span>{state.primaryAttendee.grandLodge} • </span>
                  <span>
                    {state.primaryAttendee.lodgeName}
                    {state.primaryAttendee.lodgeNumber && ` No. ${state.primaryAttendee.lodgeNumber}`}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Display existing additional attendees */}
        {state.additionalAttendees.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-masonic-navy">Additional Attendees</h3>
            <div className="space-y-4">
              {state.additionalAttendees.map((attendee) => (
                <AttendeeCard key={attendee.id} attendee={attendee} onRemove={handleRemoveAttendee} />
              ))}
            </div>
          </div>
        )}

        {/* Add Additional Mason Form */}
        {showAdditionalMasonForm && state.primaryAttendee && (
          <Card className="border-masonic-lightgold">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Add Mason</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-500 hover:text-red-600"
                  onClick={() => setShowAdditionalMasonForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <AdditionalMasonForm primaryMason={state.primaryAttendee} onSubmit={handleAddAttendee} />
            </CardContent>
          </Card>
        )}

        {/* Add Guest Form */}
        {showGuestForm && state.primaryAttendee && (
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
        {state.primaryAttendee && !showAdditionalMasonForm && !showGuestForm && (
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
          disabled={!state.primaryAttendee}
          className="bg-masonic-navy hover:bg-masonic-blue"
        >
          Continue to Tickets
        </Button>
      </div>
    </div>
  )
}
