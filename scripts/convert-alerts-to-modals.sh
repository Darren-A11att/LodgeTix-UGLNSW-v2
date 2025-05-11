#!/bin/bash

# Script to replace browser alerts with styled modals in React components
# Usage: ./convert-alerts-to-modals.sh [directory_path]

set -e

# Define the directory to search in
TARGET_DIR=${1:-"./components"}

# Find files containing alert(
FILES_WITH_ALERTS=$(grep -l "alert(" $TARGET_DIR --include="*.tsx" --include="*.jsx" --recursive)

if [ -z "$FILES_WITH_ALERTS" ]; then
  echo "No files with alerts found in $TARGET_DIR"
  exit 0
fi

echo "Found $(echo "$FILES_WITH_ALERTS" | wc -l | tr -d ' ') files with browser alerts"

for FILE in $FILES_WITH_ALERTS; do
  echo "Processing $FILE..."
  
  # Check if the file already imports AlertModal
  if ! grep -q "import { AlertModal }" "$FILE"; then
    # Add import for AlertModal and Lucide icons
    sed -i '' '1,/^import/s/^\(import.*\)$/\1\nimport { AlertModal } from "@\/components\/ui\/alert-modal"/' "$FILE"
    echo "  Added AlertModal import"
  fi
  
  # Check if the file already has alertModalOpen state
  if ! grep -q "alertModalOpen" "$FILE"; then
    # Add state for modal
    COMPONENT_START=$(grep -n "function\|const.*=.*(" "$FILE" | head -1 | cut -d':' -f1)
    STATE_LINE=$((COMPONENT_START + 5))
    
    sed -i '' "${STATE_LINE}i\\
  // Alert modal state\\
  const [alertModalOpen, setAlertModalOpen] = useState(false)\\
  const [alertModalData, setAlertModalData] = useState({\\
    title: \"\",\\
    description: \"\",\\
    variant: \"default\" as \"default\" | \"destructive\" | \"success\" | \"warning\"\\
  })\\
" "$FILE"
    echo "  Added modal state"
  fi
  
  # Check if showAlert function exists
  if ! grep -q "showAlert" "$FILE"; then
    # Add showAlert function
    COMPONENT_START=$(grep -n "function\|const.*=.*(" "$FILE" | head -1 | cut -d':' -f1)
    HOOKS_END=$(grep -n "useEffect" "$FILE" | tail -1 | cut -d':' -f1)
    FUNC_LINE=$((HOOKS_END + 20))
    
    sed -i '' "${FUNC_LINE}i\\
  const showAlert = (title: string, description: string, variant: \"default\" | \"destructive\" | \"success\" | \"warning\" = \"default\") => {\\
    setAlertModalData({ title, description, variant })\\
    setAlertModalOpen(true)\\
  }\\
" "$FILE"
    echo "  Added showAlert function"
  fi
  
  # Replace alert calls with showAlert
  # First, find alert calls with appropriate context and replace with specific titles
  sed -i '' 's/alert(\("Please fill in all required.*"\))/showAlert("Required Fields Missing", \1, "warning")/g' "$FILE"
  sed -i '' 's/alert(\("Please ensure each attendee has.*"\))/showAlert("Tickets Required", \1, "warning")/g' "$FILE"
  
  # Then handle any remaining generic alerts
  sed -i '' 's/alert(\("[^"]*"\))/showAlert("Warning", \1, "warning")/g' "$FILE"
  sed -i '' 's/alert(\('\''[^'\'']*'\''\))/showAlert("Warning", \1, "warning")/g' "$FILE"
  echo "  Replaced alert calls with showAlert"
  
  # Add AlertModal component
  if ! grep -q "<AlertModal" "$FILE"; then
    # Find the end of the component's return statement
    END_LINE=$(grep -n "export \|export default \|^}" "$FILE" | tail -1 | cut -d':' -f1)
    PREV_LINE=$((END_LINE - 1))
    
    # Check if we need to add a fragment wrapper
    if ! grep -q "return (.*<>" "$FILE"; then
      # If it's already in a fragment, just add before the closing fragment
      if grep -q "</>" "$FILE"; then
        FRAGMENT_END=$(grep -n "</>" "$FILE" | tail -1 | cut -d':' -f1)
        MODAL_INSERT_LINE=$((FRAGMENT_END))
        
        sed -i '' "${MODAL_INSERT_LINE}i\\
\\
      <AlertModal\\
        isOpen={alertModalOpen}\\
        onClose={() => setAlertModalOpen(false)}\\
        title={alertModalData.title}\\
        description={alertModalData.description}\\
        variant={alertModalData.variant}\\
        actionLabel=\"OK\"\\
      />\\
" "$FILE"
      else
        # Wrap return with fragments and add modal
        sed -i '' 's/return (/return (<>/g' "$FILE"
        # Find the closing paren of the return statement
        RETURN_END=$(grep -n "return (" "$FILE" | head -1 | cut -d':' -f1)
        # Count opening and closing parens to find the matching closing paren
        OPEN_PARENS=1
        LINE_NUM=$((RETURN_END + 1))
        while [ $OPEN_PARENS -gt 0 ] && [ $LINE_NUM -lt $END_LINE ]; do
          LINE=$(sed -n "${LINE_NUM}p" "$FILE")
          OPEN_COUNT=$(echo "$LINE" | grep -o "(" | wc -l)
          CLOSE_COUNT=$(echo "$LINE" | grep -o ")" | wc -l)
          OPEN_PARENS=$((OPEN_PARENS + OPEN_COUNT - CLOSE_COUNT))
          if [ $OPEN_PARENS -eq 0 ]; then
            RETURN_CLOSE_LINE=$LINE_NUM
          fi
          LINE_NUM=$((LINE_NUM + 1))
        done
        
        # Insert fragment close and modal before the closing paren
        sed -i '' "${RETURN_CLOSE_LINE}i\\
\\
      <AlertModal\\
        isOpen={alertModalOpen}\\
        onClose={() => setAlertModalOpen(false)}\\
        title={alertModalData.title}\\
        description={alertModalData.description}\\
        variant={alertModalData.variant}\\
        actionLabel=\"OK\"\\
      />\\
      </>\\
" "$FILE"
        # Remove the original closing paren and add it after the fragment
        sed -i '' "${RETURN_CLOSE_LINE}s/)//" "$FILE"
        NEXT_LINE=$((RETURN_CLOSE_LINE + 3))
        sed -i '' "${NEXT_LINE}s/$/)/" "$FILE"
      fi
    else
      # Already has a fragment, just add modal before the closing fragment
      FRAGMENT_END=$(grep -n "</>" "$FILE" | tail -1 | cut -d':' -f1)
      MODAL_INSERT_LINE=$((FRAGMENT_END))
      
      sed -i '' "${MODAL_INSERT_LINE}i\\
\\
      <AlertModal\\
        isOpen={alertModalOpen}\\
        onClose={() => setAlertModalOpen(false)}\\
        title={alertModalData.title}\\
        description={alertModalData.description}\\
        variant={alertModalData.variant}\\
        actionLabel=\"OK\"\\
      />\\
" "$FILE"
    fi
    
    echo "  Added AlertModal component"
  fi
  
  echo "✅ Completed processing $FILE"
done

echo "Conversion complete! All browser alerts have been replaced with styled modals."