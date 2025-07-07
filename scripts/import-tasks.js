#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Import detected tasks into Task Master
const detectedTasksFile = path.join(__dirname, '..', 'detected-tasks.json');
const tasksFile = path.join(__dirname, '..', 'tasks.json');

if (fs.existsSync(detectedTasksFile)) {
  const detectedTasks = JSON.parse(fs.readFileSync(detectedTasksFile, 'utf8'));
  const existingTasks = fs.existsSync(tasksFile) 
    ? JSON.parse(fs.readFileSync(tasksFile, 'utf8'))
    : [];

  let addedCount = 0;
  
  detectedTasks.forEach(task => {
    // Check if task already exists
    const exists = existingTasks.some(t => 
      t.title === task.title || 
      (t.file === task.file && t.source === task.source)
    );
    
    if (!exists) {
      const newTask = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        title: task.title,
        priority: task.priority,
        category: task.category,
        source: task.source,
        file: task.file,
        completed: false,
        createdAt: new Date().toISOString(),
        autoDetected: true
      };
      
      existingTasks.push(newTask);
      addedCount++;
      
      console.log(`✅ Added: ${task.title}`);
    }
  });
  
  if (addedCount > 0) {
    fs.writeFileSync(tasksFile, JSON.stringify(existingTasks, null, 2));
    console.log(`\n📋 Added ${addedCount} new tasks to Task Master`);
    
    // Clean up detected tasks file
    fs.unlinkSync(detectedTasksFile);
  } else {
    console.log('ℹ️  All detected tasks already exist');
  }
}