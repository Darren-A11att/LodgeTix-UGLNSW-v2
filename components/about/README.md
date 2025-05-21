# About Components

This directory contains components for the About page that fetch and display dynamic content from Supabase.

## Components

- `AboutContent`: The main container component that fetches content from Supabase and organizes it
- `AboutSection`: Displays a section of content with a title and description
- `AboutValues`: Displays the values section with multiple value cards
- `AboutFeatures`: Displays features with icons and descriptions

## Data Structure

Content is stored in three Supabase tables:

1. `content`: General content blocks with sections
2. `content_features`: Feature items with icons
3. `content_values`: Value cards

## Setup

To set up the content tables in Supabase, run:

```bash
npx ts-node scripts/setup-content-tables.ts
```

This will create the necessary tables and seed them with initial data.

## Adding/Editing Content

Content can be edited directly in the Supabase dashboard or via SQL queries. Each content item has an `order` field to control the display order.

### Adding a New Section

To add a new section to the About page:

1. Add a record to the `content` table with:
   - `page: 'about'`
   - `section: 'your-section-name'`
   - `title`: The section heading
   - `description`: The section text
   - `order`: Position in the page

2. Update the `AboutContent` component to render the new section if needed.

## Icons

Feature icons use Lucide React components. The following icons are supported:

- `shield`
- `shield-check`
- `layout-grid`
- `users`

To add more icons, update the `iconMap` in `features.tsx`.