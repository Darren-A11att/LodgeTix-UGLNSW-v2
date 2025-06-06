# Website Schema Implementation Guide

## Quick Start

This guide shows how to implement the website schema in your existing components.

## 1. Update Hero Component

### Before (Static Content)
```tsx
// components/hero-angled-design.tsx
export async function HeroAngledDesign() {
  const functionData = await getHeroFunction()
  
  return (
    <section>
      <h1>{functionData?.title || "Grand Proclamation 2025"}</h1>
      <p>{functionData?.subtitle || "Celebrating Excellence in Freemasonry"}</p>
    </section>
  )
}
```

### After (Using Website Schema)
```tsx
// components/hero-angled-design.tsx
import { createClient } from '@/utils/supabase/server'

export async function HeroAngledDesign() {
  const supabase = await createClient()
  const functionId = process.env.FEATURED_FUNCTION_ID
  
  // Get hero content from website schema
  const { data: heroContent } = await supabase
    .from('website.hero_sections')
    .select('*')
    .eq('function_id', functionId)
    .eq('is_active', true)
    .order('sort_order')
    .single()
  
  // Fallback to function data if no CMS content
  const functionData = heroContent ? null : await getHeroFunction()
  
  return (
    <section>
      <h1>{heroContent?.title || functionData?.title || "Grand Proclamation 2025"}</h1>
      <p>{heroContent?.subtitle || functionData?.subtitle || "Celebrating Excellence in Freemasonry"}</p>
      
      {heroContent?.primary_cta_text && (
        <Link href={heroContent.primary_cta_link}>
          {heroContent.primary_cta_text}
        </Link>
      )}
    </section>
  )
}
```

## 2. Update Sponsors Component

### After (Using Website Schema)
```tsx
// components/sponsors-section.tsx
export async function SponsorsSection() {
  const supabase = await createClient()
  const functionId = process.env.FEATURED_FUNCTION_ID
  
  // Get sponsor section config
  const { data: sectionConfig } = await supabase
    .from('website.sponsor_sections')
    .select('*')
    .eq('function_id', functionId)
    .eq('is_active', true)
    .single()
  
  // Get sponsors
  const { data: sponsors } = await supabase
    .from('website.sponsors')
    .select('*')
    .eq('function_id', functionId)
    .eq('is_active', true)
    .order('sort_order')
  
  return (
    <section>
      <h2>{sectionConfig?.title || "Our Distinguished Sponsors"}</h2>
      <p>{sectionConfig?.subtitle || "Supporting Masonic Excellence and Tradition"}</p>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        {sponsors?.map((sponsor) => (
          <div key={sponsor.id}>
            <img 
              src={sponsor.logo_url} 
              alt={sponsor.logo_alt || sponsor.name}
            />
          </div>
        ))}
      </div>
    </section>
  )
}
```

## 3. Create Content Service

```typescript
// lib/services/website-content-service.ts
import { createClient } from '@/utils/supabase/server'

export class WebsiteContentService {
  private supabase
  private functionId: string
  
  constructor() {
    this.functionId = process.env.FEATURED_FUNCTION_ID!
  }
  
  async init() {
    this.supabase = await createClient()
    return this
  }
  
  async getMetaTags(pagePath: string = '/') {
    const { data } = await this.supabase
      .from('website.meta_tags')
      .select('*')
      .eq('function_id', this.functionId)
      .eq('page_path', pagePath)
      .eq('is_active', true)
      .single()
    
    return data
  }
  
  async getHeroContent() {
    const { data } = await this.supabase
      .rpc('get_hero_content', { p_function_id: this.functionId })
      .single()
    
    return data
  }
  
  async getNavigationLinks(location: string = 'header') {
    const { data } = await this.supabase
      .rpc('get_navigation_links', { 
        p_function_id: this.functionId,
        p_menu_location: location 
      })
    
    return data || []
  }
  
  async getLocationInfo() {
    const { data } = await this.supabase
      .from('website.location_info')
      .select('*')
      .eq('function_id', this.functionId)
      .eq('is_active', true)
      .single()
    
    return data
  }
  
  async getCTASection(sectionKey: string) {
    const { data } = await this.supabase
      .from('website.cta_sections')
      .select('*')
      .eq('function_id', this.functionId)
      .eq('section_key', sectionKey)
      .eq('is_active', true)
      .single()
    
    return data
  }
}

// Helper function for server components
export async function createWebsiteContentService() {
  const service = new WebsiteContentService()
  return await service.init()
}
```

## 4. Update Layout for Dynamic Meta Tags

```tsx
// app/layout.tsx
import { createWebsiteContentService } from '@/lib/services/website-content-service'

export async function generateMetadata() {
  const contentService = await createWebsiteContentService()
  const metaTags = await contentService.getMetaTags('/')
  
  return {
    title: metaTags?.title || 'Grand Proclamation 2025 | United Grand Lodge of NSW & ACT',
    description: metaTags?.description || 'Join us for the most prestigious Masonic event',
    openGraph: {
      title: metaTags?.og_title,
      description: metaTags?.og_description,
      images: metaTags?.og_image ? [metaTags.og_image] : [],
    },
    twitter: {
      card: metaTags?.twitter_card || 'summary_large_image',
    },
    robots: metaTags?.robots || 'index,follow',
  }
}
```

## 5. Create Admin UI (Optional)

```tsx
// app/(portals)/organiser/website-content/page.tsx
export default function WebsiteContentManager() {
  // Admin UI to manage website content
  // Could use react-hook-form for forms
  // Could use shadcn/ui components
  
  return (
    <div>
      <Tabs>
        <TabsList>
          <TabsTrigger value="hero">Hero Section</TabsTrigger>
          <TabsTrigger value="sponsors">Sponsors</TabsTrigger>
          <TabsTrigger value="location">Location</TabsTrigger>
          <TabsTrigger value="navigation">Navigation</TabsTrigger>
        </TabsList>
        
        <TabsContent value="hero">
          {/* Hero content form */}
        </TabsContent>
        
        {/* Other tabs... */}
      </Tabs>
    </div>
  )
}
```

## 6. Add Caching Layer

```typescript
// lib/services/cached-content-service.ts
import { unstable_cache } from 'next/cache'
import { createWebsiteContentService } from './website-content-service'

export const getCachedHeroContent = unstable_cache(
  async (functionId: string) => {
    const service = await createWebsiteContentService()
    return await service.getHeroContent()
  },
  ['hero-content'],
  {
    revalidate: 3600, // Cache for 1 hour
    tags: ['website-content']
  }
)

export const getCachedNavigationLinks = unstable_cache(
  async (functionId: string, location: string) => {
    const service = await createWebsiteContentService()
    return await service.getNavigationLinks(location)
  },
  ['navigation-links'],
  {
    revalidate: 3600,
    tags: ['website-content']
  }
)
```

## 7. Migration Strategy

### Phase 1: Database Setup ✓
- Run the migration to create schema and tables
- Seed with current static content

### Phase 2: Read Implementation (Non-Breaking)
1. Update components to read from website schema
2. Keep fallbacks to existing static content
3. Test thoroughly

### Phase 3: Admin UI
1. Create content management interface
2. Add role-based access control
3. Implement content preview

### Phase 4: Full Migration
1. Remove static content fallbacks
2. Update all components to use website schema
3. Add content versioning if needed

## Benefits Achieved

1. **Dynamic Content**: All homepage content can be updated without code changes
2. **Multi-Function Support**: Different content for different events
3. **A/B Testing Ready**: Can create multiple versions and toggle is_active
4. **SEO Flexibility**: Dynamic meta tags per page and function
5. **Performance**: Can be aggressively cached
6. **Maintainability**: Clear separation of content and code

## Next Steps

1. Run the migration: `npx supabase db push`
2. Update one component at a time
3. Test with different function IDs
4. Build admin UI when ready
5. Consider adding:
   - Content versioning
   - Approval workflows
   - Preview functionality
   - Audit trails