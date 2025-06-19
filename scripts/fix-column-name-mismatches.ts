import * as fs from 'fs';
import * as path from 'path';

// Define the fixes needed based on our audit
const columnFixes = [
  // Registrations
  {
    file: '/app/api/registrations/[id]/confirmation.pdf/route.ts',
    line: 44,
    old: ".eq('id', registrationId)",
    new: ".eq('registration_id', registrationId)"
  },
  {
    file: '/app/api/registrations/lodge/route.ts',
    line: 343,
    old: ".eq('id', registrationResult.id);",
    new: ".eq('registration_id', registrationResult.id);"
  },
  {
    file: '/app/api/registrations/route.ts',
    line: 611,
    old: ".eq('id', registrationResult.id)",
    new: ".eq('registration_id', registrationResult.id)"
  },
  {
    file: '/app/api/registrations/route.ts',
    line: 621,
    old: ".eq('id', savedReg.id)",
    new: ".eq('registration_id', savedReg.id)"
  },
  
  // Event tickets
  {
    file: '/app/api/registrations/[id]/confirmation.pdf/route.ts',
    line: 58,
    old: ".select('id, ticket_type')",
    new: ".select('event_ticket_id, ticket_type')"
  },
  {
    file: '/app/api/registrations/[id]/confirmation.pdf/route.ts',
    line: 59,
    old: ".in('id', ticketIds);",
    new: ".in('event_ticket_id', ticketIds);"
  },
  {
    file: '/app/api/registrations/lodge/route.ts',
    line: 199,
    old: ".select('id, price')",
    new: ".select('event_ticket_id, price')"
  },
  {
    file: '/app/api/registrations/lodge/route.ts',
    line: 209,
    old: ".select('id, price')",
    new: ".select('event_ticket_id, price')"
  },
  {
    file: '/lib/api/admin/eventAdminService.ts',
    line: 134,
    old: ".select('id')",
    new: ".select('event_ticket_id')"
  },
  {
    file: '/lib/api/admin/eventAdminService.ts',
    line: 147,
    old: ".select('id')",
    new: ".select('event_ticket_id')"
  },
  {
    file: '/lib/api/admin/packageAdminService.ts',
    line: 185,
    old: ".select('id')",
    new: ".select('event_ticket_id')"
  },
  {
    file: '/lib/api/admin/packageAdminService.ts',
    line: 283,
    old: ".in('id', eventIds);",
    new: ".in('event_ticket_id', eventIds);"
  },
  {
    file: '/lib/api/eventAdminService.ts',
    line: 134,
    old: ".select('id')",
    new: ".select('event_ticket_id')"
  },
  {
    file: '/lib/api/eventAdminService.ts',
    line: 147,
    old: ".select('id')",
    new: ".select('event_ticket_id')"
  },
  {
    file: '/lib/api/packageAdminService.ts',
    line: 185,
    old: ".select('id')",
    new: ".select('event_ticket_id')"
  },
  {
    file: '/lib/api/packageAdminService.ts',
    line: 283,
    old: ".in('id', eventIds);",
    new: ".in('event_ticket_id', eventIds);"
  },
  {
    file: '/lib/realtime/reservation-expiry-manager.ts',
    line: 130,
    old: ".eq('id', ticketTypeId)",
    new: ".eq('event_ticket_id', ticketTypeId)"
  },
  {
    file: '/lib/realtime/reservation-expiry-manager.ts',
    line: 150,
    old: ".eq('id', ticketTypeId)",
    new: ".eq('event_ticket_id', ticketTypeId)"
  },
  {
    file: '/lib/services/post-payment-service.ts',
    line: 121,
    old: ".select('id, title, ticket_type')",
    new: ".select('event_ticket_id, title, ticket_type')"
  },
  {
    file: '/lib/services/post-payment-service.ts',
    line: 122,
    old: ".in('id', ticketIds);",
    new: ".in('event_ticket_id', ticketIds);"
  },
  // Note: stripe-sync-service.ts has been removed as this application now uses Square payments
  {
    file: '/scripts/check-all-event-tickets.ts',
    line: 25,
    old: ".select('id, name, event_id, eligibility_criteria')",
    new: ".select('event_ticket_id, name, event_id, eligibility_criteria')"
  },
  
  // Tickets
  {
    file: '/app/api/registrations/[id]/verify-payment/route.ts',
    line: 112,
    old: ".eq('id', ticket.id);",
    new: ".eq('ticket_id', ticket.ticket_id);"
  },
  {
    file: '/app/api/tickets/[ticketId]/qr-code/route.ts',
    line: 32,
    old: ".eq('id', ticketId)",
    new: ".eq('ticket_id', ticketId)"
  },
  {
    file: '/app/api/tickets/[ticketId]/qr-code/route.ts',
    line: 72,
    old: ".eq('id', ticketId);",
    new: ".eq('ticket_id', ticketId);"
  },
  {
    file: '/app/api/tickets/[ticketId]/qr-code/route.ts',
    line: 116,
    old: ".eq('id', ticketId)",
    new: ".eq('ticket_id', ticketId)"
  },
  {
    file: '/app/api/tickets/[ticketId]/qr-code/route.ts',
    line: 154,
    old: ".eq('id', ticketId);",
    new: ".eq('ticket_id', ticketId);"
  },
  {
    file: '/app/registrations/[registrationId]/tickets/[ticketId]/page.tsx',
    line: 51,
    old: ".eq('id', ticketId)",
    new: ".eq('ticket_id', ticketId)"
  },
  {
    file: '/lib/batch-operations.ts',
    line: 68,
    old: ".eq('id', update.id)",
    new: ".eq('ticket_id', update.ticket_id)"
  },
  {
    file: '/lib/batch-operations.ts',
    line: 215,
    old: ".select('id');",
    new: ".select('ticket_id');"
  },
  {
    file: '/lib/services/post-payment-service.ts',
    line: 153,
    old: ".eq('id', ticket.id);",
    new: ".eq('ticket_id', ticket.ticket_id);"
  },
  {
    file: '/lib/services/post-payment-service.ts',
    line: 390,
    old: ".eq('id', ticket.id);",
    new: ".eq('ticket_id', ticket.ticket_id);"
  },
  {
    file: '/lib/services/storage-cleanup-service.ts',
    line: 92,
    old: ".select('id, qr_code_url');",
    new: ".select('ticket_id, qr_code_url');"
  },
  
  // Organisations
  {
    file: '/app/api/registrations/lodge/route.ts',
    line: 176,
    old: ".select('id')",
    new: ".select('organisation_id')"
  },
  {
    file: '/lib/services/static-data-service.ts',
    line: 177,
    old: ".eq('id', id)",
    new: ".eq('organisation_id', id)"
  },
  
  // Customers
  {
    file: '/app/api/registrations/route.ts',
    line: 219,
    old: '.select("id")',
    new: '.select("customer_id")'
  },
  {
    file: '/app/api/registrations/route.ts',
    line: 220,
    old: '.eq("id", customerId)',
    new: '.eq("customer_id", customerId)'
  },
  {
    file: '/app/api/registrations/route.ts',
    line: 276,
    old: '.select("id")',
    new: '.select("customer_id")'
  },
  {
    file: '/app/api/registrations/route.ts',
    line: 277,
    old: '.eq("id", customerId)',
    new: '.eq("customer_id", customerId)'
  },
  {
    file: '/app/api/registrations/route.ts',
    line: 345,
    old: '.eq("id", customerId);',
    new: '.eq("customer_id", customerId);'
  },
  
  // Events
  {
    file: '/app/api/test-event/route.ts',
    line: 13,
    old: ".select('id, slug, title, is_published, event_start')",
    new: ".select('event_id, slug, title, is_published, event_start')"
  },
  {
    file: '/app/api/test-event/route.ts',
    line: 35,
    old: ".select('id, slug, title, is_published')",
    new: ".select('event_id, slug, title, is_published')"
  },
  {
    file: '/app/api/test-event/route.ts',
    line: 56,
    old: ".select('id, slug, title, is_published')",
    new: ".select('event_id, slug, title, is_published')"
  },
  {
    file: '/lib/api/server-actions.ts',
    line: 29,
    old: ".eq('id', id)",
    new: ".eq('event_id', id)"
  },
  // Note: Additional stripe-sync-service.ts reference removed
  
  // Attendees
  {
    file: '/lib/batch-operations.ts',
    line: 184,
    old: ".eq('id', id)",
    new: ".eq('attendee_id', id)"
  },
  {
    file: '/lib/services/registration-service-optimized.ts',
    line: 198,
    old: ".eq('id', id)",
    new: ".eq('attendee_id', id)"
  },
  
  // Packages
  {
    file: '/lib/packageService.ts',
    line: 79,
    old: ".select('id, name, parent_event_id')",
    new: ".select('package_id, name, parent_event_id')"
  },
  {
    file: '/lib/packageService.ts',
    line: 80,
    old: ".eq('id', packageId)",
    new: ".eq('package_id', packageId)"
  },
  
  // Contacts
  {
    file: '/scripts/setup-organiser-user.ts',
    line: 94,
    old: ".update({ auth_user_id: authUserId })",
    new: ".update({ auth_user_id: authUserId })"
  }
];

function fixFile(filePath: string, fixes: typeof columnFixes) {
  const projectRoot = path.join(__dirname, '..');
  const fullPath = path.join(projectRoot, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.error(`File not found: ${fullPath}`);
    return false;
  }
  
  let content = fs.readFileSync(fullPath, 'utf-8');
  let modified = false;
  
  // Apply fixes for this file
  const fileFixes = fixes.filter(fix => fix.file === filePath);
  
  fileFixes.forEach(fix => {
    if (content.includes(fix.old)) {
      content = content.replace(fix.old, fix.new);
      modified = true;
      console.log(`✓ Fixed ${filePath}:${fix.line}`);
      console.log(`  - ${fix.old}`);
      console.log(`  + ${fix.new}`);
    } else {
      console.warn(`⚠ Could not find pattern in ${filePath}:${fix.line}`);
      console.warn(`  Looking for: ${fix.old}`);
    }
  });
  
  if (modified) {
    fs.writeFileSync(fullPath, content, 'utf-8');
    return true;
  }
  
  return false;
}

// Also need to update any references in the code where we're accessing these properties
function updatePropertyAccess() {
  const propertyMappings = [
    { from: 'ticket.id', to: 'ticket.ticket_id' },
    { from: 'event.id', to: 'event.event_id' },
    { from: 'registration.id', to: 'registration.registration_id' },
    { from: 'eventTicket.id', to: 'eventTicket.event_ticket_id' },
    { from: 'attendee.id', to: 'attendee.attendee_id' },
    { from: 'package.id', to: 'package.package_id' },
    { from: 'contact.id', to: 'contact.contact_id' },
    { from: 'customer.id', to: 'customer.customer_id' },
    { from: 'organisation.id', to: 'organisation.organisation_id' },
  ];
  
  // This would be implemented to scan and update property access patterns
  console.log('\nProperty access patterns that may need updating:');
  propertyMappings.forEach(mapping => {
    console.log(`- ${mapping.from} → ${mapping.to}`);
  });
}

console.log('Starting column name fixes...\n');

// Get unique file paths
const filesToFix = [...new Set(columnFixes.map(fix => fix.file))];
let fixedCount = 0;

filesToFix.forEach(file => {
  if (fixFile(file, columnFixes)) {
    fixedCount++;
  }
});

console.log(`\n✅ Fixed ${fixedCount} files`);

// Show property access patterns that need manual review
updatePropertyAccess();

console.log('\n⚠️  Remember to:');
console.log('1. Run the database migration: 20250607_fix_all_column_name_mismatches.sql');
console.log('2. Review and update any property access patterns in TypeScript code');
console.log('3. Test all affected functionality');
console.log('4. Update any TypeScript interfaces if needed');