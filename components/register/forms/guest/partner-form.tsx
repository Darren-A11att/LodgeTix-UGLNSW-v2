"use client"

import React from "react"
import { useState, useEffect } from "react"
import { v4 as uuidv4 } from "uuid"
import type { PartnerAttendee, ContactPreference } from "@/lib/registration-types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { X } from "lucide-react"
import { AlertModal } from "@/components/ui/alert-modal"

interface PartnerFormProps {
  relatedAttendeeId: string
  onSubmit: (partner: PartnerAttendee) => void
  initialData?: Partial<PartnerAttendee>
  onFormClose?: () => void
  isDialog?: boolean
}

export function PartnerForm({
  relatedAttendeeId,
  onSubmit,
  initialData,
  onFormClose,
  isDialog,
}: PartnerFormProps) {
  const [formData, setFormData] = useState<Partial<PartnerAttendee>>(() => {
    const defaults: Partial<PartnerAttendee> = {
      type: "partner",
      id: uuidv4(),
      relatedAttendeeId,
      relationship: "Spouse",
      title: "Mrs",
      contactPreference: "Mason/Guest" as ContactPreference,
      firstName: "",
      lastName: "",
      dietaryRequirements: "",
      specialNeeds: "",
    }
    return { ...defaults, ...initialData }
  })

  // Alert modal state
  const [alertModalOpen, setAlertModalOpen] = useState(false)
  const [alertModalData, setAlertModalData] = useState({
    title: "",
    description: "",
    variant: "default" as "default" | "destructive" | "success" | "warning"
  })

  useEffect(() => {
    if (initialData) {
      setFormData((prev) => ({
        ...prev,
        ...initialData,
        id: initialData.id || prev.id || uuidv4(),
        relatedAttendeeId: initialData.relatedAttendeeId || relatedAttendeeId,
      }))
    }
  }, [initialData, relatedAttendeeId])

  const handleChange = (field: keyof PartnerAttendee, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))

    if (field === "contactPreference" && value !== "Directly") {
      setFormData((prev) => ({
        ...prev,
        mobile: undefined,
        email: undefined,
      }))
    }
  }

  const showAlert = (title: string, description: string, variant: "default" | "destructive" | "success" | "warning" = "default") => {
    setAlertModalData({ title, description, variant })
    setAlertModalOpen(true)
  }

  const handleSavePartner = () => {
    if (
      !formData.firstName ||
      !formData.lastName ||
      (formData.contactPreference === "Directly" && (!formData.mobile || !formData.email))
    ) {
      showAlert(
        "Required Fields Missing", 
        "Please fill in all required partner fields. " + 
        (formData.contactPreference === "Directly" ? "Mobile and email are required when 'Contact Directly' is selected." : ""),
        "warning"
      )
      return
    }
    onSubmit(formData as PartnerAttendee)
  }

  const submitButtonText = initialData?.id ? "Update Partner" : "Add Partner"

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-masonic-navy">Partner Details</h3>
          {onFormClose && (
            <Button variant="ghost" size="icon" onClick={onFormClose} aria-label="Close partner form">
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-12">
          <div className="space-y-2 md:col-span-3">
            <Label htmlFor="relationship">Relationship</Label>
            <Select
              value={formData.relationship || "Spouse"}
              onValueChange={(value) => handleChange("relationship", value)}
            >
              <SelectTrigger id="relationship">
                <SelectValue placeholder="Select relationship" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Spouse">Spouse</SelectItem>
                <SelectItem value="Partner">Partner</SelectItem>
                <SelectItem value="Companion">Companion</SelectItem>
                <SelectItem value="Guest">Guest</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-3">
            <Label htmlFor="title">Title</Label>
            <Select
              value={formData.title || "Mrs"}
              onValueChange={(value) => handleChange("title", value)}
            >
              <SelectTrigger id="title">
                <SelectValue placeholder="Select title" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Mrs">Mrs</SelectItem>
                <SelectItem value="Ms">Ms</SelectItem>
                <SelectItem value="Miss">Miss</SelectItem>
                <SelectItem value="Mr">Mr</SelectItem>
                <SelectItem value="Mx">Mx</SelectItem>
                <SelectItem value="Dr">Dr</SelectItem>
                <SelectItem value="Prof">Prof</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-3">
            <Label htmlFor="partnerFirstName">First Name</Label>
            <Input
              id="partnerFirstName"
              value={formData.firstName || ""}
              onChange={(e) => handleChange("firstName", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2 md:col-span-3">
            <Label htmlFor="partnerLastName">Last Name</Label>
            <Input
              id="partnerLastName"
              value={formData.lastName || ""}
              onChange={(e) => handleChange("lastName", e.target.value)}
              required
            />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-12">
          <div className="space-y-2 md:col-span-4">
            <Label htmlFor="partnerContactPreference">Contact Preference</Label>
            <Select
              value={formData.contactPreference}
              onValueChange={(value) => handleChange("contactPreference", value as ContactPreference)}
            >
              <SelectTrigger id="partnerContactPreference">
                <SelectValue placeholder="Select contact preference" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Directly">Contact Directly</SelectItem>
                <SelectItem value="Mason/Guest">Contact via Mason/Guest adding me</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.contactPreference === "Directly" && (
            <>
              <div className="space-y-2 md:col-span-4">
                <Label htmlFor="partnerMobile">Mobile</Label>
                <Input
                  id="partnerMobile"
                  type="tel"
                  value={formData.mobile || ""}
                  onChange={(e) => handleChange("mobile", e.target.value)}
                  required={formData.contactPreference === "Directly"}
                />
              </div>

              <div className="space-y-2 md:col-span-4">
                <Label htmlFor="partnerEmail">Email</Label>
                <Input
                  id="partnerEmail"
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) => handleChange("email", e.target.value)}
                  required={formData.contactPreference === "Directly"}
                />
              </div>
            </>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-12">
          <div className="space-y-2 md:col-span-6">
            <Label htmlFor="partnerDietaryRequirements">Dietary Requirements</Label>
            <Textarea
              id="partnerDietaryRequirements"
              value={formData.dietaryRequirements || ""}
              onChange={(e) => handleChange("dietaryRequirements", e.target.value)}
              placeholder="e.g. Vegetarian, Gluten-free"
            />
          </div>

          <div className="space-y-2 md:col-span-6">
            <Label htmlFor="partnerSpecialNeeds">Special Needs or Accessibility</Label>
            <Textarea
              id="partnerSpecialNeeds"
              value={formData.specialNeeds || ""}
              onChange={(e) => handleChange("specialNeeds", e.target.value)}
              placeholder="e.g. Wheelchair access"
            />
          </div>
        </div>
        <div className="flex justify-end space-x-3 pt-4">
          {onFormClose && (
            <Button type="button" variant="outline" onClick={onFormClose}>
              Cancel
            </Button>
          )}
          <Button type="button" onClick={handleSavePartner}>{submitButtonText}</Button>
        </div>
      </div>

      <AlertModal
        isOpen={alertModalOpen}
        onClose={() => setAlertModalOpen(false)}
        title={alertModalData.title}
        description={alertModalData.description}
        variant={alertModalData.variant}
        actionLabel="OK"
      />
    </>
  )
}