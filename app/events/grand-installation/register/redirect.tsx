import { redirect } from "next/navigation"
import { getEventByIdOrSlug } from "@/lib/event-facade"

// This redirect is currently disabled to allow the registration wizard flow
// Instead, we'll keep this file to avoid breaking imports but won't perform redirection

export default async function GrandInstallationRegisterRedirect() {
  // Commented out redirect logic to allow registration wizard flow
  /*
  // Fetch the grand installation event by slug
  const event = await getEventByIdOrSlug("grand-installation-2025")
  
  if (event) {
    // Redirect to the dynamic event registration page
    redirect(`/events/${event.slug || event.id}/tickets`)
  }
  
  // If event not found, redirect to home
  redirect('/')
  */
  
  // Allow the request to continue to the registration wizard
  return null;
}