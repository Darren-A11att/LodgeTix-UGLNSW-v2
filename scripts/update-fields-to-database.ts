#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as path from 'path';
import { DATABASE_FIELD_MAPPINGS, DATABASE_TABLE_MAPPINGS, DATABASE_ENUM_MAPPINGS } from '../lib/database-mappings';

// File extensions to process
const FILE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

// Directories to exclude from processing
const EXCLUDED_DIRS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  'coverage',
  '__tests__',
  'tests',
  '.turbo'
];

// Files to exclude from processing
const EXCLUDED_FILES = [
  'database-mappings.ts',
  'update-fields-to-database.ts'
];

interface UpdateStats {
  filesProcessed: number;
  filesUpdated: number;
  totalReplacements: number;
  replacementsByFile: Map<string, number>;
}

const stats: UpdateStats = {
  filesProcessed: 0,
  filesUpdated: 0,
  totalReplacements: 0,
  replacementsByFile: new Map()
};

/**
 * Check if a path should be excluded
 */
function shouldExclude(filePath: string): boolean {
  const normalizedPath = filePath.replace(/\\/g, '/');
  
  // Check if path contains any excluded directory
  for (const excludedDir of EXCLUDED_DIRS) {
    if (normalizedPath.includes(`/${excludedDir}/`)) {
      return true;
    }
  }
  
  // Check if file is in excluded files list
  const fileName = path.basename(filePath);
  if (EXCLUDED_FILES.includes(fileName)) {
    return true;
  }
  
  return false;
}

/**
 * Get all files recursively from a directory
 */
function getAllFiles(dirPath: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dirPath);
  
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    
    if (shouldExclude(filePath)) {
      continue;
    }
    
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      getAllFiles(filePath, fileList);
    } else if (FILE_EXTENSIONS.includes(path.extname(file))) {
      fileList.push(filePath);
    }
  }
  
  return fileList;
}

/**
 * Create regex patterns for field replacements
 */
function createFieldPatterns(): Map<string, RegExp[]> {
  const patterns = new Map<string, RegExp[]>();
  
  for (const [camelCase, snakeCase] of Object.entries(DATABASE_FIELD_MAPPINGS)) {
    const regexPatterns = [
      // Object property access: obj.fieldName
      new RegExp(`\\.${camelCase}(?![a-zA-Z0-9_])`, 'g'),
      
      // Object property definition: { fieldName: value }
      new RegExp(`(?<![a-zA-Z0-9_])${camelCase}(?=\\s*:)`, 'g'),
      
      // Destructuring: const { fieldName } = obj
      new RegExp(`(?<={[^}]*?)\\b${camelCase}\\b(?=[^{]*?})`, 'g'),
      
      // Function parameters: (fieldName, otherParam)
      new RegExp(`(?<=[(,]\\s*)${camelCase}(?=\\s*[,)])`, 'g'),
      
      // Variable declarations: const fieldName = 
      new RegExp(`(?<=(?:const|let|var)\\s+)${camelCase}(?=\\s*=)`, 'g'),
      
      // Array access with string: obj['fieldName']
      new RegExp(`(?<=\\[['"\`])${camelCase}(?=['"\`]\\])`, 'g'),
      
      // Template literals: ${obj.fieldName}
      new RegExp(`(?<=\\$\\{[^}]*\\.)${camelCase}(?![a-zA-Z0-9_])`, 'g'),
      
      // Type definitions: fieldName: string
      new RegExp(`(?<=interface\\s+\\w+\\s*{[^}]*?)\\b${camelCase}(?=\\s*[?:]*)`, 'g'),
      
      // Type definitions in type alias: type Foo = { fieldName: string }
      new RegExp(`(?<=type\\s+\\w+\\s*=\\s*{[^}]*?)\\b${camelCase}(?=\\s*[?:]*)`, 'g')
    ];
    
    patterns.set(camelCase, regexPatterns);
  }
  
  return patterns;
}

/**
 * Create regex patterns for table replacements
 */
function createTablePatterns(): Map<string, RegExp[]> {
  const patterns = new Map<string, RegExp[]>();
  
  for (const [camelCase, snakeCase] of Object.entries(DATABASE_TABLE_MAPPINGS)) {
    const regexPatterns = [
      // Supabase client calls: supabase.from('tableName')
      new RegExp(`(?<=from\\(['"\`])${camelCase}(?=['"\`]\\))`, 'g'),
      
      // Table references in strings
      new RegExp(`(?<=(['"\`]))${camelCase}(?=\\1)`, 'g')
    ];
    
    patterns.set(camelCase, regexPatterns);
  }
  
  return patterns;
}

/**
 * Create regex patterns for enum replacements
 */
function createEnumPatterns(): Map<string, RegExp[]> {
  const patterns = new Map<string, RegExp[]>();
  
  for (const [pascalCase, snakeCase] of Object.entries(DATABASE_ENUM_MAPPINGS)) {
    const regexPatterns = [
      // Enum value in strings: "EnumValue"
      new RegExp(`(?<=(['"\`]))${pascalCase}(?=\\1)`, 'g'),
      
      // Enum value comparisons: === EnumValue
      new RegExp(`(?<=[=!]=\\s*)['"\`]${pascalCase}['"\`]`, 'g')
    ];
    
    patterns.set(pascalCase, regexPatterns);
  }
  
  return patterns;
}

/**
 * Update a single file
 */
function updateFile(filePath: string, dryRun: boolean = false): number {
  stats.filesProcessed++;
  
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  let replacementCount = 0;
  
  // Apply field replacements
  const fieldPatterns = createFieldPatterns();
  for (const [camelCase, patterns] of fieldPatterns) {
    const snakeCase = DATABASE_FIELD_MAPPINGS[camelCase as keyof typeof DATABASE_FIELD_MAPPINGS];
    
    for (const pattern of patterns) {
      const matches = content.match(pattern);
      if (matches) {
        content = content.replace(pattern, snakeCase);
        replacementCount += matches.length;
      }
    }
  }
  
  // Apply table replacements
  const tablePatterns = createTablePatterns();
  for (const [camelCase, patterns] of tablePatterns) {
    const snakeCase = DATABASE_TABLE_MAPPINGS[camelCase as keyof typeof DATABASE_TABLE_MAPPINGS];
    
    for (const pattern of patterns) {
      const matches = content.match(pattern);
      if (matches) {
        content = content.replace(pattern, snakeCase);
        replacementCount += matches.length;
      }
    }
  }
  
  // Apply enum replacements
  const enumPatterns = createEnumPatterns();
  for (const [pascalCase, patterns] of enumPatterns) {
    const snakeCase = DATABASE_ENUM_MAPPINGS[pascalCase as keyof typeof DATABASE_ENUM_MAPPINGS];
    
    for (const pattern of patterns) {
      const matches = content.match(pattern);
      if (matches) {
        content = content.replace(pattern, match => {
          // Replace the PascalCase within the matched string
          return match.replace(pascalCase, snakeCase);
        });
        replacementCount += matches.length;
      }
    }
  }
  
  // Write file if changes were made
  if (content !== originalContent && !dryRun) {
    fs.writeFileSync(filePath, content, 'utf8');
    stats.filesUpdated++;
    stats.replacementsByFile.set(filePath, replacementCount);
  }
  
  if (replacementCount > 0) {
    console.log(`  ${dryRun ? '[DRY RUN] Would update' : 'Updated'} ${filePath}: ${replacementCount} replacements`);
  }
  
  stats.totalReplacements += replacementCount;
  return replacementCount;
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const targetPath = args.find(arg => !arg.startsWith('--')) || '.';
  
  console.log('Database Field Update Script');
  console.log('===========================');
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE UPDATE'}`);
  console.log(`Target: ${path.resolve(targetPath)}`);
  console.log('');
  
  // Validate target path
  if (!fs.existsSync(targetPath)) {
    console.error(`Error: Target path "${targetPath}" does not exist`);
    process.exit(1);
  }
  
  // Get all files to process
  console.log('Scanning for files...');
  const files = getAllFiles(targetPath);
  console.log(`Found ${files.length} files to process\n`);
  
  // Process each file
  console.log('Processing files...');
  for (const file of files) {
    updateFile(file, dryRun);
  }
  
  // Print summary
  console.log('\nSummary');
  console.log('=======');
  console.log(`Files processed: ${stats.filesProcessed}`);
  console.log(`Files ${dryRun ? 'would be updated' : 'updated'}: ${stats.filesUpdated}`);
  console.log(`Total replacements: ${stats.totalReplacements}`);
  
  if (stats.replacementsByFile.size > 0) {
    console.log('\nTop 10 files by replacement count:');
    const sortedFiles = Array.from(stats.replacementsByFile.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    
    for (const [file, count] of sortedFiles) {
      console.log(`  ${count} replacements: ${path.relative(targetPath, file)}`);
    }
  }
  
  if (dryRun) {
    console.log('\nThis was a dry run. No files were modified.');
    console.log('Run without --dry-run to apply changes.');
  }
}

// Run the script
main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});