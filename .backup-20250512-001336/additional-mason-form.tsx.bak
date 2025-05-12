"use client"

import type React from "react"

import { useState } from "react"
import { v4 as uuidv4 } from "uuid"
import type {
  MasonAttendee,
  MasonicTitle,
  MasonicRank,
  GrandOfficerStatus,
  PresentGrandOfficerRole,
} from "@/lib/registration-types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { PartnerForm } from "./partner-form"
import { Card, CardContent } from "@/components/ui/card"
import { Plus } from "lucide-react"
import { AlertModal } from "@/components/ui/alert-modal"

interface AdditionalMasonFormProps {
  primaryMason: MasonAttendee | null
  onSubmit: (mason: MasonAttendee) => void
}

export function AdditionalMasonForm({ primaryMason, onSubmit }: AdditionalMasonFormProps) {
  const [showPartnerForm, setShowPartnerForm] = useState(false)
  const [sameLodge, setSameLodge] = useState(false)
  const [formData, setFormData] = useState<Partial<MasonAttendee>>({
    type: "mason",
    id: uuidv4(),
    masonicTitle: "Bro" as MasonicTitle,
    rank: "MM" as MasonicRank,
    hasPartner: false,
  })
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false)
  const [alertModalMessage, setAlertModalMessage] = useState("")

  const handleChange = (field: keyof MasonAttendee, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))

    // Reset conditional fields when parent field changes
    if (field === "rank" && value !== "GL") {
      setFormData((prev) => ({
        ...prev,
        grandRank: undefined,
        grandOfficerStatus: undefined,
        presentGrandOfficerRole: undefined,
        otherGrandOfficerRole: undefined,
      }))
    }

    if (field === "grandOfficerStatus" && value !== "Present") {
      setFormData((prev) => ({
        ...prev,
        presentGrandOfficerRole: undefined,
        otherGrandOfficerRole: undefined,
      }))
    }

    if (field === "presentGrandOfficerRole" && value !== "Other") {
      setFormData((prev) => ({
        ...prev,
        otherGrandOfficerRole: undefined,
      }))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // If same lodge as primary, copy those details
    let updatedFormData = { ...formData }
    if (sameLodge && primaryMason) {
      updatedFormData = {
        ...updatedFormData,
        grandLodge: primaryMason.grandLodge,
        lodgeName: primaryMason.lodgeName,
        lodgeNumber: primaryMason.lodgeNumber,
        sameLodgeAsPrimary: true,
      }
    }

    // Validate form
    if (
      !updatedFormData.firstName ||
      !updatedFormData.lastName ||
      !updatedFormData.grandLodge ||
      !updatedFormData.lodgeName ||
      !updatedFormData.mobile ||
      !updatedFormData.email
    ) {
      setAlertModalMessage("Please fill in all required fields for the additional Mason.")
      setIsAlertModalOpen(true)
      return
    }

    onSubmit(updatedFormData as MasonAttendee)

    // Reset form
    setFormData({
      type: "mason",
      id: uuidv4(),
      masonicTitle: "Bro" as MasonicTitle,
      rank: "MM" as MasonicRank,
      hasPartner: false,
    })
    setShowPartnerForm(false)
    setSameLodge(false)
  }

  const handleTogglePartnerForm = () => {
    setShowPartnerForm(!showPartnerForm)
    setFormData((prev) => ({ ...prev, hasPartner: !showPartnerForm }))
  }

  const handleSameLodgeChange = (checked: boolean) => {
    setSameLodge(checked)
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="masonicTitle">Masonic Title</Label>
            <Select
              value={formData.masonicTitle}
              onValueChange={(value) => handleChange("masonicTitle", value as MasonicTitle)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select title" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Bro">Bro</SelectItem>
                <SelectItem value="W Bro">W Bro</SelectItem>
                <SelectItem value="VW Bro">VW Bro</SelectItem>
                <SelectItem value="RW Bro">RW Bro</SelectItem>
                <SelectItem value="MW Bro">MW Bro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rank">Masonic Rank</Label>
            <Select value={formData.rank} onValueChange={(value) => handleChange("rank", value as MasonicRank)}>
              <SelectTrigger>
                <SelectValue placeholder="Select rank" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EAF">Entered Apprentice Freemason (EAF)</SelectItem>
                <SelectItem value="FCF">Fellow Craft Freemason (FCF)</SelectItem>
                <SelectItem value="MM">Master Mason (MM)</SelectItem>
                <SelectItem value="IM">Installed Master (IM)</SelectItem>
                <SelectItem value="GL">Grand Lodge Rank (GL)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {formData.rank === "GL" && (
          <div className="space-y-6 p-4 bg-masonic-lightblue rounded-lg">
            <div className="space-y-2">
              <Label htmlFor="grandRank">Grand Rank</Label>
              <Input
                id="grandRank"
                value={formData.grandRank || ""}
                onChange={(e) => handleChange("grandRank", e.target.value)}
                placeholder="e.g. PSGW"
                maxLength={6}
              />
              <p className="text-xs text-gray-500">Maximum 6 characters</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="grandOfficerStatus">Grand Officer Status</Label>
              <Select
                value={formData.grandOfficerStatus}
                onValueChange={(value) => handleChange("grandOfficerStatus", value as GrandOfficerStatus)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Past">Past</SelectItem>
                  <SelectItem value="Present">Present</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.grandOfficerStatus === "Present" && (
              <div className="space-y-2">
                <Label htmlFor="presentGrandOfficerRole">Present Grand Officer Role</Label>
                <Select
                  value={formData.presentGrandOfficerRole}
                  onValueChange={(value) => handleChange("presentGrandOfficerRole", value as PresentGrandOfficerRole)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Grand Master">Grand Master</SelectItem>
                    <SelectItem value="Deputy Grand Master">Deputy Grand Master</SelectItem>
                    <SelectItem value="Assistant Grand Master">Assistant Grand Master</SelectItem>
                    <SelectItem value="Grand Secretary">Grand Secretary</SelectItem>
                    <SelectItem value="Grand Director of Ceremonies">Grand Director of Ceremonies</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {formData.presentGrandOfficerRole === "Other" && (
              <div className="space-y-2">
                <Label htmlFor="otherGrandOfficerRole">Specify Role</Label>
                <Input
                  id="otherGrandOfficerRole"
                  value={formData.otherGrandOfficerRole || ""}
                  onChange={(e) => handleChange("otherGrandOfficerRole", e.target.value)}
                  placeholder="Enter your Grand Officer role"
                />
              </div>
            )}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
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

        {primaryMason && (
          <div className="flex items-center space-x-2">
            <Checkbox id="sameLodge" checked={sameLodge} onCheckedChange={handleSameLodgeChange} />
            <Label htmlFor="sameLodge">Same Lodge as Primary Mason</Label>
          </div>
        )}

        {!sameLodge && (
          <>
            <div className="space-y-2">
              <Label htmlFor="grandLodge">Grand Lodge</Label>
              <Input
                id="grandLodge"
                value={formData.grandLodge || ""}
                onChange={(e) => handleChange("grandLodge", e.target.value)}
                placeholder="e.g. United Grand Lodge of NSW & ACT"
                required
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="lodgeName">Lodge Name</Label>
                <Input
                  id="lodgeName"
                  value={formData.lodgeName || ""}
                  onChange={(e) => handleChange("lodgeName", e.target.value)}
                  placeholder="e.g. Lodge Commonwealth"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lodgeNumber">Lodge Number</Label>
                <Input
                  id="lodgeNumber"
                  value={formData.lodgeNumber || ""}
                  onChange={(e) => handleChange("lodgeNumber", e.target.value)}
                  placeholder="e.g. 400"
                />
              </div>
            </div>
          </>
        )}

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
            Add Mason
          </Button>
        </div>
      </form>
      <AlertModal
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
        title="Incomplete Information"
        description={alertModalMessage}
      />
    </>
  )
}
