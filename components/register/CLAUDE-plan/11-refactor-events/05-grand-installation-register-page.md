# Grand Installation Registration Page (`/app/events/grand-installation/register/page.tsx`)

## Page Type: Client Component

This page is implemented as a Next.js client component using the "use client" directive. It does not fetch any data directly - instead, it renders the `RegistrationWizard` component which handles all registration logic.

## Implementation Details

This is a very simple component:

```typescript
"use client"

import { RegistrationWizard } from "../../../../components/register/RegistrationWizard/registration-wizard"
import Link from "next/link"
import { TicketIcon } from "lucide-react"

export default function RegistrationPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header>...</header>
      <main className="container mx-auto py-8 flex-grow">
        <RegistrationWizard />
      </main>
      <footer>...</footer>
    </div>
  )
}
```

## Data Source

This page does not fetch any data directly. All data fetching occurs within the `RegistrationWizard` component, which likely handles:

1. Form state management
2. Step navigation
3. Data validation
4. API communication

## Hard-coded Constants

The page contains several hard-coded elements:

1. UI Layout:
   - Header with LodgeTix logo
   - Link to "/events/grand-installation" for back navigation
   - Footer with copyright notice

2. Styling:
   - `text-masonic-navy` - Masonic-themed color styles
   - `bg-masonic-navy` - Background color for footer

## Dynamic Elements

Only one dynamic value is used:
- `{new Date().getFullYear()}` - Current year for copyright notice

## Rendering Pattern

The page follows this simple pattern:
1. Renders a container with header, main content, and footer
2. Includes the `RegistrationWizard` component to handle all registration logic
3. Provides standard navigation links

## Dependencies

This page depends on the following components:
- `RegistrationWizard` from `/components/register/RegistrationWizard/registration-wizard`

## Client-side Features

Since this is a client component, it can utilize:
- React hooks
- Browser APIs
- Interactive event handlers
- Client-side routing