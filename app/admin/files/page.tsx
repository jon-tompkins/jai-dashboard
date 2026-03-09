'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

const styles = {
  container: { background: '#0a0a0a', minHeight: '100vh', color: '#e5e5e5', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif' },
  card: { background: '#0d0d0d', border: '1px solid #262626', borderRadius: '8px', padding: '16px' },
  cardTitle: { fontSize: '12px', color: '#737373', textTransform: 'uppercase' as const, letterSpacing: '0.5px', marginBottom: '16px', fontWeight: 500 },
  btn: { padding: '8px 14px', background: '#171717', border: '1px solid #262626', borderRadius: '4px', color: '#e5e5e5', cursor: 'pointer', fontSize: '13px' },
  btnActive: { padding: '8px 14px', background: '#171717', border: '1px solid #404040', borderRadius: '4px', color: '#fff', cursor: 'pointer', fontSize: '13px' },
}

// Icons for different file types
const FILE_ICONS: Record<string, string> = {
  '.md': '📝',
  '.json': '📋',
  '.js': '⚡',
  '.ts': '💎',
  '.tsx': '💎',
  '.py': '🐍',
  '.sql': '🗃️',
  '.csv': '📊',
  '.html': '🌐',
  '.css': '🎨',
  '.sh': '⚙️',
  '.log': '📜',
  '.env': '🔐',
  'default': '📄',
}

// Folder icons for special directories
const FOLDER_ICONS: Record<string, string> = {
  '.learnings': '🎓',
  'memory': '🧠',
  'agents': '🤖',
  'Agent-Reports': '📊',
  'reviews': '📁',
  'research': '🔬',
  'portfolio': '💼',
  'tools': '🛠️',
  'docs': '📚',
  'scripts': '⚙️',
  'myjunto': '📱',
  'junto-app': '📱',
  'jai-dashboard': '📱',
  'default': '📂',
}

function getFileIcon(name: string): string {
  if (name.startsWith('.env')) return FILE_ICONS['.env']
  const ext = name.includes('.') ? '.' + name.split('.').pop() : ''
  return FILE_ICONS[ext] || FILE_ICONS['default']
}

function getFolderIcon(name: string): string {
  return FOLDER_ICONS[name] || FOLDER_ICONS['default']
}

// File viewer modal
function FileViewer({ path, onClose }: { path: string, onClose: () => void }) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/workspace/file?path=${encodeURIComponent(path)}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error)
        else setContent(d.content || '')
        setLoading(false)
      })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [path])

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onClick={onClose}>
      <div style={{ ...styles.card, maxWidth: '1000px', width: '100%', height: '85vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #262626', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px' }}>{getFileIcon(path.split('/').pop() || '')}</span>
            <span style={{ fontWeight: 600, fontSize: '14px', fontFamily: 'monospace' }}>{path}</span>
          </div>
          <button onClick={onClose} style={{ ...styles.btn, padding: '8px 12px' }}>✕</button>
        </div>
        {loading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#737373' }}>Loading...</div>
        ) : error ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>{error}</div>
        ) : (
          <pre style={{
            flex: 1, width: '100%', background: '#0a0a0a', border: '1px solid #262626', borderRadius: '4px',
            padding: '16px', color: '#e5e5e5', fontSize: '12px', margin: 0,
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
            lineHeight: 1.6, overflow: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word'
          }}>
            {content}
          </pre>
        )}
      </div>
    </div>
  )
}

// Tree node component
function TreeNode({ item, depth, onFileClick }: { item: any, depth: number, onFileClick: (path: string) => void }) {
  const [expanded, setExpanded] = useState(depth < 1) // Auto-expand first level
  const isDir = item.type === 'directory'
  const indent = depth * 20

  return (
    <div>
      <div 
        style={{ 
          display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 8px', marginLeft: indent,
          cursor: 'pointer', borderRadius: '4px', fontSize: '13px',
          background: 'transparent', transition: 'background 0.1s'
        }}
        onMouseEnter={e => (e.currentTarget.style.background = '#171717')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        onClick={() => isDir ? setExpanded(!expanded) : onFileClick(item.path)}
      >
        {isDir && (
          <span style={{ color: '#525252', fontSize: '10px', width: '12px' }}>
            {expanded ? '▼' : '▶'}
          </span>
        )}
        {!isDir && <span style={{ width: '12px' }} />}
        <span>{isDir ? getFolderIcon(item.name) : getFileIcon(item.name)}</span>
        <span style={{ color: isDir ? '#e5e5e5' : '#a3a3a3' }}>{item.name}</span>
        {isDir && item.children && (
          <span style={{ color: '#525252', fontSize: '11px', marginLeft: '4px' }}>
            ({item.children.length})
          </span>
        )}
        {!isDir && item.size && (
          <span style={{ color: '#404040', fontSize: '11px', marginLeft: 'auto' }}>
            {item.size < 1024 ? `${item.size}B` : item.size < 1024*1024 ? `${(item.size/1024).toFixed(1)}K` : `${(item.size/1024/1024).toFixed(1)}M`}
          </span>
        )}
      </div>
      {isDir && expanded && item.children && (
        <div>
          {item.children.map((child: any, i: number) => (
            <TreeNode key={child.path || i} item={child} depth={depth + 1} onFileClick={onFileClick} />
          ))}
        </div>
      )}
    </div>
  )
}

// Quick links section
function QuickLinks({ onFileClick }: { onFileClick: (path: string) => void }) {
  const links = [
    { label: 'AGENTS.md', path: 'AGENTS.md', icon: '📋' },
    { label: 'SOUL.md', path: 'SOUL.md', icon: '💜' },
    { label: 'USER.md', path: 'USER.md', icon: '👤' },
    { label: 'TOOLS.md', path: 'TOOLS.md', icon: '🛠️' },
    { label: 'HEARTBEAT.md', path: 'HEARTBEAT.md', icon: '💓' },
    { label: 'MEMORY.md', path: 'MEMORY.md', icon: '🧠' },
    { label: 'SESSION-STATE.md', path: 'SESSION-STATE.md', icon: '🔥' },
    { label: 'STABILITY.md', path: '.learnings/STABILITY.md', icon: '⚠️' },
  ]

  return (
    <div style={styles.card}>
      <div style={styles.cardTitle}>Quick Links</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {links.map(link => (
          <button
            key={link.path}
            onClick={() => onFileClick(link.path)}
            style={{ ...styles.btn, display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <span>{link.icon}</span>
            <span>{link.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// Stats card
function StatsCard({ tree }: { tree: any }) {
  const countItems = (node: any): { files: number, dirs: number } => {
    if (!node) return { files: 0, dirs: 0 }
    if (node.type !== 'directory') return { files: 1, dirs: 0 }
    let files = 0, dirs = 1
    if (node.children) {
      node.children.forEach((child: any) => {
        const counts = countItems(child)
        files += counts.files
        dirs += counts.dirs
      })
    }
    return { files, dirs }
  }

  const counts = countItems(tree)

  return (
    <div style={styles.card}>
      <div style={styles.cardTitle}>Workspace Stats</div>
      <div style={{ display: 'flex', gap: '24px' }}>
        <div>
          <div style={{ fontSize: '24px', fontWeight: 600 }}>{counts.dirs}</div>
          <div style={{ fontSize: '12px', color: '#737373' }}>directories</div>
        </div>
        <div>
          <div style={{ fontSize: '24px', fontWeight: 600 }}>{counts.files}</div>
          <div style={{ fontSize: '12px', color: '#737373' }}>files</div>
        </div>
      </div>
    </div>
  )
}

export default function FilesPage() {
  const [tree, setTree] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [viewingFile, setViewingFile] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const loadTree = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/workspace/tree')
      const data = await res.json()
      if (data.error) setError(data.error)
      else setTree(data.tree)
    } catch (e: any) {
      setError(e.message)
    }
    setLoading(false)
  }

  useEffect(() => { loadTree() }, [])

  // Filter tree based on search
  const filterTree = (node: any, query: string): any => {
    if (!node || !query) return node
    const q = query.toLowerCase()
    
    if (node.type !== 'directory') {
      return node.name.toLowerCase().includes(q) ? node : null
    }
    
    if (!node.children) return null
    
    const filteredChildren = node.children
      .map((child: any) => filterTree(child, query))
      .filter(Boolean)
    
    if (filteredChildren.length > 0 || node.name.toLowerCase().includes(q)) {
      return { ...node, children: filteredChildren }
    }
    return null
  }

  const displayTree = search ? filterTree(tree, search) : tree

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid #262626', padding: '16px 24px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Link href="/" style={{ color: '#525252', textDecoration: 'none', fontSize: '13px' }}>← Dashboard</Link>
              <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>📁 Workspace Files</h1>
              <span style={{ fontSize: '11px', color: '#525252', background: '#171717', padding: '4px 8px', borderRadius: '4px', fontFamily: 'monospace' }}>
                ~/clawd
              </span>
            </div>
            <button onClick={loadTree} disabled={loading} style={{ ...styles.btn, background: loading ? '#171717' : '#166534' }}>
              {loading ? '...' : '↻ Refresh'}
            </button>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link href="/admin" style={{ ...styles.btn, textDecoration: 'none', color: '#737373' }}>
              🤖 Agents
            </Link>
            <Link href="/admin/kanban" style={{ ...styles.btn, textDecoration: 'none', color: '#737373' }}>
              📋 Kanban
            </Link>
            <Link href="/admin/crons" style={{ ...styles.btn, textDecoration: 'none', color: '#737373' }}>
              ⏰ Crons
            </Link>
            <div style={styles.btnActive}>
              📁 Files
            </div>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
        {/* Quick links and stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '16px', marginBottom: '24px' }}>
          <QuickLinks onFileClick={setViewingFile} />
          {tree && <StatsCard tree={tree} />}
        </div>

        {/* Search */}
        <div style={{ marginBottom: '16px' }}>
          <input
            type="text"
            placeholder="Search files..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', maxWidth: '400px', padding: '10px 14px',
              background: '#0d0d0d', border: '1px solid #262626', borderRadius: '6px',
              color: '#e5e5e5', fontSize: '14px', outline: 'none'
            }}
          />
        </div>

        {/* Tree view */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>File Tree</div>
          {loading ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#737373' }}>Loading workspace...</div>
          ) : error ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#ef4444' }}>{error}</div>
          ) : !displayTree ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#737373' }}>No matches found</div>
          ) : (
            <div style={{ maxHeight: '60vh', overflow: 'auto' }}>
              <TreeNode item={displayTree} depth={0} onFileClick={setViewingFile} />
            </div>
          )}
        </div>
      </main>

      {/* File viewer modal */}
      {viewingFile && (
        <FileViewer path={viewingFile} onClose={() => setViewingFile(null)} />
      )}
    </div>
  )
}
