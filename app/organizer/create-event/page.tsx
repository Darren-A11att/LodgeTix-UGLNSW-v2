"use client"

import React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Calendar, Clock, DollarSign, MapPin, Ticket, Upload, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function CreateEventPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate event creation
    setTimeout(() => {
      setIsLoading(false)
      router.push("/organizer/dashboard")
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-white px-4 md:px-6">
        <Link href="/organizer/dashboard" className="flex items-center">
          <Ticket className="mr-2 h-5 w-5 text-blue-600" />
          <span className="font-bold">LodgeTix</span>
        </Link>
        <div className="flex items-center gap-4">
          <Button variant="outline" asChild>
            <Link href="/organizer/dashboard">Cancel</Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Create New Event</h1>
          <p className="text-gray-500">Fill in the details to create your event</p>
        </div>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basic" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="tickets">Tickets</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>Provide the basic details about your event</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Event Title</Label>
                    <Input id="title" placeholder="e.g. Tech Conference 2023" required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select defaultValue="lodge-meeting">
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lodge-meeting">Lodge Meeting</SelectItem>
                        <SelectItem value="degree-ceremony">Degree Ceremony</SelectItem>
                        <SelectItem value="installation">Installation</SelectItem>
                        <SelectItem value="festive-board">Festive Board</SelectItem>
                        <SelectItem value="lecture">Lecture</SelectItem>
                        <SelectItem value="charity">Charity Event</SelectItem>
                        <SelectItem value="ladies-night">Ladies Night</SelectItem>
                        <SelectItem value="social">Social Event</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Start Date</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                        <Input id="startDate" type="date" className="pl-10" required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="startTime">Start Time</Label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                        <Input id="startTime" type="time" className="pl-10" required />
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="endDate">End Date</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                        <Input id="endDate" type="date" className="pl-10" required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endTime">End Time</Label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                        <Input id="endTime" type="time" className="pl-10" required />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                      <Input id="location" placeholder="Venue name or address" className="pl-10" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="degreeType">Degree Type (if applicable)</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select if this is a degree ceremony" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Not Applicable</SelectItem>
                        <SelectItem value="first">First Degree (Entered Apprentice)</SelectItem>
                        <SelectItem value="second">Second Degree (Fellow Craft)</SelectItem>
                        <SelectItem value="third">Third Degree (Master Mason)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dresscode">Dress Code</Label>
                    <Select defaultValue="dark">
                      <SelectTrigger>
                        <SelectValue placeholder="Select dress code" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dark">Dark Suit</SelectItem>
                        <SelectItem value="morning">Morning Suit</SelectItem>
                        <SelectItem value="casual">Smart Casual</SelectItem>
                        <SelectItem value="white">White Tie</SelectItem>
                        <SelectItem value="black">Black Tie</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="regalia">Regalia Requirements</Label>
                    <Select defaultValue="craft">
                      <SelectTrigger>
                        <SelectValue placeholder="Select regalia requirements" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="craft">Craft</SelectItem>
                        <SelectItem value="provincial">Provincial</SelectItem>
                        <SelectItem value="royal-arch">Royal Arch</SelectItem>
                        <SelectItem value="other">Other (specify in description)</SelectItem>
                        <SelectItem value="none">None</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Event Image</CardTitle>
                  <CardDescription>Upload a cover image for your event</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 p-12">
                    <div className="mb-4 rounded-full bg-gray-100 p-3">
                      <Upload className="h-6 w-6 text-gray-500" />
                    </div>
                    <div className="space-y-1 text-center">
                      <p className="text-sm font-medium">Drag and drop an image</p>
                      <p className="text-xs text-gray-500">PNG, JPG or GIF up to 5MB</p>
                    </div>
                    <Button variant="outline" size="sm" className="mt-4">
                      Browse Files
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button type="button" onClick={() => document.querySelector('[data-value="details"]')?.click()}>
                  Next: Event Details
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="details" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Event Details</CardTitle>
                  <CardDescription>Provide more information about your event</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe your event..."
                      className="min-h-[200px]"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="organizer">Organizer Name</Label>
                    <Input id="organizer" placeholder="Who is organizing this event?" required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">Contact Email</Label>
                    <Input id="contactEmail" type="email" placeholder="Email for attendee inquiries" required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactPhone">Contact Phone (Optional)</Label>
                    <Input id="contactPhone" type="tel" placeholder="Phone number for attendee inquiries" />
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.querySelector('[data-value="basic"]')?.click()}
                >
                  Back: Basic Info
                </Button>
                <Button type="button" onClick={() => document.querySelector('[data-value="tickets"]')?.click()}>
                  Next: Tickets
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="tickets" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Ticket Information</CardTitle>
                  <CardDescription>Set up ticket types and pricing for your event</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="rounded-lg border p-4">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="font-medium">General Admission</h3>
                      <Button variant="outline" size="sm">
                        Remove
                      </Button>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="ticketName">Ticket Name</Label>
                        <Input id="ticketName" defaultValue="General Admission" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ticketPrice">Price</Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                          <Input id="ticketPrice" type="number" defaultValue="99" className="pl-10" required />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ticketQuantity">Quantity Available</Label>
                        <Input id="ticketQuantity" type="number" defaultValue="100" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ticketEndDate">Sales End Date</Label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                          <Input id="ticketEndDate" type="date" className="pl-10" required />
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button type="button" variant="outline" className="w-full">
                    <Plus className="mr-2 h-4 w-4" /> Add Another Ticket Type
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Publish Settings</CardTitle>
                  <CardDescription>Choose how to publish your event</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <input type="radio" id="publishNow" name="publishOption" className="mt-1" defaultChecked />
                      <div>
                        <Label htmlFor="publishNow" className="font-medium">
                          Publish now
                        </Label>
                        <p className="text-sm text-gray-500">Make this event visible to all Brethren immediately</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <input type="radio" id="membersOnly" name="publishOption" className="mt-1" />
                      <div>
                        <Label htmlFor="membersOnly" className="font-medium">
                          Lodge members only
                        </Label>
                        <p className="text-sm text-gray-500">Only visible to members of your Lodge</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <input type="radio" id="publishLater" name="publishOption" className="mt-1" />
                      <div>
                        <Label htmlFor="publishLater" className="font-medium">
                          Save as draft
                        </Label>
                        <p className="text-sm text-gray-500">Save this event as a draft to publish later</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.querySelector('[data-value="details"]')?.click()}
                >
                  Back: Event Details
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Creating Event..." : "Create Event"}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </form>
      </main>
    </div>
  )
}
