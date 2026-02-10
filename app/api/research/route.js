import { readdir, readFile, stat } from 'fs/promises';
import { join } from 'path';

export const dynamic = 'force-dynamic';

const RESEARCH_DIR = process.env.RESEARCH_DIR || '/home/ubuntu/clawd/research';

// GET: List research files or get specific file content
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('file');
  
  try {
    if (filename) {
      // Return specific file content
      const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '');
      const filepath = join(RESEARCH_DIR, safeName);
      const content = await readFile(filepath, 'utf-8');
      const stats = await stat(filepath);
      
      return Response.json({
        filename: safeName,
        content,
        modified: stats.mtime,
        size: stats.size
      });
    }
    
    // List all research files
    const files = await readdir(RESEARCH_DIR);
    const mdFiles = files.filter(f => f.endsWith('.md'));
    
    const research = await Promise.all(mdFiles.map(async (f) => {
      const filepath = join(RESEARCH_DIR, f);
      const stats = await stat(filepath);
      const content = await readFile(filepath, 'utf-8');
      
      // Extract title from first # heading or filename
      const titleMatch = content.match(/^#\s+(.+)$/m);
      const title = titleMatch ? titleMatch[1] : f.replace('.md', '');
      
      // Extract date from filename or file modified time
      const dateMatch = f.match(/(\d{4}-\d{2}-\d{2})/);
      const date = dateMatch ? dateMatch[1] : stats.mtime.toISOString().split('T')[0];
      
      // Extract symbol/ticker if present
      const symbolMatch = f.match(/^([A-Z]{1,5})-/i);
      const symbol = symbolMatch ? symbolMatch[1].toUpperCase() : null;
      
      // Get preview (first ~200 chars after title)
      const previewStart = content.indexOf('\n\n');
      const preview = content.slice(previewStart, previewStart + 200).trim().replace(/[#*_]/g, '') + '...';
      
      return {
        filename: f,
        title,
        symbol,
        date,
        modified: stats.mtime,
        size: stats.size,
        preview
      };
    }));
    
    // Sort by date descending
    research.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    return Response.json({ research, count: research.length });
    
  } catch (error) {
    console.error('Research API error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
