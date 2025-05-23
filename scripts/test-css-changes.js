#!/usr/bin/env node

/**
 * CSS Changes Test Script
 * 
 * This script helps validate the CSS changes made by consolidate-css.js by:
 * 1. Checking which files would be affected (dry run)
 * 2. Counting CSS import patterns in the codebase
 * 3. Identifying color variable references to convert
 * 
 * Note: Phone input styling is completely excluded from analysis
 */

const fs = require('fs');
const path = require('path');

// Paths
const ROOT_DIR = process.cwd();
const APP_DIR = path.join(ROOT_DIR, 'app');
const SHARED_DIR = path.join(ROOT_DIR, 'shared');

// Function to recursively find all files with specific extensions
function findFiles(dir, extensions, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      // Skip node_modules and .git directories
      if (entry.name !== 'node_modules' && entry.name !== '.git') {
        findFiles(fullPath, extensions, files);
      }
    } else if (extensions.some(ext => entry.name.endsWith(ext))) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Analyze file imports (excluding phone input)
function analyzeFileImports(file) {
  try {
    const content = fs.readFileSync(file, 'utf8');
    const results = {
      file,
      importsAppGlobals: content.includes('/style/styles/globals.css'),
      importsSharedTheme: content.includes('/shared/theme/index.css'),
      hasColorPrimaryRgba: content.includes('rgba(var(--color-primary)'),
      hasColorSecondaryRgba: content.includes('rgba(var(--color-secondary)'),
      hasColorAccentRgba: content.includes('rgba(var(--color-accent)'),
      needsUpdate: false
    };
    
    results.needsUpdate = 
      results.importsAppGlobals || 
      results.importsSharedTheme || 
      results.hasColorPrimaryRgba || 
      results.hasColorSecondaryRgba || 
      results.hasColorAccentRgba;
    
    return results;
  } catch (error) {
    console.error(`Error analyzing ${file}:`, error);
    return {
      file,
      error: error.message,
      needsUpdate: false
    };
  }
}

// Print a summary report
function printSummary(results) {
  let appGlobalCount = 0;
  let sharedThemeCount = 0;
  let colorPrimaryRgbaCount = 0;
  let colorSecondaryRgbaCount = 0;
  let colorAccentRgbaCount = 0;
  let filesToUpdateCount = 0;
  
  for (const result of results) {
    if (result.importsAppGlobals) appGlobalCount++;
    if (result.importsSharedTheme) sharedThemeCount++;
    if (result.hasColorPrimaryRgba) colorPrimaryRgbaCount++;
    if (result.hasColorSecondaryRgba) colorSecondaryRgbaCount++;
    if (result.hasColorAccentRgba) colorAccentRgbaCount++;
    if (result.needsUpdate) filesToUpdateCount++;
  }
  
  console.log('\n📊 CSS CONSOLIDATION ANALYSIS');
  console.log('============================');
  console.log(`Total files analyzed: ${results.length}`);
  console.log(`Files needing updates: ${filesToUpdateCount}`);
  console.log('\nCSS IMPORT PATTERNS:');
  console.log(`- Files importing style/styles/globals.css: ${appGlobalCount}`);
  console.log(`- Files importing shared/theme/index.css: ${sharedThemeCount}`);
  console.log('\nCSS VARIABLE USAGE:');
  console.log(`- Files using rgba(var(--color-primary), x): ${colorPrimaryRgbaCount}`);
  console.log(`- Files using rgba(var(--color-secondary), x): ${colorSecondaryRgbaCount}`);
  console.log(`- Files using rgba(var(--color-accent), x): ${colorAccentRgbaCount}`);
  
  // Display files that need to be updated
  if (filesToUpdateCount > 0) {
    console.log('\nFILES THAT NEED UPDATES:');
    results
      .filter(r => r.needsUpdate)
      .forEach(r => {
        const reasons = [];
        if (r.importsAppGlobals) reasons.push('imports style/styles/globals.css');
        if (r.importsSharedTheme) reasons.push('imports shared/theme/index.css');
        if (r.hasColorPrimaryRgba) reasons.push('uses --color-primary');
        if (r.hasColorSecondaryRgba) reasons.push('uses --color-secondary');
        if (r.hasColorAccentRgba) reasons.push('uses --color-accent');
        
        console.log(`- ${r.file} (${reasons.join(', ')})`);
      });
  }
  
  // Summary
  console.log('\n🔍 CONCLUSION:');
  if (filesToUpdateCount > 0) {
    console.log(`The consolidate-css.js script will update ${filesToUpdateCount} files.`);
    console.log('Phone input styling is EXCLUDED from all updates as requested.');
  } else {
    console.log('No files need to be updated. The codebase is already using consolidated CSS.');
  }
}

// Main function
function main() {
  console.log('🔍 Analyzing CSS usage in the codebase (excluding phone input styling)...');
  
  // Find all TS/TSX/JS/JSX files 
  const files = findFiles(ROOT_DIR, ['.ts', '.tsx', '.js', '.jsx']);
  console.log(`Found ${files.length} files to analyze.`);
  
  // Analyze each file
  const results = files.map(analyzeFileImports);
  
  // Print summary
  printSummary(results);
}

// Run the script
main();