#!/bin/bash
# Script to convert existing PascalCase tables to snake_case

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TEMP_FILE="$PROJECT_ROOT/tmp/snake-case-migration.sql"

# Create temp directory if it doesn't exist
mkdir -p "$PROJECT_ROOT/tmp"

echo "=== LodgeTix Table Name Migration Script ==="
echo "This script will convert table names from PascalCase to snake_case."
echo

# Ensure we have the Supabase URL and key
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
    echo "Error: Supabase environment variables not set."
    echo "Please set the following environment variables:"
    echo "  NEXT_PUBLIC_SUPABASE_URL"
    echo "  NEXT_PUBLIC_SUPABASE_ANON_KEY"
    echo
    echo "You can set them temporarily with:"
    echo "  export NEXT_PUBLIC_SUPABASE_URL=your-url"
    echo "  export NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key"
    exit 1
fi

# Create the migration SQL
cat > "$TEMP_FILE" << EOF
BEGIN;

-- Rename tables
ALTER TABLE IF EXISTS "AttendeeEvents" RENAME TO attendee_events;
ALTER TABLE IF EXISTS "Attendees" RENAME TO attendees;
ALTER TABLE IF EXISTS "Customers" RENAME TO customers;
ALTER TABLE IF EXISTS "Events" RENAME TO events;
ALTER TABLE IF EXISTS "EventTickets" RENAME TO event_tickets;
ALTER TABLE IF EXISTS "GrandLodges" RENAME TO grand_lodges;
ALTER TABLE IF EXISTS "Lodges" RENAME TO lodges;
ALTER TABLE IF EXISTS "Registrations" RENAME TO registrations;
ALTER TABLE IF EXISTS "Tickets" RENAME TO tickets;
ALTER TABLE IF EXISTS "TicketTypes" RENAME TO ticket_types;

-- Rename attendee_events columns
ALTER TABLE IF EXISTS attendee_events RENAME COLUMN "attendeeId" TO attendee_id;
ALTER TABLE IF EXISTS attendee_events RENAME COLUMN "eventId" TO event_id;
ALTER TABLE IF EXISTS attendee_events RENAME COLUMN "createdAt" TO created_at;
ALTER TABLE IF EXISTS attendee_events RENAME COLUMN "updatedAt" TO updated_at;

-- Rename attendees columns
ALTER TABLE IF EXISTS attendees RENAME COLUMN "firstName" TO first_name;
ALTER TABLE IF EXISTS attendees RENAME COLUMN "lastName" TO last_name;
ALTER TABLE IF EXISTS attendees RENAME COLUMN "emailAddress" TO email_address;
ALTER TABLE IF EXISTS attendees RENAME COLUMN "phoneNumber" TO phone_number;
ALTER TABLE IF EXISTS attendees RENAME COLUMN "eventId" TO event_id;
ALTER TABLE IF EXISTS attendees RENAME COLUMN "registrationId" TO registration_id;
ALTER TABLE IF EXISTS attendees RENAME COLUMN "createdAt" TO created_at;
ALTER TABLE IF EXISTS attendees RENAME COLUMN "updatedAt" TO updated_at;
ALTER TABLE IF EXISTS attendees RENAME COLUMN "hasPartner" TO has_partner;
ALTER TABLE IF EXISTS attendees RENAME COLUMN "partnerFirstName" TO partner_first_name;
ALTER TABLE IF EXISTS attendees RENAME COLUMN "partnerLastName" TO partner_last_name;
ALTER TABLE IF EXISTS attendees RENAME COLUMN "partnerEmailAddress" TO partner_email_address;
ALTER TABLE IF EXISTS attendees RENAME COLUMN "partnerPhoneNumber" TO partner_phone_number;
ALTER TABLE IF EXISTS attendees RENAME COLUMN "partnerRelationship" TO partner_relationship;
ALTER TABLE IF EXISTS attendees RENAME COLUMN "dietaryRequirements" TO dietary_requirements;
ALTER TABLE IF EXISTS attendees RENAME COLUMN "lodgeId" TO lodge_id;
ALTER TABLE IF EXISTS attendees RENAME COLUMN "grandLodgeId" TO grand_lodge_id;
ALTER TABLE IF EXISTS attendees RENAME COLUMN "isGrandOfficer" TO is_grand_officer;
ALTER TABLE IF EXISTS attendees RENAME COLUMN "grandRank" TO grand_rank;

-- Rename customers columns
ALTER TABLE IF EXISTS customers RENAME COLUMN "firstName" TO first_name;
ALTER TABLE IF EXISTS customers RENAME COLUMN "lastName" TO last_name;
ALTER TABLE IF EXISTS customers RENAME COLUMN "emailAddress" TO email_address;
ALTER TABLE IF EXISTS customers RENAME COLUMN "phoneNumber" TO phone_number;
ALTER TABLE IF EXISTS customers RENAME COLUMN "createdAt" TO created_at;
ALTER TABLE IF EXISTS customers RENAME COLUMN "updatedAt" TO updated_at;

-- Rename events columns
ALTER TABLE IF EXISTS events RENAME COLUMN "eventName" TO event_name;
ALTER TABLE IF EXISTS events RENAME COLUMN "eventDate" TO event_date;
ALTER TABLE IF EXISTS events RENAME COLUMN "eventLocation" TO event_location;
ALTER TABLE IF EXISTS events RENAME COLUMN "eventDescription" TO event_description;
ALTER TABLE IF EXISTS events RENAME COLUMN "eventStatus" TO event_status;
ALTER TABLE IF EXISTS events RENAME COLUMN "createdAt" TO created_at;
ALTER TABLE IF EXISTS events RENAME COLUMN "updatedAt" TO updated_at;
ALTER TABLE IF EXISTS events RENAME COLUMN "eventType" TO event_type;
ALTER TABLE IF EXISTS events RENAME COLUMN "eventCapacity" TO event_capacity;
ALTER TABLE IF EXISTS events RENAME COLUMN "isFeatured" TO is_featured;
ALTER TABLE IF EXISTS events RENAME COLUMN "eventSlug" TO event_slug;

-- Rename event_tickets columns
ALTER TABLE IF EXISTS event_tickets RENAME COLUMN "eventId" TO event_id;
ALTER TABLE IF EXISTS event_tickets RENAME COLUMN "ticketTypeId" TO ticket_type_id;
ALTER TABLE IF EXISTS event_tickets RENAME COLUMN "ticketPrice" TO ticket_price;
ALTER TABLE IF EXISTS event_tickets RENAME COLUMN "ticketQuantity" TO ticket_quantity;
ALTER TABLE IF EXISTS event_tickets RENAME COLUMN "createdAt" TO created_at;
ALTER TABLE IF EXISTS event_tickets RENAME COLUMN "updatedAt" TO updated_at;

-- Rename grand_lodges columns
ALTER TABLE IF EXISTS grand_lodges RENAME COLUMN "grandLodgeName" TO grand_lodge_name;
ALTER TABLE IF EXISTS grand_lodges RENAME COLUMN "createdAt" TO created_at;
ALTER TABLE IF EXISTS grand_lodges RENAME COLUMN "updatedAt" TO updated_at;

-- Rename lodges columns
ALTER TABLE IF EXISTS lodges RENAME COLUMN "lodgeName" TO lodge_name;
ALTER TABLE IF EXISTS lodges RENAME COLUMN "lodgeNumber" TO lodge_number;
ALTER TABLE IF EXISTS lodges RENAME COLUMN "grandLodgeId" TO grand_lodge_id;
ALTER TABLE IF EXISTS lodges RENAME COLUMN "createdAt" TO created_at;
ALTER TABLE IF EXISTS lodges RENAME COLUMN "updatedAt" TO updated_at;

-- Rename registrations columns
ALTER TABLE IF EXISTS registrations RENAME COLUMN "registrationType" TO registration_type;
ALTER TABLE IF EXISTS registrations RENAME COLUMN "eventId" TO event_id;
ALTER TABLE IF EXISTS registrations RENAME COLUMN "customerId" TO customer_id;
ALTER TABLE IF EXISTS registrations RENAME COLUMN "registrationStatus" TO registration_status;
ALTER TABLE IF EXISTS registrations RENAME COLUMN "createdAt" TO created_at;
ALTER TABLE IF EXISTS registrations RENAME COLUMN "updatedAt" TO updated_at;
ALTER TABLE IF EXISTS registrations RENAME COLUMN "paymentAmount" TO payment_amount;
ALTER TABLE IF EXISTS registrations RENAME COLUMN "paymentStatus" TO payment_status;
ALTER TABLE IF EXISTS registrations RENAME COLUMN "paymentIntentId" TO payment_intent_id;
ALTER TABLE IF EXISTS registrations RENAME COLUMN "billingName" TO billing_name;
ALTER TABLE IF EXISTS registrations RENAME COLUMN "billingEmail" TO billing_email;
ALTER TABLE IF EXISTS registrations RENAME COLUMN "billingStreet" TO billing_street;
ALTER TABLE IF EXISTS registrations RENAME COLUMN "billingCity" TO billing_city;
ALTER TABLE IF EXISTS registrations RENAME COLUMN "billingState" TO billing_state;
ALTER TABLE IF EXISTS registrations RENAME COLUMN "billingZip" TO billing_zip;
ALTER TABLE IF EXISTS registrations RENAME COLUMN "billingCountry" TO billing_country;
ALTER TABLE IF EXISTS registrations RENAME COLUMN "registrationId" TO registration_id;
ALTER TABLE IF EXISTS registrations RENAME COLUMN "totalAmountPaid" TO total_amount_paid;
ALTER TABLE IF EXISTS registrations RENAME COLUMN "totalPricePaid" TO total_price_paid;
ALTER TABLE IF EXISTS registrations RENAME COLUMN "agreeToTerms" TO agree_to_terms;
ALTER TABLE IF EXISTS registrations RENAME COLUMN "stripePaymentIntentId" TO stripe_payment_intent_id;
ALTER TABLE IF EXISTS registrations RENAME COLUMN "primaryAttendeeId" TO primary_attendee_id;
ALTER TABLE IF EXISTS registrations RENAME COLUMN "registrationData" TO registration_data;

-- Rename tickets columns
ALTER TABLE IF EXISTS tickets RENAME COLUMN "ticketTypeId" TO ticket_type_id;
ALTER TABLE IF EXISTS tickets RENAME COLUMN "eventId" TO event_id;
ALTER TABLE IF EXISTS tickets RENAME COLUMN "attendeeId" TO attendee_id;
ALTER TABLE IF EXISTS tickets RENAME COLUMN "registrationId" TO registration_id;
ALTER TABLE IF EXISTS tickets RENAME COLUMN "ticketPrice" TO ticket_price;
ALTER TABLE IF EXISTS tickets RENAME COLUMN "ticketStatus" TO ticket_status;
ALTER TABLE IF EXISTS tickets RENAME COLUMN "createdAt" TO created_at;
ALTER TABLE IF EXISTS tickets RENAME COLUMN "updatedAt" TO updated_at;
ALTER TABLE IF EXISTS tickets RENAME COLUMN "isPartnerTicket" TO is_partner_ticket;

-- Rename ticket_types columns
ALTER TABLE IF EXISTS ticket_types RENAME COLUMN "ticketName" TO ticket_name;
ALTER TABLE IF EXISTS ticket_types RENAME COLUMN "ticketDescription" TO ticket_description;
ALTER TABLE IF EXISTS ticket_types RENAME COLUMN "createdAt" TO created_at;
ALTER TABLE IF EXISTS ticket_types RENAME COLUMN "updatedAt" TO updated_at;

-- Rename primary key constraints and indexes
ALTER INDEX IF EXISTS "Events_pkey" RENAME TO events_pkey;
ALTER INDEX IF EXISTS "Attendees_pkey" RENAME TO attendees_pkey;
ALTER INDEX IF EXISTS "Customers_pkey" RENAME TO customers_pkey;
ALTER INDEX IF EXISTS "EventTickets_pkey" RENAME TO event_tickets_pkey;
ALTER INDEX IF EXISTS "GrandLodges_pkey" RENAME TO grand_lodges_pkey;
ALTER INDEX IF EXISTS "Lodges_pkey" RENAME TO lodges_pkey;
ALTER INDEX IF EXISTS "registrations_consolidated_pkey" RENAME TO registrations_pkey;
ALTER INDEX IF EXISTS "Tickets_pkey" RENAME TO tickets_pkey;
ALTER INDEX IF EXISTS "TicketTypes_pkey" RENAME TO ticket_types_pkey;

-- Create a log table to track table and column renames
CREATE TABLE IF NOT EXISTS log.table_rename_log (
  id SERIAL PRIMARY KEY,
  old_name TEXT NOT NULL,
  new_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS log.column_rename_log (
  id SERIAL PRIMARY KEY,
  table_name TEXT NOT NULL,
  old_name TEXT NOT NULL,
  new_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMIT;
EOF

echo "Migration SQL created at: $TEMP_FILE"
echo

# Display options to run migrations
echo "How would you like to run the migrations?"
echo "1) Using Supabase CLI (if installed)"
echo "2) Using Supabase direct SQL API endpoint"
echo "3) Just create the file (manual run later)"
echo "q) Quit without running migrations"
read -p "Select an option [1-3/q]: " option

case "$option" in
    1)
        echo "Running migrations with Supabase CLI..."
        if ! command -v supabase &> /dev/null; then
            echo "Error: Supabase CLI not found. Please install it first."
            echo "npm install -g supabase"
            exit 1
        fi
        
        read -p "Enter your Supabase project reference: " PROJECT_REF
        supabase link --project-ref "$PROJECT_REF"
        supabase db execute -f "$TEMP_FILE"
        ;;
    2)
        echo "Running migrations with direct SQL API..."
        # Get Supabase direct SQL API endpoint
        SUPABASE_HOST=$(echo $NEXT_PUBLIC_SUPABASE_URL | sed 's/https:\/\///')
        SQL_API_URL="https://$SUPABASE_HOST/rest/v1/sql"
        
        # Read the migration file
        MIGRATION_SQL=$(cat "$TEMP_FILE")
        
        # Run the migrations
        echo "Sending SQL to Supabase..."
        curl -X POST "$SQL_API_URL" \
            -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
            -H "Authorization: Bearer $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
            -H "Content-Type: application/json" \
            -d "{\"query\": \"$MIGRATION_SQL\"}"
        echo
        ;;
    3)
        echo "Migration file created but not executed."
        echo "You can run it manually with your preferred SQL tool."
        ;;
    q|Q)
        echo "Quitting without running migrations."
        exit 0
        ;;
    *)
        echo "Invalid option."
        exit 1
        ;;
esac

echo
echo "=== Migration Process Complete ==="
echo 