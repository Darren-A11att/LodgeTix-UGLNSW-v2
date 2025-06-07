# Website Content Seed Guide

## Overview

This guide explains how to seed your website schema with the existing homepage content and manage images in Supabase Storage.

## Files Created

1. **`supabase/seed/website_content_seed.sql`** - Complete seed data matching current homepage
2. **`scripts/upload-website-images.ts`** - Helper script for uploading images to Supabase Storage
3. **`supabase/migrations/20250606000001_create_website_schema.sql`** - Schema creation (already exists)

## Step-by-Step Setup

### 1. Create the Schema

First, run the migration to create the website schema:

```bash
npx supabase db push
```

### 2. Get Your Function ID

Find your featured function ID:

```sql
-- Option 1: From environment variable
SELECT '${FEATURED_FUNCTION_ID}' as function_id;

-- Option 2: Find the published function
SELECT function_id, title FROM public.functions WHERE is_published = true;
```

### 3. Update and Run Seed Data

Replace `{FEATURED_FUNCTION_ID}` in the seed file:

```bash
# Using sed on Mac/Linux
sed -i '' 's/{FEATURED_FUNCTION_ID}/your-actual-uuid-here/g' supabase/seed/website_content_seed.sql

# Or manually replace all instances of {FEATURED_FUNCTION_ID}
```

Then run the seed:

```bash
# Using Supabase CLI
npx supabase db seed -f supabase/seed/website_content_seed.sql

# Or via SQL editor in Supabase Dashboard
```

### 4. Upload Images to Storage

#### Option A: Using the Upload Script

1. Add your images to `public/images/`:
   - `hero-grand-proclamation-2025.jpg` (800x600)
   - `sponsor-grand-lodge.png` (200x100)
   - `sponsor-major.png` (200x100)
   - `sponsor-gold.png` (200x100)
   - `sponsor-silver.png` (200x100)

2. Run the upload script:
   ```bash
   npx tsx scripts/upload-website-images.ts
   ```

#### Option B: Manual Upload via Dashboard

1. Go to Supabase Dashboard > Storage > public-events bucket
2. Create folders:
   - `website/heroes/`
   - `website/sponsors/`
3. Upload images to respective folders
4. Get public URLs and update database

### 5. Update Image URLs in Database

After uploading images, update the placeholder URLs:

```sql
-- Update hero image
UPDATE website.hero_sections 
SET image_url = 'https://[your-project].supabase.co/storage/v1/object/public/public-events/website/heroes/hero-grand-proclamation-2025.jpg'
WHERE function_id = 'your-function-id';

-- Update sponsor logos
UPDATE website.sponsors 
SET logo_url = 'https://[your-project].supabase.co/storage/v1/object/public/public-events/website/sponsors/sponsor-grand-lodge.png'
WHERE function_id = 'your-function-id' AND name = 'Grand Lodge of NSW & ACT';
```

## Verification

Check that all content was seeded correctly:

```sql
-- Count records in each table
SELECT 
    'meta_tags' as table_name, COUNT(*) as count FROM website.meta_tags
UNION ALL
SELECT 'hero_sections', COUNT(*) FROM website.hero_sections
UNION ALL
SELECT 'sponsors', COUNT(*) FROM website.sponsors
UNION ALL
SELECT 'navigation_links', COUNT(*) FROM website.navigation_links
UNION ALL
SELECT 'footer_content', COUNT(*) FROM website.footer_content
UNION ALL
SELECT 'location_info', COUNT(*) FROM website.location_info
UNION ALL
SELECT 'cta_sections', COUNT(*) FROM website.cta_sections
UNION ALL
SELECT 'scripts', COUNT(*) FROM website.scripts;

-- View hero content
SELECT * FROM website.hero_sections WHERE function_id = 'your-function-id';

-- View navigation
SELECT * FROM website.navigation_links ORDER BY menu_location, sort_order;
```

## Content Mapping Reference

### Current Static Content → Database Tables

| Component | Current Location | Database Table | Notes |
|-----------|-----------------|----------------|-------|
| Meta Tags | `app/layout.tsx` | `website.meta_tags` | SEO metadata |
| Hero Content | `components/hero-angled-design.tsx` | `website.hero_sections` | Title, subtitle, CTAs |
| Sponsors | `components/sponsors-section.tsx` | `website.sponsors` | Logos and tiers |
| Location | `components/location-info-section.tsx` | `website.location_info` | Venue details |
| CTA | `components/cta-section.tsx` | `website.cta_sections` | Bottom call-to-action |
| Navigation | `components/navigation/main-nav.tsx` | `website.navigation_links` | Menu items |
| Footer | `components/ui/footer.tsx` | `website.footer_content` | Company info |

### Image Placeholders to Replace

All current images use placeholder SVGs. Replace with real images:

1. **Hero Image**: 800x600px, Grand Proclamation event photo
2. **Sponsor Logos**: 200x100px, PNG with transparency preferred
3. **Event Images**: Various sizes, used in featured events (pulled from events table)

## Storage URL Pattern

Supabase Storage URLs follow this pattern:
```
https://[your-project-ref].supabase.co/storage/v1/object/public/[bucket-name]/[path-to-file]
```

For this project:
- Bucket: `public-events`
- Website images path: `website/[category]/[filename]`

Example:
```
https://abc123.supabase.co/storage/v1/object/public/public-events/website/heroes/hero-grand-proclamation-2025.jpg
```

## Next Steps

1. **Update Components**: Modify homepage components to read from database (see `WEBSITE_SCHEMA_IMPLEMENTATION_GUIDE.md`)
2. **Add Caching**: Implement caching for better performance
3. **Create Admin UI**: Build interface for content management
4. **Add More Pages**: Extend schema for other pages (About, Contact, etc.)

## Troubleshooting

### Issue: Foreign key constraint error
**Solution**: Make sure the function_id exists in the functions table

### Issue: Unique constraint violation
**Solution**: The seed includes ON CONFLICT clauses, but you may need to clear existing data first

### Issue: Images not showing
**Solution**: 
1. Check bucket permissions (should be public)
2. Verify URLs are correct
3. Check CORS settings if needed

### Issue: Content not appearing on homepage
**Solution**: 
1. Verify `is_active = true` on all records
2. Check function_id matches `FEATURED_FUNCTION_ID`
3. Ensure components are updated to read from database