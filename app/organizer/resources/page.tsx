import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Download, BookOpen, Video } from "lucide-react"

export default function OrganizerResourcesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Organizer Resources</h1>
          
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-masonic-navy" />
                  <CardTitle className="text-lg">Event Planning Guide</CardTitle>
                </div>
                <CardDescription>
                  Complete guide to planning successful Masonic events
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-masonic-navy" />
                  <CardTitle className="text-lg">Best Practices</CardTitle>
                </div>
                <CardDescription>
                  Tips for maximizing attendance and engagement
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  Read Guide
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Video className="h-5 w-5 text-masonic-navy" />
                  <CardTitle className="text-lg">Video Tutorials</CardTitle>
                </div>
                <CardDescription>
                  Step-by-step walkthroughs of the platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  Watch Videos
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-masonic-navy" />
                  <CardTitle className="text-lg">Event Templates</CardTitle>
                </div>
                <CardDescription>
                  Pre-configured templates for common event types
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  Browse Templates
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-600 mb-4">
              Need additional help? Contact our organizer support team.
            </p>
            <Button asChild>
              <Link href="/contact">Contact Support</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}