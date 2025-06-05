#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read the remote schema file
const schemaPath = path.join(__dirname, '../supabase/migrations/20250605073722_remote_schema.sql');
const schemaContent = fs.readFileSync(schemaPath, 'utf8');

// Output directory for parsed migrations
const outputDir = path.join(__dirname, '../supabase/migrations/parsed');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Split schema into logical sections
const sections = {
  '001_extensions': [],
  '002_types': [],
  '003_tables': [],
  '004_indexes': [],
  '005_constraints': [],
  '006_views': [],
  '007_functions': [],
  '008_triggers': [],
  '009_policies': [],
  '010_grants': []
};

// Current section being processed
let currentSection = null;
let currentStatement = '';
let inStatement = false;

// Parse the schema line by line
const lines = schemaContent.split('\n');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const trimmedLine = line.trim();
  
  // Skip empty lines and comments outside of statements
  if (!inStatement && (trimmedLine === '' || trimmedLine.startsWith('--'))) {
    continue;
  }
  
  // Detect statement starts
  if (!inStatement) {
    if (trimmedLine.startsWith('CREATE EXTENSION')) {
      currentSection = '001_extensions';
      inStatement = true;
    } else if (trimmedLine.startsWith('CREATE TYPE')) {
      currentSection = '002_types';
      inStatement = true;
    } else if (trimmedLine.startsWith('CREATE TABLE')) {
      currentSection = '003_tables';
      inStatement = true;
    } else if (trimmedLine.startsWith('CREATE INDEX') || trimmedLine.startsWith('CREATE UNIQUE INDEX')) {
      currentSection = '004_indexes';
      inStatement = true;
    } else if (trimmedLine.startsWith('ALTER TABLE') && trimmedLine.includes('ADD CONSTRAINT')) {
      currentSection = '005_constraints';
      inStatement = true;
    } else if (trimmedLine.startsWith('CREATE VIEW') || trimmedLine.startsWith('CREATE OR REPLACE VIEW')) {
      currentSection = '006_views';
      inStatement = true;
    } else if (trimmedLine.startsWith('CREATE FUNCTION') || trimmedLine.startsWith('CREATE OR REPLACE FUNCTION')) {
      currentSection = '007_functions';
      inStatement = true;
    } else if (trimmedLine.startsWith('CREATE TRIGGER')) {
      currentSection = '008_triggers';
      inStatement = true;
    } else if (trimmedLine.startsWith('CREATE POLICY')) {
      currentSection = '009_policies';
      inStatement = true;
    } else if (trimmedLine.startsWith('GRANT') || trimmedLine.startsWith('REVOKE')) {
      currentSection = '010_grants';
      inStatement = true;
    } else if (trimmedLine.startsWith('ALTER TABLE') && trimmedLine.includes('ENABLE ROW LEVEL SECURITY')) {
      currentSection = '009_policies';
      inStatement = true;
    } else if (trimmedLine.startsWith('ALTER') || trimmedLine.startsWith('COMMENT')) {
      // Determine section based on object type
      if (line.includes('TYPE')) {
        currentSection = '002_types';
      } else if (line.includes('TABLE')) {
        currentSection = '003_tables';
      } else if (line.includes('FUNCTION')) {
        currentSection = '007_functions';
      } else {
        currentSection = '003_tables'; // default
      }
      inStatement = true;
    }
  }
  
  // Accumulate statement
  if (inStatement) {
    currentStatement += line + '\n';
    
    // Check for statement end
    if (trimmedLine.endsWith(';')) {
      // Special handling for functions which can have multiple semicolons
      if (currentSection === '007_functions' && !trimmedLine.match(/\$\$\s*LANGUAGE/)) {
        if (!trimmedLine.match(/;\s*$/)) {
          continue;
        }
      }
      
      // Add statement to appropriate section
      if (currentSection && sections[currentSection]) {
        sections[currentSection].push(currentStatement);
      }
      
      // Reset for next statement
      currentStatement = '';
      inStatement = false;
      currentSection = null;
    }
  }
}

// Write out migration files
const timestamp = '20250605073722';

Object.entries(sections).forEach(([filename, statements]) => {
  if (statements.length === 0) return;
  
  const filePath = path.join(outputDir, `${timestamp}_${filename}.sql`);
  let content = `-- ${filename.replace(/^\d+_/, '').toUpperCase()} from remote schema\n\n`;
  
  // Add header comments
  switch (filename) {
    case '001_extensions':
      content += '-- PostgreSQL extensions required by the application\n\n';
      break;
    case '002_types':
      content += '-- Custom types and enums\n\n';
      break;
    case '003_tables':
      content += '-- Core table definitions\n\n';
      break;
    case '004_indexes':
      content += '-- Performance indexes\n\n';
      break;
    case '005_constraints':
      content += '-- Foreign key and other constraints\n\n';
      break;
    case '006_views':
      content += '-- Database views\n\n';
      break;
    case '007_functions':
      content += '-- Stored procedures and functions\n\n';
      break;
    case '008_triggers':
      content += '-- Database triggers\n\n';
      break;
    case '009_policies':
      content += '-- Row Level Security policies\n\n';
      break;
    case '010_grants':
      content += '-- Permission grants\n\n';
      break;
  }
  
  // Filter out problematic statements
  const filteredStatements = statements.filter(stmt => {
    // Skip prisma role grants
    if (stmt.includes('prisma')) return false;
    // Skip realtime schema references
    if (stmt.includes('realtime.')) return false;
    // Keep everything else
    return true;
  });
  
  content += filteredStatements.join('\n');
  
  fs.writeFileSync(filePath, content);
  console.log(`Created: ${filePath} (${filteredStatements.length} statements)`);
});

// Create a master migration that references all the parts
const masterContent = `-- Remote database schema
-- This migration loads all components of the remote schema in the correct order

-- Load each component
\\i parsed/${timestamp}_001_extensions.sql
\\i parsed/${timestamp}_002_types.sql
\\i parsed/${timestamp}_003_tables.sql
\\i parsed/${timestamp}_004_indexes.sql
\\i parsed/${timestamp}_005_constraints.sql
\\i parsed/${timestamp}_006_views.sql
\\i parsed/${timestamp}_007_functions.sql
\\i parsed/${timestamp}_008_triggers.sql
\\i parsed/${timestamp}_009_policies.sql
\\i parsed/${timestamp}_010_grants.sql
`;

fs.writeFileSync(path.join(outputDir, `${timestamp}_000_master.sql`), masterContent);
console.log(`\nCreated master migration file: ${timestamp}_000_master.sql`);
console.log('\nParsing complete! Check the supabase/migrations/parsed directory.');