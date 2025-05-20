import { redirect } from "next/navigation"
import { getEventByIdOrSlug } from "@/lib/event-facade"

export default async function GrandInstallationRegisterRedirect() {
  // Fetch the grand installation event by slug
  const event = await getEventByIdOrSlug("grand-installation-2025")
  
  if (event) {
    // Redirect to the dynamic event registration page
    redirect(`/events/${event.slug || event.id}/tickets`)
  }
  
  // If event not found, redirect to home
  redirect('/')
}