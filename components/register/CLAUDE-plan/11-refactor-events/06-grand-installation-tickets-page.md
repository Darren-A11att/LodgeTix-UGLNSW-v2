# Grand Installation Tickets Page (`/app/events/grand-installation/tickets/page.tsx`)

## Page Type: Client Component

This page is implemented as a Next.js client component using the "use client" directive. Unlike the generic tickets page, this specialized Grand Installation tickets page has hard-coded ticket data and form fields.

## Implementation Details

The page includes a complete ticket selection and checkout flow with client-side state management:

```typescript
"use client"

export default function TicketsPage() {
  const router = useRouter()
  const [selectedTickets, setSelectedTickets] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(false)

  // Hard-coded ticket data and form handlers
  // ...
}
```

## Data Source

### Ticket Data
All ticket data is **hard-coded** directly in the component:

```typescript
const tickets = [
  {
    id: "installation",
    name: "Installation Ceremony",
    price: 75,
    available: true,
    description: "Admission to the Grand Installation Ceremony at Sydney Masonic Centre",
  },
  {
    id: "banquet",
    name: "Grand Banquet",
    price: 150,
    available: true,
    description: "Formal dinner with wine at Hilton Sydney (Black Tie)",
  },
  // More tickets...
]
```

### Form Data
All form fields are hard-coded, including:
- Personal information fields (name, email, phone)
- Masonic information (lodge, rank, jurisdiction)
- Dietary requirements
- Payment options

## Hard-coded Constants

The page contains numerous hard-coded elements:

1. Ticket information:
   - Ticket types, prices, and descriptions
   - Event date and location ("Saturday, 25 November 2023 • Sydney Masonic Centre")

2. Form fields:
   - Input field labels and placeholders
   - Masonic rank options in dropdown
   - Grand Lodge jurisdictions in dropdown
   - Dietary requirement options

3. Payment UI:
   - Payment method options
   - Card details form fields

4. Visual elements:
   - Masonic-themed styling (`bg-masonic-navy`, `border-masonic-lightgold`, etc.)
   - Informational text about ticket policies

## Client-side State

The page manages several pieces of client-side state:
- `selectedTickets` - Record of ticket IDs to quantities
- `isLoading` - Loading state for payment submission

## Functions/Handlers

The page includes several client-side functions:
- `handleTicketChange()` - Updates ticket quantities
- `handleSubmit()` - Simulates payment processing with a timeout
- Utility calculations for total tickets and price

## Rendering Pattern

The page follows this pattern:
1. Renders a header with navigation back to the event
2. Shows event title, date, and location
3. Displays ticket options with quantity selectors
4. Conditionally renders attendee and payment forms when tickets are selected
5. Shows an order summary sidebar
6. Handles form submission with simulated payment processing

## Mock API Calls

The page includes a simulated payment processing flow that redirects to the confirmation page:

```typescript
const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault()
  setIsLoading(true)

  // Simulate payment processing
  setTimeout(() => {
    setIsLoading(false)
    router.push("/events/grand-installation/confirmation")
  }, 1500)
}
```

This would be replaced by actual API calls in production.