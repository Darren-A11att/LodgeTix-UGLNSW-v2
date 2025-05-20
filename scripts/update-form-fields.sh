#!/bin/bash
set -e

# Script to update form field grid classes to use the new form-grid and field-size model
# Script modifies files in-place

echo "Starting form field classes update..."

# Create backup directory if it doesn't exist
BACKUP_DIR="/Users/darrenallatt/Development/LodgeTix-UGLNSW-v2/scripts/grid-classes-backup"
mkdir -p "$BACKUP_DIR"

# List of files to process (excluding backup and git directories)
FILES=$(find /Users/darrenallatt/Development/LodgeTix-UGLNSW-v2/components/register -type f -name "*.tsx" \
  | grep -v "node_modules" \
  | grep -v "\.git" \
  | grep -v "oldforms-backup")

# Make a backup of all files first
echo "Creating backups in $BACKUP_DIR..."
for FILE in $FILES; do
  RELATIVE_PATH=$(echo "$FILE" | sed "s|/Users/darrenallatt/Development/LodgeTix-UGLNSW-v2/||")
  BACKUP_FILE="$BACKUP_DIR/$RELATIVE_PATH"
  mkdir -p $(dirname "$BACKUP_FILE")
  cp "$FILE" "$BACKUP_FILE"
done

echo "Processing files..."

for FILE in $FILES; do
  echo "Processing $FILE"
  
  # Make a temporary file
  TEMP_FILE=$(mktemp)
  
  # 1. Update grid-cols-1 md:grid-cols-X patterns to form-grid
  sed -E '
    # Convert grid container classes to form-grid
    s/className="([^"]*)grid grid-cols-1 md:grid-cols-([0-9]+)([^"]*)"/className="\1form-grid\3"/g
    s/className=`([^`]*)grid grid-cols-1 md:grid-cols-([0-9]+)([^`]*)`/className=`\1form-grid\3`/g
    s/className=\{([^}]*)"grid grid-cols-1 md:grid-cols-([0-9]+)([^}]*)"\}/className={\1"form-grid\3"}/g
    s/className=\{cn\("grid grid-cols-1 md:grid-cols-([0-9]+)([^}]*)"\)\}/className={cn("form-grid\2")}/g
    
    # Handle other grid container variations 
    s/className="([^"]*)grid grid-cols-([0-9]+) gap-([0-9]+)([^"]*)"/className="\1form-grid\4"/g
    s/className=`([^`]*)grid grid-cols-([0-9]+) gap-([0-9]+)([^`]*)`/className=`\1form-grid\4`/g
  ' "$FILE" > "$TEMP_FILE"
  
  # 2. Update md:col-span-X patterns to field-X classes
  sed -E '
    # Convert field col-span classes to field size utilities
    s/className="([^"]*)md:col-span-1([^"]*)"/className="\1field-sm\2"/g
    s/className=`([^`]*)md:col-span-1([^`]*)`/className=`\1field-sm\2`/g
    s/className=\{([^}]*)"md:col-span-1([^}]*)"\}/className={\1"field-sm\2"}/g
    
    s/className="([^"]*)md:col-span-2([^"]*)"/className="\1field-md\2"/g
    s/className=`([^`]*)md:col-span-2([^`]*)`/className=`\1field-md\2`/g
    s/className=\{([^}]*)"md:col-span-2([^}]*)"\}/className={\1"field-md\2"}/g
    
    s/className="([^"]*)md:col-span-3([^"]*)"/className="\1field-lg\2"/g
    s/className=`([^`]*)md:col-span-3([^`]*)`/className=`\1field-lg\2`/g
    s/className=\{([^}]*)"md:col-span-3([^}]*)"\}/className={\1"field-lg\2"}/g
    
    s/className="([^"]*)col-span-full([^"]*)"/className="\1field-full\2"/g
    s/className=`([^`]*)col-span-full([^`]*)`/className=`\1field-full\2`/g
    s/className=\{([^}]*)"col-span-full([^}]*)"\}/className={\1"field-full\2"}/g
    
    s/className="([^"]*)md:col-span-full([^"]*)"/className="\1field-full\2"/g
    s/className=`([^`]*)md:col-span-full([^`]*)`/className=`\1field-full\2`/g
    s/className=\{([^}]*)"md:col-span-full([^}]*)"\}/className={\1"field-full\2"}/g
    
    s/className="([^"]*)col-span-12([^"]*)"/className="\1field-full\2"/g
    s/className=`([^`]*)col-span-12([^`]*)`/className=`\1field-full\2`/g
    s/className=\{([^}]*)"col-span-12([^}]*)"\}/className={\1"field-full\2"}/g
  ' "$TEMP_FILE" > "$FILE"
  
  rm "$TEMP_FILE"
done

# Fix any files that need special handling (if needed)
echo "All files processed. Please check the changes before committing."
echo "Backups are stored in $BACKUP_DIR"