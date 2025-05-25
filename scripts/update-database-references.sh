#!/bin/bash

# Script to update database references after migration
# Updates table names from PascalCase to lowercase and column names to snake_case

echo "🔄 Updating database references throughout the codebase..."

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counter for changes
CHANGES=0

# Function to count and report changes
update_file() {
    local file=$1
    local pattern=$2
    local replacement=$3
    local description=$4
    
    if grep -q "$pattern" "$file" 2>/dev/null; then
        sed -i '' "s/$pattern/$replacement/g" "$file"
        echo -e "${GREEN}✓${NC} Updated $file: $description"
        ((CHANGES++))
    fi
}

echo -e "\n${YELLOW}1. Updating table names from PascalCase to lowercase...${NC}"

# Update direct table references
find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) \
    -not -path "./node_modules/*" \
    -not -path "./.next/*" \
    -not -path "./scripts/*" \
    -exec grep -l "Registrations\|Tickets" {} \; | while read file; do
    
    # Update Registrations to registrations
    update_file "$file" "from(['\"])Registrations(['\"])" "from(\1registrations\2)" "Registrations → registrations"
    update_file "$file" "table(['\"])Registrations(['\"])" "table(\1registrations\2)" "Registrations → registrations"
    update_file "$file" "\.Registrations\b" ".registrations" "Registrations → registrations"
    update_file "$file" "['\"]Registrations['\"]" "'registrations'" "Registrations → registrations"
    
    # Update Tickets to tickets
    update_file "$file" "from(['\"])Tickets(['\"])" "from(\1tickets\2)" "Tickets → tickets"
    update_file "$file" "table(['\"])Tickets(['\"])" "table(\1tickets\2)" "Tickets → tickets"
    update_file "$file" "\.Tickets\b" ".tickets" "Tickets → tickets"
    update_file "$file" "['\"]Tickets['\"]" "'tickets'" "Tickets → tickets"
done

echo -e "\n${YELLOW}2. Updating column references in tickets table...${NC}"

# Update ticket column references
find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) \
    -not -path "./node_modules/*" \
    -not -path "./.next/*" \
    -not -path "./supabase/supabase.ts" \
    -not -path "./scripts/*" \
    -exec grep -l "ticketid\|attendeeid\|eventid\|ticketdefinitionid\|pricepaid\|seatinfo\|checkedinat\|createdat\|updatedat" {} \; | while read file; do
    
    # Update camelCase columns to snake_case
    update_file "$file" "\bticketid\b" "ticket_id" "ticketid → ticket_id"
    update_file "$file" "\battendeeid\b" "attendee_id" "attendeeid → attendee_id"
    update_file "$file" "\beventid\b" "event_id" "eventid → event_id"
    update_file "$file" "\bticketdefinitionid\b" "ticket_definition_id" "ticketdefinitionid → ticket_definition_id"
    update_file "$file" "\bpricepaid\b" "price_paid" "pricepaid → price_paid"
    update_file "$file" "\bseatinfo\b" "seat_info" "seatinfo → seat_info"
    update_file "$file" "\bcheckedinat\b" "checked_in_at" "checkedinat → checked_in_at"
    update_file "$file" "\bcreatedat\b" "created_at" "createdat → created_at"
    update_file "$file" "\bupdatedat\b" "updated_at" "updatedat → updated_at"
done

echo -e "\n${YELLOW}3. Removing DB_TABLE_NAMES workaround...${NC}"

# Update supabase-singleton.ts to remove the workaround
if [ -f "lib/supabase-singleton.ts" ]; then
    # Remove DB_TABLE_NAMES mapping
    sed -i '' '/export const DB_TABLE_NAMES/,/^}/d' lib/supabase-singleton.ts
    echo -e "${GREEN}✓${NC} Removed DB_TABLE_NAMES from lib/supabase-singleton.ts"
    ((CHANGES++))
fi

echo -e "\n${YELLOW}4. Updating specific API routes...${NC}"

# Update registrations API route
if [ -f "app/api/registrations/route.ts" ]; then
    # Remove dual insert logic
    sed -i '' '/Insert into both tables for compatibility/,/Insert into Registrations/d' app/api/registrations/route.ts
    echo -e "${GREEN}✓${NC} Updated app/api/registrations/route.ts"
    ((CHANGES++))
fi

echo -e "\n${YELLOW}5. Updating type imports...${NC}"

# Update any imports of the old types
find . -type f \( -name "*.ts" -o -name "*.tsx" \) \
    -not -path "./node_modules/*" \
    -not -path "./.next/*" \
    -not -path "./supabase/supabase.ts" \
    -exec grep -l "Database\[.*\]\[.*Registrations.*\]\|Database\[.*\]\[.*Tickets.*\]" {} \; | while read file; do
    
    update_file "$file" "Database\[(['\"])public(['\"])\]\[(['\"])Tables(['\"])\]\[(['\"])Registrations(['\"])\]" "Database[\1public\2][\3Tables\4][\5registrations\6]" "Type reference update"
    update_file "$file" "Database\[(['\"])public(['\"])\]\[(['\"])Tables(['\"])\]\[(['\"])Tickets(['\"])\]" "Database[\1public\2][\3Tables\4][\5tickets\6]" "Type reference update"
done

echo -e "\n${YELLOW}6. Final cleanup...${NC}"

# Remove any remaining references in comments or strings
find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) \
    -not -path "./node_modules/*" \
    -not -path "./.next/*" \
    -not -path "./scripts/*" \
    -not -path "./development/*" \
    -exec grep -l "PascalCase.*Registrations\|PascalCase.*Tickets" {} \; | while read file; do
    
    sed -i '' 's/PascalCase.*Registrations/registrations/g' "$file"
    sed -i '' 's/PascalCase.*Tickets/tickets/g' "$file"
    echo -e "${GREEN}✓${NC} Cleaned up comments in $file"
    ((CHANGES++))
done

echo -e "\n${GREEN}✅ Update complete!${NC}"
echo -e "Total files updated: ${CHANGES}"

echo -e "\n${YELLOW}Next steps:${NC}"
echo "1. Copy the new types file: cp supabase/supabase.ts shared/types/supabase.ts"
echo "2. Run: npm run build"
echo "3. Test the application thoroughly"
echo "4. Check for any TypeScript errors: npx tsc --noEmit"