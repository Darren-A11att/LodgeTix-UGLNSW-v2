# Step 5: Integration Configuration Files

## Objective
Create configuration files that enable seamless integration between Claude Code, Puppeteer, and the existing Playwright setup.

## Tasks

### 5.1 Create Puppeteer Configuration
- [ ] Create `puppeteer.config.ts` file
- [ ] Configure browser launch options
- [ ] Set up viewport defaults
- [ ] Configure timeout settings

### 5.2 Shared Test Configuration
- [ ] Create `test-config/shared.config.ts`
- [ ] Define common test timeouts
- [ ] Set up shared test data paths
- [ ] Configure base URLs and endpoints

### 5.3 Environment Configuration
- [ ] Update `.env.example` with Puppeteer variables
- [ ] Create environment-specific configs
- [ ] Set up browser download paths
- [ ] Configure headless/headful modes

### 5.4 TypeScript Configuration
- [ ] Update `tsconfig.json` for Puppeteer types
- [ ] Create `tsconfig.puppeteer.json` if needed
- [ ] Configure path aliases
- [ ] Set up module resolution

## Configuration Templates

### puppeteer.config.ts
```typescript
export const puppeteerConfig = {
  launch: {
    headless: process.env.HEADLESS !== 'false',
    slowMo: parseInt(process.env.SLOW_MO || '0'),
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: {
      width: 1280,
      height: 720
    }
  },
  timeouts: {
    navigation: 30000,
    waitForSelector: 10000
  }
};
```

### test-config/shared.config.ts
```typescript
export const sharedTestConfig = {
  baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  testData: {
    paths: {
      fixtures: './test-data/fixtures',
      screenshots: './test-results/screenshots'
    }
  },
  retries: 2,
  parallel: true
};
```

## Expected Outputs
- Working configuration files
- Environment variable documentation
- TypeScript type definitions
- Configuration validation

## Success Criteria
- Configurations work in all environments
- No conflicts with existing setup
- Easy to maintain and extend
- Well-documented settings