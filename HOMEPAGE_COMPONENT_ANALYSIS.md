# Comprehensive Homepage Component Analysis

## 1. Navigation/Header Component Analysis

### LayoutWithFooter Component
**Location**: `/components/ui/layout-with-footer.tsx`
**Type**: Client Component

#### Header Element (Non-Homepage Pages)
```tsx
<header className="sticky top-0 w-full flex-shrink-0 z-40 flex h-14 items-center justify-between border-b bg-white px-4 md:px-6">
```

**Tailwind Classes & CSS Values**:
- `sticky` → position: sticky
- `top-0` → top: 0
- `w-full` → width: 100%
- `flex-shrink-0` → flex-shrink: 0
- `z-40` → z-index: 40
- `flex` → display: flex
- `h-14` → height: 3.5rem (56px)
- `items-center` → align-items: center
- `justify-between` → justify-content: space-between
- `border-b` → border-bottom-width: 1px
- `bg-white` → background-color: rgb(255 255 255)
- `px-4` → padding-left: 1rem; padding-right: 1rem (16px)
- `md:px-6` → @media (min-width: 768px) { padding-left: 1.5rem; padding-right: 1.5rem (24px) }

#### Logo Link
```tsx
<Link href="/" className="flex items-center">
  <TicketIcon className="mr-2 h-5 w-5 text-masonic-navy" />
  <span className="font-bold">LodgeTix</span>
</Link>
```

**Icon Component**:
- Component: `TicketIcon` from `lucide-react`
- Classes: `mr-2 h-5 w-5 text-masonic-navy`
- CSS: margin-right: 0.5rem; height: 1.25rem; width: 1.25rem; color: masonic-navy

**Text Content**:
- Static text: "LodgeTix"
- Classes: `font-bold` → font-weight: 700

#### Conditional Rendering Logic
- `shouldShowHeader`: Shows on all pages EXCEPT:
  - Homepage (`pathname === '/'`)
  - Registration wizard pages (contains `/register/`)
  - Organiser pages (starts with `/organiser`)

### MainNav Component
**Location**: `/components/navigation/main-nav.tsx`
**Type**: Client Component

#### Navigation Links
```tsx
<nav className="flex items-center space-x-6">
```

**CSS**: 
- `flex` → display: flex
- `items-center` → align-items: center
- `space-x-6` → margin-left: 1.5rem (except first child)

**Links** (All Static):
1. **Home**
   - href: "/"
   - Classes: `text-sm font-medium hover:underline hover:underline-offset-4`
   
2. **Functions**
   - href: "/functions"
   - Same classes as above
   
3. **About**
   - href: "/about"
   - Same classes as above
   
4. **Contact**
   - href: "/contact"
   - Same classes as above

**Link CSS**:
- `text-sm` → font-size: 0.875rem; line-height: 1.25rem
- `font-medium` → font-weight: 500
- `hover:underline` → text-decoration-line: underline (on hover)
- `hover:underline-offset-4` → text-underline-offset: 4px (on hover)

## 2. Footer Component Analysis

**Location**: `/components/ui/footer.tsx`
**Type**: Server Component

### Main Footer Container
```tsx
<footer className="bg-masonic-navy py-12 text-gray-300">
```

**CSS**:
- `bg-masonic-navy` → custom color (likely dark blue)
- `py-12` → padding-top: 3rem; padding-bottom: 3rem (48px)
- `text-gray-300` → color: rgb(209 213 219)

### Grid Layout
```tsx
<div className="grid gap-8 md:grid-cols-4">
```

**CSS**:
- `grid` → display: grid
- `gap-8` → gap: 2rem (32px)
- `md:grid-cols-4` → @media (min-width: 768px) { grid-template-columns: repeat(4, minmax(0, 1fr)) }

### Footer Sections

#### Section 1: Brand
**Content**:
- Title: "LodgeTix" (static)
- Description: "Official ticketing platform for the Grand Installation." (static)
- External Link: "Visit masons.au" → https://www.masons.au
- Icon: `ExternalLink` from `lucide-react`

#### Section 2: Event Information
**Dynamic Content** (uses `eventSlug` parameter):
- Default slug: 'grand-proclamation-2025'
- Links use dynamic slug: `/functions/${slug}`

#### Section 3: For Attendees
**Mixed Content**:
- Dynamic: Purchase Tickets link uses slug
- Static: My Tickets → "/customer/tickets"
- Dynamic: FAQs link uses slug
- Static: Contact Us → "/contact"

#### Section 4: Legal
**All Static Links**:
- Terms & Conditions → "/terms"
- Privacy Policy → "/privacy"
- Refund Policy → "/refund-policy"

### Copyright
```tsx
<p>&copy; {new Date().getFullYear()} United Grand Lodge of NSW & ACT. All rights reserved.</p>
```
**Dynamic**: Current year via `new Date().getFullYear()`

## 3. Meta Tags and SEO Elements

### From Root Layout (`/app/layout.tsx`)
```tsx
export const metadata: Metadata = {
  title: 'Grand Proclamation 2025 | United Grand Lodge of NSW & ACT',
  description: 'Created with v0',
  generator: ';)',
}
```

**SEO Elements**:
- Title: Static (should be dynamic)
- Description: Placeholder (needs update)
- Language: `<html lang="en">`

### External Scripts
```html
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"></script>
```
**Purpose**: Cloudflare Turnstile CAPTCHA integration

## 4. Mobile Menu Variations

### MobileAppLayout Component
**Location**: `/components/ui/mobile-app-layout.tsx`
**Type**: Client Component

#### Mobile Header
```tsx
<header className="flex h-14 flex-shrink-0 items-center justify-between border-b bg-white px-4 shadow-sm">
```

**Additional Classes vs Desktop**:
- `shadow-sm` → box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05)

#### Mobile Menu Button
```tsx
<Button
  variant="ghost"
  size="icon"
  onClick={handleMenuToggle}
  aria-label="Toggle navigation menu"
>
  <Menu className="h-6 w-6" />
</Button>
```

**Icon**: `Menu` from `lucide-react`
**Accessibility**: `aria-label="Toggle navigation menu"`

#### Mobile-Specific Layout
- Scrollable main content: `flex-grow overflow-y-auto p-4`
- Optional fixed footer for actions
- Full height: `h-screen`

## 5. Error States and Fallback Content

### Global Error (`/app/global-error.tsx`)
**Type**: Client Component

**UI Structure**:
```tsx
<div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
  <div className="bg-white shadow-lg rounded-lg max-w-lg w-full p-8 text-center">
```

**Content**:
- Title: "Something went wrong" (static)
- Message: "We apologize for the inconvenience. Please try again or contact support if the issue persists." (static)
- Button: "Try again" with error reset functionality

**Error Handling**:
- Captures errors with Sentry
- Logs to console
- Provides reset mechanism with fallback to page reload

### 404 Not Found (`/app/not-found.tsx`)
**Type**: Server Component

**Content**:
- Title: "404" (static)
- Subtitle: "Page Not Found" (static)
- Message: "The page you're looking for doesn't exist or has been moved." (static)
- Button: "Return Home" → links to "/"

## 6. Loading States

### Global Loading (`/app/loading.tsx`)
```tsx
export default function Loading() {
  return null
}
```
**Note**: Returns null - no visible loading state

### Skeleton Component (`/components/ui/skeleton.tsx`)
```tsx
<div className={cn("animate-pulse rounded-md bg-muted", className)} />
```

**CSS**:
- `animate-pulse` → CSS animation for pulsing effect
- `rounded-md` → border-radius: 0.375rem
- `bg-muted` → background from theme

## 7. Analytics and Tracking

### Sentry Error Tracking
**Client Configuration** (`/instrumentation-client.ts`):
- DSN: Production Sentry endpoint
- Integrations: Replay integration
- Sample Rates:
  - Traces: 5% (dev) / 10% (prod)
  - Replay Sessions: 1% (dev) / 2% (prod)
  - Error Replays: 100%

### Cloudflare Turnstile
- Script loaded in root layout
- Used for bot protection/CAPTCHA

## 8. Icon Components Inventory

### From lucide-react:
1. **TicketIcon** - Header logo (layout-with-footer.tsx)
2. **Menu** - Mobile menu toggle (mobile-app-layout.tsx)
3. **ExternalLink** - Footer external link indicator
4. **Square** - Masonic logo component
5. **Compass** - Masonic logo component

### Custom Components:
1. **MasonicLogo** (`/components/masonic-logo.tsx`)
   - Sizes: sm (32px), md (48px), lg (64px)
   - Combines Square + Compass + "G" letter
   - Colors: blue-700, blue-800, blue-900

## 9. Responsive Breakpoints

### Breakpoints Used:
- `md:` → 768px and up
  - Header padding changes from px-4 to px-6
  - Footer grid changes from 1 column to 4 columns

## 10. Dynamic vs Static Content Summary

### Dynamic Elements:
1. Footer copyright year
2. Footer event slug (with fallback)
3. Page visibility logic (header/footer conditionals)
4. Error handling and reset functions

### Static Elements:
1. All navigation links and text
2. Error messages
3. Brand name "LodgeTix"
4. Legal links
5. Meta tags (should be dynamic)

### Database Sources:
- Event slug could come from `functions.slug`
- No other database connections in these layout components

## 11. Key Findings & Recommendations

1. **SEO**: Meta tags are static and need to be made dynamic
2. **Loading State**: No visible loading indicator
3. **Mobile Navigation**: Uses sidebar/sheet pattern (not visible in analyzed code)
4. **Accessibility**: Good aria-label usage on mobile menu
5. **Error Handling**: Comprehensive with Sentry integration
6. **Color Scheme**: Uses custom `masonic-navy` and `masonic-gold` colors