#!/bin/bash

# Reset Local Database Script
# This script resets your local Supabase database for development

echo "=== Resetting Local Supabase Database ==="
echo ""

# Stop all running containers
echo "1. Stopping all Supabase containers..."
supabase stop --all

# Remove problematic migrations temporarily
echo ""
echo "2. Moving problematic migrations..."
mkdir -p supabase/migrations_temp
mv supabase/migrations/20250608000222_fix_all_registration_rls.sql supabase/migrations_temp/ 2>/dev/null || true
mv supabase/migrations/20250608000223_fix_function_security_definer.sql supabase/migrations_temp/ 2>/dev/null || true
mv supabase/migrations/20250608000224_fix_confirmation_number_constraint.sql supabase/migrations_temp/ 2>/dev/null || true
mv supabase/migrations/20250608000225_fix_booking_contact_fkey.sql supabase/migrations_temp/ 2>/dev/null || true
mv supabase/migrations/20250608000226_fix_ticket_column_mapping.sql supabase/migrations_temp/ 2>/dev/null || true
mv supabase/migrations/20250608000227_fix_ticket_status_constraint.sql supabase/migrations_temp/ 2>/dev/null || true
mv supabase/migrations/20250608000228_fix_all_ticket_constraints.sql supabase/migrations_temp/ 2>/dev/null || true
mv supabase/migrations/20250608000229_fix_attendee_ticket_order.sql supabase/migrations_temp/ 2>/dev/null || true
mv supabase/migrations/20250608000230_fix_event_id_lookup_from_event_tickets.sql supabase/migrations_temp/ 2>/dev/null || true
mv supabase/migrations/20250608000310_final_attendee_relationship_fix.sql supabase/migrations_temp/ 2>/dev/null || true
mv supabase/migrations/20250608001020_remove_attendee_fk_constraint.sql supabase/migrations_temp/ 2>/dev/null || true
mv supabase/migrations/20250608001030_force_remove_fk_constraint.sql supabase/migrations_temp/ 2>/dev/null || true
mv supabase/migrations/20250608001040_check_and_remove_all_fk_constraints.sql supabase/migrations_temp/ 2>/dev/null || true
mv supabase/migrations/20250608001100_final_remove_fk_constraint.sql supabase/migrations_temp/ 2>/dev/null || true
mv supabase/migrations/20250608001200_comprehensive_fk_removal.sql supabase/migrations_temp/ 2>/dev/null || true

# Start fresh
echo ""
echo "3. Starting Supabase with working migrations..."
supabase start

# Check status
echo ""
echo "4. Checking status..."
supabase status

echo ""
echo "=== Local Database Reset Complete ==="
echo ""
echo "Your local Supabase is now running with a clean database."
echo "The problematic migrations have been moved to supabase/migrations_temp/"
echo ""
echo "To restore them later:"
echo "  mv supabase/migrations_temp/*.sql supabase/migrations/"
echo ""
echo "Access your local Supabase at:"
echo "  Studio: http://localhost:54323"
echo "  API: http://localhost:54321"