import { readFileSync, statSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

export const dynamic = 'force-dynamic';

// Files to expose for review
const REVIEW_FILES = [
  { 
    path: '~/clawd/content/twitter-drafts.md', 
    name: 'Twitter Drafts', 
    category: 'Content',
    publicFile: 'twitter-drafts.md'
  },
  { 
    path: '~/clawd/research/irl-trade-2026-01-30.md', 
    name: 'The IRL Trade', 
    category: 'Research',
    publicFile: 'irl-trade-2026-01-30.md'
  },
  { 
    path: '~/clawd/myjunto/PRODUCT_PLAN.md', 
    name: 'Product Plan', 
    category: 'myjunto',
    publicFile: 'PRODUCT_PLAN.md'
  },
  { 
    path: '~/clawd/MEMORY.md', 
    name: 'Memory', 
    category: 'Notes',
    publicFile: 'MEMORY.md'
  },
  { 
    path: '~/clawd/AGENTS.md', 
    name: 'Agents Guide', 
    category: 'Notes',
    publicFile: 'AGENTS.md'
  },
];

function expandPath(p) {
  if (p.startsWith('~/')) {
    return join(homedir(), p.slice(2));
  }
  return p;
}

function tryReadLocal(filePath) {
  try {
    const fullPath = expandPath(filePath);
    const stats = statSync(fullPath);
    const content = readFileSync(fullPath, 'utf-8');
    return { exists: true, content, size: stats.size, modified: stats.mtime.toISOString() };
  } catch (e) {
    return { exists: false };
  }
}

function tryReadPublic(publicFile) {
  try {
    // In Next.js, public files are in process.cwd()/public
    const publicPath = join(process.cwd(), 'public', 'review-files', publicFile);
    const stats = statSync(publicPath);
    const content = readFileSync(publicPath, 'utf-8');
    return { exists: true, content, size: stats.size, modified: stats.mtime.toISOString() };
  } catch (e) {
    return { exists: false };
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const filePath = searchParams.get('file');

  // If file is requested, return its contents
  if (filePath) {
    const fileConfig = REVIEW_FILES.find(f => f.path === filePath);
    if (!fileConfig) {
      return Response.json({ error: 'File not allowed' }, { status: 403 });
    }

    // Try local first (for dev/local running)
    const local = tryReadLocal(filePath);
    if (local.exists) {
      return Response.json({
        path: filePath,
        name: fileConfig.name,
        content: local.content,
        size: local.size,
        source: 'local'
      });
    }

    // Try public folder (for Vercel deployment)
    if (fileConfig.publicFile) {
      const pub = tryReadPublic(fileConfig.publicFile);
      if (pub.exists) {
        return Response.json({
          path: filePath,
          name: fileConfig.name,
          content: pub.content,
          size: pub.size,
          source: 'public'
        });
      }
    }

    return Response.json({ 
      error: 'File not available',
      path: filePath 
    }, { status: 404 });
  }

  // Return list of available files
  const files = REVIEW_FILES.map(f => {
    const local = tryReadLocal(f.path);
    if (local.exists) {
      return { path: f.path, name: f.name, category: f.category, size: local.size, modified: local.modified, exists: true };
    }
    
    if (f.publicFile) {
      const pub = tryReadPublic(f.publicFile);
      if (pub.exists) {
        return { path: f.path, name: f.name, category: f.category, size: pub.size, modified: pub.modified, exists: true };
      }
    }
    
    return { path: f.path, name: f.name, category: f.category, exists: false };
  });

  return Response.json({ files: files.filter(f => f.exists) });
}
