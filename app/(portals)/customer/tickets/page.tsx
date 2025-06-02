import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Ticket } from "lucide-react"

export default function MyTicketsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Ticket className="h-6 w-6 text-masonic-navy" />
              <CardTitle>My Tickets</CardTitle>
            </div>
            <CardDescription>
              View and manage your event tickets
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center py-12">
            <p className="text-gray-600 mb-6">
              You don't have any tickets yet.
            </p>
            <Button asChild>
              <Link href="/functions">Browse Events</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}