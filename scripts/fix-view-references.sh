#!/bin/bash

echo "Fixing view references in tables migration..."

# Get all views from the views migration
views=$(grep -E "CREATE.*VIEW" supabase/migrations/parsed/20250605073722_006_views.sql | sed -E 's/.*"([^"]+)".*/\1/')

# Remove ALTER TABLE statements for views from tables migration
for view in $views; do
  echo "Fixing references to view: $view"
  sed -i '' "s/ALTER TABLE \"public\".\"$view\".*$/-- $view is a view, handled in views migration/g" supabase/migrations/20250605073723_remote_tables.sql
done

echo "Fixed view references"