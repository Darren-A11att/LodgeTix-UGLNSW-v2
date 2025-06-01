# MCP (Model Context Protocol) Setup Guide

## Overview
This project uses MCP servers for enhanced Claude Code functionality. The configuration file `.mcp.json` contains sensitive access tokens and should never be committed to version control.

## Setup Instructions

1. **Copy the example configuration:**
   ```bash
   cp .mcp.json.example .mcp.json
   ```

2. **Configure your tokens:**
   
   Edit `.mcp.json` and replace the placeholder values:

   - **Supabase Access Token:**
     - Replace `YOUR_SUPABASE_ACCESS_TOKEN_HERE` with your actual Supabase access token
     - Get this from your Supabase project settings

   - **GitHub Personal Access Token:**
     - Replace `YOUR_GITHUB_PAT_HERE` with a new GitHub PAT
     - Create one at: https://github.com/settings/tokens
     - Required scopes: `repo`, `read:org`, `read:user`

3. **Verify the configuration:**
   - The `.mcp.json` file is gitignored to prevent accidental commits
   - Never commit this file with real tokens

## Security Notes

- The `.mcp.json` file contains sensitive credentials
- It's automatically excluded from version control via `.gitignore`
- If you accidentally commit credentials:
  1. Immediately revoke the exposed tokens
  2. Generate new tokens
  3. Update your local `.mcp.json` with the new tokens

## Available MCP Servers

- **filesystem**: File system access
- **sequential-thinking**: Enhanced reasoning capabilities
- **Context7**: Context management
- **supabase**: Database interactions
- **claude**: Claude-specific features
- **make**: Automation workflows
- **puppeteer**: Browser automation for testing
- **github**: GitHub API access
- **memory**: Persistent memory across sessions