import { redirect } from "next/navigation"
import { getEventByIdOrSlug } from "@/lib/event-facade"

export default async function GrandInstallationPage() {
  // Fetch the grand installation event by slug
  const event = await getEventByIdOrSlug("grand-installation-2025")
  
  if (event) {
    // Redirect to the dynamic event page
    redirect(`/events/${event.slug || event.id}`)
  }
  
  // If event not found, redirect to home
  redirect('/')
}