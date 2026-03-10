import { NextRequest, NextResponse } from 'next/server'

// GitHub repos for different paths
const GITHUB_REPOS: Record<string, string> = {
  '': 'jon-tompkins/clawd',  // default - main workspace
  'clawd': 'jon-tompkins/clawd',  // main workspace
  'clawstreet': 'jon-tompkins/clawstreet',
  'myjunto': 'jon-tompkins/junto',
  'jai-dashboard': 'jon-tompkins/jai-dashboard',
}

// Binary extensions we won't read
const BINARY_EXTS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.svg',
  '.pdf', '.zip', '.tar', '.gz', '.exe', '.dll', '.so',
  '.woff', '.woff2', '.ttf', '.eot', '.mp3', '.mp4', '.wav'
])

export async function GET(request: NextRequest) {
  let filePath = request.nextUrl.searchParams.get('path')
  
  if (!filePath) {
    return NextResponse.json({ error: 'Missing path parameter' }, { status: 400 })
  }
  
  // Normalize path - remove ~/ and leading slashes
  filePath = filePath.replace(/^~\//, '').replace(/^\//, '')
  
  // Determine which repo to fetch from
  let repo = GITHUB_REPOS['clawd']  // default
  let repoPath = filePath
  
  // Check if path starts with a known project
  if (filePath.startsWith('clawstreet/')) {
    repo = GITHUB_REPOS['clawstreet']
    repoPath = filePath.replace('clawstreet/', '')
  } else if (filePath.startsWith('myjunto/')) {
    repo = GITHUB_REPOS['myjunto']
    repoPath = filePath.replace('myjunto/', '')
  } else if (filePath.startsWith('jai-dashboard/')) {
    repo = GITHUB_REPOS['jai-dashboard']
    repoPath = filePath.replace('jai-dashboard/', '')
  }
  
  // Check for binary extensions
  const ext = filePath.includes('.') ? '.' + filePath.split('.').pop()?.toLowerCase() : ''
  if (BINARY_EXTS.has(ext)) {
    return NextResponse.json({ error: 'Binary file cannot be displayed' }, { status: 400 })
  }
  
  // Fetch from GitHub raw
  const rawUrl = `https://raw.githubusercontent.com/${repo}/main/${repoPath}`
  const masterUrl = `https://raw.githubusercontent.com/${repo}/master/${repoPath}`
  
  try {
    // Try main branch first, then master
    let response = await fetch(rawUrl)
    if (!response.ok) {
      response = await fetch(masterUrl)
    }
    
    if (!response.ok) {
      return NextResponse.json({ 
        error: `File not found in GitHub (${repo}/${repoPath})`,
        tried: [rawUrl, masterUrl]
      }, { status: 404 })
    }
    
    const content = await response.text()
    
    return NextResponse.json({ 
      content,
      size: content.length,
      source: 'github',
      repo,
      path: repoPath
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
