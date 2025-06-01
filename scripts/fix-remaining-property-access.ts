import * as fs from 'fs';
import * as path from 'path';

// Specific fixes for property access patterns
const specificFixes = [
  // stripe-sync-service.ts
  {
    file: '/lib/services/stripe-sync-service.ts',
    fixes: [
      {
        old: 'ticket.id',
        new: 'ticket.event_ticket_id',
        lines: [152, 166, 195, 217]
      }
    ]
  },
  // Fix patterns where we're accessing data after inserts/updates
  {
    file: '/lib/services/post-payment-service.ts',
    fixes: [
      {
        old: 'ticket.id',
        new: 'ticket.ticket_id',
        description: 'Update ticket ID references'
      }
    ]
  },
  {
    file: '/lib/event-facade.ts',
    fixes: [
      {
        old: 'event.id',
        new: 'event.event_id',
        description: 'Update event ID references'
      }
    ]
  }
];

// General patterns to fix
const generalPatterns = [
  {
    pattern: /\bticket\.id\b/g,
    replacement: 'ticket.ticket_id',
    filePattern: /ticket/i
  },
  {
    pattern: /\beventTicket\.id\b/g,
    replacement: 'eventTicket.event_ticket_id',
    filePattern: /ticket/i
  },
  {
    pattern: /\bevent\.id\b/g,
    replacement: 'event.event_id',
    filePattern: /event/i
  },
  {
    pattern: /\bregistration\.id\b/g,
    replacement: 'registration.registration_id',
    filePattern: /registration/i
  },
  {
    pattern: /\battendee\.id\b/g,
    replacement: 'attendee.attendee_id',
    filePattern: /attendee/i
  },
  {
    pattern: /\bpackage\.id\b/g,
    replacement: 'package.package_id',
    filePattern: /package/i
  }
];

function fixFile(filePath: string): number {
  const fullPath = path.join(__dirname, '..', filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.error(`File not found: ${fullPath}`);
    return 0;
  }
  
  let content = fs.readFileSync(fullPath, 'utf-8');
  let fixCount = 0;
  const appliedFixes: string[] = [];
  
  // Apply general patterns
  generalPatterns.forEach(({ pattern, replacement }) => {
    const matches = content.match(pattern);
    if (matches) {
      matches.forEach(match => {
        // Skip if it's stripe.id, price.id, etc.
        const prefix = match.split('.')[0];
        if (['stripe', 'price', 'product', 'error', 'req', 'res'].includes(prefix)) {
          return;
        }
        
        content = content.replace(new RegExp(`\\b${match}\\b`, 'g'), replacement);
        appliedFixes.push(`${match} → ${replacement}`);
        fixCount++;
      });
    }
  });
  
  if (fixCount > 0) {
    fs.writeFileSync(fullPath, content, 'utf-8');
    console.log(`\n✓ Fixed ${filePath}`);
    appliedFixes.forEach(fix => console.log(`  - ${fix}`));
  }
  
  return fixCount;
}

function scanAllFiles(): void {
  const dirsToScan = ['lib', 'app', 'components'];
  let totalFixes = 0;
  
  console.log('Fixing remaining property access patterns...\n');
  
  // Fix specific known issues first
  specificFixes.forEach(({ file }) => {
    const fixes = fixFile(file);
    totalFixes += fixes;
  });
  
  // Then scan for general patterns
  dirsToScan.forEach(dir => {
    const fullPath = path.join(__dirname, '..', dir);
    scanDirectory(fullPath);
  });
  
  function scanDirectory(dirPath: string): void {
    const files = fs.readdirSync(dirPath);
    
    files.forEach(file => {
      const filePath = path.join(dirPath, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && !file.includes('node_modules') && !file.startsWith('.')) {
        scanDirectory(filePath);
      } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        const relativePath = path.relative(path.join(__dirname, '..'), filePath);
        const fixes = fixFile(relativePath);
        totalFixes += fixes;
      }
    });
  }
  
  console.log(`\n✅ Total fixes applied: ${totalFixes}`);
}

// Also check for destructuring patterns that need updating
function checkDestructuringPatterns(): void {
  console.log('\n⚠️  Manual review needed for destructuring patterns:');
  console.log('Look for patterns like:');
  console.log('- const { id, name } = ticket; // Should be { ticket_id, name }');
  console.log('- const { id, title } = event; // Should be { event_id, title }');
  console.log('- tickets.map(({ id, ...rest }) => ...) // Should use ticket_id');
  console.log('\nAlso check:');
  console.log('- API response handling where id might be aliased');
  console.log('- Type definitions that might need updating');
}

// Run the fixes
scanAllFiles();
checkDestructuringPatterns();