"use client"

import { useState } from "react"
import Link from "next/link"
import { BarChart3, Calendar, CreditCard, LayoutDashboard, LogOut, Plus, Settings, Ticket, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface OrganizerDashboardClientProps {
  events: Array<{
    id: string
    title: string
    date: string
    status: string
    ticketsSold: number
    revenue: string
  }>
}

export default function OrganizerDashboardClient({ events }: OrganizerDashboardClientProps) {
  const [activeTab, setActiveTab] = useState("overview")

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="hidden w-64 flex-col bg-white shadow-sm md:flex">
        <div className="flex h-14 items-center border-b px-4">
          <Link href="/" className="flex items-center">
            <Ticket className="mr-2 h-5 w-5 text-purple-600" />
            <span className="font-bold">LodgeTix</span>
          </Link>
        </div>
        <div className="flex flex-1 flex-col justify-between p-4">
          <nav className="space-y-1">
            <Link
              href="/organizer/dashboard"
              className="flex items-center rounded-md bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700"
            >
              <LayoutDashboard className="mr-3 h-5 w-5" />
              Dashboard
            </Link>
            <Link
              href="/organizer/events"
              className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              <Calendar className="mr-3 h-5 w-5" />
              Lodge Events
            </Link>
            <Link
              href="/organizer/tickets"
              className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              <Ticket className="mr-3 h-5 w-5" />
              Tickets
            </Link>
            <Link
              href="/organizer/attendees"
              className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              <Users className="mr-3 h-5 w-5" />
              Brethren
            </Link>
            <Link
              href="/organizer/analytics"
              className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              <BarChart3 className="mr-3 h-5 w-5" />
              Analytics
            </Link>
            <Link
              href="/organizer/payments"
              className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              <CreditCard className="mr-3 h-5 w-5" />
              Payments
            </Link>
            <Link
              href="/organizer/settings"
              className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              <Settings className="mr-3 h-5 w-5" />
              Settings
            </Link>
          </nav>
          <div className="mt-auto pt-4">
            <div className="flex items-center justify-between rounded-md px-3 py-2">
              <div className="flex items-center">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder.svg?height=32&width=32" alt="User" />
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                <div className="ml-3">
                  <p className="text-sm font-medium">John Doe</p>
                  <p className="text-xs text-gray-500">john@example.com</p>
                </div>
              </div>
              <button className="text-gray-400 hover:text-gray-500">
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-white px-4 md:px-6">
          <div className="flex items-center md:hidden">
            <Ticket className="mr-2 h-5 w-5 text-blue-600" />
            <span className="font-bold">LodgeTix</span>
          </div>
          <div className="ml-auto flex items-center gap-4">
            <Button asChild className="bg-blue-700 hover:bg-blue-800">
              <Link href="/organizer/create-event">
                <Plus className="mr-2 h-4 w-4" /> Create Event
              </Link>
            </Button>
            <Avatar className="h-8 w-8 md:hidden">
              <AvatarImage src="/placeholder.svg?height=32&width=32" alt="User" />
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
          </div>
        </header>

        <main className="p-4 md:p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Lodge Dashboard</h1>
            <p className="text-gray-500">Welcome back, W.Bro. John! Here's what's happening with your Lodge events.</p>
          </div>

          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="events">Events</TabsTrigger>
              <TabsTrigger value="sales">Sales</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {/* Stats Cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                    <Calendar className="h-4 w-4 text-gray-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">3</div>
                    <p className="text-xs text-gray-500">+1 from last month</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Tickets Sold</CardTitle>
                    <Ticket className="h-4 w-4 text-gray-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">1,495</div>
                    <p className="text-xs text-gray-500">+350 from last month</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <CreditCard className="h-4 w-4 text-gray-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">$261,000</div>
                    <p className="text-xs text-gray-500">+$52,500 from last month</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Attendees</CardTitle>
                    <Users className="h-4 w-4 text-gray-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">1,280</div>
                    <p className="text-xs text-gray-500">+305 from last month</p>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Events */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Events</CardTitle>
                  <CardDescription>Your recently created and upcoming events</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {events.map((event) => (
                      <div key={event.id} className="flex items-center justify-between rounded-lg border p-4">
                        <div>
                          <h3 className="font-medium">{event.title}</h3>
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="mr-1 h-3 w-3" />
                            <span>{event.date}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="font-medium">{event.ticketsSold} tickets</div>
                            <div className="text-sm text-gray-500">{event.revenue}</div>
                          </div>
                          <div
                            className={`rounded-full px-2 py-1 text-xs ${
                              event.status === "Published" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {event.status}
                          </div>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/organizer/events/${event.id}`}>View</Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="events" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Your Events</CardTitle>
                    <Button asChild size="sm">
                      <Link href="/organizer/create-event">
                        <Plus className="mr-2 h-4 w-4" /> Create Event
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {events.map((event) => (
                      <div key={event.id} className="flex items-center justify-between rounded-lg border p-4">
                        <div>
                          <h3 className="font-medium">{event.title}</h3>
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="mr-1 h-3 w-3" />
                            <span>{event.date}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div
                            className={`rounded-full px-2 py-1 text-xs ${
                              event.status === "Published" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {event.status}
                          </div>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/organizer/events/${event.id}/edit`}>Edit</Link>
                          </Button>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/organizer/events/${event.id}`}>View</Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sales" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Sales Overview</CardTitle>
                  <CardDescription>Your ticket sales and revenue</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-8">
                    {events
                      .filter((e) => e.status === "Published")
                      .map((event) => (
                        <div key={event.id} className="space-y-2">
                          <h3 className="font-medium">{event.title}</h3>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Tickets Sold</span>
                            <span className="font-medium">{event.ticketsSold}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Revenue</span>
                            <span className="font-medium">{event.revenue}</span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                            <div
                              className="h-full bg-purple-600"
                              style={{ width: `${Math.min(event.ticketsSold / 15, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}
