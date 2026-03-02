import { NextRequest, NextResponse } from 'next/server'
import { readdir, readFile, writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

const AGENTS_DIR = '/home/ubuntu/clawd/agents'

// Save file content
export async function POST(request: NextRequest) {
  try {
    const { agent, file, content } = await request.json()
    if (!agent || !file || content === undefined) {
      return NextResponse.json({ error: 'Missing agent, file, or content' }, { status: 400 })
    }
    
    const filePath = join(AGENTS_DIR, agent, file)
    await writeFile(filePath, content, 'utf-8')
    return NextResponse.json({ ok: true, agent, file })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const agentName = searchParams.get('agent')
  const fileName = searchParams.get('file')

  try {
    // If requesting specific file content
    if (agentName && fileName) {
      const filePath = join(AGENTS_DIR, agentName, fileName)
      const content = await readFile(filePath, 'utf-8')
      return NextResponse.json({ agent: agentName, file: fileName, content })
    }

    // If requesting specific agent's files
    if (agentName) {
      const agentDir = join(AGENTS_DIR, agentName)
      const files = await readdir(agentDir, { withFileTypes: true })
      const mdFiles = files
        .filter(f => f.isFile() && f.name.endsWith('.md'))
        .map(f => f.name)
      return NextResponse.json({ agent: agentName, files: mdFiles })
    }

    // List all agents with their files
    const entries = await readdir(AGENTS_DIR, { withFileTypes: true })
    const agents = await Promise.all(
      entries
        .filter(e => e.isDirectory())
        .map(async (dir) => {
          const agentDir = join(AGENTS_DIR, dir.name)
          try {
            const files = await readdir(agentDir, { withFileTypes: true })
            const mdFiles = files
              .filter(f => f.isFile() && f.name.endsWith('.md'))
              .map(f => f.name)
            return { name: dir.name, files: mdFiles }
          } catch {
            return { name: dir.name, files: [] }
          }
        })
    )

    return NextResponse.json({ agents })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to read agent files' },
      { status: 500 }
    )
  }
}
