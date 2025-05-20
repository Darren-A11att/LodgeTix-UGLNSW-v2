// scripts/verify-design-system.js
// Script to verify that all design system classes are available in the build

const fs = require('fs');
const path = require('path');

// List of design system classes to verify
const designSystemClasses = [
  // Grid classes
  '.form-grid',
  '.form-grid-tight',
  '.form-grid-loose',
  '.mason-grid',
  '.guest-grid',
  '.ticket-grid',
  
  // Field classes
  '.field-xs',
  '.field-sm',
  '.field-md',
  '.field-lg',
  '.field-xl',
  
  // Component classes
  '.input-base',
  '.select-base',
  '.textarea-base',
  '.button-base',
  '.button-primary',
  '.button-secondary',
  
  // Form classes
  '.form-section',
  '.form-section-header',
  
  // Card classes
  '.card-base',
  '.card-hover',
  '.card-selected',
  
  // Text classes
  '.label-base',
  '.error-text',
  '.hint-text',
];

// Tailwind config classes to verify
const tailwindClasses = [
  'col-field-xs',
  'col-field-sm',
  'col-field-md',
  'col-field-lg',
  'col-field-xl',
  'h-input',
  'h-button',
  'rounded-input',
  'rounded-button',
  'gap-form',
  'gap-form-sm',
  'gap-form-lg',
  'text-label',
  'text-hint',
  'text-error',
];

function verifyCSSFile(filePath) {
  try {
    const cssContent = fs.readFileSync(filePath, 'utf8');
    const missing = [];
    const found = [];
    
    console.log(`\nVerifying CSS file: ${filePath}`);
    console.log('='.repeat(50));
    
    // Check design system classes
    designSystemClasses.forEach(className => {
      if (cssContent.includes(className)) {
        found.push(className);
      } else {
        missing.push(className);
      }
    });
    
    // Check for Tailwind utility classes (they might be prefixed)
    tailwindClasses.forEach(className => {
      // Look for the class in various forms
      const variations = [
        `.${className}`,
        `${className}:`,
        `"${className}"`,
        `'${className}'`,
      ];
      
      const exists = variations.some(variant => cssContent.includes(variant));
      if (exists) {
        found.push(className);
      } else {
        missing.push(className);
      }
    });
    
    // Report results
    console.log(`\n✅ Found ${found.length} classes:`);
    found.forEach(cls => console.log(`   ${cls}`));
    
    if (missing.length > 0) {
      console.log(`\n❌ Missing ${missing.length} classes:`);
      missing.forEach(cls => console.log(`   ${cls}`));
    }
    
    return { found, missing };
    
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    return { found: [], missing: designSystemClasses.concat(tailwindClasses) };
  }
}

function verifyTailwindConfig() {
  const configPath = path.join(process.cwd(), 'tailwind.config.ts');
  
  try {
    const configContent = fs.readFileSync(configPath, 'utf8');
    console.log('\nVerifying Tailwind Config');
    console.log('='.repeat(50));
    
    const requiredExtensions = [
      'gridColumn',
      'gridTemplateColumns',
      'spacing',
      'height',
      'width',
      'fontSize',
      'borderRadius',
    ];
    
    const found = [];
    const missing = [];
    
    requiredExtensions.forEach(extension => {
      if (configContent.includes(extension)) {
        found.push(extension);
      } else {
        missing.push(extension);
      }
    });
    
    console.log(`\n✅ Found ${found.length} extensions:`);
    found.forEach(ext => console.log(`   ${ext}`));
    
    if (missing.length > 0) {
      console.log(`\n❌ Missing ${missing.length} extensions:`);
      missing.forEach(ext => console.log(`   ${ext}`));
    }
    
  } catch (error) {
    console.error('Error reading Tailwind config:', error.message);
  }
}

function main() {
  console.log('Design System Verification');
  console.log('='.repeat(50));
  
  // Verify Tailwind config
  verifyTailwindConfig();
  
  // Verify globals.css
  const globalsCSSPath = path.join(process.cwd(), 'app', 'globals.css');
  verifyCSSFile(globalsCSSPath);
  
  // Check if build CSS exists
  const buildCSSPath = path.join(process.cwd(), '.next', 'static', 'css');
  if (fs.existsSync(buildCSSPath)) {
    console.log('\n\nVerifying Built CSS Files');
    console.log('='.repeat(50));
    
    const cssFiles = fs.readdirSync(buildCSSPath)
      .filter(file => file.endsWith('.css'))
      .map(file => path.join(buildCSSPath, file));
    
    cssFiles.forEach(verifyCSSFile);
  } else {
    console.log('\n⚠️  No build CSS found. Run `npm run build` first to verify built CSS.');
  }
  
  console.log('\n\nVerification Complete!');
  console.log('='.repeat(50));
  console.log('\nNext steps:');
  console.log('1. If classes are missing, check your Tailwind config');
  console.log('2. Ensure globals.css is imported in your layout');
  console.log('3. Run `npm run build` to generate production CSS');
  console.log('4. Clear .next cache if needed: `rm -rf .next`');
}

// Run the verification
main();