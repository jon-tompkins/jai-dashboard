#!/usr/bin/env node

import { readdirSync, readFileSync, writeFileSync, statSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const REVIEWS_DIR = join(homedir(), 'clawd', 'reviews');
const PUBLIC_DIR = join(process.cwd(), 'public', 'reviews-data');

function ensureDir(dir) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function bundleReviews() {
  console.log('🔍 Scanning reviews directory...');
  
  if (!existsSync(REVIEWS_DIR)) {
    console.log('❌ Reviews directory not found:', REVIEWS_DIR);
    return;
  }

  ensureDir(PUBLIC_DIR);
  
  const reviews = [];
  const entries = readdirSync(REVIEWS_DIR, { withFileTypes: true });
  
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const taskDir = join(REVIEWS_DIR, entry.name);
      const reviewFile = join(taskDir, 'REVIEW.md');
      
      if (existsSync(reviewFile)) {
        try {
          console.log(`📄 Processing: ${entry.name}`);
          
          const content = readFileSync(reviewFile, 'utf-8');
          const stats = statSync(reviewFile);
          const taskName = entry.name
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
          
          // Get deliverable files
          const deliverableFiles = [];
          try {
            const dirEntries = readdirSync(taskDir, { withFileTypes: true });
            for (const dirEntry of dirEntries) {
              if (dirEntry.name !== 'REVIEW.md' && !dirEntry.name.includes('node_modules')) {
                deliverableFiles.push({
                  name: dirEntry.name,
                  type: dirEntry.isDirectory() ? 'folder' : 'file'
                });
              }
            }
          } catch (e) {
            console.error('Error reading deliverable files:', e);
          }
          
          const review = {
            taskName,
            taskId: taskName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            content,
            deliverableFiles,
            lastModified: stats.mtime.toISOString()
          };
          
          reviews.push(review);
          
          // Write individual review file
          writeFileSync(
            join(PUBLIC_DIR, `${entry.name}.json`), 
            JSON.stringify(review, null, 2)
          );
          
        } catch (e) {
          console.error(`❌ Error processing ${reviewFile}:`, e);
        }
      }
    }
  }
  
  // Write combined reviews file
  const reviewsData = {
    reviews,
    lastBundled: new Date().toISOString(),
    total: reviews.length
  };
  
  writeFileSync(
    join(PUBLIC_DIR, 'reviews.json'), 
    JSON.stringify(reviewsData, null, 2)
  );
  
  console.log(`✅ Bundled ${reviews.length} reviews to ${PUBLIC_DIR}`);
  console.log('📦 Files created:');
  console.log(`   - reviews.json (${reviews.length} reviews)`);
  reviews.forEach(r => console.log(`   - ${r.taskId}.json`));
}

bundleReviews();