# Homepage Component Analysis

## 1. Layout With Footer Component (`/components/ui/layout-with-footer.tsx`)

### Text Content
- **Static Text:**
  - "LodgeTix" (brand name in header)

### Images
- **Icons:**
  - TicketIcon from lucide-react (header logo)

### Buttons/Links
- **Links:**
  - Logo link to "/" (home)
  - Embedded MainNav component (navigation links)

### Dynamic Data Sources
- None directly - passes `eventSlug` to Footer component

### CSS/Tailwind Classes
- **Header:** `sticky top-0 w-full flex-shrink-0 z-40 flex h-14 items-center justify-between border-b bg-white px-4 md:px-6`
- **Logo:** `flex items-center`, `mr-2 h-5 w-5 text-masonic-navy`
- **Brand text:** `font-bold`

### Conditional Rendering Logic
- Shows header only if NOT on homepage, registration wizard, or organiser pages
- Shows footer if NOT on registration wizard
- Extracts `eventSlug` from URL pattern `/events/[slug]`

---

## 2. Hero Angled Design Component (`/components/hero-angled-design.tsx`)

### Text Content
- **Static Text:**
  - "LodgeTix" (brand name)
  - "United Grand Lodge of NSW & ACT official ticketing platform."
  - "Learn more →"
  - "Welcome to LodgeTix" (fallback title)
  - "Your premier destination for Masonic events and ticketing. Join us for memorable occasions and timeless traditions." (fallback description)
  - "Explore Events" (button)
  - "Log in" (navigation)
  - Navigation items: 'Events', 'About', 'Contact', 'Help'

- **Dynamic Text (from database):**
  - Event title
  - Event description
  - Event date and time
  - Event location (with 📍 emoji)
  - Organiser name
  - "Get Tickets" (when specific event is featured)

### Images
- **Static:**
  - MasonicLogo component (imported)
  - SVG polygon for angled design effect
  - Fallback image: `/placeholder.svg?height=800&width=800`
  
- **Dynamic:**
  - Event imageUrl from database

### Buttons/Links
- **Navigation Links:**
  - "/" (home/logo)
  - "/functions" (Events)
  - "/about" (About)
  - "/contact" (Contact)
  - "/help" (Help)
  - "/login" (Log in)

- **Action Buttons:**
  - "Explore Events" → `/functions`
  - "Learn more" → `/about`
  - "Get Tickets" → `/functions/[slug]/register` or `/functions`

### Dynamic Data Sources
- **Service:** `getHeroFunction()` from `@/lib/services/homepage-service`
- **Data fetched:**
  - title
  - description
  - date
  - time
  - location
  - imageUrl
  - slug
  - organiser

### CSS/Tailwind Classes
- **Container:** `bg-masonic-navy`
- **Header:** `absolute inset-x-0 top-0 z-50`
- **Text colors:** `text-white`, `text-masonic-gold`, `text-gray-300`
- **Buttons:** `bg-masonic-gold hover:bg-masonic-lightgold text-masonic-navy`, `border-masonic-gold bg-masonic-navy text-masonic-gold hover:bg-masonic-navy/80`
- **Image overlay:** `bg-masonic-blue/30`

### Conditional Rendering Logic
- Shows generic content if no `heroFunction` data
- Shows dynamic content with event details if data available
- Date/time shown only if both values exist

---

## 3. Sponsors Section Component (`/components/sponsors-section.tsx`)

### Text Content
- **Static Text:**
  - "Proudly supported by Masonic organizations across NSW & ACT"
  - Sponsor names (in alt text):
    - "United Grand Lodge of NSW & ACT"
    - "Masonic Care NSW"
    - "Freemasons Foundation"
    - "Royal Arch Chapter"
    - "Mark Master Masons"

### Images
- **All placeholder images:**
  - `/placeholder.svg?height=48&width=158&text=UGL`
  - `/placeholder.svg?height=48&width=158&text=Care`
  - `/placeholder.svg?height=48&width=158&text=Foundation`
  - `/placeholder.svg?height=48&width=158&text=Royal+Arch`
  - `/placeholder.svg?height=48&width=158&text=Mark`

### Buttons/Links
- None

### Dynamic Data Sources
- None - all data is hardcoded

### CSS/Tailwind Classes
- **Container:** `bg-gray-100 py-24 sm:py-32`
- **Heading:** `text-center text-lg/8 font-semibold text-masonic-navy`
- **Grid:** `grid max-w-lg grid-cols-4 items-center gap-x-8 gap-y-10 sm:max-w-xl sm:grid-cols-6 sm:gap-x-10 lg:mx-0 lg:max-w-none lg:grid-cols-5`
- **Images:** `h-12 w-full object-contain filter brightness-0 opacity-60 hover:opacity-80 transition-opacity`

### Conditional Rendering Logic
- None

---

## 4. Featured Events Redesigned Component (`/components/featured-events-redesigned.tsx`)

### Text Content
- **Static Text:**
  - "Featured Events"
  - "Experience the finest in Masonic tradition and fellowship. Join us for these carefully curated events that celebrate our heritage and strengthen our community bonds."
  - "View All Events →"
  - "View pricing" (price placeholder)
  - "Location TBA" (location fallback)
  - Fallback event titles and descriptions (hardcoded)

- **Dynamic Text:**
  - Event titles
  - Event descriptions
  - Event dates (formatted)
  - Event locations (formatted as "place_name, suburb, state")

### Images
- **Dynamic:**
  - Event image URLs from database
  - Fallback: `/placeholder.svg?height=400&width=1000`

### Buttons/Links
- **Links:**
  - "View All Events" → `/functions`
  - Individual event links use function slug

### Dynamic Data Sources
- **API Endpoint:** Direct Supabase REST API call
- **Query:** `events?function_id=eq.${FEATURED_FUNCTION_ID}&is_published=eq.true&order=event_start.asc&limit=2`
- **Joined data:** `locations(place_name,suburb,state)`
- **Environment variables:** 
  - `FEATURED_FUNCTION_ID`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### CSS/Tailwind Classes
- **Container:** `bg-white`
- **Heading:** `text-4xl font-semibold tracking-tight text-masonic-navy sm:text-5xl`
- **Description:** `text-lg text-gray-600`
- **Event layout:** Alternating left/right using grid system
- **Button:** `inline-flex items-center justify-center rounded-md bg-masonic-navy px-6 py-3 text-base font-medium text-white hover:bg-masonic-blue transition-colors`

### Conditional Rendering Logic
- Falls back to `FeaturedEventsRedesignedFallback` component if:
  - API call fails
  - No events returned
- Alternates event layout (left/right) based on index (even/odd)
- Shows location only if available

---

## 5. Location Info Section Component (`/components/location-info-section.tsx`)

### Text Content
- **Static Text:**
  - "Experience Excellence" (section label)
  - "Premium Venues, Perfect Experiences" (heading)
  - "Our events are hosted at carefully selected venues throughout NSW & ACT, ensuring every occasion meets the highest standards of quality, accessibility, and Masonic tradition." (description)
  - Feature names and descriptions:
    - "Prime Locations" - "Our events are held at prestigious venues across NSW & ACT, offering convenient access and parking for all attendees."
    - "Convenient Timing" - "Events are scheduled to accommodate working schedules, with both evening and weekend options available."
    - "Community Focused" - "Join a welcoming community of Masons and guests from across the region, building lasting friendships and connections."

### Images
- **Static:**
  - SVG icons (MapPinIcon, ClockIcon, UserGroupIcon) - inline components
  - Placeholder image: `/placeholder.svg?height=600&width=800&text=Lodge+Hall`

### Buttons/Links
- None

### Dynamic Data Sources
- None - all content is static

### CSS/Tailwind Classes
- **Container:** `overflow-hidden bg-masonic-navy py-24 sm:py-32`
- **Section label:** `text-base/7 font-semibold text-masonic-gold`
- **Heading:** `text-4xl font-semibold tracking-tight text-pretty text-white sm:text-5xl`
- **Description:** `text-lg/8 text-gray-300`
- **Feature list:** `space-y-8 text-base/7 text-gray-300`
- **Icons:** `size-5 text-masonic-gold`
- **Image:** `w-[48rem] max-w-none rounded-xl shadow-xl ring-1 ring-white/10`

### Conditional Rendering Logic
- None

---

## 6. CTA Section Component (`/components/cta-section.tsx`)

### Text Content
- **Static Text:**
  - "Join Our Community" (heading)
  - "Become part of a tradition that spans centuries. Experience the brotherhood, ceremony, and fellowship that makes Freemasonry a cornerstone of community life." (main description)
  - "From intimate lodge meetings to grand installations, our events offer opportunities to connect with like-minded individuals, participate in meaningful ceremonies, and contribute to charitable causes that make a difference in our communities." (secondary description)
  - "Explore Events →" (button text)

### Images
- **All placeholder images:**
  - `/placeholder.svg?height=400&width=592&text=Ceremony`
  - `/placeholder.svg?height=604&width=768&text=Lodge+Meeting`
  - `/placeholder.svg?height=842&width=1152&text=Charity+Work`
  - `/placeholder.svg?height=604&width=768&text=Historic+Lodge`

### Buttons/Links
- **Links:**
  - "Explore Events" button → `/functions`

### Dynamic Data Sources
- None - all content is static

### CSS/Tailwind Classes
- **Container:** `overflow-hidden bg-gray-100 py-32`
- **Heading:** `text-4xl font-semibold tracking-tight text-masonic-navy sm:text-5xl`
- **Descriptions:** `text-xl/8 text-gray-700`, `text-base/7 text-gray-600`
- **Button:** `bg-masonic-navy hover:bg-masonic-blue text-white`
- **Images:** Various aspect ratios with `rounded-2xl bg-gray-50 object-cover`

### Conditional Rendering Logic
- One image hidden on mobile: `hidden sm:block`

---

## Summary of Key Findings

### Color Palette Used
- `masonic-navy`
- `masonic-gold`
- `masonic-lightgold`
- `masonic-blue`
- `masonic-lightblue`
- White, gray variations

### Common Patterns
1. All images currently use placeholder SVGs
2. Consistent button styling with masonic color scheme
3. Responsive design with mobile-first approach
4. Heavy use of Tailwind utility classes
5. Limited dynamic data fetching (only in hero and featured events)

### Data Dependencies
1. **Hero Section:** Depends on `getHeroFunction()` service
2. **Featured Events:** Direct Supabase API call for events with location joins
3. All other sections use static content

### Navigation Structure
- Main navigation: Events, About, Contact, Help
- Login link in header
- Primary CTA buttons lead to `/functions` page