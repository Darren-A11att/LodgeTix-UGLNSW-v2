"use client"

import { RegistrationWizard } from "../../../../components/register/RegistrationWizard/registration-wizard"

export default function RegistrationPage() {
  // Hardcoded event ID for Grand Installation 2025
  // This should ideally be fetched dynamically based on the route
  const eventId = "d290f1ee-6c54-4b01-90e6-d701748f0855"
  
  return <RegistrationWizard eventId={eventId} />
}
