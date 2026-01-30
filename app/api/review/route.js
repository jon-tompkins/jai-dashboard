import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname, basename } from 'path';
import { homedir } from 'os';

export const dynamic = 'force-dynamic';

// Files to expose for review
const REVIEW_FILES = [
  // Content
  { path: '~/clawd/content/twitter-drafts.md', name: 'Twitter Drafts', category: 'Content' },
  // Research
  { path: '~/clawd/research/irl-trade-2026-01-30.md', name: 'The IRL Trade', category: 'Research' },
  // myjunto
  { path: '~/clawd/myjunto/PRODUCT_PLAN.md', name: 'Product Plan', category: 'myjunto' },
  { path: '~/clawd/myjunto/prompts/professional-v1.md', name: 'Prompt v1', category: 'myjunto' },
  { path: '~/clawd/myjunto/prompts/original-backup.md', name: 'Original Prompt', category: 'myjunto' },
  // Memory/Notes
  { path: '~/clawd/MEMORY.md', name: 'Memory', category: 'Notes' },
  { path: '~/clawd/AGENTS.md', name: 'Agents Guide', category: 'Notes' },
];

function expandPath(p) {
  if (p.startsWith('~/')) {
    return join(homedir(), p.slice(2));
  }
  return p;
}

function getFileInfo(filePath, name, category) {
  try {
    const fullPath = expandPath(filePath);
    const stats = statSync(fullPath);
    return {
      path: filePath,
      name,
      category,
      size: stats.size,
      modified: stats.mtime.toISOString(),
      exists: true
    };
  } catch (e) {
    return {
      path: filePath,
      name,
      category,
      exists: false,
      error: e.message
    };
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const filePath = searchParams.get('file');

  // If file is requested, return its contents
  if (filePath) {
    try {
      // Security: only allow files in our whitelist
      const allowed = REVIEW_FILES.find(f => f.path === filePath);
      if (!allowed) {
        return Response.json({ error: 'File not allowed' }, { status: 403 });
      }

      const fullPath = expandPath(filePath);
      const content = readFileSync(fullPath, 'utf-8');
      
      return Response.json({
        path: filePath,
        name: allowed.name,
        content,
        size: content.length
      });
    } catch (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }
  }

  // Otherwise return list of available files
  const files = REVIEW_FILES.map(f => getFileInfo(f.path, f.name, f.category));
  
  return Response.json({ files: files.filter(f => f.exists) });
}
