"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { v4 as uuidv4 } from "uuid"
import type {
  MasonAttendee,
  MasonicTitle,
  MasonicRank,
  GrandOfficerStatus,
  PresentGrandOfficerRole,
  PartnerAttendee,
} from "@/lib/registration-types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { PartnerForm } from "./partner-form"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, X } from "lucide-react"
import { useRegistrationStore } from "@/lib/registration-store";
import { AlertModal } from "@/components/ui/alert-modal"

export type AttendeeType = "primary" | "additional"

interface MasonFormProps {
  attendeeType: AttendeeType
  onSubmit: (mason: MasonAttendee) => void
  primaryMasonData?: MasonAttendee | null
  onFormClose?: () => void
  initialData?: Partial<MasonAttendee>
  isDialog?: boolean
}

export function MasonForm({
  attendeeType,
  onSubmit,
  primaryMasonData,
  onFormClose,
  initialData,
  isDialog,
}: MasonFormProps) {
  const [showPartnerForm, setShowPartnerForm] = useState(false)
  const [sameLodge, setSameLodge] = useState(false)
  const addAdditionalAttendee = useRegistrationStore((state) => state.addAdditionalAttendee);
  const [formData, setFormData] = useState<Partial<MasonAttendee>>(() => {
    const defaults: Partial<MasonAttendee> = {
      type: "mason",
      id: initialData?.id || uuidv4(),
      masonicTitle: "Bro" as MasonicTitle,
      rank: "MM" as MasonicRank,
      hasPartner: false,
      dietaryRequirements: "",
      isPrimaryAttendee: attendeeType === "primary",
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
        isPrimaryAttendee: attendeeType === "primary",
      }))
      setShowPartnerForm(!!initialData.hasPartner && !!initialData.partner)
      if (attendeeType === "additional" && initialData.sameLodgeAsPrimary) {
        setSameLodge(true)
      }
    }
  }, [initialData, attendeeType])

  useEffect(() => {
    setFormData((prev) => ({ ...prev, isPrimaryAttendee: attendeeType === "primary" }))
  }, [attendeeType])

  const handleChange = (field: keyof MasonAttendee, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))

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

  const showAlert = (title: string, description: string, variant: "default" | "destructive" | "success" | "warning" = "default") => {
    setAlertModalData({ title, description, variant })
    setAlertModalOpen(true)
  }

  const handleSaveChanges = () => {
    let updatedFormData = { ...formData }
    if (attendeeType === "additional" && sameLodge && primaryMasonData) {
      updatedFormData = {
        ...updatedFormData,
        grandLodge: primaryMasonData.grandLodge,
        lodgeName: primaryMasonData.lodgeName,
        lodgeNumber: primaryMasonData.lodgeNumber,
        sameLodgeAsPrimary: true,
      }
    } else if (attendeeType === "additional") {
      updatedFormData.sameLodgeAsPrimary = false
    }

    // Validate required fields
    if (
      !updatedFormData.firstName ||
      !updatedFormData.lastName ||
      (!(updatedFormData.sameLodgeAsPrimary && primaryMasonData) && (!updatedFormData.grandLodge || !updatedFormData.lodgeName)) ||
      !updatedFormData.mobile ||
      !updatedFormData.email
    ) {
      showAlert(
        "Required Fields Missing", 
        "Please fill in all required Mason fields including name, lodge information, mobile number, and email address.",
        "warning"
      )
      return
    }

    onSubmit(updatedFormData as MasonAttendee)

    if (!initialData && attendeeType === "additional") {
      setFormData({
        type: "mason",
        id: uuidv4(),
        masonicTitle: "Bro" as MasonicTitle,
        rank: "MM" as MasonicRank,
        hasPartner: false,
        dietaryRequirements: "",
        isPrimaryAttendee: false,
      })
      setShowPartnerForm(false)
      setSameLodge(false)
    }
  }

  const handleTogglePartnerForm = () => {
    const newShowPartnerForm = !showPartnerForm
    setShowPartnerForm(newShowPartnerForm)
    setFormData((prev) => ({ ...prev, hasPartner: newShowPartnerForm }))
    if (!newShowPartnerForm) {
      setFormData((prev) => {
        const { partner, ...rest } = prev
        return rest
      })
    }
  }

  const handlePartnerSubmit = (partnerData: PartnerAttendee) => {
    setFormData((prev) => ({
      ...prev,
      hasPartner: true,
      partner: {
        ...partnerData,
        id: prev.partner?.id || partnerData.id || uuidv4(),
      }
    }));
    addAdditionalAttendee(partnerData);
  }

  const handleSameLodgeChange = (checked: boolean | "indeterminate") => {
    if (typeof checked === 'boolean') {
      setSameLodge(checked)
      if (checked && primaryMasonData) {
        setFormData((prev) => ({
          ...prev,
          grandLodge: primaryMasonData.grandLodge,
          lodgeName: primaryMasonData.lodgeName,
          lodgeNumber: primaryMasonData.lodgeNumber,
        }))
      } else {
        setFormData((prev) => ({
          ...prev,
          grandLodge: initialData?.grandLodge || "",
          lodgeName: initialData?.lodgeName || "",
          lodgeNumber: initialData?.lodgeNumber || "",
        }))
      }
    }
  }

  const formTitle = attendeeType === "primary" ? "Primary Attendee Details" : "Add Additional Mason"
  const submitButtonText = initialData ? "Update Mason" : (attendeeType === "primary" ? "Confirm Primary Attendee" : "Add Mason")

  return (
    <>
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">{formTitle}</h2>
            {onFormClose && attendeeType === "additional" && (
              <Button variant="ghost" size="sm" onClick={onFormClose} aria-label="Close form">
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-12">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="masonicTitle">Masonic Title</Label>
                <Select
                  value={formData.masonicTitle}
                  onValueChange={(value) => handleChange("masonicTitle", value as MasonicTitle)}
                >
                  <SelectTrigger id="masonicTitle"><SelectValue placeholder="Select title" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bro">Bro</SelectItem>
                    <SelectItem value="W Bro">W Bro</SelectItem>
                    <SelectItem value="VW Bro">VW Bro</SelectItem>
                    <SelectItem value="RW Bro">RW Bro</SelectItem>
                    <SelectItem value="MW Bro">MW Bro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-3">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" value={formData.firstName || ""} onChange={(e) => handleChange("firstName", e.target.value)} required />
              </div>
              <div className="space-y-2 md:col-span-3">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" value={formData.lastName || ""} onChange={(e) => handleChange("lastName", e.target.value)} required />
              </div>
              <div className="space-y-2 md:col-span-4">
                <Label htmlFor="rank">Masonic Rank</Label>
                <Select value={formData.rank} onValueChange={(value) => handleChange("rank", value as MasonicRank)}>
                  <SelectTrigger id="rank"><SelectValue placeholder="Select rank" /></SelectTrigger>
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
              <div className="grid gap-4 md:grid-cols-12 p-4 bg-muted/50 rounded-lg">
                <div className="space-y-2 md:col-span-3">
                  <Label htmlFor="grandRank">Grand Rank</Label>
                  <Input id="grandRank" value={formData.grandRank || ""} onChange={(e) => handleChange("grandRank", e.target.value)} placeholder="e.g. PSGW" maxLength={10} />
                  <p className="text-xs text-muted-foreground">Max 10 characters</p>
                </div>
                <div className="space-y-2 md:col-span-3">
                  <Label htmlFor="grandOfficerStatus">Grand Officer Status</Label>
                  <Select value={formData.grandOfficerStatus} onValueChange={(value) => handleChange("grandOfficerStatus", value as GrandOfficerStatus)}>
                    <SelectTrigger id="grandOfficerStatus"><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Past">Past</SelectItem>
                      <SelectItem value="Present">Present</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.grandOfficerStatus === "Present" && (
                  <div className="space-y-2 md:col-span-3">
                    <Label htmlFor="presentGrandOfficerRole">Present Grand Officer Role</Label>
                    <Select value={formData.presentGrandOfficerRole} onValueChange={(value) => handleChange("presentGrandOfficerRole", value as PresentGrandOfficerRole)}>
                      <SelectTrigger id="presentGrandOfficerRole"><SelectValue placeholder="Select role" /></SelectTrigger>
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
                {formData.presentGrandOfficerRole === "Other" && formData.grandOfficerStatus === "Present" && (
                  <div className="space-y-2 md:col-span-3">
                    <Label htmlFor="otherGrandOfficerRole">Specify Other Role</Label>
                    <Input id="otherGrandOfficerRole" value={formData.otherGrandOfficerRole || ""} onChange={(e) => handleChange("otherGrandOfficerRole", e.target.value)} placeholder="Enter role" />
                  </div>
                )}
              </div>
            )}

            {attendeeType === "additional" && primaryMasonData && (
              <div className="flex items-center space-x-2 my-4">
                <Checkbox id="sameLodge" checked={sameLodge} onCheckedChange={handleSameLodgeChange} />
                <Label htmlFor="sameLodge" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Same Grand Lodge & Lodge Name/No. as Primary Attendee?
                </Label>
              </div>
            )}

            {!(attendeeType === "additional" && sameLodge && primaryMasonData) && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="grandLodge">Grand Lodge</Label>
                  <Input id="grandLodge" value={formData.grandLodge || ""} onChange={(e) => handleChange("grandLodge", e.target.value)} placeholder="e.g. UGL of NSW & ACT" required={!(attendeeType === "additional" && sameLodge)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lodgeName">Lodge Name & No.</Label>
                  <Input id="lodgeName" value={formData.lodgeName || ""} onChange={(e) => handleChange("lodgeName", e.target.value)} placeholder="e.g. Lodge Commonwealth No. 400" required={!(attendeeType === "additional" && sameLodge)} />
                </div>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" value={formData.email || ""} onChange={(e) => handleChange("email", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mobile">Mobile Number</Label>
                <Input id="mobile" value={formData.mobile || ""} onChange={(e) => handleChange("mobile", e.target.value)} required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dietaryRequirements">Dietary Requirements (optional)</Label>
              <Textarea id="dietaryRequirements" value={formData.dietaryRequirements || ""} onChange={(e) => handleChange("dietaryRequirements", e.target.value)} placeholder="e.g. Vegetarian, Gluten-free" />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="hasPartner" className="text-base font-medium">Bringing a Partner?</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleTogglePartnerForm} className="flex items-center">
                  {showPartnerForm ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                  {showPartnerForm ? "Cancel Partner" : "Add Partner"}
                </Button>
              </div>
              {showPartnerForm && (
                <Card className="bg-muted/30">
                  <CardContent className="pt-6">
                    <PartnerForm
                      onSubmit={handlePartnerSubmit}
                      initialData={formData.partner}
                      relatedAttendeeId={formData.id!}
                      onFormClose={() => setShowPartnerForm(false)}
                    />
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              {onFormClose && attendeeType === "additional" && !initialData && (
                <Button type="button" variant="outline" onClick={onFormClose}>Cancel</Button>
              )}
              <Button type="button" onClick={handleSaveChanges}>{submitButtonText}</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertModal
        isOpen={alertModalOpen}
        onClose={() => setAlertModalOpen(false)}
        title={alertModalData.title}
        description={alertModalData.description}
        variant={alertModalData.variant}
        actionLabel="OK"
        cancelLabel="Cancel"
      />
    </>
  )
}