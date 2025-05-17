#!/bin/bash

cd /Users/darrenallatt/Development/LodgeTix-UGLNSW-v2/.development/nextjs-refactor

echo "Removing empty files..."

# Find and remove files with 0 bytes
find . -name "*.md" -size 0 -print -delete

echo "Remaining files with content:"
ls -la *.md | grep -E '^-' | awk '{print $9, "("$5" bytes)"}' | sort -V