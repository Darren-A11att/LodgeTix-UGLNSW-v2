#!/usr/bin/env ts-node

// Example script showing how to use the field update utilities

import { DATABASE_FIELD_MAPPINGS } from '../lib/database-mappings';

console.log('Field Update Example');
console.log('===================\n');

console.log('Database Field Mappings Preview:');
console.log('--------------------------------');

// Show first 10 field mappings as examples
const mappingEntries = Object.entries(DATABASE_FIELD_MAPPINGS).slice(0, 10);
mappingEntries.forEach(([camelCase, snakeCase]) => {
  console.log(`  ${camelCase.padEnd(20)} → ${snakeCase}`);
});
console.log('  ... and more\n');

console.log('Quick Start Commands:');
console.log('--------------------');
console.log('1. Preview what will be changed:');
console.log('   npm run fields:update:dry\n');

console.log('2. Validate current field usage:');
console.log('   npm run fields:validate\n');

console.log('3. Generate TypeScript helpers:');
console.log('   npm run fields:generate-helpers\n');

console.log('4. Apply field updates:');
console.log('   npm run fields:update\n');

console.log('5. Simple update (with backup):');
console.log('   npm run fields:update:simple -- --backup\n');

console.log('Example Code Transformations:');
console.log('----------------------------');
console.log('Before:');
console.log(`  const user = {
    contactId: '123',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com'
  };
  
  const { firstName, lastName } = user;
  console.log(user.contactId);`);

console.log('\nAfter:');
console.log(`  const user = {
    contact_id: '123',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com'
  };
  
  const { first_name, last_name } = user;
  console.log(user.contact_id);`);

console.log('\n✅ Run "npm run fields:update:dry" to see what would change in your codebase!');