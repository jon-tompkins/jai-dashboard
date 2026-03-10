#!/usr/bin/env node
/**
 * Build structure.json with embedded file contents.
 * Run this before deploying to embed live file contents.
 * 
 * Usage: node scripts/build-structure.js
 */

const fs = require('fs');
const path = require('path');

const HOME = process.env.HOME || '/home/ubuntu';
const STRUCTURE_PATH = path.join(__dirname, '../app/admin/files/structure.json');
const OUTPUT_PATH = path.join(__dirname, '../app/admin/files/structure-built.json');

// Path mappings
const PATH_BASES = {
  '~': HOME,
  'clawd': path.join(HOME, 'clawd'),
  'clawstreet': path.join(HOME, 'clawstreet'),
  'myjunto': path.join(HOME, 'myjunto'),
};

function resolvePath(filePath) {
  if (!filePath) return null;
  
  // Handle ~ home directory
  if (filePath.startsWith('~/')) {
    return path.join(HOME, filePath.slice(2));
  }
  
  // Handle known project prefixes
  if (filePath.startsWith('clawstreet/')) {
    return path.join(PATH_BASES.clawstreet, filePath.slice(11));
  }
  if (filePath.startsWith('myjunto/')) {
    return path.join(PATH_BASES.myjunto, filePath.slice(8));
  }
  
  // Default to clawd
  return path.join(PATH_BASES.clawd, filePath);
}

function readFileContent(filePath) {
  const fullPath = resolvePath(filePath);
  if (!fullPath) return null;
  
  try {
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) return null;
    if (stat.size > 100 * 1024) return '[File too large]'; // 100KB limit
    
    return fs.readFileSync(fullPath, 'utf-8');
  } catch (e) {
    return `[Error: ${e.message}]`;
  }
}

function embedContents(obj) {
  if (Array.isArray(obj)) {
    return obj.map(item => embedContents(item));
  }
  
  if (obj && typeof obj === 'object') {
    const result = { ...obj };
    
    // If this object has a 'path' and it's a file reference, embed content
    if (result.path && !result.isDir) {
      result.content = readFileContent(result.path);
    }
    
    // Recursively process nested objects
    for (const key of Object.keys(result)) {
      if (typeof result[key] === 'object' && result[key] !== null) {
        result[key] = embedContents(result[key]);
      }
    }
    
    return result;
  }
  
  return obj;
}

// Main
console.log('📦 Building structure with embedded contents...');

const structure = JSON.parse(fs.readFileSync(STRUCTURE_PATH, 'utf-8'));
const built = embedContents(structure);
built._built = new Date().toISOString();

fs.writeFileSync(OUTPUT_PATH, JSON.stringify(built, null, 2));
console.log(`✅ Written to ${OUTPUT_PATH}`);
console.log(`   Size: ${(fs.statSync(OUTPUT_PATH).size / 1024).toFixed(1)}KB`);
