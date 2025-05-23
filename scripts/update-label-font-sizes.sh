#!/bin/bash

# Update direct label elements with text-sm to text-lb
find . -name "*.tsx" -type f -exec sed -i '' 's/className="[^"]*\btext-sm\b/& text-lb/g' {} \;
find . -name "*.tsx" -type f -exec sed -i '' 's/className=".*\b\(text-sm\)\b/className="text-lb/g' {} \;

# Update Label component usage if it has custom classNames with text-sm 
find . -name "*.tsx" -type f -exec sed -i '' 's/<[Ll]abel[^>]*className="[^"]*\btext-sm\b/& text-lb/g' {} \;
find . -name "*.tsx" -type f -exec sed -i '' 's/<[Ll]abel[^>]*className=".*\b\(text-sm\)\b/<Label className="text-lb/g' {} \;

# Update label HTML elements 
find . -name "*.tsx" -type f -exec sed -i '' 's/<label[^>]*className="[^"]*\btext-sm\b/& text-lb/g' {} \;
find . -name "*.tsx" -type f -exec sed -i '' 's/<label[^>]*className=".*\b\(text-sm\)\b/<label className="text-lb/g' {} \;

echo "Font size updates complete. You should now rebuild the application."