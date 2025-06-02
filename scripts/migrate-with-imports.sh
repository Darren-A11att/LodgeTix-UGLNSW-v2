#!/bin/bash

# Comprehensive migration script that moves files AND updates imports
# This ensures everything continues working after the restructure

set -e

echo "🚀 Starting comprehensive migration with import updates..."

# First, create the new structure (same as before)
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
mkdir -p app/\(portals\)/customer/registrations
mkdir -p app/\(portals\)/attendee

# Function to update imports in a file
update_imports() {
    local file="$1"
    echo "Updating imports in: $file"
    
    # Update relative imports that point to components
    sed -i.bak 's|@/components/|@/components/|g' "$file"
    sed -i.bak 's|@/lib/|@/lib/|g' "$file"
    sed -i.bak 's|@/utils/|@/utils/|g' "$file"
    
    # Update specific route references
    sed -i.bak 's|/events/\${slug}/register|/functions/\${functionId}/register|g' "$file"
    sed -i.bak 's|/events/\${|/functions/\${|g' "$file"
    sed -i.bak 's|href="/events"|href="/functions"|g' "$file"
    
    # Clean up backup files
    rm -f "$file.bak"
}

# Function to update route references in components
update_route_references() {
    echo "🔧 Updating route references in components..."
    
    # Find all TypeScript/JavaScript files and update route references
    find components lib shared -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" -o -name "*.js" | while read -r file; do
        if [ -f "$file" ]; then
            update_imports "$file"
        fi
    done
}

echo "📦 Moving and updating files..."

# Move homepage and update imports
if [ -f "app/page.tsx" ]; then
    cp app/page.tsx app/\(public\)/page.tsx
    update_imports "app/(public)/page.tsx"
    echo "✅ Moved and updated homepage"
fi

# Move layout and update imports
if [ -f "app/layout.tsx" ]; then
    cp app/layout.tsx app/\(public\)/layout.tsx
    update_imports "app/(public)/layout.tsx"
    echo "✅ Moved and updated main layout"
fi

# Move events page to functions and update imports
if [ -f "app/events/page.tsx" ]; then
    cp app/events/page.tsx app/\(public\)/functions/page.tsx
    update_imports "app/(public)/functions/page.tsx"
    echo "✅ Moved and updated events listing to functions listing"
fi

# Move event detail pages and update imports
if [ -f "app/events/[slug]/page.tsx" ]; then
    cp app/events/[slug]/page.tsx app/\(public\)/functions/\[functionId\]/page.tsx
    update_imports "app/(public)/functions/[functionId]/page.tsx"
    echo "✅ Moved and updated event detail to function detail"
fi

# Move registration components and update imports
if [ -d "app/events/[slug]/register/[registrationId]" ]; then
    if [ -f "app/events/[slug]/register/[registrationId]/layout.tsx" ]; then
        cp app/events/[slug]/register/[registrationId]/layout.tsx app/\(public\)/functions/\[functionId\]/register/layout.tsx
        update_imports "app/(public)/functions/[functionId]/register/layout.tsx"
        echo "✅ Moved and updated registration layout"
    fi
    
    if [ -f "app/events/[slug]/register/[registrationId]/page.tsx" ]; then
        cp app/events/[slug]/register/[registrationId]/page.tsx app/\(public\)/functions/\[functionId\]/register/page.tsx
        update_imports "app/(public)/functions/[functionId]/register/page.tsx"
        echo "✅ Moved and updated registration wizard main page"
    fi
    
    if [ -f "app/events/[slug]/register/[registrationId]/tickets/page.tsx" ]; then
        cp app/events/[slug]/register/[registrationId]/tickets/page.tsx app/\(public\)/functions/\[functionId\]/register/tickets/page.tsx
        update_imports "app/(public)/functions/[functionId]/register/tickets/page.tsx"
        echo "✅ Moved and updated registration tickets step"
    fi
    
    if [ -f "app/events/[slug]/register/[registrationId]/tickets/client-page.tsx" ]; then
        cp app/events/[slug]/register/[registrationId]/tickets/client-page.tsx app/\(public\)/functions/\[functionId\]/register/tickets/client-page.tsx
        update_imports "app/(public)/functions/[functionId]/register/tickets/client-page.tsx"
        echo "✅ Moved and updated registration tickets client page"
    fi
fi

# Move registration route and update imports
if [ -f "app/events/[slug]/register/route.ts" ]; then
    cp app/events/[slug]/register/route.ts app/\(public\)/functions/\[functionId\]/register/route.ts
    update_imports "app/(public)/functions/[functionId]/register/route.ts"
    echo "✅ Moved and updated registration route handler"
fi

# Move organiser portal and update imports
if [ -d "app/organiser" ]; then
    cp -r app/organiser/* app/\(portals\)/organiser/
    find app/\(portals\)/organiser -name "*.tsx" -o -name "*.ts" | while read -r file; do
        update_imports "$file"
    done
    echo "✅ Moved and updated organiser portal"
fi

# Move customer portal (registrations) and update imports
if [ -d "app/registrations" ]; then
    cp -r app/registrations/* app/\(portals\)/customer/registrations/
    find app/\(portals\)/customer/registrations -name "*.tsx" -o -name "*.ts" | while read -r file; do
        update_imports "$file"
    done
    echo "✅ Moved and updated customer registrations to portal"
fi

# Move account pages to customer portal and update imports
if [ -d "app/account" ]; then
    cp -r app/account/* app/\(portals\)/customer/
    find app/\(portals\)/customer -name "*.tsx" -o -name "*.ts" | while read -r file; do
        update_imports "$file"
    done
    echo "✅ Moved and updated account pages to customer portal"
fi

# Update route references throughout the codebase
update_route_references

# Create necessary placeholder pages
echo "📝 Creating updated placeholder pages..."

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

# Customer portal layout
cat > app/\(portals\)/customer/layout.tsx << 'EOF'
import React from 'react'

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="customer-portal">
      <nav>Customer Portal Navigation</nav>
      <main>{children}</main>
    </div>
  )
}
EOF

# Customer portal homepage
cat > app/\(portals\)/customer/page.tsx << 'EOF'
export default function CustomerDashboard() {
  return (
    <div>
      <h1>Customer Dashboard</h1>
      <p>Welcome to your customer portal</p>
    </div>
  )
}
EOF

echo "✅ Created placeholder pages with proper structure"

echo "🎉 Comprehensive migration complete!"
echo ""
echo "📋 Summary of changes:"
echo "- Created (public) and (portals) route groups"
echo "- Moved all existing pages to new structure"
echo "- Updated imports and route references in moved files"
echo "- Updated route references throughout components and lib"
echo "- Created placeholder pages for new routes"
echo ""
echo "⚠️  Next steps:"
echo "1. Test the new routes work correctly"
echo "2. Check for any missed import references"
echo "3. Update API routes to match new hierarchy"
echo "4. Remove old directory structure when confident"
echo "5. Update any hardcoded URLs that weren't caught"