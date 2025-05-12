#!/bin/bash

# Build the application
echo "🔨 Building the application..."
npm run build

# Check bundle sizes
echo "📊 Bundle size analysis:"
echo "-----------------------"
cat .next/build-manifest.json | jq '.pages | to_entries | sort_by(.value | length) | reverse | .[0:5] | map({path: .key, size: (.value | length)})' | jq -c '.[]' | while read -r entry; do
  path=$(echo $entry | jq -r '.path')
  size=$(echo $entry | jq -r '.size')
  echo "Path: $path - Components: $size"
done

# Compare before/after bundle sizes
echo ""
echo "🔍 Runtime JS size check:"
echo "------------------------"
grep -A 3 "First Load JS shared by all" .next/server/pages-manifest.json || echo "Runtime JS info not available"

# Check for client/server components
echo ""
echo "🔄 Client/Server Component breakdown:"
echo "-----------------------------------"
client_components=$(grep -r "\"use client\"" --include="*.tsx" --include="*.jsx" ./components | wc -l)
total_components=$(find ./components -name "*.tsx" -o -name "*.jsx" | wc -l)
server_components=$((total_components - client_components))

echo "Client components: $client_components"
echo "Server components: $server_components"
echo "Total components: $total_components"
echo "Server component ratio: $(echo "scale=2; $server_components/$total_components*100" | bc)%"

# Summary
echo ""
echo "✅ Performance Optimization Summary:"
echo "--------------------------------"
echo "1. Dynamic imports: Lazy-loaded wizard steps"
echo "2. Static generation: Implemented for event pages"
echo "3. Server components: Maximized where possible"
echo "4. Suspense boundaries: Added for step loading"
echo ""
echo "To further improve performance:"
echo "- Consider image optimization with next/image"
echo "- Add API response caching where applicable"
echo "- Implement more granular code-splitting"