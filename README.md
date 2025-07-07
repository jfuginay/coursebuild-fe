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
