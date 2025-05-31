#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as path from 'path';
import { DATABASE_FIELD_MAPPINGS } from '../lib/database-mappings';

// Simple version that updates the most common patterns

const FILE_EXTENSIONS = ['.ts', '.tsx'];
const EXCLUDED_DIRS = ['node_modules', '.git', 'dist', 'build', '.next'];

interface FileUpdate {
  path: string;
  original: string;
  updated: string;
  changes: number;
}

const updates: FileUpdate[] = [];

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

function updateFieldNames(content: string): { updated: string; changes: number } {
  let updated = content;
  let changes = 0;
  
  for (const [camelCase, snakeCase] of Object.entries(DATABASE_FIELD_MAPPINGS)) {
    // Create a more conservative regex that matches whole words only
    const regex = new RegExp(`\\b${camelCase}\\b`, 'g');
    
    // Count matches before replacement
    const matches = updated.match(regex);
    if (matches) {
      changes += matches.length;
      updated = updated.replace(regex, snakeCase);
    }
  }
  
  return { updated, changes };
}

function processFile(filePath: string): void {
  const original = fs.readFileSync(filePath, 'utf8');
  const { updated, changes } = updateFieldNames(original);
  
  if (changes > 0) {
    updates.push({
      path: filePath,
      original,
      updated,
      changes
    });
  }
}

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const createBackup = args.includes('--backup');
  const targetDir = args.find(arg => !arg.startsWith('--')) || '.';
  
  console.log('Simple Field Update Script');
  console.log('=========================');
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE UPDATE'}`);
  console.log(`Target: ${path.resolve(targetDir)}`);
  console.log(`Backup: ${createBackup ? 'YES' : 'NO'}`);
  console.log('');
  
  // Find all files
  const files = getAllFiles(targetDir);
  console.log(`Found ${files.length} TypeScript files\n`);
  
  // Process files
  console.log('Processing files...');
  files.forEach(processFile);
  
  // Show results
  console.log(`\nFound ${updates.length} files with changes:`);
  updates.forEach(update => {
    const relativePath = path.relative(targetDir, update.path);
    console.log(`  ${relativePath}: ${update.changes} changes`);
  });
  
  if (!dryRun && updates.length > 0) {
    // Create backup if requested
    if (createBackup) {
      const backupDir = path.join(targetDir, '.field-update-backup');
      fs.mkdirSync(backupDir, { recursive: true });
      
      console.log(`\nCreating backups in ${backupDir}`);
      updates.forEach(update => {
        const backupPath = path.join(backupDir, path.basename(update.path) + '.backup');
        fs.writeFileSync(backupPath, update.original);
      });
    }
    
    // Apply updates
    console.log('\nApplying updates...');
    updates.forEach(update => {
      fs.writeFileSync(update.path, update.updated);
    });
    
    console.log(`\nSuccessfully updated ${updates.length} files!`);
  } else if (dryRun) {
    console.log('\nDry run complete. No files were modified.');
    console.log('Run without --dry-run to apply changes.');
  }
}

main();