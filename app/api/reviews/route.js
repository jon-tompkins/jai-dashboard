import { readdirSync, readFileSync, statSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

export const dynamic = 'force-dynamic';

const REVIEWS_DIR = join(homedir(), 'clawd', 'reviews');

function parseReviewMd(content, taskName, filePath) {
  // Extract key information from REVIEW.md content
  const lines = content.split('\n');
  
  // Extract status from the first few lines
  let status = 'Unknown';
  let whatBuilt = '';
  let keyFeatures = [];
  let testingInstructions = '';
  let requiredSetup = '';
  let readyFor = [];
  
  let currentSection = '';
  let sectionContent = [];
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Detect status patterns
    if (trimmedLine.includes('Status:') || trimmedLine.includes('STATUS:')) {
      if (trimmedLine.includes('COMPLETE') || trimmedLine.includes('READY TO TEST')) {
        status = 'ready-to-test';
      } else if (trimmedLine.includes('DEPLOYED')) {
        status = 'deployed';
      } else if (trimmedLine.includes('NEEDS')) {
        status = 'needs-action';
      } else if (trimmedLine.includes('SETUP')) {
        status = 'needs-setup';
      }
    }
    
    // Section headers
    if (trimmedLine.startsWith('## ') || trimmedLine.startsWith('### ')) {
      // Save previous section
      if (currentSection && sectionContent.length > 0) {
        const text = sectionContent.join('\n').trim();
        switch (currentSection.toLowerCase()) {
          case 'what was built':
          case 'what built':
            whatBuilt = text;
            break;
          case 'key features':
          case 'features':
            keyFeatures = sectionContent
              .filter(l => l.trim().startsWith('-') || l.trim().startsWith('•'))
              .map(l => l.replace(/^[-•]\s*/, '').replace(/^[🔗📊📈🔄🔐⏰🌍📅🚫📊🔄]\s*/, '').trim())
              .filter(Boolean);
            break;
          case 'testing instructions':
          case 'testing':
            testingInstructions = text;
            break;
          case 'required setup':
          case 'setup':
            requiredSetup = text;
            break;
          case 'ready for':
            readyFor = sectionContent
              .filter(l => l.trim().startsWith('-') || l.trim().startsWith('•') || l.trim().includes('[ ]') || l.trim().includes('[x]'))
              .map(l => {
                const clean = l.replace(/^[-•]\s*/, '').replace(/^\[[ x]\]\s*/, '').trim();
                const completed = l.includes('[x]') || l.includes('✅') || l.includes('DONE');
                return { text: clean, completed };
              })
              .filter(item => item.text);
            break;
        }
      }
      
      // Start new section
      currentSection = trimmedLine.replace(/^#+\s*/, '').replace(/^\*\*(.+)\*\*$/, '$1');
      sectionContent = [];
    } else if (currentSection && trimmedLine) {
      sectionContent.push(line);
    }
  }
  
  // Process final section
  if (currentSection && sectionContent.length > 0) {
    const text = sectionContent.join('\n').trim();
    switch (currentSection.toLowerCase()) {
      case 'what was built':
      case 'what built':
        whatBuilt = text;
        break;
      case 'key features':
      case 'features':
        keyFeatures = sectionContent
          .filter(l => l.trim().startsWith('-') || l.trim().startsWith('•'))
          .map(l => l.replace(/^[-•]\s*/, '').replace(/^[🔗📊📈🔄🔐⏰🌍📅🚫📊🔄]\s*/, '').trim())
          .filter(Boolean);
        break;
      case 'testing instructions':
      case 'testing':
        testingInstructions = text;
        break;
      case 'required setup':
      case 'setup':
        requiredSetup = text;
        break;
      case 'ready for':
        readyFor = sectionContent
          .filter(l => l.trim().startsWith('-') || l.trim().startsWith('•') || l.trim().includes('[ ]') || l.trim().includes('[x]'))
          .map(l => {
            const clean = l.replace(/^[-•]\s*/, '').replace(/^\[[ x]\]\s*/, '').trim();
            const completed = l.includes('[x]') || l.includes('✅') || l.includes('DONE');
            return { text: clean, completed };
          })
          .filter(item => item.text);
        break;
    }
  }
  
  // Determine overall status if not found explicitly
  if (status === 'Unknown') {
    const hasCompletedItems = readyFor.some(item => item.completed);
    const allCompleted = readyFor.length > 0 && readyFor.every(item => item.completed);
    
    if (allCompleted) {
      status = 'complete';
    } else if (requiredSetup || readyFor.some(item => item.text.toLowerCase().includes('setup'))) {
      status = 'needs-setup';
    } else if (readyFor.some(item => !item.completed)) {
      status = 'needs-action';
    } else {
      status = 'ready-to-test';
    }
  }
  
  return {
    taskName,
    taskId: taskName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    status,
    whatBuilt: whatBuilt || `${taskName} deliverable`,
    keyFeatures,
    testingInstructions,
    requiredSetup,
    readyFor,
    fullContent: content,
    filePath,
    lastModified: null // Will be set by caller
  };
}

function scanReviewsFolder() {
  if (!existsSync(REVIEWS_DIR)) {
    return [];
  }
  
  const reviews = [];
  
  try {
    const entries = readdirSync(REVIEWS_DIR, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const taskDir = join(REVIEWS_DIR, entry.name);
        const reviewFile = join(taskDir, 'REVIEW.md');
        
        if (existsSync(reviewFile)) {
          try {
            const content = readFileSync(reviewFile, 'utf-8');
            const stats = statSync(reviewFile);
            const taskName = entry.name
              .split('-')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
            
            const parsedReview = parseReviewMd(content, taskName, reviewFile);
            parsedReview.lastModified = stats.mtime.toISOString();
            
            // Get list of deliverable files in the directory
            const deliverableFiles = [];
            try {
              const dirEntries = readdirSync(taskDir, { withFileTypes: true });
              for (const dirEntry of dirEntries) {
                if (dirEntry.name !== 'REVIEW.md') {
                  deliverableFiles.push({
                    name: dirEntry.name,
                    type: dirEntry.isDirectory() ? 'folder' : 'file',
                    path: join(taskDir, dirEntry.name)
                  });
                }
              }
            } catch (e) {
              console.error('Error reading deliverable files:', e);
            }
            
            parsedReview.deliverableFiles = deliverableFiles;
            reviews.push(parsedReview);
            
          } catch (e) {
            console.error(`Error parsing ${reviewFile}:`, e);
          }
        }
      }
    }
  } catch (e) {
    console.error('Error scanning reviews directory:', e);
  }
  
  return reviews.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
}

export async function GET(request) {
  try {
    const reviews = scanReviewsFolder();
    
    // Generate summary statistics
    const summary = {
      total: reviews.length,
      'ready-to-test': reviews.filter(r => r.status === 'ready-to-test').length,
      'needs-setup': reviews.filter(r => r.status === 'needs-setup').length,
      'needs-action': reviews.filter(r => r.status === 'needs-action').length,
      'complete': reviews.filter(r => r.status === 'complete').length,
      'deployed': reviews.filter(r => r.status === 'deployed').length,
    };
    
    return Response.json({
      reviews,
      summary,
      lastScanned: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error in /api/reviews:', error);
    return Response.json(
      { error: 'Failed to load reviews' }, 
      { status: 500 }
    );
  }
}