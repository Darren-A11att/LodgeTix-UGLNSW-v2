import React from "react"
import Link from "next/link"
import { Ticket } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LoginForm } from "@/components/auth/login-form"

export default function OrganizerLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center">
            <div className="mb-4 rounded-full bg-masonic-navy/10 p-3">
              <Ticket className="h-6 w-6 text-masonic-navy" />
            </div>
          </div>
          <CardTitle className="text-center text-2xl">Lodge Secretary Login</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access your lodge dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  )
}
