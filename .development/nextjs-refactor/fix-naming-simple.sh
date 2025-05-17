#!/bin/bash

cd /Users/darrenallatt/Development/LodgeTix-UGLNSW-v2/.development/nextjs-refactor

# Let's take a simple approach and just fix the actual issues:
# 1. We have two 03 files
# 2. We have a gap at 10
# 3. We have two 15 files

echo "Fixing duplicate sequence numbers..."

# Fix the duplicate 03 files
if [ -f "03-directory-structure-patterns.md" ] && [ -f "03-type-safety-patterns.md" ]; then
    mv 03-type-safety-patterns.md 03b-type-safety-patterns.md
    # Shift directory structure to 04
    mv 03-directory-structure-patterns.md 04a-directory-structure-patterns.md
    # Shift file extension to 05
    mv 04-file-extension-patterns.md 05a-file-extension-patterns.md
    # Now rename properly
    mv 03b-type-safety-patterns.md 03-type-safety-patterns.md
    mv 04a-directory-structure-patterns.md 04-directory-structure-patterns.md
    mv 05a-file-extension-patterns.md 05-file-extension-patterns.md
fi

# Fix the gap at 10 (missing 10)
mv 11-hook-patterns.md 10-hook-patterns.md

# Fix duplicate 15 files
if [ -f "15-context-patterns.md" ] && [ -f "16-accessibility-patterns.md" ]; then
    mv 15-context-patterns.md 11-context-patterns.md
fi

# Fix misplaced accessibility file at 35
if [ -f "35-accessibility-patterns.md" ]; then
    rm 35-accessibility-patterns.md  # This is a duplicate of 16-accessibility-patterns.md
fi

echo "Final file structure:"
ls -la *.md | grep -E '^-' | awk '{print $9}' | sort -V