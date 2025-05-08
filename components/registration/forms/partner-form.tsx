"use client"

import type React from "react"

import { useState } from "react"
import { v4 as uuidv4 } from "uuid"
import type { PartnerAttendee, ContactPreference } from "@/lib/registration-types"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

interface PartnerFormProps {
  relatedAttendeeId: string
  onSubmit: (partner: PartnerAttendee) => void
}

export function PartnerForm({ relatedAttendeeId, onSubmit }: PartnerFormProps) {
  const [formData, setFormData] = useState<Partial<PartnerAttendee>>({
    type: "partner",
    id: uuidv4(),
    relatedAttendeeId,
    relationship: "Spouse",
    title: "Mrs",
    contactPreference: "Mason/Guest" as ContactPreference,
  })

  const handleChange = (field: keyof PartnerAttendee, value: any) => {
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

    onSubmit(formData as PartnerAttendee)
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-masonic-navy">Partner Details</h3>

      <div className="grid gap-6 md:grid-cols-12">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="relationship">Relationship</Label>
          <Select value={formData.relationship} onValueChange={(value) => handleChange("relationship", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select relationship" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Spouse">Spouse</SelectItem>
              <SelectItem value="Partner">Partner</SelectItem>
              <SelectItem value="Companion">Companion</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="title">Title</Label>
          <Select value={formData.title} onValueChange={(value) => handleChange("title", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select title" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Mrs">Mrs</SelectItem>
              <SelectItem value="Ms">Ms</SelectItem>
              <SelectItem value="Miss">Miss</SelectItem>
              <SelectItem value="Mr">Mr</SelectItem>
              <SelectItem value="Dr">Dr</SelectItem>
              <SelectItem value="Prof">Prof</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 md:col-span-4">
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            value={formData.firstName || ""}
            onChange={(e) => handleChange("firstName", e.target.value)}
            required
          />
        </div>

        <div className="space-y-2 md:col-span-4">
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            value={formData.lastName || ""}
            onChange={(e) => handleChange("lastName", e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        <div className="space-y-2 md:col-span-4">
          <Label htmlFor="contactPreference">Contect</Label>
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
              <SelectItem value="Mason/Guest">Contact via Mason/Guest</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {formData.contactPreference === "Directly" && (
          <>
            <div className="space-y-2 md:col-span-4">
              <Label htmlFor="mobile">Mobile</Label>
              <Input
                id="mobile"
                type="tel"
                value={formData.mobile || ""}
                onChange={(e) => handleChange("mobile", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2 md:col-span-4">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ""}
                onChange={(e) => handleChange("email", e.target.value)}
                required
              />
            </div>
          </>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        <div className="space-y-2 md:col-span-6">
          <Label htmlFor="dietaryRequirements">Dietary Requirements</Label>
          <Textarea
            id="dietaryRequirements"
            value={formData.dietaryRequirements || ""}
            onChange={(e) => handleChange("dietaryRequirements", e.target.value)}
            placeholder="Please specify any dietary requirements"
          />
        </div>

        <div className="space-y-2 md:col-span-6">
          <Label htmlFor="specialNeeds">Special Needs or Accessibility Requirements</Label>
          <Textarea
            id="specialNeeds"
            value={formData.specialNeeds || ""}
            onChange={(e) => handleChange("specialNeeds", e.target.value)}
            placeholder="Please specify any special needs or accessibility requirements"
          />
        </div>
      </div>
    </div>
  )
}
