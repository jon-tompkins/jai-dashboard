import { NextResponse } from 'next/server'
import { readFileSync, statSync } from 'fs'
import { join } from 'path'

const HOME = process.env.HOME || '/home/ubuntu'

const PATH_BASES: Record<string, string> = {
  '~': HOME,
  'clawd': join(HOME, 'clawd'),
  'clawstreet': join(HOME, 'clawstreet'),
  'myjunto': join(HOME, 'myjunto'),
}

function resolvePath(filePath: string): string | null {
  if (!filePath) return null
  
  if (filePath.startsWith('~/')) {
    return join(HOME, filePath.slice(2))
  }
  if (filePath.startsWith('clawstreet/')) {
    return join(PATH_BASES.clawstreet, filePath.slice(11))
  }
  if (filePath.startsWith('myjunto/')) {
    return join(PATH_BASES.myjunto, filePath.slice(8))
  }
  
  return join(PATH_BASES.clawd, filePath)
}

function readFileContent(filePath: string): string | null {
  const fullPath = resolvePath(filePath)
  if (!fullPath) return null
  
  try {
    const stat = statSync(fullPath)
    if (stat.isDirectory()) return null
    if (stat.size > 100 * 1024) return '[File too large]'
    
    return readFileSync(fullPath, 'utf-8')
  } catch (e: any) {
    return `[Error: ${e.message}]`
  }
}

function embedContents(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(item => embedContents(item))
  }
  
  if (obj && typeof obj === 'object') {
    const result = { ...obj }
    
    if (result.path && !result.isDir) {
      result.content = readFileContent(result.path)
    }
    
    for (const key of Object.keys(result)) {
      if (typeof result[key] === 'object' && result[key] !== null) {
        result[key] = embedContents(result[key])
      }
    }
    
    return result
  }
  
  return obj
}

export async function GET() {
  try {
    const structurePath = join(process.cwd(), 'app/admin/files/structure.json')
    const structure = JSON.parse(readFileSync(structurePath, 'utf-8'))
    const built = embedContents(structure)
    built._built = new Date().toISOString()
    
    return NextResponse.json(built)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
