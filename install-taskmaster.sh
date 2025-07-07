#!/bin/bash

echo "Installing Task Master MCP server..."

# Copy MCP config to Claude directory
cp mcp.json ~/Library/Application\ Support/Claude/

echo "Task Master has been added to your MCP configuration!"
echo ""
echo "Next steps:"
echo "1. Restart Claude Desktop to load Task Master"
echo "2. Task Master will auto-organize your tasks by priority"
echo "3. Use these commands in Claude:"
echo "   - 'Create task: [description]'"
echo "   - 'List tasks'"
echo "   - 'Update task [id]'"
echo "   - 'Complete task [id]'"
echo ""
echo "Task Master features:"
echo "- Smart prioritization based on task content"
echo "- Automatic categorization"
echo "- Progress tracking"
echo "- Team synchronization through shared tasks"