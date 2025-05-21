"use client"

import type { Attendee } from "@/lib/registration-types"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { User, UserCheck, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface AttendeeCardProps {
  attendee: Attendee
  onRemove: (id: string) => void
}

export function AttendeeCard({ attendee, onRemove }: AttendeeCardProps) {
  const getAttendeeIcon = () => {
    switch (attendee.type) {
      case "mason":
        return <UserCheck className="h-5 w-5 text-masonic-navy" />
      case "guest":
        return <User className="h-5 w-5 text-masonic-navy" />
      case "partner":
        return <Users className="h-5 w-5 text-masonic-navy" />
    }
  }

  const getAttendeeTitle = () => {
    switch (attendee.type) {
      case "mason":
        return attendee.masonicTitle
      case "guest":
        return attendee.title
      case "partner":
        return attendee.title
    }
  }

  const getAttendeeTypeLabel = () => {
    switch (attendee.type) {
      case "mason":
        return "Mason"
      case "guest":
        return "Guest"
      case "partner":
        return "Partner"
    }
  }

  return (
    <Card className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm border-masonic-lightgold"
    )}>
      <CardContent className="pt-6 relative">
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-2 top-2 text-gray-500 hover:text-red-600"
          onClick={() => onRemove(attendee.id)}
        >
          Remove
        </Button>
        <div className="flex items-start">
          <div className="mr-3">{getAttendeeIcon()}</div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-medium">
                {getAttendeeTitle()} {attendee.firstName} {attendee.lastName}
              </h3>
              <Badge variant="outline" className="text-xs">
                {getAttendeeTypeLabel()}
              </Badge>
            </div>
            {attendee.type === "mason" && (
              <p className="text-sm text-gray-500">
                {attendee.lodgeName}
                {attendee.lodgeNumber && ` No. ${attendee.lodgeNumber}`}
              </p>
            )}
            {attendee.type === "partner" && <p className="text-sm text-gray-500">{attendee.relationship}</p>}
          </div>
        </div>

        {/* Show partner info if this attendee has a partner */}
        {attendee.type !== "partner" && attendee.hasPartner && attendee.partner && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center">
              <Users className="h-4 w-4 text-masonic-navy mr-2" />
              <p className="text-sm">
                <span className="font-medium">Partner:</span> {attendee.partner.title} {attendee.partner.firstName}{" "}
                {attendee.partner.lastName}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
