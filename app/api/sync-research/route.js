import { createClient } from '@supabase/supabase-js';
import { promises as fs } from 'fs';
import path from 'path';

const SUPABASE_URL = process.env.SUPABASE_URL || "https://lsqlqssigerzghlxfxjl.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Research files location on the server
const RESEARCH_DIR = process.env.RESEARCH_DIR || '/home/ubuntu/clawd/research';

export async function POST(request) {
  if (!SUPABASE_SERVICE_KEY) {
    return Response.json({ error: 'SUPABASE_SERVICE_ROLE_KEY not configured' }, { status: 500 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  
  try {
    // Read all .md files from research directory
    const files = await fs.readdir(RESEARCH_DIR);
    const mdFiles = files.filter(f => f.endsWith('.md'));
    
    const results = { synced: [], errors: [] };
    
    for (const file of mdFiles) {
      try {
        const filePath = path.join(RESEARCH_DIR, file);
        const content = await fs.readFile(filePath, 'utf-8');
        const stat = await fs.stat(filePath);
        
        // Extract title from first # heading
        const titleMatch = content.match(/^#\s+(.+)$/m);
        const title = titleMatch ? titleMatch[1].trim() : file.replace('.md', '');
        
        // Extract tickers (words in caps 2-5 chars, common stock ticker pattern)
        const tickerPattern = /\b([A-Z]{2,5})\b/g;
        const potentialTickers = [...new Set(content.match(tickerPattern) || [])];
        // Filter out common words
        const commonWords = ['THE', 'AND', 'FOR', 'NOT', 'BUT', 'ARE', 'WAS', 'HAS', 'USD', 'TTM', 'YOY', 'CEO', 'CFO', 'IPO', 'ETF', 'NYSE', 'NASDAQ'];
        const referencedAssets = potentialTickers.filter(t => !commonWords.includes(t)).slice(0, 20);
        
        // Determine type from filename or content
        let type = 'research';
        if (file.includes('sector')) type = 'sector';
        else if (file.includes('trade') || file.includes('thesis')) type = 'thesis';
        else if (file.includes('deep-dive')) type = 'deep-dive';
        else if (file.includes('analysis')) type = 'analysis';
        
        // Create unique ID from filename
        const id = file.replace('.md', '').replace(/[^a-z0-9-]/gi, '-');
        
        // Upsert to Supabase
        const { error } = await supabase
          .from('research')
          .upsert({
            id,
            title,
            content,
            type,
            referenced_assets: referencedAssets,
            updated_at: stat.mtime.toISOString(),
            created_at: stat.birthtime.toISOString()
          }, { onConflict: 'id' });
        
        if (error) {
          results.errors.push({ file, error: error.message });
        } else {
          results.synced.push({ file, title, type, assets: referencedAssets.length });
        }
      } catch (fileError) {
        results.errors.push({ file, error: fileError.message });
      }
    }
    
    return Response.json({
      success: true,
      total: mdFiles.length,
      synced: results.synced.length,
      errors: results.errors.length,
      details: results
    });
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  // List available research files
  try {
    const files = await fs.readdir(RESEARCH_DIR);
    const mdFiles = files.filter(f => f.endsWith('.md'));
    
    const fileList = await Promise.all(mdFiles.map(async (file) => {
      const stat = await fs.stat(path.join(RESEARCH_DIR, file));
      return { file, modified: stat.mtime };
    }));
    
    return Response.json({ 
      directory: RESEARCH_DIR,
      files: fileList.sort((a, b) => new Date(b.modified) - new Date(a.modified))
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
