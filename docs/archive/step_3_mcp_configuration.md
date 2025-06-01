# Step 3: MCP Configuration

## Objective
Add Model Context Protocol (MCP) configuration to enable Claude Code's Puppeteer integration capabilities.

## Tasks

### 3.1 Install MCP Server
- [ ] Install @modelcontextprotocol/server-puppeteer package
- [ ] Configure MCP server settings
- [ ] Set up authentication if required
- [ ] Verify server installation

### 3.2 Configure Claude Desktop
- [ ] Update Claude Desktop settings
- [ ] Add MCP server configuration
- [ ] Set up environment variables
- [ ] Test connection to MCP server

### 3.3 Project-Specific Configuration
- [ ] Create `.mcp/` configuration directory
- [ ] Add puppeteer-specific settings
- [ ] Configure browser launch options
- [ ] Set up headless/headful modes

### 3.4 Integration Testing
- [ ] Test basic Puppeteer commands through Claude
- [ ] Verify screenshot capabilities
- [ ] Test page navigation features
- [ ] Validate selector interactions

## Configuration Template
```json
{
  "mcpServers": {
    "puppeteer": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-puppeteer"],
      "options": {
        "headless": true,
        "slowMo": 50,
        "defaultViewport": {
          "width": 1280,
          "height": 720
        }
      }
    }
  }
}
```

## Expected Outputs
- Working MCP configuration
- Verified Claude-Puppeteer connection
- Configuration documentation
- Troubleshooting guide

## Success Criteria
- MCP server running successfully
- Claude can execute Puppeteer commands
- Configuration is version controlled
- Team can replicate setup