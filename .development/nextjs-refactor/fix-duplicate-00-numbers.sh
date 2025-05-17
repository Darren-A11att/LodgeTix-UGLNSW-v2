#!/bin/bash

cd /Users/darrenallatt/Development/LodgeTix-UGLNSW-v2/.development/nextjs-refactor

# Fix the duplicate 00 numbers to have unique sequence numbers
echo "Fixing duplicate 00 sequence numbers..."

# Keep the main guide summary as 00
# Move immutable laws summary to 22 (before other reference materials)
mv 00-immutable-laws-summary.md 22-immutable-laws-summary.md

# Move SOP index to 23 (before the style guide, but after laws summary)
mv 00-sop-index.md 23-sop-index.md

echo "Updated file structure:"
ls -la *.md | grep -E '^-' | awk '{print $9}' | sort -V