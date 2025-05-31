/**
 * Visual Regression Tests
 * Captures and compares screenshots to detect visual changes
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

describe('Visual Regression Tests', () => {
  let browser;
  let page;
  
  const baselineDir = path.join(__dirname, '../../screenshots/visual-baseline');
  const currentDir = path.join(__dirname, '../../screenshots/visual-current');
  const diffDir = path.join(__dirname, '../../screenshots/visual-diff');
  
  beforeAll(async () => {
    // Create screenshot directories
    [baselineDir, currentDir, diffDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
    
    browser = await puppeteer.launch({
      headless: process.env.PUPPETEER_HEADLESS !== 'false',
      slowMo: process.env.CI ? 0 : 50,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none']
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
    
    // Set consistent conditions for screenshots
    await page.evaluateOnNewDocument(() => {
      // Disable animations
      const style = document.createElement('style');
      style.textContent = `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
      `;
      document.head.appendChild(style);
      
      // Mock date/time
      Date.now = () => new Date('2025-01-31T10:00:00').getTime();
    });
  });
  
  afterEach(async () => {
    if (page) {
      await page.close();
    }
  });
  
  async function compareScreenshots(name) {
    const baselinePath = path.join(baselineDir, `${name}.png`);
    const currentPath = path.join(currentDir, `${name}.png`);
    
    // If no baseline exists, create it
    if (!fs.existsSync(baselinePath)) {
      fs.copyFileSync(currentPath, baselinePath);
      console.log(`Created baseline for: ${name}`);
      return { match: true, firstRun: true };
    }
    
    // Simple file size comparison (in real app, use image diff library)
    const baselineStats = fs.statSync(baselinePath);
    const currentStats = fs.statSync(currentPath);
    
    const sizeDiff = Math.abs(baselineStats.size - currentStats.size);
    const threshold = baselineStats.size * 0.05; // 5% threshold
    
    return {
      match: sizeDiff < threshold,
      sizeDiff,
      threshold
    };
  }
  
  test('event page visual consistency', async () => {
    await page.goto(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/events/grand-installation-2025`);
    
    // Wait for content to load
    await page.waitForSelector('[data-testid="event-title"]', { timeout: 10000 });
    await page.waitForTimeout(1000); // Wait for images to load
    
    // Hide dynamic content
    await page.evaluate(() => {
      // Hide elements that change frequently
      const dynamicElements = document.querySelectorAll('[data-dynamic], .timestamp, .countdown');
      dynamicElements.forEach(el => el.style.visibility = 'hidden');
    });
    
    await page.screenshot({ 
      path: path.join(currentDir, 'event-page.png'),
      fullPage: true 
    });
    
    const result = await compareScreenshots('event-page');
    if (!result.firstRun) {
      expect(result.match).toBe(true);
    }
  });
  
  test('registration type selection visual consistency', async () => {
    await page.goto(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/events/grand-installation-2025/register`);
    
    await page.waitForSelector('[data-testid="registration-type-step"]', { timeout: 10000 });
    
    // Capture default state
    await page.screenshot({ 
      path: path.join(currentDir, 'registration-type-default.png'),
      fullPage: false,
      clip: await page.$eval('[data-testid="registration-type-step"]', el => {
        const rect = el.getBoundingClientRect();
        return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
      })
    });
    
    // Capture hover state
    await page.hover('[data-testid="registration-type-individual"]');
    await page.waitForTimeout(100);
    
    await page.screenshot({ 
      path: path.join(currentDir, 'registration-type-hover.png'),
      fullPage: false,
      clip: await page.$eval('[data-testid="registration-type-step"]', el => {
        const rect = el.getBoundingClientRect();
        return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
      })
    });
    
    // Capture selected state
    await page.click('[data-testid="registration-type-individual"]');
    await page.waitForTimeout(100);
    
    await page.screenshot({ 
      path: path.join(currentDir, 'registration-type-selected.png'),
      fullPage: false,
      clip: await page.$eval('[data-testid="registration-type-step"]', el => {
        const rect = el.getBoundingClientRect();
        return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
      })
    });
    
    // Compare screenshots
    const results = await Promise.all([
      compareScreenshots('registration-type-default'),
      compareScreenshots('registration-type-hover'),
      compareScreenshots('registration-type-selected')
    ]);
    
    results.forEach((result, index) => {
      if (!result.firstRun) {
        expect(result.match).toBe(true);
      }
    });
  });
  
  test('form components visual consistency', async () => {
    await page.goto(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/events/grand-installation-2025/register`);
    
    // Navigate to form
    await page.click('[data-testid="registration-type-individual"]');
    await page.click('[data-testid="continue-button"]');
    
    await page.waitForSelector('[data-testid="attendee-details-step"]', { timeout: 10000 });
    
    // Capture form in different states
    const formStates = [
      { name: 'form-empty', action: null },
      { name: 'form-focused', action: async () => {
        await page.focus('[data-testid="attendee-firstname"]');
      }},
      { name: 'form-filled', action: async () => {
        await page.type('[data-testid="attendee-firstname"]', 'John');
        await page.type('[data-testid="attendee-lastname"]', 'Doe');
      }},
      { name: 'form-error', action: async () => {
        await page.click('[data-testid="continue-button"]');
        await page.waitForSelector('[data-testid^="field-error-"]');
      }}
    ];
    
    for (const state of formStates) {
      if (state.action) {
        await state.action();
      }
      
      await page.screenshot({ 
        path: path.join(currentDir, `${state.name}.png`),
        fullPage: false,
        clip: await page.$eval('[data-testid="attendee-details-step"]', el => {
          const rect = el.getBoundingClientRect();
          return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
        })
      });
      
      const result = await compareScreenshots(state.name);
      if (!result.firstRun) {
        expect(result.match).toBe(true);
      }
    }
  });
  
  test('ticket selection UI visual consistency', async () => {
    await page.goto(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/events/grand-installation-2025/register`);
    
    // Quick navigation to ticket selection
    await page.evaluate(() => {
      // Mock navigation to ticket step
      window.location.hash = '#ticket-selection';
    });
    
    await page.goto(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/events/grand-installation-2025/register/test-id/tickets`);
    await page.waitForSelector('[data-testid="ticket-selection-step"]', { timeout: 10000 });
    
    // Capture ticket cards
    const ticketCards = await page.$$('[data-testid^="ticket-card-"]');
    
    for (let i = 0; i < Math.min(ticketCards.length, 3); i++) {
      await page.screenshot({ 
        path: path.join(currentDir, `ticket-card-${i}.png`),
        clip: await ticketCards[i].boundingBox()
      });
      
      const result = await compareScreenshots(`ticket-card-${i}`);
      if (!result.firstRun) {
        expect(result.match).toBe(true);
      }
    }
    
    // Capture order summary
    const orderSummary = await page.$('[data-testid="order-summary"]');
    if (orderSummary) {
      await page.screenshot({ 
        path: path.join(currentDir, 'order-summary.png'),
        clip: await orderSummary.boundingBox()
      });
      
      const result = await compareScreenshots('order-summary');
      if (!result.firstRun) {
        expect(result.match).toBe(true);
      }
    }
  });
  
  test('responsive design visual consistency', async () => {
    const viewports = [
      { name: 'mobile', width: 375, height: 812 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1920, height: 1080 }
    ];
    
    for (const viewport of viewports) {
      await page.setViewport({ width: viewport.width, height: viewport.height });
      
      await page.goto(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/events/grand-installation-2025`);
      await page.waitForSelector('[data-testid="event-title"]', { timeout: 10000 });
      
      await page.screenshot({ 
        path: path.join(currentDir, `responsive-${viewport.name}.png`),
        fullPage: false
      });
      
      const result = await compareScreenshots(`responsive-${viewport.name}`);
      if (!result.firstRun) {
        expect(result.match).toBe(true);
      }
    }
  });
  
  test('dark mode visual consistency', async () => {
    // Enable dark mode
    await page.evaluateOnNewDocument(() => {
      localStorage.setItem('theme', 'dark');
      document.documentElement.classList.add('dark');
    });
    
    await page.goto(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/events/grand-installation-2025`);
    await page.waitForSelector('[data-testid="event-title"]', { timeout: 10000 });
    
    await page.screenshot({ 
      path: path.join(currentDir, 'dark-mode-event.png'),
      fullPage: true
    });
    
    const result = await compareScreenshots('dark-mode-event');
    if (!result.firstRun) {
      expect(result.match).toBe(true);
    }
  });
  
  test('loading states visual consistency', async () => {
    // Intercept API calls to simulate loading
    await page.setRequestInterception(true);
    
    let interceptCount = 0;
    page.on('request', request => {
      if (request.url().includes('/api/') && interceptCount < 1) {
        interceptCount++;
        setTimeout(() => request.continue(), 2000); // 2 second delay
      } else {
        request.continue();
      }
    });
    
    await page.goto(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/events/grand-installation-2025`);
    
    // Capture loading state
    await page.waitForTimeout(500);
    await page.screenshot({ 
      path: path.join(currentDir, 'loading-state.png'),
      fullPage: false
    });
    
    const result = await compareScreenshots('loading-state');
    if (!result.firstRun) {
      expect(result.match).toBe(true);
    }
  });
  
  test('error states visual consistency', async () => {
    // Navigate to a non-existent page
    await page.goto(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/events/non-existent-event`);
    
    await page.waitForTimeout(1000);
    
    await page.screenshot({ 
      path: path.join(currentDir, 'error-404.png'),
      fullPage: true
    });
    
    const result = await compareScreenshots('error-404');
    if (!result.firstRun) {
      expect(result.match).toBe(true);
    }
  });
});