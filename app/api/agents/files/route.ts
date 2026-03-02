import { NextRequest, NextResponse } from 'next/server'
import { readdir, readFile, writeFile, access } from 'fs/promises'
import { join } from 'path'
import { constants } from 'fs'

const AGENTS_DIR = '/home/ubuntu/clawd/agents'
const GITHUB_REPO = 'jon-tompkins/clawd'
const GITHUB_BRANCH = 'main'

// Check if running locally (has filesystem access)
async function agentsDirExists(): Promise<boolean> {
  try {
    await access(AGENTS_DIR, constants.R_OK)
    return true
  } catch {
    return false
  }
}

// Fetch agents from GitHub when running on Vercel
async function fetchAgentsFromGitHub(): Promise<{ name: string, files: string[] }[]> {
  try {
    // List agents directory
    const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/agents?ref=${GITHUB_BRANCH}`, {
      headers: { 'Accept': 'application/vnd.github.v3+json' },
      next: { revalidate: 60 } // Cache for 1 minute
    })
    if (!res.ok) return []
    
    const dirs = await res.json()
    if (!Array.isArray(dirs)) return []
    
    // Get files for each agent
    const agents = await Promise.all(
      dirs.filter((d: any) => d.type === 'dir').map(async (dir: any) => {
        try {
          const filesRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/agents/${dir.name}?ref=${GITHUB_BRANCH}`, {
            headers: { 'Accept': 'application/vnd.github.v3+json' },
            next: { revalidate: 60 }
          })
          if (!filesRes.ok) return { name: dir.name, files: [] }
          
          const files = await filesRes.json()
          const mdFiles = Array.isArray(files) 
            ? files.filter((f: any) => f.type === 'file' && f.name.endsWith('.md')).map((f: any) => f.name)
            : []
          return { name: dir.name, files: mdFiles }
        } catch {
          return { name: dir.name, files: [] }
        }
      })
    )
    return agents
  } catch {
    return []
  }
}

// Fetch single file from GitHub
async function fetchFileFromGitHub(agent: string, file: string): Promise<string | null> {
  try {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/agents/${agent}/${file}?ref=${GITHUB_BRANCH}`, {
      headers: { 'Accept': 'application/vnd.github.v3+json' },
      next: { revalidate: 60 }
    })
    if (!res.ok) return null
    
    const data = await res.json()
    if (data.content && data.encoding === 'base64') {
      return Buffer.from(data.content, 'base64').toString('utf-8')
    }
    return null
  } catch {
    return null
  }
}

// Save file content (only works locally)
export async function POST(request: NextRequest) {
  if (!(await agentsDirExists())) {
    return NextResponse.json({ error: 'File editing only available locally' }, { status: 403 })
  }
  
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
  const isLocal = await agentsDirExists()

  try {
    // If requesting specific file content
    if (agentName && fileName) {
      if (isLocal) {
        const filePath = join(AGENTS_DIR, agentName, fileName)
        const content = await readFile(filePath, 'utf-8')
        return NextResponse.json({ agent: agentName, file: fileName, content, source: 'local' })
      } else {
        const content = await fetchFileFromGitHub(agentName, fileName)
        if (content === null) {
          return NextResponse.json({ error: 'File not found' }, { status: 404 })
        }
        return NextResponse.json({ agent: agentName, file: fileName, content, source: 'github', readOnly: true })
      }
    }

    // If requesting specific agent's files
    if (agentName) {
      if (isLocal) {
        const agentDir = join(AGENTS_DIR, agentName)
        const files = await readdir(agentDir, { withFileTypes: true })
        const mdFiles = files.filter(f => f.isFile() && f.name.endsWith('.md')).map(f => f.name)
        return NextResponse.json({ agent: agentName, files: mdFiles, source: 'local' })
      } else {
        const agents = await fetchAgentsFromGitHub()
        const agent = agents.find(a => a.name === agentName)
        return NextResponse.json({ agent: agentName, files: agent?.files || [], source: 'github' })
      }
    }

    // List all agents with their files
    if (isLocal) {
      const entries = await readdir(AGENTS_DIR, { withFileTypes: true })
      const agents = await Promise.all(
        entries.filter(e => e.isDirectory()).map(async (dir) => {
          const agentDir = join(AGENTS_DIR, dir.name)
          try {
            const files = await readdir(agentDir, { withFileTypes: true })
            const mdFiles = files.filter(f => f.isFile() && f.name.endsWith('.md')).map(f => f.name)
            return { name: dir.name, files: mdFiles }
          } catch {
            return { name: dir.name, files: [] }
          }
        })
      )
      return NextResponse.json({ agents, source: 'local' })
    } else {
      const agents = await fetchAgentsFromGitHub()
      return NextResponse.json({ agents, source: 'github', readOnly: true })
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to read agent files' }, { status: 500 })
  }
}
