# Phase 2: Minimal Integration Setup (Day 3-5)

## Overview
Establish the minimal viable integration between Claude Code and the existing project infrastructure, focusing on non-disruptive additions that enhance rather than replace current workflows.

## Step 3: Add MCP Configuration

### 3.1 MCP Server Setup
- [ ] Install MCP (Model Context Protocol) server
  ```bash
  npm install --save-dev @modelcontextprotocol/server
  ```
- [ ] Create MCP configuration directory structure
  ```
  mcp/
  ├── config/
  │   ├── puppeteer.json
  │   └── project.json
  ├── tools/
  │   └── test-generator.js
  └── README.md
  ```

### 3.2 Configure MCP for Puppeteer
- [ ] Create `mcp/config/puppeteer.json`
  ```json
  {
    "name": "puppeteer-integration",
    "version": "1.0.0",
    "tools": {
      "test-generator": {
        "description": "Generate Puppeteer tests from user interactions",
        "input_schema": {
          "type": "object",
          "properties": {
            "component": { "type": "string" },
            "testType": { "type": "string" }
          }
        }
      }
    }
  }
  ```

### 3.3 Project-specific MCP Configuration
- [ ] Create `mcp/config/project.json`
  ```json
  {
    "projectRoot": "./",
    "testDirectory": "__tests__/e2e",
    "framework": "puppeteer",
    "existingFramework": "playwright",
    "coexistence": true
  }
  ```

## Step 4: Install Dependencies

### 4.1 Core Puppeteer Dependencies
- [ ] Install Puppeteer and related packages
  ```bash
  npm install --save-dev puppeteer
  npm install --save-dev @types/puppeteer
  npm install --save-dev puppeteer-core
  ```

### 4.2 Claude Code Integration Dependencies
- [ ] Install Claude Code helpers
  ```bash
  npm install --save-dev @anthropic/claude-code-tools
  npm install --save-dev @anthropic/mcp-client
  ```

### 4.3 Test Enhancement Dependencies
- [ ] Install test utilities
  ```bash
  npm install --save-dev puppeteer-screen-recorder
  npm install --save-dev puppeteer-cluster
  npm install --save-dev expect-puppeteer
  ```

### 4.4 Development Dependencies
- [ ] Install development tools
  ```bash
  npm install --save-dev puppeteer-devtools
  npm install --save-dev jest-puppeteer
  ```

## Step 5: Integration Configuration Files

### 5.1 Create Puppeteer Configuration
- [ ] Create `puppeteer.config.js`
  ```javascript
  module.exports = {
    launch: {
      headless: process.env.HEADLESS !== 'false',
      slowMo: process.env.SLOW_MO || 0,
      devtools: process.env.DEVTOOLS === 'true',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    },
    browser: 'chromium',
    exitOnPageError: false
  };
  ```

### 5.2 Jest-Puppeteer Configuration
- [ ] Create `jest-puppeteer.config.js`
  ```javascript
  module.exports = {
    launch: {
      dumpio: true,
      headless: process.env.HEADLESS !== 'false',
    },
    browserContext: 'default',
    server: {
      command: 'npm run dev',
      port: 3000,
      launchTimeout: 10000,
      debug: true
    }
  };
  ```

### 5.3 TypeScript Configuration for Puppeteer
- [ ] Update `tsconfig.json` to include Puppeteer types
  ```json
  {
    "compilerOptions": {
      "types": ["puppeteer", "jest-puppeteer", "expect-puppeteer"]
    },
    "include": ["__tests__/puppeteer/**/*"]
  }
  ```

### 5.4 Environment Configuration
- [ ] Create `.env.puppeteer`
  ```bash
  PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false
  PUPPETEER_EXECUTABLE_PATH=
  HEADLESS=true
  SLOW_MO=0
  DEVTOOLS=false
  ```

### 5.5 Package.json Scripts
- [ ] Add Puppeteer-specific scripts
  ```json
  {
    "scripts": {
      "test:puppeteer": "jest --config=jest.puppeteer.config.js",
      "test:puppeteer:debug": "HEADLESS=false DEVTOOLS=true npm run test:puppeteer",
      "test:puppeteer:slow": "SLOW_MO=250 npm run test:puppeteer",
      "generate:test": "node mcp/tools/test-generator.js"
    }
  }
  ```

## Directory Structure
```
project-root/
├── __tests__/
│   ├── e2e/              # Existing Playwright tests
│   └── puppeteer/        # New Puppeteer tests
│       ├── config/
│       ├── fixtures/
│       ├── helpers/
│       └── specs/
├── mcp/                  # MCP configuration
│   ├── config/
│   └── tools/
├── puppeteer.config.js
├── jest-puppeteer.config.js
└── .env.puppeteer
```

## Verification Checklist
- [ ] MCP server starts without errors
- [ ] Puppeteer can launch browser successfully
- [ ] Sample test runs without conflicts
- [ ] Existing Playwright tests still function
- [ ] Claude Code can access MCP tools
- [ ] TypeScript recognizes Puppeteer types
- [ ] Environment variables load correctly

## Success Criteria
- Minimal integration established without breaking existing tests
- Both Playwright and Puppeteer tests can coexist
- Claude Code can interact with test generation tools
- No performance degradation in existing workflows
- Clear separation of concerns between frameworks

## Troubleshooting Guide
1. **Browser Launch Issues**: Check Chrome/Chromium installation
2. **Port Conflicts**: Ensure test server port is available
3. **Type Errors**: Verify TypeScript configuration includes Puppeteer types
4. **MCP Connection**: Check MCP server logs for connection issues
5. **Permission Errors**: Ensure proper file permissions for browser executable