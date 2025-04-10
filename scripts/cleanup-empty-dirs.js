#!/usr/bin/env node
/**
 * Script to remove empty directories under apps/web/app
 * Excludes the (authed) directory since that's where content was moved to
 * 
 * Usage: node scripts/cleanup-empty-dirs.js
 */

const fs = require('fs');
const path = require('path');

// Function to check if a directory is empty
function isDirectoryEmpty(dirPath) {
  try {
    const files = fs.readdirSync(dirPath);
    return files.length === 0;
  } catch (err) {
    // Directory doesn't exist or can't be read
    return false;
  }
}

// Function to recursively find and remove empty directories
function cleanupEmptyDirs(dirPath, isRoot = false) {
  // Skip if directory doesn't exist
  if (!fs.existsSync(dirPath)) return false;
  
  // Get directory entries
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  
  // Track if any subdirectories were removed
  let anyRemoved = false;
  
  // Process all subdirectories first (depth-first)
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const fullPath = path.join(dirPath, entry.name);
      
      // Skip the (authed) directory
      if (entry.name === '(authed)') continue;
      
      // Recursively process subdirectory
      const wasRemoved = cleanupEmptyDirs(fullPath);
      anyRemoved = anyRemoved || wasRemoved;
    }
  }
  
  // After processing subdirectories, check if this directory is now empty
  if (!isRoot && isDirectoryEmpty(dirPath)) {
    console.log(`Removing empty directory: ${path.relative(process.cwd(), dirPath)}`);
    try {
      fs.rmdirSync(dirPath);
      return true; // Directory was removed
    } catch (err) {
      console.error(`Error removing directory ${dirPath}:`, err);
      return false;
    }
  }
  
  return anyRemoved;
}

// Main function
function main() {
  const appDir = path.join(process.cwd(), 'apps', 'web', 'app');
  
  console.log('Cleaning up empty directories under apps/web/app...');
  console.log('(excluding the (authed) directory)');
  
  const anyRemoved = cleanupEmptyDirs(appDir, true);
  
  if (anyRemoved) {
    console.log('Empty directories have been removed.');
  } else {
    console.log('No empty directories found to remove.');
  }
}

main();
