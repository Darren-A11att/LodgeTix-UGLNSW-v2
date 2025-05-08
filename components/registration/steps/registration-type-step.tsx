"use client"

import { useState } from "react"
import { useRegistration } from "@/contexts/registration-context"
import type { RegistrationType } from "@/lib/registration-types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Building, Award, Check } from "lucide-react"

export function RegistrationTypeStep() {
  const { state, dispatch } = useRegistration()
  const [selectedType, setSelectedType] = useState<RegistrationType | null>(state.registrationType)

  const handleSelectType = (type: RegistrationType) => {
    setSelectedType(type)
    dispatch({ type: "SET_REGISTRATION_TYPE", payload: type })
    dispatch({ type: "NEXT_STEP" })
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-masonic-navy">Select Registration Type</h1>
        <div className="masonic-divider"></div>
        <p className="text-gray-600">Please select how you would like to register for this event</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card
          className={`border-2 transition-all ${
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
          <CardFooter className="pt-2">
            <Button
              onClick={() => handleSelectType("myself-others")}
              className="w-full bg-masonic-navy hover:bg-masonic-blue"
            >
              Select
            </Button>
          </CardFooter>
        </Card>

        <Card
          className={`border-2 transition-all ${
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
          <CardFooter className="pt-2">
            <Button onClick={() => handleSelectType("lodge")} className="w-full bg-masonic-navy hover:bg-masonic-blue">
              Select
            </Button>
          </CardFooter>
        </Card>

        <Card
          className={`border-2 transition-all ${
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
          <CardFooter className="pt-2">
            <Button
              onClick={() => handleSelectType("delegation")}
              className="w-full bg-masonic-navy hover:bg-masonic-blue"
            >
              Select
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
