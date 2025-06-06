#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Files to update based on the audit
const filesToUpdate = [
  // Registration Wizard Components
  'components/register/RegistrationWizard/Summary/AttendeeDetailsSummary.tsx',
  'components/register/RegistrationWizard/hooks/useAttendeeProgress.ts',
  'components/register/RegistrationWizard/hooks/useTicketEligibility.ts',
  'components/register/RegistrationWizard/payment/BillingDetailsForm.tsx',
  'components/register/RegistrationWizard/registration-wizard.tsx',
  'components/register/RegistrationWizard/Attendees/AttendeeSummary.tsx',
  'components/register/RegistrationWizard/Attendees/AttendeeEditModal.tsx',
  'components/register/RegistrationWizard/Steps/ticket-selection-step.tsx',
  'components/register/RegistrationWizard/Steps/order-review-step.tsx',
  'components/register/RegistrationWizard/Steps/confirmation-step.tsx',
  'components/register/RegistrationWizard/Shared/attendee-card.tsx',
  
  // Form Components
  'components/register/Forms/guest/Layouts/GuestForm.tsx',
  'components/register/Forms/mason/lib/LodgeSelection.tsx',
  'components/register/Forms/mason/Layouts/MasonForm.tsx',
  'components/register/Forms/attendee/AttendeeEditDialog.tsx',
  'components/register/Forms/attendee/components/EditAttendeeDialog.tsx',
  'components/register/Forms/attendee/DelegationsForm.tsx',
  'components/register/Forms/attendee/IndividualsForm.tsx',
  'components/register/Forms/attendee/utils/formatters.ts',
  'components/register/Forms/attendee/utils/businessLogic.ts',
  'components/register/Forms/attendee/utils/validation.ts',
  'components/register/Forms/attendee/utils/attendeeTypeRenderer.tsx',
  
  // API Routes
  'app/api/functions/[functionId]/individual-registration/route.ts',
  'app/api/registrations/[id]/payment/route.ts',
  'app/api/registrations/route.ts',
  
  // Services
  'lib/registrationStore.ts',
  'lib/services/registration-service.ts',
  'lib/services/pdf-service.ts',
  'lib/services/post-payment-service.ts',
  'lib/validation/schemas.ts',
  
  // Supabase Edge Functions
  'supabase/functions/send-confirmation-email/index.ts',
  'supabase/functions/send-confirmation-email/types/email.ts',
  'supabase/functions/send-confirmation-email/templates/primary_contact_ticket_template.tsx',
  'supabase/functions/send-confirmation-email/templates/lodge_confirmation_template.tsx',
  'supabase/functions/send-confirmation-email/templates/individuals_confirmation_template.tsx',
  
  // Customer Portal Pages
  'app/(portals)/customer/registrations/[registrationId]/page.tsx',
  'app/(portals)/customer/registrations/[registrationId]/tickets/page.tsx',
  'app/(portals)/customer/registrations/[registrationId]/attendees/page.tsx',
];

// Patterns to replace
const replacements = [
  // Direct string comparisons
  { pattern: /attendeeType === ['"]Mason['"]/g, replacement: 'attendeeType === \'mason\'' },
  { pattern: /attendeeType === ['"]Guest['"]/g, replacement: 'attendeeType === \'guest\'' },
  { pattern: /attendee\.attendeeType === ['"]Mason['"]/g, replacement: 'attendee.attendeeType === \'mason\'' },
  { pattern: /attendee\.attendeeType === ['"]Guest['"]/g, replacement: 'attendee.attendeeType === \'guest\'' },
  
  // Case statements
  { pattern: /case ['"]Mason['"]:/g, replacement: 'case \'mason\':' },
  { pattern: /case ['"]Guest['"]:/g, replacement: 'case \'guest\':' },
  
  // Type assignments
  { pattern: /type: ['"]Mason['"] as const/g, replacement: 'type: \'mason\' as const' },
  { pattern: /type: ['"]Guest['"] as const/g, replacement: 'type: \'guest\' as const' },
  
  // Default values in objects
  { pattern: /attendeeType: ['"]Mason['"]/g, replacement: 'attendeeType: \'mason\'' },
  { pattern: /attendeeType: ['"]Guest['"]/g, replacement: 'attendeeType: \'guest\'' },
  
  // Ternary conditions
  { pattern: /\? ['"]Mason['"] : ['"]Guest['"]/g, replacement: '? \'mason\' : \'guest\'' },
  { pattern: /\? ['"]Guest['"] : ['"]Mason['"]/g, replacement: '? \'guest\' : \'mason\'' },
  
  // Array includes
  { pattern: /\.includes\(['"]Mason['"]\)/g, replacement: '.includes(\'mason\')' },
  { pattern: /\.includes\(['"]Guest['"]\)/g, replacement: '.includes(\'guest\')' },
  
  // Not equal comparisons
  { pattern: /!== ['"]Mason['"]/g, replacement: '!== \'mason\'' },
  { pattern: /!== ['"]Guest['"]/g, replacement: '!== \'guest\'' },
  
  // Template literals and strings
  { pattern: /`Mason`/g, replacement: '`mason`' },
  { pattern: /`Guest`/g, replacement: '`guest`' },
  
  // Display text (preserve capitalization for user-facing text)
  // We'll handle these manually to avoid changing UI text
];

// Function to update a single file
function updateFile(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return false;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  let originalContent = content;
  let changeCount = 0;
  
  // Apply replacements
  replacements.forEach(({ pattern, replacement }) => {
    const matches = content.match(pattern);
    if (matches) {
      changeCount += matches.length;
      content = content.replace(pattern, replacement);
    }
  });
  
  // Only write if changes were made
  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Updated ${filePath} (${changeCount} changes)`);
    return true;
  } else {
    console.log(`⏭️  No changes needed in ${filePath}`);
    return false;
  }
}

// Main execution
console.log('🔍 Fixing attendee type case mismatches...\n');

let totalFiles = 0;
let updatedFiles = 0;

filesToUpdate.forEach(file => {
  totalFiles++;
  if (updateFile(file)) {
    updatedFiles++;
  }
});

console.log(`\n✨ Done! Updated ${updatedFiles} out of ${totalFiles} files.`);

// Reminder about manual checks
console.log('\n📝 Remember to manually check:');
console.log('- Display text that should remain capitalized for UI');
console.log('- Test files that may need updating');
console.log('- Any dynamic string construction with attendee types');