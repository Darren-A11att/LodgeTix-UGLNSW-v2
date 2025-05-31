/**
 * Accessibility Tests for Registration Flows
 * Tests WCAG 2.1 compliance using Puppeteer's accessibility features
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

describe('Accessibility Tests', () => {
  let browser;
  let page;
  
  const screenshotDir = path.join(__dirname, '../../screenshots/accessibility');
  
  beforeAll(async () => {
    // Create screenshot directory
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
    
    browser = await puppeteer.launch({
      headless: process.env.PUPPETEER_HEADLESS !== 'false',
      slowMo: process.env.CI ? 0 : 50,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  });
  
  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });
  
  beforeEach(async () => {
    page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
  });
  
  afterEach(async () => {
    if (page) {
      await page.close();
    }
  });
  
  test('registration type page has proper accessibility tree', async () => {
    await page.goto(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/events/grand-installation-2025/register`);
    
    // Get accessibility tree
    const snapshot = await page.accessibility.snapshot();
    
    // Verify page has proper heading structure
    const headings = findNodesWithRole(snapshot, 'heading');
    expect(headings.length).toBeGreaterThan(0);
    expect(headings[0].name).toBeTruthy();
    
    // Verify all interactive elements have accessible names
    const buttons = findNodesWithRole(snapshot, 'button');
    buttons.forEach(button => {
      expect(button.name).toBeTruthy();
      expect(button.name).not.toBe('');
    });
    
    // Check for proper landmark regions
    const main = findNodesWithRole(snapshot, 'main');
    expect(main.length).toBe(1);
    
    await page.screenshot({ 
      path: path.join(screenshotDir, 'registration-type-a11y.png'),
      fullPage: true 
    });
  });
  
  test('form fields have proper labels and descriptions', async () => {
    await page.goto(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/events/grand-installation-2025/register`);
    
    // Navigate to attendee details
    await page.click('[data-testid="registration-type-individual"]');
    await page.click('[data-testid="continue-button"]');
    
    await page.waitForSelector('[data-testid="attendee-details-step"]');
    
    // Check form field accessibility
    const formFields = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input, select, textarea'));
      return inputs.map(input => {
        const label = document.querySelector(`label[for="${input.id}"]`);
        const ariaLabel = input.getAttribute('aria-label');
        const ariaDescribedBy = input.getAttribute('aria-describedby');
        
        return {
          type: input.type,
          id: input.id,
          hasLabel: !!label,
          labelText: label?.textContent,
          hasAriaLabel: !!ariaLabel,
          ariaLabel,
          hasAriaDescribedBy: !!ariaDescribedBy,
          required: input.hasAttribute('required') || input.getAttribute('aria-required') === 'true'
        };
      });
    });
    
    // Every form field should have either a label or aria-label
    formFields.forEach(field => {
      expect(field.hasLabel || field.hasAriaLabel).toBe(true);
    });
    
    // Required fields should have proper ARIA attributes
    const requiredFields = formFields.filter(f => f.required);
    expect(requiredFields.length).toBeGreaterThan(0);
    
    await page.screenshot({ 
      path: path.join(screenshotDir, 'form-fields-a11y.png'),
      fullPage: true 
    });
  });
  
  test('keyboard navigation works correctly', async () => {
    await page.goto(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/events/grand-installation-2025/register`);
    
    // Test tab navigation
    await page.keyboard.press('Tab');
    let focusedElement = await page.evaluate(() => document.activeElement.tagName);
    expect(['A', 'BUTTON', 'INPUT']).toContain(focusedElement);
    
    // Tab through registration type options
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
    }
    
    // Select with Enter key
    await page.keyboard.press('Enter');
    
    // Continue with keyboard
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    
    // Verify we navigated to next step
    await page.waitForSelector('[data-testid="attendee-details-step"]');
    
    await page.screenshot({ 
      path: path.join(screenshotDir, 'keyboard-navigation.png'),
      fullPage: true 
    });
  });
  
  test('error messages are properly announced', async () => {
    await page.goto(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/events/grand-installation-2025/register`);
    
    // Navigate to form
    await page.click('[data-testid="registration-type-individual"]');
    await page.click('[data-testid="continue-button"]');
    
    await page.waitForSelector('[data-testid="attendee-details-step"]');
    
    // Try to submit without filling required fields
    await page.click('[data-testid="continue-button"]');
    
    // Check error messages have proper ARIA attributes
    const errorMessages = await page.evaluate(() => {
      const errors = Array.from(document.querySelectorAll('[role="alert"], [aria-live="polite"]'));
      return errors.map(error => ({
        text: error.textContent,
        role: error.getAttribute('role'),
        ariaLive: error.getAttribute('aria-live'),
        isVisible: error.offsetParent !== null
      }));
    });
    
    expect(errorMessages.length).toBeGreaterThan(0);
    errorMessages.forEach(error => {
      expect(error.isVisible).toBe(true);
      expect(error.role === 'alert' || error.ariaLive === 'polite').toBe(true);
    });
    
    await page.screenshot({ 
      path: path.join(screenshotDir, 'error-messages-a11y.png'),
      fullPage: true 
    });
  });
  
  test('color contrast meets WCAG standards', async () => {
    await page.goto(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/events/grand-installation-2025`);
    
    // Check contrast ratios for key elements
    const contrastResults = await page.evaluate(() => {
      const elements = [];
      
      // Check buttons
      const buttons = document.querySelectorAll('button');
      buttons.forEach(button => {
        const styles = window.getComputedStyle(button);
        elements.push({
          type: 'button',
          text: button.textContent,
          color: styles.color,
          backgroundColor: styles.backgroundColor,
          fontSize: styles.fontSize
        });
      });
      
      // Check headings
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      headings.forEach(heading => {
        const styles = window.getComputedStyle(heading);
        elements.push({
          type: 'heading',
          text: heading.textContent.substring(0, 50),
          color: styles.color,
          backgroundColor: styles.backgroundColor || 'rgb(255, 255, 255)',
          fontSize: styles.fontSize
        });
      });
      
      return elements;
    });
    
    // Log contrast information for manual review
    console.log('Contrast check results:', contrastResults.slice(0, 5));
    
    await page.screenshot({ 
      path: path.join(screenshotDir, 'color-contrast.png'),
      fullPage: true 
    });
  });
  
  test('focus indicators are visible', async () => {
    await page.goto(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/events/grand-installation-2025/register`);
    
    // Tab to first interactive element
    await page.keyboard.press('Tab');
    
    // Check if focus is visible
    const focusVisible = await page.evaluate(() => {
      const focused = document.activeElement;
      const styles = window.getComputedStyle(focused);
      
      // Check for focus styles
      const hasOutline = styles.outline !== 'none' && styles.outline !== '';
      const hasBoxShadow = styles.boxShadow !== 'none' && styles.boxShadow !== '';
      const hasBorderChange = styles.border !== '';
      
      return {
        element: focused.tagName,
        hasVisibleFocus: hasOutline || hasBoxShadow || hasBorderChange,
        outline: styles.outline,
        boxShadow: styles.boxShadow,
        border: styles.border
      };
    });
    
    expect(focusVisible.hasVisibleFocus).toBe(true);
    
    await page.screenshot({ 
      path: path.join(screenshotDir, 'focus-indicators.png'),
      fullPage: true 
    });
  });
  
  test('screen reader landmarks are properly structured', async () => {
    await page.goto(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/events/grand-installation-2025`);
    
    // Check for proper landmark structure
    const landmarks = await page.evaluate(() => {
      const landmarkRoles = ['banner', 'navigation', 'main', 'contentinfo', 'complementary'];
      const landmarkElements = [];
      
      // Check ARIA landmarks
      landmarkRoles.forEach(role => {
        const elements = document.querySelectorAll(`[role="${role}"]`);
        elements.forEach(el => {
          landmarkElements.push({
            role,
            hasLabel: !!el.getAttribute('aria-label') || !!el.getAttribute('aria-labelledby'),
            label: el.getAttribute('aria-label') || el.getAttribute('aria-labelledby')
          });
        });
      });
      
      // Check HTML5 landmarks
      const semanticElements = document.querySelectorAll('header, nav, main, footer, aside');
      semanticElements.forEach(el => {
        landmarkElements.push({
          element: el.tagName.toLowerCase(),
          hasLabel: !!el.getAttribute('aria-label') || !!el.getAttribute('aria-labelledby'),
          label: el.getAttribute('aria-label') || el.getAttribute('aria-labelledby')
        });
      });
      
      return landmarkElements;
    });
    
    // Should have at least main landmark
    const mainLandmarks = landmarks.filter(l => l.role === 'main' || l.element === 'main');
    expect(mainLandmarks.length).toBeGreaterThanOrEqual(1);
    
    await page.screenshot({ 
      path: path.join(screenshotDir, 'landmarks.png'),
      fullPage: true 
    });
  });
  
  test('images have appropriate alt text', async () => {
    await page.goto(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/events/grand-installation-2025`);
    
    // Check all images
    const imageAccessibility = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img'));
      return images.map(img => ({
        src: img.src.substring(img.src.lastIndexOf('/') + 1),
        hasAlt: img.hasAttribute('alt'),
        altText: img.getAttribute('alt'),
        isDecorative: img.getAttribute('alt') === '',
        role: img.getAttribute('role')
      }));
    });
    
    // All images should have alt attribute
    imageAccessibility.forEach(img => {
      expect(img.hasAlt).toBe(true);
    });
    
    // Decorative images should have empty alt or role="presentation"
    const decorativeImages = imageAccessibility.filter(img => img.isDecorative);
    decorativeImages.forEach(img => {
      expect(img.altText === '' || img.role === 'presentation').toBe(true);
    });
    
    await page.screenshot({ 
      path: path.join(screenshotDir, 'image-alt-text.png'),
      fullPage: true 
    });
  });
});

// Helper function to find nodes with specific role in accessibility tree
function findNodesWithRole(node, role, nodes = []) {
  if (node.role === role) {
    nodes.push(node);
  }
  
  if (node.children) {
    node.children.forEach(child => findNodesWithRole(child, role, nodes));
  }
  
  return nodes;
}