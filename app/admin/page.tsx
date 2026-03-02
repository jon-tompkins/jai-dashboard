'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

// Clean styles - myjunto inspired
const styles = {
  container: { background: '#0a0a0a', minHeight: '100vh', color: '#e5e5e5', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif' },
  card: { background: '#0d0d0d', border: '1px solid #262626', borderRadius: '4px', padding: '16px' },
  cardTitle: { fontSize: '12px', color: '#737373', textTransform: 'uppercase' as const, letterSpacing: '0.5px', marginBottom: '12px', fontWeight: 500 },
  btn: { padding: '8px 14px', background: '#171717', border: '1px solid #262626', borderRadius: '4px', color: '#e5e5e5', cursor: 'pointer', fontSize: '13px' },
  btnActive: { padding: '8px 14px', background: '#171717', border: '1px solid #404040', borderRadius: '4px', color: '#fff', cursor: 'pointer', fontSize: '13px' },
  btnSuccess: { padding: '8px 14px', background: '#166534', border: '1px solid #22c55e', borderRadius: '4px', color: '#fff', cursor: 'pointer', fontSize: '13px' },
}

const TEAM_COLORS: Record<string, string> = {
  core: '#6366f1', trading: '#ef4444', clawstreet: '#22c55e', junto: '#f59e0b', ailmanack: '#06b6d4'
}

// File Editor Component - Inline expandable
function FileEditor({ agentName, fileName, onClose }: { agentName: string, fileName: string, onClose: () => void }) {
  const [content, setContent] = useState('')
  const [originalContent, setOriginalContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch(`/api/agents/files?agent=${agentName}&file=${fileName}`)
      .then(r => r.json())
      .then(d => { 
        setContent(d.content || '') 
        setOriginalContent(d.content || '')
        setLoading(false) 
      })
      .catch(() => { setContent('Error loading file'); setLoading(false) })
  }, [agentName, fileName])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/agents/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent: agentName, file: fileName, content })
      })
      if (res.ok) {
        setOriginalContent(content)
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } catch (e) { console.error(e) }
    setSaving(false)
  }

  const hasChanges = content !== originalContent

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onClick={onClose}>
      <div style={{ ...styles.card, maxWidth: '900px', width: '100%', height: '85vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #262626', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ color: '#737373', fontSize: '13px' }}>agents/{agentName}/</span>
            <span style={{ fontWeight: 600, fontSize: '15px' }}>{fileName}</span>
            {hasChanges && <span style={{ fontSize: '11px', color: '#f59e0b', background: '#422006', padding: '2px 8px', borderRadius: '4px' }}>unsaved</span>}
            {saved && <span style={{ fontSize: '11px', color: '#22c55e', background: '#14532d', padding: '2px 8px', borderRadius: '4px' }}>✓ saved</span>}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handleSave} disabled={!hasChanges || saving} style={{ ...styles.btnSuccess, opacity: hasChanges ? 1 : 0.5 }}>
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button onClick={onClose} style={{ ...styles.btn, padding: '8px 12px' }}>✕ Close</button>
          </div>
        </div>
        
        {/* Editor */}
        {loading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#737373' }}>Loading...</div>
        ) : (
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            style={{
              flex: 1,
              width: '100%',
              background: '#0a0a0a',
              border: '1px solid #262626',
              borderRadius: '4px',
              padding: '16px',
              color: '#e5e5e5',
              fontSize: '13px',
              fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
              lineHeight: 1.6,
              resize: 'none',
              outline: 'none'
            }}
            spellCheck={false}
          />
        )}
      </div>
    </div>
  )
}

// Agent Card with inline file list
function AgentCard({ agent, files, onEditFile }: { agent: any, files: string[], onEditFile: (agent: string, file: string) => void }) {
  const [expanded, setExpanded] = useState(false)
  const teamColor = TEAM_COLORS[agent.team] || '#737373'
  const agentSlug = agent.slug || agent.name?.toLowerCase()

  return (
    <div style={{ ...styles.card, borderLeft: `3px solid ${teamColor}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: expanded ? '12px' : 0 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '16px' }}>{agent.emoji || '🤖'}</span>
            <span style={{ fontWeight: 600, fontSize: '15px' }}>{agent.name}</span>
            <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '3px', background: agent.status === 'active' ? '#166534' : '#262626', color: agent.status === 'active' ? '#22c55e' : '#525252' }}>
              {agent.status}
            </span>
          </div>
          <div style={{ fontSize: '12px', color: '#737373' }}>{agent.role}</div>
        </div>
        <button onClick={() => setExpanded(!expanded)} style={{ ...styles.btn, padding: '4px 10px', fontSize: '11px' }}>
          {expanded ? '▼' : '▶'} {files.length} files
        </button>
      </div>

      {expanded && (
        <div style={{ paddingTop: '12px', borderTop: '1px solid #1a1a1a' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {files.map(file => (
              <button 
                key={file} 
                onClick={() => onEditFile(agentSlug, file)}
                style={{ 
                  ...styles.btn, 
                  padding: '6px 10px', 
                  fontSize: '12px', 
                  fontFamily: 'monospace',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                📄 {file}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Local Files Section - agents from filesystem
function LocalAgentsSection({ localFiles, onEditFile }: { localFiles: any[], onEditFile: (agent: string, file: string) => void }) {
  // Group by inferred project based on agent name
  const groups: Record<string, any[]> = {
    'Trading Team': [],
    'Clawstreet': [],
    'Other': []
  }

  localFiles.forEach(agent => {
    const name = agent.name.toLowerCase()
    if (['scout', 'jeb', 'ant', 'jai'].includes(name)) {
      groups['Trading Team'].push(agent)
    } else if (['mark'].includes(name)) {
      groups['Clawstreet'].push(agent)
    } else {
      groups['Other'].push(agent)
    }
  })

  return (
    <div>
      {Object.entries(groups).map(([group, agents]) => 
        agents.length > 0 && (
          <div key={group} style={{ marginBottom: '24px' }}>
            <div style={{ ...styles.cardTitle, marginBottom: '12px', fontSize: '13px' }}>{group}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '12px' }}>
              {agents.map(agent => (
                <AgentCard 
                  key={agent.name} 
                  agent={{ name: agent.name, status: 'idle', emoji: getAgentEmoji(agent.name) }}
                  files={agent.files}
                  onEditFile={onEditFile}
                />
              ))}
            </div>
          </div>
        )
      )}
    </div>
  )
}

function getAgentEmoji(name: string): string {
  const emojis: Record<string, string> = {
    jai: '⚡', scout: '🔭', jeb: '📊', ant: '📈', mark: '📣', 'jai-twitter': '🐦'
  }
  return emojis[name.toLowerCase()] || '🤖'
}

export default function AdminPage() {
  const [tab, setTab] = useState('files')
  const [localFiles, setLocalFiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingFile, setEditingFile] = useState<{ agent: string, file: string } | null>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const filesData = await fetch('/api/agents/files').then(r => r.json())
      setLocalFiles(filesData.agents || [])
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid #262626', padding: '16px 24px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Link href="/" style={{ color: '#525252', textDecoration: 'none', fontSize: '13px' }}>← Dashboard</Link>
              <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>🤖 Agent Portal</h1>
            </div>
            <button onClick={loadData} disabled={loading} style={{ ...styles.btn, background: loading ? '#171717' : '#166534' }}>
              {loading ? '...' : '↻ Refresh'}
            </button>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setTab('files')} style={tab === 'files' ? styles.btnActive : styles.btn}>
              📁 Agent Files
            </button>
            <button onClick={() => setTab('activity')} style={tab === 'activity' ? styles.btnActive : styles.btn}>
              📊 Activity
            </button>
            <Link href="/admin/kanban" style={{ ...styles.btn, textDecoration: 'none' }}>
              📋 Kanban
            </Link>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
        {/* FILES TAB */}
        {tab === 'files' && (
          localFiles.length > 0 ? (
            <LocalAgentsSection 
              localFiles={localFiles} 
              onEditFile={(agent, file) => setEditingFile({ agent, file })}
            />
          ) : (
            <div style={styles.card}>
              <div style={styles.cardTitle}>Agent Files</div>
              <p style={{ color: '#737373', fontSize: '13px', margin: 0 }}>
                {loading ? 'Loading...' : 'Agent files are only available when running locally (not on Vercel). The filesystem isn\'t accessible in serverless deployments.'}
              </p>
            </div>
          )
        )}

        {/* ACTIVITY TAB */}
        {tab === 'activity' && (
          <div style={styles.card}>
            <div style={styles.cardTitle}>Session Activity</div>
            <p style={{ color: '#737373', fontSize: '13px', margin: 0 }}>
              Coming soon — will show last 100 messages from agent session transcripts.
            </p>
          </div>
        )}
      </main>

      {/* File Editor Modal */}
      {editingFile && (
        <FileEditor
          agentName={editingFile.agent}
          fileName={editingFile.file}
          onClose={() => setEditingFile(null)}
        />
      )}
    </div>
  )
}
