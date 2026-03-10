import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// Max file size to read (1MB)
const MAX_SIZE = 1024 * 1024

// Binary extensions we won't read
const BINARY_EXTS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.svg',
  '.pdf', '.zip', '.tar', '.gz', '.exe', '.dll', '.so',
  '.woff', '.woff2', '.ttf', '.eot', '.mp3', '.mp4', '.wav'
])

export async function GET(request: NextRequest) {
  const workspacePath = process.env.WORKSPACE_PATH || '/home/ubuntu/clawd'
  const homePath = process.env.HOME || '/home/ubuntu'
  let filePath = request.nextUrl.searchParams.get('path')
  
  if (!filePath) {
    return NextResponse.json({ error: 'Missing path parameter' }, { status: 400 })
  }
  
  // Handle ~ home directory and normalize path
  filePath = filePath.replace(/^~\//, `${homePath}/`)
  
  // If path is relative, resolve against workspace
  const fullPath = path.isAbsolute(filePath) 
    ? path.resolve(filePath)
    : path.resolve(workspacePath, filePath)
  
  // Security: only allow /home/ubuntu subtree
  if (!fullPath.startsWith(homePath)) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 403 })
  }
  
  try {
    const stat = fs.statSync(fullPath)
    
    if (stat.isDirectory()) {
      return NextResponse.json({ error: 'Cannot read directory' }, { status: 400 })
    }
    
    if (stat.size > MAX_SIZE) {
      return NextResponse.json({ 
        error: `File too large (${(stat.size / 1024 / 1024).toFixed(1)}MB > 1MB limit)` 
      }, { status: 400 })
    }
    
    const ext = path.extname(fullPath).toLowerCase()
    if (BINARY_EXTS.has(ext)) {
      return NextResponse.json({ error: 'Binary file cannot be displayed' }, { status: 400 })
    }
    
    const content = fs.readFileSync(fullPath, 'utf-8')
    
    return NextResponse.json({ 
      content,
      size: stat.size,
      modified: stat.mtime.toISOString()
    })
  } catch (e: any) {
    if (e.code === 'ENOENT') {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
