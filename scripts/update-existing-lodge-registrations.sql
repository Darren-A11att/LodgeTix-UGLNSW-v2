-- Script to update existing lodge registrations with missing financial fields
-- Run this after applying the migration to fix historical data

-- First, let's see what needs updating
WITH missing_fields AS (
  SELECT 
    r.registration_id,
    r.customer_id,
    r.booking_contact_id,
    r.organisation_id,
    r.connected_account_id,
    r.stripe_fee,
    o.stripe_onbehalfof
  FROM registrations r
  LEFT JOIN organisations o ON r.organisation_id = o.organisation_id
  WHERE r.registration_type = 'lodge'
    AND (
      r.booking_contact_id IS NULL 
      OR r.booking_contact_id != r.customer_id
      OR (r.connected_account_id IS NULL AND o.stripe_onbehalfof IS NOT NULL)
    )
)
SELECT 
  COUNT(*) as total_to_update,
  COUNT(CASE WHEN booking_contact_id IS NULL THEN 1 END) as missing_booking_contact,
  COUNT(CASE WHEN booking_contact_id != customer_id THEN 1 END) as mismatched_booking_contact,
  COUNT(CASE WHEN connected_account_id IS NULL AND stripe_onbehalfof IS NOT NULL THEN 1 END) as missing_connected_account
FROM missing_fields;

-- Update booking_contact_id to match customer_id
UPDATE registrations
SET 
  booking_contact_id = customer_id,
  updated_at = NOW()
WHERE registration_type = 'lodge'
  AND (booking_contact_id IS NULL OR booking_contact_id != customer_id);

-- Update connected_account_id from organisation's stripe_onbehalfof
UPDATE registrations r
SET 
  connected_account_id = o.stripe_onbehalfof,
  updated_at = NOW()
FROM organisations o
WHERE r.organisation_id = o.organisation_id
  AND r.registration_type = 'lodge'
  AND r.connected_account_id IS NULL
  AND o.stripe_onbehalfof IS NOT NULL;

-- Verify the updates
SELECT 
  'Updated Lodge Registrations' as status,
  COUNT(*) as total_lodge_registrations,
  COUNT(CASE WHEN booking_contact_id = customer_id THEN 1 END) as correct_booking_contact,
  COUNT(CASE WHEN connected_account_id IS NOT NULL THEN 1 END) as has_connected_account,
  COUNT(CASE WHEN stripe_fee IS NOT NULL AND stripe_fee > 0 THEN 1 END) as has_stripe_fee
FROM registrations
WHERE registration_type = 'lodge';