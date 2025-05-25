#!/bin/bash

# Script to add Supabase MCP server to Claude configuration
# This script will update the claude_desktop_config.json file

# Define the Claude config path (adjust if needed for your system)
CONFIG_PATH="$HOME/Library/Application Support/Claude/claude_desktop_config.json"

# Check if the config file exists
if [ ! -f "$CONFIG_PATH" ]; then
    echo "Claude config file not found at: $CONFIG_PATH"
    echo "Creating new config file..."
    mkdir -p "$(dirname "$CONFIG_PATH")"
    echo '{"mcpServers": {}}' > "$CONFIG_PATH"
fi

# Backup the current config
cp "$CONFIG_PATH" "$CONFIG_PATH.backup.$(date +%Y%m%d_%H%M%S)"
echo "Backed up current config to: $CONFIG_PATH.backup.$(date +%Y%m%d_%H%M%S)"

# Read the current config
CURRENT_CONFIG=$(cat "$CONFIG_PATH")

# Check if mcpServers exists in the config
if ! echo "$CURRENT_CONFIG" | jq -e '.mcpServers' > /dev/null 2>&1; then
    # Add mcpServers object if it doesn't exist
    CURRENT_CONFIG=$(echo "$CURRENT_CONFIG" | jq '. + {"mcpServers": {}}')
fi

# Add the Supabase MCP server configuration
UPDATED_CONFIG=$(echo "$CURRENT_CONFIG" | jq '.mcpServers.supabase = {
    "command": "npx",
    "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--access-token",
        "sbp_099d162c18f0571beb88a71dc10858692b9621fb"
    ]
}')

# Write the updated config back to the file
echo "$UPDATED_CONFIG" | jq '.' > "$CONFIG_PATH"

echo "✅ Successfully added Supabase MCP server to Claude configuration!"
echo ""
echo "The following configuration was added:"
echo ""
echo "$UPDATED_CONFIG" | jq '.mcpServers.supabase'
echo ""
echo "⚠️  IMPORTANT: You need to restart Claude Desktop for the changes to take effect."
echo ""
echo "After restarting Claude, the Supabase MCP server will be available."