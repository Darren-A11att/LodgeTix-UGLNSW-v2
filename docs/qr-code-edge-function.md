⏺ Here's how to deploy the Edge Functions to Supabase:

  Step-by-Step Deployment Guide

  1. Prerequisites

  Make sure you have the Supabase CLI installed:
  npm install -g supabase

  2. Link Your Project

  If not already linked, connect to your Supabase project:
  supabase link --project-ref your-project-ref

  3. Apply Database Migration First

  # Push the migration to add QR code columns and storage buckets
  supabase db push

  4. Deploy the Edge Functions

  # Deploy the ticket QR generator
  supabase functions deploy generate-ticket-qr

  # Deploy the attendee QR generator
  supabase functions deploy generate-attendee-qr

  5. Verify Deployment

  # List deployed functions
  supabase functions list

  # Check function logs
  supabase functions logs generate-ticket-qr
  supabase functions logs generate-attendee-qr

  6. Set Up Database Webhooks

  Go to your Supabase Dashboard:

  1. Navigate to Database → Webhooks
  2. Click "Create a new webhook"

  For Ticket QR Generation:
  - Name: generate-ticket-qr-webhook
  - Table: tickets
  - Events: INSERT
  - Type: HTTP Request
  - Method: POST
  - URL: https://[YOUR-PROJECT-REF].supabase.co/functions/v1/generate-ticket-qr
  - Headers:
  Content-Type: application/json
  Authorization: Bearer [YOUR-ANON-KEY]

  For Attendee QR Generation:
  - Name: generate-attendee-qr-webhook
  - Table: attendees
  - Events: INSERT
  - Type: HTTP Request
  - Method: POST
  - URL: https://[YOUR-PROJECT-REF].supabase.co/functions/v1/generate-attendee-qr
  - Headers:
  Content-Type: application/json
  Authorization: Bearer [YOUR-ANON-KEY]

  7. Test the System

  -- Test by creating a registration and ticket
  INSERT INTO registrations (
    function_id,
    registration_type,
    auth_user_id,
    stripe_payment_intent_id
  ) VALUES (
    'your-function-id',
    'individuals',
    'your-auth-user-id',
    'pi_test123'
  ) RETURNING registration_id;

  -- Use the registration_id from above
  INSERT INTO tickets (
    registration_id,
    event_id,
    ticket_type_id,
    price_paid,
    status
  ) VALUES (
    'registration-id-from-above',
    'your-event-id',
    'your-ticket-type-id',
    100.00,
    'reserved'
  );

  -- Check if QR was generated (wait a few seconds)
  SELECT ticket_id, qr_code_url FROM tickets WHERE registration_id = 'registration-id-from-above';

  Quick Deploy Script

  Create a deployment script:

  #!/bin/bash
  # deploy-qr-functions.sh

  echo "Deploying QR Code Edge Functions..."

  # Apply migration
  echo "1. Applying database migration..."
  supabase db push

  # Deploy functions
  echo "2. Deploying Edge Functions..."
  supabase functions deploy generate-ticket-qr
  supabase functions deploy generate-attendee-qr

  # Show deployed functions
  echo "3. Verifying deployment..."
  supabase functions list

  echo "✅ Deployment complete!"
  echo "⚠️  Don't forget to set up webhooks in the Supabase Dashboard!"

  Make it executable and run:
  chmod +x deploy-qr-functions.sh
  ./deploy-qr-functions.sh

  Environment Variables

  The Edge Functions automatically have access to:
  - SUPABASE_URL
  - SUPABASE_SERVICE_ROLE_KEY

  No additional configuration needed!