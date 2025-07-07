#!/bin/bash

echo "Setting up MCP servers for ListPro/Katalyst AI project..."

# Create .env file for sensitive tokens
cat << 'EOF' > .env.example
# GitHub Personal Access Token
# Get from: https://github.com/settings/tokens
# Required scopes: repo, project, read:user
GITHUB_PERSONAL_ACCESS_TOKEN=

# Linear API Key  
# Get from: https://linear.app/settings/api
LINEAR_API_KEY=

# Todoist API Token
# Get from: https://todoist.com/app/settings/integrations/developer
TODOIST_API_TOKEN=
EOF

# Create project structure
mkdir -p .github/workflows
mkdir -p docs
mkdir -p scripts

# Create README for team
cat << 'EOF' > README.md
# ListPro / Katalyst AI

AI-powered marketplace listing assistant that scans items via video/photo and helps create optimized listings across multiple platforms.

## Team Setup

1. **Clone this repo**
2. **Set up MCP servers:**
   ```bash
   cp .env.example .env
   # Add your personal tokens to .env
   ```

3. **Configure Claude Desktop:**
   - Copy `mcp.json` to your Claude Desktop config directory:
     - macOS: `~/Library/Application Support/Claude/`
     - Windows: `%APPDATA%\Claude\`
   - Update the tokens in the config with your personal tokens

4. **Available MCP Commands:**
   - GitHub: Create issues, PRs, manage project boards
   - Linear: Create and track tasks
   - Todoist: Personal task management

## Project Structure

- `/ios` - Swift iOS app
- `/android` - Android app  
- `/backend` - API services
- `/shared` - Shared utilities and models

## CI/CD

- GitLab CI for builds
- GitHub Actions for deployment
- See `.github/workflows/` for pipelines
EOF

echo "Setup complete! Next steps:"
echo "1. Copy .env.example to .env and add your tokens"
echo "2. Update mcp.json with your token environment variables"
echo "3. Restart Claude Desktop to load MCP servers"
echo "4. Share this setup with your team"