#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class TaskMonitor {
  constructor() {
    this.patterns = {
      // Code smell patterns that should generate tasks
      todos: /\/\/\s*(TODO|FIXME|HACK|BUG|OPTIMIZE|REFACTOR):\s*(.+)/gi,
      typescript_errors: /error TS\d+:/g,
      missing_types: /(any|Function)\s*[;,\)]/g,
      console_logs: /console\.(log|error|warn|debug)/g,
      hardcoded_values: /(api_key|secret|password|token)\s*=\s*["'][\w\d]+["']/gi,
      long_functions: /function.*\{[\s\S]{500,}\}/g,
      
      // File patterns that need attention
      missing_tests: /\.(ts|js|swift|kt|java)$/,
      missing_docs: /\.(md|README|CONTRIBUTING)$/i,
      config_changes: /\.(json|yaml|yml|env|config)$/i,
      
      // Commit message patterns
      breaking_changes: /BREAKING CHANGE:|feat!:|fix!:/,
      dependencies: /package\.json|podfile|build\.gradle/i,
      security: /security|vulnerability|CVE-/i
    };
  }

  async analyzeChanges() {
    const tasks = [];
    
    try {
      // Get recent commits
      const commits = execSync('git log --oneline -10', { encoding: 'utf8' }).trim().split('\n');
      
      // Get changed files
      const changedFiles = execSync('git diff --name-only HEAD~1', { encoding: 'utf8' }).trim().split('\n').filter(f => f);
      
      // Get uncommitted changes
      const uncommittedFiles = execSync('git status --porcelain', { encoding: 'utf8' }).trim().split('\n').filter(f => f);
      
      // Analyze commit messages
      commits.forEach(commit => {
        if (this.patterns.breaking_changes.test(commit)) {
          tasks.push({
            title: `Handle breaking change from commit: ${commit}`,
            priority: 'critical',
            category: 'maintenance',
            source: 'commit-message'
          });
        }
      });
      
      // Analyze changed files
      [...changedFiles, ...uncommittedFiles.map(f => f.substring(3))].forEach(file => {
        if (!fs.existsSync(file)) return;
        
        const content = fs.readFileSync(file, 'utf8');
        const ext = path.extname(file);
        
        // Check for TODOs and FIXMEs
        const todoMatches = [...content.matchAll(this.patterns.todos)];
        todoMatches.forEach(match => {
          tasks.push({
            title: `${match[1]}: ${match[2].trim()} (${file})`,
            priority: match[1] === 'BUG' || match[1] === 'FIXME' ? 'high' : 'medium',
            category: 'code-quality',
            source: 'code-comment',
            file: file
          });
        });
        
        // Check for hardcoded secrets
        if (this.patterns.hardcoded_values.test(content)) {
          tasks.push({
            title: `Remove hardcoded secrets from ${file}`,
            priority: 'critical',
            category: 'security',
            source: 'security-scan',
            file: file
          });
        }
        
        // Check for missing tests
        if (this.patterns.missing_tests.test(file) && !file.includes('test') && !file.includes('spec')) {
          const testFile = file.replace(/\.(ts|js|swift|kt|java)$/, '.test$1');
          if (!fs.existsSync(testFile)) {
            tasks.push({
              title: `Add tests for ${file}`,
              priority: 'medium',
              category: 'testing',
              source: 'missing-tests',
              file: file
            });
          }
        }
        
        // Check for dependency changes
        if (this.patterns.dependencies.test(file)) {
          tasks.push({
            title: `Review and test dependency changes in ${file}`,
            priority: 'high',
            category: 'dependencies',
            source: 'dependency-change',
            file: file
          });
        }
      });
      
    } catch (error) {
      console.error('Error analyzing changes:', error.message);
    }
    
    return tasks;
  }

  async generateTasksWithAI(codeSnippet, context) {
    // This would call OpenAI/Claude API in production
    // For now, using pattern matching
    const tasks = [];
    
    // Complex function detection
    if (codeSnippet.length > 500 && codeSnippet.includes('function')) {
      tasks.push({
        title: `Refactor complex function in ${context.file}`,
        priority: 'medium',
        category: 'refactoring'
      });
    }
    
    // Missing error handling
    if (codeSnippet.includes('await') && !codeSnippet.includes('try') && !codeSnippet.includes('catch')) {
      tasks.push({
        title: `Add error handling for async operations in ${context.file}`,
        priority: 'high',
        category: 'error-handling'
      });
    }
    
    return tasks;
  }
}

// Main execution
async function main() {
  const monitor = new TaskMonitor();
  const command = process.argv[2];
  
  switch(command) {
    case 'scan':
      console.log('🔍 Scanning repository for tasks...\n');
      const tasks = await monitor.analyzeChanges();
      
      if (tasks.length === 0) {
        console.log('✅ No new tasks detected!');
      } else {
        console.log(`Found ${tasks.length} potential tasks:\n`);
        
        // Group by priority
        const grouped = tasks.reduce((acc, task) => {
          acc[task.priority] = acc[task.priority] || [];
          acc[task.priority].push(task);
          return acc;
        }, {});
        
        ['critical', 'high', 'medium', 'low'].forEach(priority => {
          if (grouped[priority]) {
            console.log(`\n${priority.toUpperCase()} Priority:`);
            grouped[priority].forEach(task => {
              console.log(`- ${task.title}`);
              console.log(`  Category: ${task.category}, Source: ${task.source}`);
            });
          }
        });
        
        // Save to tasks file
        const tasksFile = path.join(__dirname, 'detected-tasks.json');
        fs.writeFileSync(tasksFile, JSON.stringify(tasks, null, 2));
        console.log(`\n💾 Tasks saved to ${tasksFile}`);
      }
      break;
      
    case 'watch':
      console.log('👁️  Watching for changes...');
      // This would set up file watchers in production
      setInterval(async () => {
        const tasks = await monitor.analyzeChanges();
        if (tasks.length > 0) {
          console.log(`\n🚨 ${new Date().toLocaleTimeString()}: Found ${tasks.length} new tasks!`);
        }
      }, 30000); // Check every 30 seconds
      break;
      
    case 'hook':
      // Git hook integration
      const hookTasks = await monitor.analyzeChanges();
      if (hookTasks.length > 0) {
        console.log('\n⚠️  New tasks detected from your changes:');
        hookTasks.forEach(task => {
          console.log(`- [${task.priority}] ${task.title}`);
        });
        console.log('\nRun "npm run monitor:scan" to see details');
      }
      break;
      
    default:
      console.log(`
🤖 Task Monitor - RAG-based Task Detection

Usage:
  npm run monitor:scan     - Scan repository and detect tasks
  npm run monitor:watch    - Watch for changes continuously
  npm run monitor:hook     - Run as git hook

Detects:
  - TODO/FIXME comments
  - Missing tests
  - Security issues
  - Code quality issues
  - Breaking changes
  - Dependency updates
      `);
  }
}

main().catch(console.error);