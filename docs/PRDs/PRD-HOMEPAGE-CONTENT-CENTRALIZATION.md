# PRD: Homepage Content Centralization - Intermediary Solution

## Overview

Create a centralized content management file (`homepage-content.ts`) as an intermediary solution before implementing the full database-driven CMS. This will allow easy content editing without modifying individual components or diving into the database schema.

## Problem Statement

Currently, homepage content is scattered across multiple components with static strings hardcoded throughout. This makes content updates cumbersome and error-prone, requiring:
- Editing multiple component files individually
- Managing mix of dynamic database content and static text
- Risk of inconsistencies across components
- Developer intervention for simple content changes

## Solution

### Phase 1: Centralized Content File
Create `lib/content/homepage-content.ts` with structured content objects organized by homepage sections.

### Phase 2: Component Integration
Update all homepage components to consume content from the centralized file while maintaining existing dynamic database functionality.

## Requirements

### Functional Requirements

1. **Content Organization**
   - All static text organized by component/section
   - Image URLs and alt text centralized
   - Navigation items and links consolidated
   - Fallback content for dynamic sections

2. **Component Integration**
   - Zero breaking changes to existing functionality
   - Maintain dynamic content from database
   - Support fallback patterns for when database content unavailable
   - Preserve existing styling and structure

3. **Developer Experience**
   - Single file to edit for all homepage content
   - Clear, intuitive content structure
   - TypeScript types for content validation
   - Easy migration path to future database solution

4. **Content Types Support**
   - Text content (headings, descriptions, labels)
   - Image URLs and metadata
   - Navigation links
   - CTA buttons and links
   - Feature lists and descriptions

### Non-Functional Requirements

1. **Performance**
   - No performance degradation
   - Maintain existing caching patterns
   - Tree-shakable content imports

2. **Maintainability**
   - Clear content structure
   - TypeScript enforcement
   - Easy content validation

3. **Future Compatibility**
   - Clear migration path to database CMS
   - Maintain existing service patterns
   - Support gradual rollout

## Technical Architecture

### Content File Structure
```typescript
// lib/content/homepage-content.ts
export const homepageContent = {
  navigation: {
    brand: { name: "LodgeTix", logo: "..." },
    items: [{ name: "Events", href: "/functions" }, ...],
    auth: { loginText: "Log in", href: "/login" }
  },
  hero: {
    fallback: {
      title: "Welcome to LodgeTix",
      subtitle: "Your premier destination...",
      buttons: { primary: "Explore Events", secondary: "Learn more" },
      badge: "United Grand Lodge of NSW & ACT official...",
      image: { url: "/placeholder.svg...", alt: "..." }
    }
  },
  sponsors: {
    title: "Proudly supported by Masonic organizations...",
    items: [{ name: "United Grand Lodge...", logo: "...", alt: "..." }]
  },
  events: {
    title: "Featured Events",
    description: "Experience the finest in Masonic tradition...",
    viewAllText: "View All Events",
    fallbackEvents: [{ title: "...", description: "..." }]
  },
  location: {
    badge: "Experience Excellence",
    title: "Premium Venues, Perfect Experiences",
    description: "Our events are hosted at carefully selected...",
    features: [{ name: "Prime Locations", description: "...", icon: "MapPin" }],
    image: { url: "/placeholder.svg...", alt: "..." }
  },
  cta: {
    title: "Join Our Community",
    description: "Become part of a tradition...",
    secondaryDescription: "From intimate lodge meetings...",
    button: { text: "Explore Events", href: "/functions" },
    images: [{ url: "...", alt: "..." }]
  }
}
```

### Component Integration Pattern
```typescript
// Example: components/hero-angled-design.tsx
import { homepageContent } from '@/lib/content/homepage-content'

export async function HeroAngledDesign() {
  const heroFunction = await getHeroFunction();
  const content = homepageContent.hero;
  
  return (
    <h1>{heroFunction?.title || content.fallback.title}</h1>
  );
}
```

## Content Mapping

### Static Content to Centralize

1. **Hero Section (`hero-angled-design.tsx`)**
   - Navigation items: Events, About, Contact, Help
   - Brand name: "LodgeTix"
   - Fallback hero title: "Welcome to LodgeTix"
   - Fallback description and CTA buttons
   - Badge text: "United Grand Lodge..."
   - Fallback image URL

2. **Sponsors Section (`sponsors-section.tsx`)**
   - Section title: "Proudly supported by..."
   - All sponsor data (5 sponsors with names, logos)

3. **Featured Events (`featured-events-redesigned.tsx`)**
   - Section title: "Featured Events"
   - Section description
   - "View All Events" button text
   - Fallback event data (2 complete events)

4. **Location Info (`location-info-section.tsx`)**
   - Section badge: "Experience Excellence"
   - Section title and description
   - Feature items (3 features with icons and descriptions)
   - Image URL and alt text

5. **CTA Section (`cta-section.tsx`)**
   - Section title: "Join Our Community"
   - Two description paragraphs
   - Button text and href
   - All image URLs (4 images) and alt text

## Implementation Plan

### Phase 1: Content File Creation
1. Create `lib/content/homepage-content.ts` with TypeScript types
2. Extract all static content from existing components
3. Organize content by component sections
4. Add comprehensive TypeScript types

### Phase 2: Component Updates
1. Update `hero-angled-design.tsx` to use centralized content
2. Update `sponsors-section.tsx` to use centralized content
3. Update `featured-events-redesigned.tsx` to use centralized content
4. Update `location-info-section.tsx` to use centralized content
5. Update `cta-section.tsx` to use centralized content

### Phase 3: Testing & Validation
1. Write tests for content file structure
2. Verify all components render correctly
3. Test content editability and changes
4. Validate TypeScript type safety

## Success Criteria

1. ✅ Single file contains all editable homepage content
2. ✅ No breaking changes to existing functionality
3. ✅ All dynamic database content continues working
4. ✅ Easy content editing for non-developers
5. ✅ Clear migration path to database CMS
6. ✅ TypeScript type safety for content structure
7. ✅ Performance maintained or improved

## Migration Strategy

### Database CMS Migration Path
1. Content file structure maps directly to existing website schema tables
2. Service layer can be updated to read from database instead of file
3. Admin UI can be built to manage database content
4. Gradual migration: file → database with fallbacks → database only

## Risk Mitigation

1. **Content Duplication**: Clear documentation of what moves to file vs stays dynamic
2. **Performance Impact**: Use tree-shaking and proper imports
3. **Type Safety**: Comprehensive TypeScript types and validation
4. **Future Compatibility**: Structure aligns with existing database schema

## Timeline

- **Phase 1**: 2-3 hours (Content file creation)
- **Phase 2**: 4-6 hours (Component updates)
- **Phase 3**: 2-3 hours (Testing & validation)
- **Total**: 8-12 hours of development time

## Acceptance Criteria

1. All homepage content editable from single file
2. Zero visual or functional regressions
3. TypeScript compilation without errors
4. All tests passing
5. Clear documentation for content editing
6. Performance benchmarks maintained