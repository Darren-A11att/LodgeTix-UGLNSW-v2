# TODO-001: Authentication and Organization Check

## Overview
Set up authentication flow to ensure only users with an organization can access the organizer portal.

## Acceptance Criteria
- [ ] Check if user is authenticated
- [ ] Verify user has an associated organization
- [ ] Redirect to login if not authenticated
- [ ] Show "No organization" message if user has no org
- [ ] Store organization in context for use throughout app

## Technical Requirements
- Use Supabase auth
- Query user_roles and organisations tables
- Create auth wrapper component
- Handle loading states

## Why This First
Cannot show any data without knowing who the user is and which organization they belong to.

## Definition of Done
- Authenticated users can access portal
- Non-organizers see appropriate message
- Organization data available to all child components