"use client"

import type React from "react"

import { useState } from "react"
import { v4 as uuidv4 } from "uuid"
import type { GuestAttendee, ContactPreference } from "@/lib/registration-types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { PartnerForm } from "./partner-form"
import { Card, CardContent } from "@/components/ui/card"
import { Plus } from "lucide-react"

interface GuestFormProps {
  onSubmit: (guest: GuestAttendee) => void
}

export function GuestForm({ onSubmit }: GuestFormProps) {
  const [showPartnerForm, setShowPartnerForm] = useState(false)
  const [formData, setFormData] = useState<Partial<GuestAttendee>>({
    type: "guest",
    id: uuidv4(),
    title: "Mr",
    contactPreference: "Primary Attendee" as ContactPreference,
    hasPartner: false,
  })

  const handleChange = (field: keyof GuestAttendee, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))

    // Reset contact fields when preference changes
    if (field === "contactPreference" && value !== "Directly") {
      setFormData((prev) => ({
        ...prev,
        mobile: undefined,
        email: undefined,
      }))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form
    if (
      !formData.firstName ||
      !formData.lastName ||
      (formData.contactPreference === "Directly" && (!formData.mobile || !formData.email))
    ) {
      alert("Please fill in all required fields")
      return
    }

    onSubmit(formData as GuestAttendee)

    // Reset form
    setFormData({
      type: "guest",
      id: uuidv4(),
      title: "Mr",
      contactPreference: "Primary Attendee" as ContactPreference,
      hasPartner: false,
    })
    setShowPartnerForm(false)
  }

  const handleTogglePartnerForm = () => {
    setShowPartnerForm(!showPartnerForm)
    setFormData((prev) => ({ ...prev, hasPartner: !showPartnerForm }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Select value={formData.title} onValueChange={(value) => handleChange("title", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select title" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Mr">Mr</SelectItem>
              <SelectItem value="Mrs">Mrs</SelectItem>
              <SelectItem value="Ms">Ms</SelectItem>
              <SelectItem value="Miss">Miss</SelectItem>
              <SelectItem value="Dr">Dr</SelectItem>
              <SelectItem value="Prof">Prof</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            value={formData.firstName || ""}
            onChange={(e) => handleChange("firstName", e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            value={formData.lastName || ""}
            onChange={(e) => handleChange("lastName", e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="contactPreference">Contact Preference</Label>
        <Select
          value={formData.contactPreference}
          onValueChange={(value) => handleChange("contactPreference", value as ContactPreference)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select contact preference" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Directly">Contact Directly</SelectItem>
            <SelectItem value="Primary Attendee">Contact via Primary Attendee</SelectItem>
            <SelectItem value="Provide Later">Provide Contact Details Later</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {formData.contactPreference === "Directly" && (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="mobile">Mobile</Label>
            <Input
              id="mobile"
              type="tel"
              value={formData.mobile || ""}
              onChange={(e) => handleChange("mobile", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email || ""}
              onChange={(e) => handleChange("email", e.target.value)}
              required
            />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="dietaryRequirements">Dietary Requirements</Label>
        <Textarea
          id="dietaryRequirements"
          value={formData.dietaryRequirements || ""}
          onChange={(e) => handleChange("dietaryRequirements", e.target.value)}
          placeholder="Please specify any dietary requirements"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="specialNeeds">Special Needs or Accessibility Requirements</Label>
        <Textarea
          id="specialNeeds"
          value={formData.specialNeeds || ""}
          onChange={(e) => handleChange("specialNeeds", e.target.value)}
          placeholder="Please specify any special needs or accessibility requirements"
        />
      </div>

      {!showPartnerForm ? (
        <Button
          type="button"
          variant="outline"
          onClick={handleTogglePartnerForm}
          className="border-masonic-navy text-masonic-navy hover:bg-masonic-lightblue"
        >
          <Plus className="mr-2 h-4 w-4" />
          Register Lady or Partner
        </Button>
      ) : (
        <Card>
          <CardContent className="pt-6 relative">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-4 top-4 text-gray-500 hover:text-red-600"
              onClick={handleTogglePartnerForm}
            >
              Remove
            </Button>
            <PartnerForm
              relatedAttendeeId={formData.id || ""}
              onSubmit={(partnerData) => {
                setFormData((prev) => ({
                  ...prev,
                  hasPartner: true,
                  partner: partnerData,
                }))
              }}
            />
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button type="submit" className="bg-masonic-navy hover:bg-masonic-blue">
          Add Guest
        </Button>
      </div>
    </form>
  )
}
