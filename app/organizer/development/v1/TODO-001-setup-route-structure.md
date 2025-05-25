# TODO-001: Setup Organizer Route Structure

## Overview
Create the basic Next.js route structure for the organizer portal under `/app/organizer/(auth)/` directory.

## Acceptance Criteria
- [ ] Create `(auth)` route group for protected pages
- [ ] Create `layout.tsx` with authentication check
- [ ] Create `dashboard/page.tsx` as landing page
- [ ] Create `events/page.tsx` for event listing
- [ ] Create `registrations/page.tsx` for registration listing
- [ ] Redirect unauthenticated users to login

## Technical Requirements
- Use Next.js App Router conventions
- Implement server-side auth check using Supabase
- Return 401 for unauthorized access
- Use existing auth patterns from main app

## Dependencies
- Existing Supabase auth setup
- User must have organizer role

## Definition of Done
- Routes are accessible when authenticated
- Unauthenticated users redirected to login
- Basic page components render without errors