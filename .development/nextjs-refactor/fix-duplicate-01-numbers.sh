#!/bin/bash

cd /Users/darrenallatt/Development/LodgeTix-UGLNSW-v2/.development/nextjs-refactor

# Fix the duplicate 01 numbers to have unique sequence numbers
echo "Fixing duplicate 01 sequence numbers..."

# Keep the architecture laws as 01
# Move UI design laws to 02, shifting everything else up
mv 02-type-safety-patterns.md temp-03-type-safety-patterns.md
mv 01-immutable-ui-design-laws.md 02-immutable-ui-design-laws.md
mv temp-03-type-safety-patterns.md 03-type-safety-patterns.md

# Shift all other pattern files up by 1
for i in {3..21}; do
    next=$((i + 1))
    old_file=$(ls ${i}-*.md 2>/dev/null | head -1)
    if [ -n "$old_file" ] && [ "$old_file" != "03-type-safety-patterns.md" ]; then
        new_file=$(echo "$old_file" | sed "s/^${i}-/${next}-/")
        echo "Moving $old_file to $new_file"
        mv "$old_file" "$new_file"
    fi
done

# Shift reference materials up by 1 
for i in {22..34}; do
    next=$((i + 1))
    old_file=$(ls ${i}-*.md 2>/dev/null | head -1)
    if [ -n "$old_file" ]; then
        new_file=$(echo "$old_file" | sed "s/^${i}-/${next}-/")
        echo "Moving $old_file to $new_file"
        mv "$old_file" "$new_file"
    fi
done

echo "Updated file structure:"
ls -la *.md | grep -E '^-' | awk '{print $9}' | sort -V