#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read the full schema
const fullSchemaPath = path.join(__dirname, '../supabase/migrations/backup/20250605073722_remote_schema.sql.full');
const fullSchema = fs.readFileSync(fullSchemaPath, 'utf8');

// Extract just the functions section
const lines = fullSchema.split('\n');
let inFunction = false;
let functionContent = [];
let bracketCount = 0;

const functions = [];
let currentFunction = '';

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const trimmedLine = line.trim();
  
  // Start of function
  if (trimmedLine.startsWith('CREATE OR REPLACE FUNCTION') || trimmedLine.startsWith('CREATE FUNCTION')) {
    inFunction = true;
    currentFunction = line + '\n';
    continue;
  }
  
  if (inFunction) {
    currentFunction += line + '\n';
    
    // Track $$ pairs for function body
    const dollarMatches = line.match(/\$\$/g);
    if (dollarMatches) {
      bracketCount += dollarMatches.length;
    }
    
    // Function ends when we have even number of $$ and see language declaration
    if (bracketCount % 2 === 0 && bracketCount > 0 && line.match(/LANGUAGE\s+(plpgsql|sql)/)) {
      // Check if there's a semicolon on this line or the next
      if (line.includes(';') || (i + 1 < lines.length && lines[i + 1].trim() === ';')) {
        if (!line.includes(';')) {
          currentFunction += lines[i + 1] + '\n';
          i++;
        }
        functions.push(currentFunction);
        currentFunction = '';
        inFunction = false;
        bracketCount = 0;
      }
    }
  }
}

// Write fixed functions migration
const outputPath = path.join(__dirname, '../supabase/migrations/20250605073726_remote_functions.sql');
let content = `-- FUNCTIONS from remote schema

-- Stored procedures and functions

`;

// Filter out problematic functions and add the rest
functions.forEach(func => {
  // Skip if it references prisma or realtime
  if (func.includes('prisma') || func.includes('realtime.')) {
    return;
  }
  content += func + '\n\n';
});

// Add the ALTER and GRANT statements from the original
const originalFunctions = fs.readFileSync(outputPath, 'utf8');
const alterGrants = originalFunctions.split('\n').filter(line => 
  line.startsWith('ALTER FUNCTION') || 
  line.startsWith('COMMENT ON FUNCTION') ||
  line.startsWith('ALTER DEFAULT PRIVILEGES')
).join('\n');

content += '\n' + alterGrants;

fs.writeFileSync(outputPath, content);

console.log(`Fixed functions migration with ${functions.length} complete functions`);