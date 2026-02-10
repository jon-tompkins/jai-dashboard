export const dynamic = 'force-dynamic';

const GITHUB_RAW = 'https://raw.githubusercontent.com/jon-tompkins/Agent-Reports/main/reports';

// GET: List research files or get specific file content
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('file');
  const publicOnly = searchParams.get('public') === 'true';
  
  try {
    if (filename) {
      // Return specific file content
      const res = await fetch(`${GITHUB_RAW}/${filename}`, { cache: 'no-store' });
      if (!res.ok) {
        return Response.json({ error: 'File not found' }, { status: 404 });
      }
      const content = await res.text();
      
      return Response.json({
        filename,
        content
      });
    }
    
    // Fetch index from GitHub
    const res = await fetch(`${GITHUB_RAW}/index.json`, { cache: 'no-store' });
    if (!res.ok) {
      throw new Error('Failed to fetch index');
    }
    
    const data = await res.json();
    let reports = data.reports || [];
    
    // Filter to public only if requested
    if (publicOnly) {
      reports = reports.filter(r => r.visibility === 'public');
    }
    
    // Map to expected format
    const research = reports.map(r => ({
      filename: r.file,
      title: r.title,
      symbol: r.ticker,
      date: r.date,
      type: r.type,
      rating: r.rating,
      visibility: r.visibility,
      summary: r.summary,
      tags: r.tags,
      id: r.id
    }));
    
    return Response.json({ 
      research, 
      count: research.length,
      lastUpdated: data.lastUpdated
    });
    
  } catch (error) {
    console.error('Research API error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// PATCH: Update report visibility
export async function PATCH(request) {
  // For now, return instructions - actual update requires GitHub API with token
  const body = await request.json();
  
  return Response.json({
    message: 'Visibility update requires GitHub push',
    instructions: 'Edit index.json in Agent-Reports repo to change visibility',
    requested: body
  }, { status: 501 });
}
