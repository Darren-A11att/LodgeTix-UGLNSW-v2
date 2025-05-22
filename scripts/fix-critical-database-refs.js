#!/usr/bin/env node

/**
 * Critical Database References Fixer
 * 
 * Quick fix for the most critical database naming issues
 */

const fs = require('fs');
const path = require('path');

// Critical transformations based on the migration JSON
const CRITICAL_TRANSFORMS = {
  // Table names (case-sensitive)
  '"Events"': '"events"',
  "'Events'": "'events'",
  '"Registrations"': '"registrations"',
  "'Registrations'": "'registrations'",
  '"Customers"': '"customers"',
  "'Customers'": "'customers'",
  '"Tickets"': '"tickets"',
  "'Tickets'": "'tickets'",
  '"Attendees"': '"attendees"',
  "'Attendees'": "'attendees'",
  '"MasonicProfiles"': '"masonicprofiles"',
  "'MasonicProfiles'": "'masonicprofiles'",
  
  // Common field names
  '"registrationId"': '"registration_id"',
  '"eventId"': '"event_id"',
  '"customerId"': '"customer_id"',
  '"attendeeId"': '"attendee_id"',
  '"createdAt"': '"created_at"',
  '"updatedAt"': '"updated_at"',
  '"firstName"': '"first_name"',
  '"lastName"': '"last_name"',
  '"eventStart"': '"event_start"',
  '"eventEnd"': '"event_end"',
  '"imageUrl"': '"image_url"',
  '"paymentStatus"': '"payment_status"',
  '"registrationType"': '"registration_type"',
  '"registrationDate"': '"registration_date"',
  '"totalAmountPaid"': '"total_amount_paid"',
  '"stripePaymentIntentId"': '"stripe_payment_intent_id"',
  '"primaryAttendeeId"': '"primary_attendee_id"',
  
  // Enum values
  '"Mason"': '"mason"',
  '"Guest"': '"guest"',
  '"Individuals"': '"individuals"',
  '"Groups"': '"groups"',
  '"Officials"': '"officials"',
};

function applyTransforms(content) {
  let result = content;
  
  Object.entries(CRITICAL_TRANSFORMS).forEach(([oldValue, newValue]) => {
    const regex = new RegExp(oldValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    result = result.replace(regex, newValue);
  });
  
  return result;
}

function processFile(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return false;
  }
  
  try {
    const content = fs.readFileSync(fullPath, 'utf8');
    const transformed = applyTransforms(content);
    
    if (content !== transformed) {
      fs.writeFileSync(fullPath, transformed);
      console.log(`✅ Updated: ${filePath}`);
      return true;
    } else {
      console.log(`ℹ️  No changes needed: ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Critical files to fix immediately
const criticalFiles = [
  'lib/services/events-schema-service.ts',
  'app/api/registrations/route.ts',
  'lib/reservationService.ts',
  'shared/types/register_updated.ts',
];

console.log('🚀 Fixing critical database references...\n');

let updated = 0;
criticalFiles.forEach(file => {
  if (processFile(file)) {
    updated++;
  }
});

console.log(`\n✅ Fixed ${updated} critical files`);