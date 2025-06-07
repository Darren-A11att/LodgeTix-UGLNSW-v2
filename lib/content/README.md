# Homepage Content Management Guide

This guide explains how to easily edit your homepage content using the centralized content file.

## Quick Start

All homepage content is now managed in a single file:
```
/lib/content/homepage-content.ts
```

## How It Works

Each piece of content has two parts:
1. **Source**: `DATABASE` or `FALLBACK`
2. **Content**: The actual text, images, or data

### Example
```typescript
title: {
  source: 'FALLBACK',        // ← Change this to switch sources
  fallback: 'Welcome to LodgeTix'  // ← Edit this text
}
```

## Editing Content

### 1. Change Text Content
Find the section you want to edit and modify the `fallback` text:

```typescript
// BEFORE
title: {
  source: 'FALLBACK',
  fallback: 'Welcome to LodgeTix'
}

// AFTER  
title: {
  source: 'FALLBACK',
  fallback: 'Welcome to Our Special Event'
}
```

### 2. Change Images
Update the image URL in the `fallback` field:

```typescript
// BEFORE
image: {
  url: {
    source: 'FALLBACK',
    fallback: '/placeholder.svg?height=800&width=800'
  }
}

// AFTER
image: {
  url: {
    source: 'FALLBACK',
    fallback: 'https://your-domain.com/images/hero-image.jpg'
  }
}
```

### 3. Switch Between Database and Fallback
Change the `source` field:

```typescript
// Use your fallback content
title: {
  source: 'FALLBACK',
  fallback: 'Custom Homepage Title'
}

// Use content from database
title: {
  source: 'DATABASE',
  database: {
    table: 'functions',
    recordId: process.env.FEATURED_FUNCTION_ID || '',
    idColumn: 'function_id',
    valueColumn: 'title'
  },
  fallback: 'Custom Homepage Title'  // Used if database fails
}
```

## Content Sections

### Navigation (Lines 28-56)
- **Brand name**: LodgeTix logo text
- **Menu items**: Events, About, Contact, Help links
- **Login link**: Log in button

### Hero Section (Lines 58-144)
- **Title**: Main homepage heading
- **Subtitle**: Secondary heading text
- **Description**: Main description paragraph
- **Image**: Large hero image
- **Badge**: Top announcement banner
- **Buttons**: Primary and secondary CTA buttons

### Sponsors Section (Lines 146-177)
- **Title**: Section heading
- **Items**: List of sponsor logos and names

### Featured Events (Lines 179-226)
- **Title**: "Featured Events" heading
- **Description**: Section description
- **View All Button**: Link to events page
- **Events Data**: Event cards (from database or fallback)

### Location Info (Lines 228-285)
- **Badge**: "Experience Excellence" tag
- **Title**: Section heading
- **Description**: Description text
- **Features**: List of 3 features with icons
- **Image**: Side image

### CTA Section (Lines 287-350)
- **Title**: "Join Our Community" heading
- **Description**: Main description paragraph
- **Secondary Description**: Additional text
- **Button**: CTA button
- **Images**: 4 layout images

## Common Tasks

### Change Hero Title
```typescript
// Line 60
title: {
  source: 'FALLBACK',
  fallback: 'Your New Title Here'
}
```

### Update Contact Information
```typescript
// Line 163 (in badge text)
fallback: 'Your contact information here.'
```

### Change Sponsor Logos
```typescript
// Lines 150-175
items: {
  source: 'FALLBACK',
  fallback: [
    {
      name: 'Your Sponsor Name',
      logo: 'https://your-domain.com/logo.png',
      alt: 'Your Sponsor Logo'
    },
    // Add more sponsors...
  ]
}
```

### Update Event Fallbacks
```typescript
// Lines 204-225
fallback: [
  {
    id: 'event-1',
    title: 'Your Event Title',
    description: 'Your event description...',
    date: 'Saturday, March 15, 2025',
    location: 'Your Location',
    imageUrl: 'https://your-domain.com/event-image.jpg',
    price: 'From $150'
  }
]
```

## Image Guidelines

### Image URLs
- **Local images**: `/images/your-image.jpg` (put in `/public/images/`)
- **External images**: `https://your-domain.com/image.jpg`
- **Placeholder images**: Keep existing placeholder URLs for testing

### Recommended Sizes
- **Hero image**: 800x800px
- **Sponsor logos**: 200x100px
- **Event images**: 1000x400px
- **CTA images**: Various (check existing className for ratios)

## Testing Changes

After making changes:

1. **Save the file**
2. **Refresh your browser** - changes should appear immediately
3. **Check all sections** - make sure nothing broke
4. **Test responsive design** - check mobile/tablet views

## Troubleshooting

### Content not showing
- Check that `source` is set to `'FALLBACK'`
- Verify the `fallback` field has your content
- Make sure quotes are properly closed

### Images not loading
- Check the image URL is correct
- Ensure images are accessible (public URLs)
- Verify image file exists if using local paths

### Syntax errors
- Check for missing commas
- Ensure all quotes are properly closed
- Look for unmatched brackets `{}`

## Advanced: Database Integration

To pull content from your database instead of using fallbacks:

1. Set `source: 'DATABASE'`
2. Configure the database fields:
   - `table`: Database table name
   - `recordId`: Record ID (usually your function ID)
   - `idColumn`: Column name for the ID
   - `valueColumn`: Column name for the content

The system will automatically fall back to your `fallback` content if the database is unavailable.

## Support

If you encounter issues:
1. Check the browser console for errors
2. Verify your syntax matches the examples
3. Test with simple changes first
4. Keep backups of working configurations