import * as fs from 'fs';
import * as path from 'path';

interface PropertyFix {
  pattern: RegExp;
  replacement: string;
  description: string;
}

// Define property access patterns that need to be fixed
const propertyFixes: PropertyFix[] = [
  // Event tickets
  {
    pattern: /(\w+Ticket|ticket|et)\.id\b/g,
    replacement: '$1.event_ticket_id',
    description: 'ticket.id → ticket.event_ticket_id'
  },
  // Events
  {
    pattern: /(\w*[Ee]vent)\.id\b/g,
    replacement: '$1.event_id',
    description: 'event.id → event.event_id'
  },
  // Registrations
  {
    pattern: /(\w*[Rr]egistration)\.id\b/g,
    replacement: '$1.registration_id',
    description: 'registration.id → registration.registration_id'
  },
  // Attendees
  {
    pattern: /(\w*[Aa]ttendee)\.id\b/g,
    replacement: '$1.attendee_id',
    description: 'attendee.id → attendee.attendee_id'
  },
  // Packages
  {
    pattern: /(\w*[Pp]ackage)\.id\b/g,
    replacement: '$1.package_id',
    description: 'package.id → package.package_id'
  },
  // Contacts
  {
    pattern: /(\w*[Cc]ontact)\.id\b/g,
    replacement: '$1.contact_id',
    description: 'contact.id → contact.contact_id'
  },
  // Customers
  {
    pattern: /(\w*[Cc]ustomer)\.id\b/g,
    replacement: '$1.customer_id',
    description: 'customer.id → customer.customer_id'
  },
  // Organisations
  {
    pattern: /(\w*[Oo]rganisation)\.id\b/g,
    replacement: '$1.organisation_id',
    description: 'organisation.id → organisation.organisation_id'
  }
];

const filesToSkip = [
  'node_modules',
  '.git',
  '.next',
  'dist',
  'build',
  '.DS_Store',
  'package-lock.json',
  'yarn.lock',
  'fix-property-access-patterns.ts',
  'audit-supabase-column-names.ts',
  'fix-column-name-mismatches.ts'
];

function shouldSkipFile(filePath: string): boolean {
  return filesToSkip.some(skip => filePath.includes(skip));
}

function scanAndFixFile(filePath: string): number {
  if (shouldSkipFile(filePath)) {
    return 0;
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  let modifiedContent = content;
  let fixCount = 0;
  const fixes: string[] = [];
  
  // Skip SQL files
  if (filePath.endsWith('.sql')) {
    return 0;
  }
  
  // Apply each property fix pattern
  propertyFixes.forEach(fix => {
    const matches = content.match(fix.pattern);
    if (matches && matches.length > 0) {
      // Check if this is a false positive (e.g., stripe.id, price.id)
      const validMatches = matches.filter(match => {
        const prefix = match.split('.')[0];
        // Skip if it's a known false positive
        if (['stripe', 'price', 'product', 'req', 'res', 'error', 'data'].includes(prefix)) {
          return false;
        }
        // Skip if it's already the correct property name
        if (match.includes('_id')) {
          return false;
        }
        return true;
      });
      
      if (validMatches.length > 0) {
        validMatches.forEach(match => {
          const newValue = match.replace(fix.pattern, fix.replacement);
          modifiedContent = modifiedContent.replace(match, newValue);
          fixes.push(`${match} → ${newValue}`);
          fixCount++;
        });
      }
    }
  });
  
  if (fixCount > 0) {
    fs.writeFileSync(filePath, modifiedContent, 'utf-8');
    console.log(`\n✓ Fixed ${filePath}`);
    fixes.forEach(fix => console.log(`  - ${fix}`));
  }
  
  return fixCount;
}

function scanDirectory(dir: string): number {
  let totalFixes = 0;
  
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    
    if (shouldSkipFile(filePath)) {
      continue;
    }
    
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      totalFixes += scanDirectory(filePath);
    } else if (
      file.endsWith('.ts') || 
      file.endsWith('.tsx') || 
      file.endsWith('.js') || 
      file.endsWith('.jsx')
    ) {
      totalFixes += scanAndFixFile(filePath);
    }
  }
  
  return totalFixes;
}

console.log('Scanning for property access patterns to fix...\n');

const projectRoot = path.join(__dirname, '..');
const dirsToScan = ['app', 'components', 'lib', 'scripts'];

let totalFixes = 0;

dirsToScan.forEach(dir => {
  const fullPath = path.join(projectRoot, dir);
  if (fs.existsSync(fullPath)) {
    console.log(`Scanning ${dir}...`);
    totalFixes += scanDirectory(fullPath);
  }
});

console.log(`\n✅ Total fixes applied: ${totalFixes}`);

if (totalFixes > 0) {
  console.log('\n⚠️  Important: Please review the changes and test thoroughly!');
  console.log('Some property access patterns may need manual review, especially:');
  console.log('- Destructured properties');
  console.log('- Type definitions');
  console.log('- API response handling');
}