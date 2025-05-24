import { redirect } from 'next/navigation'

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  // Redirect /register to /tickets for the registration wizard
  redirect(`/events/${id}/tickets`)
}