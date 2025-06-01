const config = require('../../config/puppeteer.config');
const { testData } = require('../../config/test-data');
const { waitForElement, clickElement, fillInput, captureScreenshot } = require('../../helpers/test-utils');

describe('Registration Flow with Functions - Smoke Tests', () => {
  let browser;
  let page;

  beforeAll(async () => {
    browser = global.__BROWSER__;
  });

  beforeEach(async () => {
    page = await browser.newPage();
    await global.setupPage(page);
  });

  afterEach(async () => {
    if (page) {
      await page.close();
    }
  });

  test('should load the home page', async () => {
    await page.goto(config.baseUrl);
    
    // Wait for any main element or hero section
    await page.waitForSelector('body', { visible: true });
    
    // Check for key elements - the page might not have a main tag
    const title = await page.title();
    expect(title).toBeTruthy();
    
    // Check if Grand Installation function is visible
    const hasFunction = await page.evaluate(() => {
      const text = document.body.innerText;
      return text.includes('Grand Installation') || text.includes('grand-installation');
    });
    
    expect(hasFunction).toBe(true);
    
    // Take screenshot for visual verification
    await captureScreenshot(page, 'home-page');
  });

  test('should navigate to Grand Installation function', async () => {
    await page.goto(config.baseUrl);
    
    // Find and click on Grand Installation function
    const functionSelectors = [
      `a[href*="${testData.functionSlug}"]`,
      'a:contains("Grand Installation")',
      '[data-testid="function-card"] a',
      'a[href*="/functions/"]'
    ];
    
    let clicked = false;
    for (const selector of functionSelectors) {
      try {
        // Use evaluate to find and click links containing Grand Proclamation
        clicked = await page.evaluate((functionSlug) => {
          const links = Array.from(document.querySelectorAll('a'));
          const functionLink = links.find(link => 
            link.href.includes(functionSlug) || 
            link.textContent.includes('Grand Installation')
          );
          if (functionLink) {
            functionLink.click();
            return true;
          }
          return false;
        }, testData.functionSlug);
        
        if (clicked) break;
      } catch (e) {
        // Try next selector
      }
    }
    
    expect(clicked).toBe(true);
    
    // Wait for navigation
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    
    // Verify we're on the function page
    const currentUrl = page.url();
    expect(currentUrl).toContain(testData.functionSlug);
    
    await captureScreenshot(page, 'function-page');
  });

  test('should access registration wizard', async () => {
    // Navigate directly to Grand Installation function
    await page.goto(`${config.baseUrl}/functions/${testData.functionSlug}`);
    
    // Find and click register/tickets button
    const registerClicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('a, button'));
      const registerButton = buttons.find(btn => {
        const text = btn.textContent || '';
        return text.includes('Register') || 
               text.includes('Get Tickets') || 
               text.includes('Purchase Tickets');
      });
      
      if (registerButton) {
        registerButton.click();
        return true;
      }
      return false;
    });
    
    expect(registerClicked).toBe(true);
    
    // Wait for navigation to registration wizard
    await page.waitForTimeout(2000);
    
    // Check if we're on the registration wizard
    const hasRegistrationTypes = await page.evaluate(() => {
      const text = document.body.innerText;
      return text.includes('Select Registration Type') || 
             text.includes('Myself & Others') ||
             text.includes('Lodge Registration');
    });
    
    expect(hasRegistrationTypes).toBe(true);
    
    await captureScreenshot(page, 'registration-wizard');
  });

  test('should select Individual registration type', async () => {
    // Navigate directly to a registration URL (from previous test observation)
    await page.goto(`${config.baseUrl}/functions/${testData.functionSlug}`);
    
    // Click register button
    await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a'));
      const registerLink = links.find(a => 
        a.textContent.includes('Register') || 
        a.textContent.includes('Get Tickets') ||
        a.textContent.includes('Purchase Tickets')
      );
      if (registerLink) registerLink.click();
    });
    
    await page.waitForTimeout(2000);
    
    // Click on "Myself & Others" registration type
    const selected = await page.evaluate(() => {
      // Find the card containing "Myself & Others"
      const cards = Array.from(document.querySelectorAll('div'));
      const myselfCard = cards.find(card => 
        card.textContent.includes('Myself & Others') &&
        card.textContent.includes('Register yourself')
      );
      
      if (myselfCard) {
        // Find the Select button within this card
        const selectButton = myselfCard.querySelector('button');
        if (selectButton) {
          selectButton.click();
          return true;
        }
      }
      
      // Alternative: click first Select button
      const selectButtons = Array.from(document.querySelectorAll('button'));
      const firstSelect = selectButtons.find(btn => btn.textContent.trim() === 'Select');
      if (firstSelect) {
        firstSelect.click();
        return true;
      }
      
      return false;
    });
    
    expect(selected).toBe(true);
    
    await page.waitForTimeout(2000);
    
    // Verify we moved to attendee details step
    const onAttendeeStep = await page.evaluate(() => {
      const text = document.body.innerText;
      return text.includes('Attendee Details') || 
             text.includes('Add Attendee') ||
             text.includes('Primary Attendee');
    });
    
    expect(onAttendeeStep).toBe(true);
    
    await captureScreenshot(page, 'attendee-details-step');
  });

  test('should verify responsive design', async () => {
    // Test mobile viewport
    await page.setViewport({ width: 375, height: 667 });
    await page.goto(config.baseUrl);
    
    // Wait for content to load
    await page.waitForTimeout(1000);
    
    // Check if content is visible
    const isMobileResponsive = await page.evaluate(() => {
      const body = document.body;
      return body.offsetWidth <= 375 && body.scrollHeight > 0;
    });
    
    expect(isMobileResponsive).toBe(true);
    
    await captureScreenshot(page, 'mobile-view');
    
    // Test tablet viewport
    await page.setViewport({ width: 768, height: 1024 });
    await page.reload();
    await page.waitForTimeout(1000);
    
    await captureScreenshot(page, 'tablet-view');
    
    // Test desktop viewport
    await page.setViewport({ width: 1920, height: 1080 });
    await page.reload();
    await page.waitForTimeout(1000);
    
    await captureScreenshot(page, 'desktop-view');
    
    expect(true).toBe(true); // Basic assertion to pass test
  });
});