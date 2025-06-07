# LodgeTix Homepage Comprehensive Element Analysis

## Table of Contents
1. [Document Structure](#document-structure)
2. [Meta Information & SEO](#meta-information--seo)
3. [Third-Party Integrations](#third-party-integrations)
4. [Header Section](#header-section)
5. [Hero Section](#hero-section)
6. [Sponsors Section](#sponsors-section)
7. [Featured Events Section](#featured-events-section)
8. [Location Info Section](#location-info-section)
9. [CTA Section](#cta-section)
10. [Footer Section](#footer-section)
11. [Global Elements](#global-elements)
12. [Color Palette & Typography](#color-palette--typography)
13. [Responsive Breakpoints](#responsive-breakpoints)

---

## Document Structure

### Page Hierarchy
```
<html lang="en">
  <head>
    - Meta tags
    - Third-party scripts
  </head>
  <body>
    <AuthProvider>
      <LocationInitializer />
      <LayoutWithFooter>
        <HomePage>
          - HeroAngledDesign
          - SponsorsSection
          - FeaturedEventsRedesigned
          - LocationInfoSection
          - CTASection
        </HomePage>
      </LayoutWithFooter>
    </AuthProvider>
  </body>
</html>
```

### Page Configuration
- **Dynamic Rendering**: `export const dynamic = 'force-dynamic'`
- **Main Container**: `<div className="min-h-screen">`

---

## Meta Information & SEO

### Static Meta Tags
| Property | Value | Type | Location |
|----------|-------|------|----------|
| title | "Grand Proclamation 2025 \| United Grand Lodge of NSW & ACT" | Static | app/layout.tsx:10 |
| description | "Created with v0" | Static | app/layout.tsx:11 |
| generator | ";)" | Static | app/layout.tsx:12 |
| lang | "en" | Static | app/layout.tsx:21 |

**Note**: These meta tags should be dynamic based on the featured function

---

## Third-Party Integrations

### 1. Cloudflare Turnstile
- **Purpose**: Bot protection and security
- **Location**: `app/layout.tsx:23-25`
- **Script URL**: `https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit`
- **Type**: External script, loaded in head

### 2. Sentry Error Tracking
- **Configuration Files**: 
  - `instrumentation.ts`
  - `sentry.server.config.ts`
  - `sentry.edge.config.ts`
- **Features**:
  - Error tracking with 0.1 sample rate
  - Session replay (1.0 rate on error, 0.1 normal)
  - Production-only tracing
  - Disabled in development

---

## Header Section

### Visibility Logic
**Note**: Header is NOT visible on homepage (`pathname === '/'`)

### When Visible (Non-Homepage Pages)
| Element | Content | Classes | CSS Values | Type |
|---------|---------|---------|------------|------|
| Container | - | `sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b` | position: sticky; top: 0; z-index: 40; background: rgba(255,255,255,0.8); backdrop-filter: blur(12px); border-bottom: 1px solid | Static |
| Inner Container | - | `container mx-auto px-4` | max-width: container; margin: 0 auto; padding: 0 16px | Static |
| Nav | - | `flex h-16 items-center justify-between` | display: flex; height: 64px; align-items: center; justify-content: space-between | Static |

### Logo Section
| Element | Content | Classes | Type | Component |
|---------|---------|---------|------|-----------|
| Logo Link | href="/" | `flex items-center gap-2 hover:opacity-80 transition-opacity` | Static | Link |
| Icon | TicketIcon | `h-6 w-6 text-masonic-gold` | Static | lucide-react |
| Text | "LodgeTix" | `text-xl font-bold text-masonic-navy` | Static | span |

### Navigation Links
| Link Text | Href | Classes | Type |
|-----------|------|---------|------|
| Home | "/" | `text-sm font-medium text-gray-700 hover:text-masonic-gold transition-colors` | Static |
| Functions | "/functions" | Same as above | Static |
| About | "/about" | Same as above | Static |
| Contact | "/contact" | Same as above | Static |

### Mobile Header Variation
| Element | Content | Classes | Condition |
|---------|---------|---------|-----------|
| Mobile Container | - | `fixed top-0 left-0 right-0 bg-white shadow-sm z-50` | Mobile only |
| Menu Button | Menu icon | `p-2` | Mobile only |
| Sidebar | Navigation menu | Sheet component | Opens on menu click |

---

## Hero Section

### Component: `HeroAngledDesign`

### Container Structure
| Element | Classes | CSS Values | Type |
|---------|---------|------------|------|
| Section | `relative overflow-hidden bg-masonic-navy min-h-[90vh]` | position: relative; overflow: hidden; background: masonic-navy; min-height: 90vh | Static |
| Pattern Overlay | `absolute inset-0 bg-gradient-to-br from-masonic-blue/20 to-transparent` | position: absolute; inset: 0; background: linear-gradient(to bottom right, masonic-blue/20, transparent) | Static |

### Content Structure
| Element | Classes | Responsive | Type |
|---------|---------|-----------|------|
| Content Container | `relative z-10 container mx-auto px-4 py-16 md:py-24` | Desktop: py-24 (96px), Mobile: py-16 (64px) | Static |
| Grid | `grid grid-cols-1 md:grid-cols-2 gap-12 items-center` | Desktop: 2 cols, Mobile: 1 col, gap: 48px | Static |

### Text Content
| Element | Content | Classes | Type | Data Source |
|---------|---------|---------|------|-------------|
| Title | Dynamic: `functionData?.title` OR Static: "Grand Proclamation 2025" | `text-4xl md:text-6xl font-bold text-white mb-6` | Dynamic/Static | `functions.title` |
| Subtitle | Dynamic: `functionData?.subtitle` OR Static: "Celebrating Excellence in Freemasonry" | `text-xl md:text-2xl text-masonic-lightgold mb-8` | Dynamic/Static | `functions.subtitle` |
| Date | Dynamic: `formattedDate` OR Static: "15th - 17th March 2025" | `text-lg text-white/90 mb-2` | Dynamic/Static | Computed from `functions.start_date` and `functions.end_date` |
| Location | Dynamic: `functionData?.venue_name` OR Static: "Sydney Masonic Centre" | `text-lg text-white/90 mb-8` | Dynamic/Static | `functions.venue_name` |
| Description | Static: "Join us for the most prestigious Masonic event..." | `text-lg text-white/80 leading-relaxed` | Static | - |

### CTA Buttons
| Button | Text | Href | Classes | Type |
|--------|------|------|---------|------|
| Primary | "Register Now" | "/functions" | `bg-masonic-gold text-masonic-navy px-8 py-4 rounded-lg font-semibold text-lg hover:bg-masonic-lightgold transition-all duration-200 transform hover:scale-105 shadow-xl` | Static |
| Secondary | "Learn More" | "/functions" | `border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-masonic-navy transition-all duration-200` | Static |

### Hero Image
| Property | Value | Type |
|----------|-------|------|
| Source | "/placeholder.svg?height=600&width=800&text=Grand+Proclamation+2025" | Static (Placeholder) |
| Alt | "Grand Proclamation 2025" | Static |
| Classes | `rounded-2xl shadow-2xl` | Static |
| Container Classes | `relative hidden md:block` | Static |
| Decorative Border | `absolute -inset-4 bg-gradient-to-r from-masonic-gold to-masonic-lightgold rounded-2xl opacity-20 blur-xl` | Static |

### Data Fetching
```typescript
// Service: getHeroFunction() from services
// Returns: FunctionWithDetails | null
// Database: functions table with events join
```

---

## Sponsors Section

### Component: `SponsorsSection`

### Container Structure
| Element | Classes | CSS Values | Type |
|---------|---------|------------|------|
| Section | `py-16 bg-gray-50` | padding-y: 64px; background: rgb(249,250,251) | Static |
| Container | `container mx-auto px-4` | max-width: container; margin: 0 auto; padding-x: 16px | Static |

### Section Header
| Element | Content | Classes | Type |
|---------|---------|---------|------|
| Title | "Our Distinguished Sponsors" | `text-3xl font-bold text-center text-masonic-navy mb-4` | Static |
| Subtitle | "Supporting Masonic Excellence and Tradition" | `text-lg text-center text-gray-600 mb-12` | Static |

### Sponsor Logos Grid
| Property | Classes | Layout |
|----------|---------|--------|
| Grid Container | `grid grid-cols-2 md:grid-cols-4 gap-8 items-center` | 2 cols mobile, 4 cols desktop |

### Sponsor Items (All Static)
| Sponsor | Image Source | Alt Text | Container Classes |
|---------|--------------|----------|-------------------|
| Grand Lodge | "/placeholder.svg?height=100&width=200&text=Grand+Lodge" | "Grand Lodge of NSW & ACT" | `flex items-center justify-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow` |
| Major Sponsor | "/placeholder.svg?height=100&width=200&text=Major+Sponsor" | "Major Sponsor" | Same as above |
| Gold Sponsor | "/placeholder.svg?height=100&width=200&text=Gold+Sponsor" | "Gold Sponsor" | Same as above |
| Silver Sponsor | "/placeholder.svg?height=100&width=200&text=Silver+Sponsor" | "Silver Sponsor" | Same as above |

---

## Featured Events Section

### Component: `FeaturedEventsRedesigned`

### Container Structure
| Element | Classes | Type |
|---------|---------|------|
| Section | `py-20 bg-white` | Static |
| Container | `container mx-auto px-4` | Static |

### Section Header
| Element | Content | Classes | Type |
|---------|---------|---------|------|
| Title | "Featured Events" | `text-4xl font-bold text-center text-masonic-navy mb-4` | Static |
| Subtitle | "Experience the Grand Proclamation Weekend" | `text-lg text-center text-gray-600 mb-16` | Static |

### Events Data Fetching
```typescript
// Direct Supabase REST API call
const functionId = process.env.FEATURED_FUNCTION_ID
const { data: events } = await supabase
  .from('events')
  .select(`
    *,
    location:locations(*)
  `)
  .eq('function_id', functionId)
  .order('start_date', { ascending: true })
```

### Success State - Events Grid
| Property | Classes | Layout |
|----------|---------|--------|
| Grid Container | `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8` | 1-2-3 column responsive |

### Event Card Structure
| Element | Classes | Type | Data Source |
|---------|---------|------|-------------|
| Card Container | `group bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1` | Static | - |
| Image Container | `relative h-64 overflow-hidden` | Static | - |
| Image | `w-full h-full object-cover group-hover:scale-105 transition-transform duration-300` | Dynamic | Placeholder based on `events.name` |
| Gradient Overlay | `absolute inset-0 bg-gradient-to-t from-black/60 to-transparent` | Static | - |
| Date Badge | `absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold text-masonic-navy` | Dynamic | Formatted from `events.start_date` |

### Event Card Content
| Element | Content | Classes | Type | Data Source |
|---------|---------|---------|------|-------------|
| Title | Event name | `text-xl font-bold text-masonic-navy mb-2 group-hover:text-masonic-gold transition-colors` | Dynamic | `events.name` |
| Time | Start time - End time | `flex items-center text-gray-600 mb-2` with Clock icon | Dynamic | `events.start_time` - `events.end_time` |
| Location | Location name | `flex items-center text-gray-600 mb-4` with MapPin icon | Dynamic | `locations.name` |
| Description | Event description (truncated) | `text-gray-700 line-clamp-3` | Dynamic | `events.description` |
| Register Link | "Register for this event" | `inline-flex items-center text-masonic-gold font-semibold group-hover:text-masonic-navy transition-colors` | Dynamic | href: `/functions/${event.function_slug}/register` |

### Error/Fallback State
| Element | Content | Classes | Type |
|---------|---------|---------|------|
| Container | - | `text-center py-16` | Static |
| Title | "Events Coming Soon" | `text-2xl font-bold text-masonic-navy mb-4` | Static |
| Message | "Check back soon for the full event schedule." | `text-gray-600` | Static |

### View All Events Link
| Element | Content | Classes | Type |
|---------|---------|---------|------|
| Container | - | `text-center mt-12` | Static |
| Link | "View All Events" | `inline-flex items-center gap-2 text-masonic-gold hover:text-masonic-navy font-semibold text-lg transition-colors` | Static |
| Icon | ChevronRight | From lucide-react | Static |

---

## Location Info Section

### Component: `LocationInfoSection`

### Container Structure
| Element | Classes | Type |
|---------|---------|------|
| Section | `py-20 bg-gradient-to-br from-masonic-navy to-masonic-blue text-white` | Static |
| Container | `container mx-auto px-4` | Static |

### Content Grid
| Property | Classes | Layout |
|----------|---------|--------|
| Grid | `grid grid-cols-1 md:grid-cols-2 gap-12 items-center` | 1 col mobile, 2 cols desktop |

### Map Placeholder
| Property | Value | Type |
|----------|-------|------|
| Container | `bg-gray-200 rounded-2xl h-96 flex items-center justify-center overflow-hidden relative` | Static |
| Shadow | `shadow-2xl` | Static |
| Decorative Border | `absolute inset-0 bg-gradient-to-r from-masonic-gold/20 to-masonic-lightgold/20 rounded-2xl` | Static |
| Icon | MapPin | `h-16 w-16 text-gray-400` | Static |

### Location Details
| Element | Content | Classes | Type |
|---------|---------|---------|------|
| Title | "Sydney Masonic Centre" | `text-4xl font-bold mb-6` | Static |
| Badge | "Premium Venue" | `inline-block bg-masonic-gold text-masonic-navy px-4 py-2 rounded-full text-sm font-semibold mb-6` | Static |

### Venue Features List
| Feature | Icon | Content | Type |
|---------|------|---------|------|
| Historic Venue | Building2 | "A landmark of Masonic tradition" | Static |
| Central Location | Train | "Easy access via public transport" | Static |
| Modern Facilities | Wifi | "State-of-the-art amenities" | Static |
| Secure Parking | Car | "Ample parking available" | Static |

Each feature uses: `flex items-start gap-4 mb-4` with icon styling: `h-6 w-6 text-masonic-gold flex-shrink-0`

### Address Information
| Element | Content | Classes | Type |
|---------|---------|---------|------|
| Container | - | `mt-8 p-6 bg-white/10 backdrop-blur-sm rounded-xl` | Static |
| Label | "Venue Address" | `text-masonic-lightgold font-semibold mb-2` | Static |
| Address Line 1 | "279 Castlereagh Street" | `text-lg` | Static |
| Address Line 2 | "Sydney NSW 2000" | `text-lg` | Static |

### CTA Button
| Property | Value | Type |
|----------|-------|------|
| Text | "Get Directions" | Static |
| Icon | ExternalLink | Static |
| Classes | `mt-6 inline-flex items-center gap-2 bg-masonic-gold text-masonic-navy px-6 py-3 rounded-lg font-semibold hover:bg-masonic-lightgold transition-colors` | Static |

---

## CTA Section

### Component: `CTASection`

### Container Structure
| Element | Classes | Type |
|---------|---------|------|
| Section | `py-20 bg-gray-50` | Static |
| Container | `container mx-auto px-4` | Static |
| Card | `bg-gradient-to-r from-masonic-navy to-masonic-blue rounded-3xl p-12 md:p-16 text-white text-center relative overflow-hidden` | Static |

### Decorative Elements
| Element | Classes | Purpose |
|---------|---------|---------|
| Pattern 1 | `absolute top-0 right-0 w-64 h-64 bg-masonic-gold/10 rounded-full -translate-y-32 translate-x-32` | Decorative |
| Pattern 2 | `absolute bottom-0 left-0 w-96 h-96 bg-masonic-lightgold/10 rounded-full translate-y-48 -translate-x-48` | Decorative |

### Content
| Element | Content | Classes | Type |
|---------|---------|---------|------|
| Title | "Ready to Join Us?" | `text-4xl md:text-5xl font-bold mb-6` | Static |
| Subtitle | "Secure Your Place at the Grand Proclamation 2025" | `text-xl md:text-2xl mb-8 text-masonic-lightgold` | Static |
| Description | "Don't miss this historic gathering..." | `text-lg mb-12 max-w-3xl mx-auto text-white/90` | Static |

### CTA Buttons
| Button | Text | Href | Classes | Type |
|--------|------|------|---------|------|
| Primary | "Register Now" | "/functions" | `bg-masonic-gold text-masonic-navy px-8 py-4 rounded-lg font-semibold text-lg hover:bg-masonic-lightgold transition-all duration-200 transform hover:scale-105 shadow-xl inline-flex items-center gap-2` | Static |
| Icon | ArrowRight | - | Included in primary button | Static |

### Info Text
| Content | Classes | Type |
|---------|---------|------|
| "Limited places available • Secure online payment • Instant confirmation" | `text-white/80 text-sm` | Static |

---

## Footer Section

### Component: Part of `LayoutWithFooter`

### Visibility Logic
- Hidden when: `pathname.includes('/register') && !pathname.includes('/register/confirmation')`
- Always visible on homepage

### Container Structure
| Element | Classes | Type |
|---------|---------|------|
| Footer | `bg-masonic-navy text-white py-12` | Static |
| Container | `container mx-auto px-4` | Static |

### Content Grid
| Property | Classes | Layout |
|----------|---------|--------|
| Grid | `grid grid-cols-1 md:grid-cols-4 gap-8` | 1 col mobile, 4 cols desktop |

### Column 1: About
| Element | Content | Classes | Type |
|---------|---------|---------|------|
| Logo Container | MasonicLogo + "LodgeTix" | `flex items-center gap-2 mb-4` | Static |
| Logo | MasonicLogo component | size="md" | Static |
| Title | "LodgeTix" | `text-xl font-bold` | Static |
| Description | "The official ticketing platform..." | `text-gray-300` | Static |

### Column 2: Quick Links
| Link | Href | Classes | Type |
|------|------|---------|------|
| Events | "/functions" | `text-gray-300 hover:text-masonic-gold transition-colors` | Static |
| About | "/about" | Same as above | Static |
| Contact | "/contact" | Same as above | Static |
| Help | "/help" | Same as above | Static |

### Column 3: Event Info
| Element | Content | Type | Data Source |
|---------|---------|------|-------------|
| Title | "Grand Proclamation 2025" | Dynamic | Should use `functions.title` |
| Date | "15-17 March 2025" | Dynamic | Should use `functions.start_date` - `functions.end_date` |
| Venue Link | "Sydney Masonic Centre" | Dynamic | href: `/functions/${slug}/venue` |

### Column 4: Connect
| Element | Content | Type |
|---------|---------|------|
| Title | "Connect" | Static |
| Description | "Stay updated with the latest news and announcements." | Static |
| External Link | "Visit United Grand Lodge of NSW & ACT" | Static |
| Link Icon | ExternalLink | Static |
| Link Href | "https://masons.au" | Static |

### Footer Bottom
| Element | Classes | Type |
|---------|---------|------|
| Divider | `border-t border-gray-700 mt-8 pt-8` | Static |
| Container | `flex flex-col md:flex-row justify-between items-center gap-4` | Static |

### Legal Links
| Link | Href | Classes | Type |
|------|------|---------|------|
| Privacy Policy | "/privacy" | `text-gray-400 hover:text-masonic-gold transition-colors` | Static |
| Terms of Service | "/terms" | Same as above | Static |
| Refund Policy | "/refund-policy" | Same as above | Static |

### Copyright
| Content | Classes | Type |
|---------|---------|------|
| "© 2024 LodgeTix. All rights reserved." | `text-gray-400` | Static |

---

## Global Elements

### AuthProvider
- **Purpose**: Wraps entire application for authentication context
- **Location**: `app/layout.tsx:28`
- **Type**: Context Provider

### LocationInitializer
- **Purpose**: Initializes user location data
- **Component**: `components/location-initializer.tsx`
- **Location**: `app/layout.tsx:29`
- **Type**: Client Component (likely uses geolocation)

### Loading State
- **File**: `app/loading.tsx`
- **Content**: Returns `null` (no visible loading indicator)

### Not Found (404) Page
- **File**: `app/not-found.tsx`
- **Content Structure**:
  - Container: `flex min-h-screen flex-col items-center justify-center`
  - Title: "404" with `text-6xl font-bold text-masonic-navy`
  - Message: "Page not found" with `text-xl text-gray-600 mt-4`
  - Link: "Return to Home" with button styling

### Global Error Handler
- **File**: `app/global-error.tsx`
- **Integration**: Sentry error reporting
- **Fallback UI**: Error message with "Try again" button

---

## Color Palette & Typography

### Custom Colors (defined in Tailwind config)
| Color Name | Usage | Value |
|------------|-------|-------|
| masonic-navy | Primary brand color | Custom color |
| masonic-gold | Accent/CTA color | Custom color |
| masonic-lightgold | Hover states | Custom color |
| masonic-blue | Gradients/accents | Custom color |
| masonic-lightblue | Light accents | Custom color |

### Typography Scale
| Size | Classes | Usage |
|------|---------|-------|
| 6xl | `text-6xl` | Hero titles (desktop) |
| 5xl | `text-5xl` | Major section titles |
| 4xl | `text-4xl` | Section titles |
| 3xl | `text-3xl` | Subsection titles |
| 2xl | `text-2xl` | Large subtitles |
| xl | `text-xl` | Subtitles |
| lg | `text-lg` | Body emphasis |
| base | Default | Body text |
| sm | `text-sm` | Small text/labels |

### Font Weights
| Weight | Class | Usage |
|--------|-------|-------|
| Bold | `font-bold` | Titles, emphasis |
| Semibold | `font-semibold` | Buttons, labels |
| Medium | `font-medium` | Navigation |
| Normal | Default | Body text |

---

## Responsive Breakpoints

### Breakpoint Usage
| Breakpoint | Size | Usage on Homepage |
|------------|------|-------------------|
| Mobile | < 768px | Default styles |
| md | ≥ 768px | 2-column layouts, larger text |
| lg | ≥ 1024px | 3-column event grid |

### Common Responsive Patterns
1. **Text Sizing**: `text-4xl md:text-6xl` (mobile → desktop)
2. **Grid Columns**: `grid-cols-1 md:grid-cols-2` (stack → side-by-side)
3. **Padding**: `py-16 md:py-24` (reduced → full padding)
4. **Visibility**: `hidden md:block` (hide on mobile → show on desktop)

---

## Database Schema References

### Dynamic Content Sources
| Section | Table | Columns Used |
|---------|-------|--------------|
| Hero | `functions` | `title`, `subtitle`, `start_date`, `end_date`, `venue_name` |
| Featured Events | `events` | `name`, `description`, `start_date`, `start_time`, `end_time`, `function_slug` |
| Featured Events | `locations` | `name` (joined with events) |
| Footer Event Info | `functions` | `title`, `start_date`, `end_date`, `slug` |

### Environment Variables
| Variable | Usage | Location |
|----------|-------|----------|
| `FEATURED_FUNCTION_ID` | Identifies current featured function | Hero section, Featured Events |

---

## Component Import Paths
| Component | Import Path |
|-----------|-------------|
| HeroAngledDesign | `@/components/hero-angled-design` |
| SponsorsSection | `@/components/sponsors-section` |
| FeaturedEventsRedesigned | `@/components/featured-events-redesigned` |
| LocationInfoSection | `@/components/location-info-section` |
| CTASection | `@/components/cta-section` |
| LayoutWithFooter | `@/components/ui/layout-with-footer` |
| MasonicLogo | `@/components/masonic-logo` |
| LocationInitializer | `@/components/location-initializer` |
| AuthProvider | `@/contexts/auth-provider` |

---

## Notes & Observations

1. **Placeholder Images**: All images are currently placeholder SVGs with descriptive text
2. **Static Content**: Much of the content that should be dynamic (meta tags, some text) is currently hardcoded
3. **Missing Loading States**: No skeleton screens or loading indicators implemented
4. **Limited Error Handling**: Only Featured Events section has explicit error handling
5. **SEO Improvements Needed**: Meta tags should be dynamic based on featured function
6. **Accessibility**: Limited aria-labels and semantic HTML in some areas
7. **No Analytics**: Only error tracking via Sentry, no user analytics visible