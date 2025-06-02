#!/bin/bash

# Migration script to reorganize app structure according to docs/structure.md
# This script moves existing files to the new route group structure

set -e

echo "🚀 Starting migration to new app structure..."

# Create new directory structure
echo "📁 Creating new directory structure..."

# Create (public) route group
mkdir -p app/\(public\)
mkdir -p app/\(public\)/functions
mkdir -p app/\(public\)/functions/\[functionId\]
mkdir -p app/\(public\)/functions/\[functionId\]/events
mkdir -p app/\(public\)/functions/\[functionId\]/events/\[eventId\]
mkdir -p app/\(public\)/functions/\[functionId\]/events/\[eventId\]/tickets
mkdir -p app/\(public\)/functions/\[functionId\]/packages
mkdir -p app/\(public\)/functions/\[functionId\]/packages/\[packageId\]
mkdir -p app/\(public\)/functions/\[functionId\]/register
mkdir -p app/\(public\)/functions/\[functionId\]/register/details
mkdir -p app/\(public\)/functions/\[functionId\]/register/attendees
mkdir -p app/\(public\)/functions/\[functionId\]/register/tickets
mkdir -p app/\(public\)/functions/\[functionId\]/register/review
mkdir -p app/\(public\)/functions/\[functionId\]/register/payment

# Create (portals) route group structure
mkdir -p app/\(portals\)
mkdir -p app/\(portals\)/organiser
mkdir -p app/\(portals\)/customer
mkdir -p app/\(portals\)/attendee

echo "📦 Moving existing files..."

# Move homepage to (public)
echo "Moving homepage..."
if [ -f "app/page.tsx" ]; then
    cp app/page.tsx app/\(public\)/page.tsx
    echo "✅ Moved homepage"
fi

# Move layout to (public)
if [ -f "app/layout.tsx" ]; then
    cp app/layout.tsx app/\(public\)/layout.tsx
    echo "✅ Moved main layout"
fi

# Move events page to functions
echo "Moving events to functions..."
if [ -f "app/events/page.tsx" ]; then
    cp app/events/page.tsx app/\(public\)/functions/page.tsx
    echo "✅ Moved events listing to functions listing"
fi

# Move event detail pages
if [ -f "app/events/[slug]/page.tsx" ]; then
    cp app/events/[slug]/page.tsx app/\(public\)/functions/\[functionId\]/page.tsx
    echo "✅ Moved event detail to function detail"
fi

# Move registration wizard components
echo "Moving registration wizard..."
if [ -d "app/events/[slug]/register/[registrationId]" ]; then
    if [ -f "app/events/[slug]/register/[registrationId]/layout.tsx" ]; then
        cp app/events/[slug]/register/[registrationId]/layout.tsx app/\(public\)/functions/\[functionId\]/register/layout.tsx
        echo "✅ Moved registration layout"
    fi
    
    if [ -f "app/events/[slug]/register/[registrationId]/page.tsx" ]; then
        cp app/events/[slug]/register/[registrationId]/page.tsx app/\(public\)/functions/\[functionId\]/register/page.tsx
        echo "✅ Moved registration wizard main page"
    fi
    
    if [ -f "app/events/[slug]/register/[registrationId]/tickets/page.tsx" ]; then
        cp app/events/[slug]/register/[registrationId]/tickets/page.tsx app/\(public\)/functions/\[functionId\]/register/tickets/page.tsx
        echo "✅ Moved registration tickets step"
    fi
fi

# Move registration route
if [ -f "app/events/[slug]/register/route.ts" ]; then
    cp app/events/[slug]/register/route.ts app/\(public\)/functions/\[functionId\]/register/route.ts
    echo "✅ Moved registration route handler"
fi

# Move organiser portal
echo "Moving organiser portal..."
if [ -d "app/organiser" ]; then
    cp -r app/organiser/* app/\(portals\)/organiser/
    echo "✅ Moved organiser portal"
fi

# Move customer portal (registrations)
echo "Moving customer portal..."
if [ -d "app/registrations" ]; then
    cp -r app/registrations/* app/\(portals\)/customer/registrations/
    echo "✅ Moved customer registrations to portal"
fi

# Move account pages to customer portal  
if [ -d "app/account" ]; then
    cp -r app/account/* app/\(portals\)/customer/
    echo "✅ Moved account pages to customer portal"
fi

# Move auth pages (keep at root level)
echo "Auth pages stay at root level - no changes needed"

# Create placeholder pages for new structure
echo "📝 Creating placeholder pages for new routes..."

# Function events page
cat > app/\(public\)/functions/\[functionId\]/events/page.tsx << 'EOF'
import { notFound } from 'next/navigation'

interface FunctionEventsPageProps {
  params: Promise<{ functionId: string }>
}

export default async function FunctionEventsPage({ params }: FunctionEventsPageProps) {
  const { functionId } = await params
  
  return (
    <div>
      <h1>Events for Function: {functionId}</h1>
      <p>This page will list all events for this function</p>
    </div>
  )
}
EOF

# Event detail page  
cat > app/\(public\)/functions/\[functionId\]/events/\[eventId\]/page.tsx << 'EOF'
import { notFound } from 'next/navigation'

interface EventDetailPageProps {
  params: Promise<{ functionId: string; eventId: string }>
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { functionId, eventId } = await params
  
  return (
    <div>
      <h1>Event: {eventId}</h1>
      <p>Function: {functionId}</p>
      <p>This page will show event details</p>
    </div>
  )
}
EOF

# Packages page
cat > app/\(public\)/functions/\[functionId\]/packages/page.tsx << 'EOF'
import { notFound } from 'next/navigation'

interface FunctionPackagesPageProps {
  params: Promise<{ functionId: string }>
}

export default async function FunctionPackagesPage({ params }: FunctionPackagesPageProps) {
  const { functionId } = await params
  
  return (
    <div>
      <h1>Packages for Function: {functionId}</h1>
      <p>This page will list all packages for this function</p>
    </div>
  )
}
EOF

echo "✅ Created placeholder pages"

echo "🎉 Migration complete!"
echo ""
echo "📋 Summary of changes:"
echo "- Created (public) route group with functions hierarchy"
echo "- Created (portals) route group for organiser/customer/attendee"
echo "- Moved existing pages to new structure"
echo "- Created placeholder pages for new routes"
echo ""
echo "⚠️  Next steps:"
echo "1. Test the new routes work correctly"
echo "2. Update any hardcoded URLs in components"
echo "3. Update navigation components"
echo "4. Remove old directory structure when confident"
echo "5. Update API routes to match new hierarchy"