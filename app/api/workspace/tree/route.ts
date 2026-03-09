import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// Directories to skip
const SKIP_DIRS = new Set([
  'node_modules', '.git', '.next', '.vercel', '__pycache__', 
  '.venv', 'venv', '.cache', 'dist', 'build', '.turbo'
])

// Max depth to prevent runaway recursion
const MAX_DEPTH = 4

interface TreeNode {
  name: string
  path: string
  type: 'file' | 'directory'
  size?: number
  children?: TreeNode[]
}

function buildTree(dirPath: string, basePath: string, depth: number = 0): TreeNode | null {
  if (depth > MAX_DEPTH) return null
  
  const name = path.basename(dirPath)
  const relativePath = path.relative(basePath, dirPath) || '.'
  
  try {
    const stat = fs.statSync(dirPath)
    
    if (stat.isFile()) {
      return {
        name,
        path: relativePath,
        type: 'file',
        size: stat.size
      }
    }
    
    if (stat.isDirectory()) {
      if (SKIP_DIRS.has(name)) return null
      
      const children: TreeNode[] = []
      const entries = fs.readdirSync(dirPath)
      
      // Sort: directories first, then files, both alphabetically
      const sorted = entries.sort((a, b) => {
        const aPath = path.join(dirPath, a)
        const bPath = path.join(dirPath, b)
        const aIsDir = fs.statSync(aPath).isDirectory()
        const bIsDir = fs.statSync(bPath).isDirectory()
        if (aIsDir && !bIsDir) return -1
        if (!aIsDir && bIsDir) return 1
        return a.localeCompare(b)
      })
      
      for (const entry of sorted) {
        const childPath = path.join(dirPath, entry)
        const child = buildTree(childPath, basePath, depth + 1)
        if (child) children.push(child)
      }
      
      return {
        name,
        path: relativePath,
        type: 'directory',
        children
      }
    }
  } catch (e) {
    // Skip files we can't read
  }
  
  return null
}

export async function GET() {
  const workspacePath = process.env.WORKSPACE_PATH || '/home/ubuntu/clawd'
  
  try {
    const tree = buildTree(workspacePath, workspacePath)
    return NextResponse.json({ tree })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
