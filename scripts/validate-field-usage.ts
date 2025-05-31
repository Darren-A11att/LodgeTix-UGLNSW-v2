#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as path from 'path';
import { DATABASE_FIELD_MAPPINGS, DATABASE_TABLE_MAPPINGS } from '../lib/database-mappings';

// Script to validate that field names are correctly using database conventions

const FILE_EXTENSIONS = ['.ts', '.tsx'];
const EXCLUDED_DIRS = ['node_modules', '.git', 'dist', 'build', '.next', 'tests', '__tests__'];

interface ValidationIssue {
  file: string;
  line: number;
  column: number;
  issue: string;
  context: string;
}

const issues: ValidationIssue[] = [];

function shouldProcess(filePath: string): boolean {
  const normalizedPath = filePath.replace(/\\/g, '/');
  return !EXCLUDED_DIRS.some(dir => normalizedPath.includes(`/${dir}/`));
}

function getAllFiles(dir: string, files: string[] = []): string[] {
  const entries = fs.readdirSync(dir);
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    
    if (!shouldProcess(fullPath)) continue;
    
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      getAllFiles(fullPath, files);
    } else if (FILE_EXTENSIONS.includes(path.extname(entry))) {
      files.push(fullPath);
    }
  }
  
  return files;
}

function validateFile(filePath: string): void {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  // Check for remaining camelCase field names
  for (const [camelCase, snakeCase] of Object.entries(DATABASE_FIELD_MAPPINGS)) {
    lines.forEach((line, lineIndex) => {
      // Skip comments and imports
      if (line.trim().startsWith('//') || line.trim().startsWith('*') || line.includes('import')) {
        return;
      }
      
      // Look for camelCase usage
      const regex = new RegExp(`\\b${camelCase}\\b`, 'g');
      let match;
      
      while ((match = regex.exec(line)) !== null) {
        // Check if it's in a string (might be intentional)
        const beforeMatch = line.substring(0, match.index);
        const inString = (beforeMatch.match(/['"]/g) || []).length % 2 === 1;
        
        if (!inString) {
          issues.push({
            file: filePath,
            line: lineIndex + 1,
            column: match.index + 1,
            issue: `Found camelCase field "${camelCase}" - should be "${snakeCase}"`,
            context: line.trim()
          });
        }
      }
    });
  }
  
  // Check for camelCase table names
  for (const [camelCase, snakeCase] of Object.entries(DATABASE_TABLE_MAPPINGS)) {
    lines.forEach((line, lineIndex) => {
      // Look for table names in from() calls
      const fromRegex = new RegExp(`from\\(['"\`]${camelCase}['"\`]\\)`, 'g');
      let match;
      
      while ((match = fromRegex.exec(line)) !== null) {
        issues.push({
          file: filePath,
          line: lineIndex + 1,
          column: match.index + 1,
          issue: `Found camelCase table "${camelCase}" - should be "${snakeCase}"`,
          context: line.trim()
        });
      }
    });
  }
}

function main() {
  const targetDir = process.argv[2] || '.';
  
  console.log('Field Usage Validation');
  console.log('=====================');
  console.log(`Target: ${path.resolve(targetDir)}\n`);
  
  // Find all files
  const files = getAllFiles(targetDir);
  console.log(`Checking ${files.length} TypeScript files...\n`);
  
  // Validate files
  files.forEach(validateFile);
  
  // Report results
  if (issues.length === 0) {
    console.log('✅ All field names are using correct database conventions!');
  } else {
    console.log(`❌ Found ${issues.length} issues:\n`);
    
    // Group issues by file
    const issuesByFile = new Map<string, ValidationIssue[]>();
    issues.forEach(issue => {
      const relativePath = path.relative(targetDir, issue.file);
      if (!issuesByFile.has(relativePath)) {
        issuesByFile.set(relativePath, []);
      }
      issuesByFile.get(relativePath)!.push(issue);
    });
    
    // Display issues
    issuesByFile.forEach((fileIssues, file) => {
      console.log(`${file}:`);
      fileIssues.forEach(issue => {
        console.log(`  Line ${issue.line}, Column ${issue.column}: ${issue.issue}`);
        console.log(`    ${issue.context}`);
      });
      console.log('');
    });
    
    console.log('Run the update script to fix these issues:');
    console.log('  npm run update-fields');
  }
}

main();