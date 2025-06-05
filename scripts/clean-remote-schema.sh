#!/bin/bash

# Clean the remote schema dump for local use
echo "Cleaning remote schema for local development..."

# Create a backup
cp supabase/migrations/20250605073722_remote_schema.sql supabase/migrations/20250605073722_remote_schema.sql.original

# Remove prisma role references
sed -i '' '/GRANT.*prisma/d' supabase/migrations/20250605073722_remote_schema.sql
sed -i '' '/REVOKE.*prisma/d' supabase/migrations/20250605073722_remote_schema.sql
sed -i '' '/ALTER.*OWNER TO "prisma"/d' supabase/migrations/20250605073722_remote_schema.sql

# Remove realtime schema references that might not exist locally
sed -i '' '/realtime\./d' supabase/migrations/20250605073722_remote_schema.sql

# Remove any DROP SCHEMA commands that might interfere
sed -i '' '/DROP SCHEMA/d' supabase/migrations/20250605073722_remote_schema.sql

echo "Schema cleaned successfully"