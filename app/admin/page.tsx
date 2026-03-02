'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

const styles = {
  container: { background: '#0a0a0a', minHeight: '100vh', color: '#e5e5e5', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif' },
  card: { background: '#0d0d0d', border: '1px solid #262626', borderRadius: '8px', padding: '16px' },
  cardTitle: { fontSize: '12px', color: '#737373', textTransform: 'uppercase' as const, letterSpacing: '0.5px', marginBottom: '16px', fontWeight: 500 },
  btn: { padding: '8px 14px', background: '#171717', border: '1px solid #262626', borderRadius: '4px', color: '#e5e5e5', cursor: 'pointer', fontSize: '13px' },
  btnActive: { padding: '8px 14px', background: '#171717', border: '1px solid #404040', borderRadius: '4px', color: '#fff', cursor: 'pointer', fontSize: '13px' },
  btnSuccess: { padding: '8px 14px', background: '#166534', border: '1px solid #22c55e', borderRadius: '4px', color: '#fff', cursor: 'pointer', fontSize: '13px' },
}

const TEAM_COLORS: Record<string, string> = {
  coordinator: '#8b5cf6',
  trading: '#f59e0b', 
  marketing: '#22c55e',
  clawstreet: '#10b981',
  other: '#6b7280'
}

// Agent metadata with avatars
const AGENT_META: Record<string, { emoji: string, role: string, team: string, avatar?: string, description?: string }> = {
  'jai': { emoji: '⚡', role: 'AI Coordinator', team: 'coordinator', description: 'Primary assistant, task coordinator, spawns sub-agents' },
  'scout': { emoji: '🔭', role: 'Research Scout', team: 'trading', description: 'Finds alpha, monitors watchlists, surfaces opportunities' },
  'jeb': { emoji: '📊', role: 'Analyst', team: 'trading', description: 'Deep dives, earnings analysis, investor frameworks' },
  'ant': { emoji: '📈', role: 'Technical Analyst', team: 'trading', description: 'Price action, momentum, chart patterns' },
  'mark': { emoji: '📣', role: 'Marketing', team: 'marketing', description: 'Clawstreet social, Discord, community' },
  'jai-twitter': { emoji: '🐦', role: 'Twitter Bot', team: 'marketing', description: 'Automated Twitter presence' },
}

// File Editor Modal
function FileEditor({ agentName, fileName, onClose, readOnly }: { agentName: string, fileName: string, onClose: () => void, readOnly?: boolean }) {
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
    if (readOnly) return
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
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onClick={onClose}>
      <div style={{ ...styles.card, maxWidth: '900px', width: '100%', height: '85vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #262626', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ color: '#737373', fontSize: '13px' }}>agents/{agentName}/</span>
            <span style={{ fontWeight: 600, fontSize: '15px' }}>{fileName}</span>
            {readOnly && <span style={{ fontSize: '11px', color: '#737373', background: '#262626', padding: '2px 8px', borderRadius: '4px' }}>read-only</span>}
            {hasChanges && !readOnly && <span style={{ fontSize: '11px', color: '#f59e0b', background: '#422006', padding: '2px 8px', borderRadius: '4px' }}>unsaved</span>}
            {saved && <span style={{ fontSize: '11px', color: '#22c55e', background: '#14532d', padding: '2px 8px', borderRadius: '4px' }}>✓ saved</span>}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {!readOnly && (
              <button onClick={handleSave} disabled={!hasChanges || saving} style={{ ...styles.btnSuccess, opacity: hasChanges ? 1 : 0.5 }}>
                {saving ? 'Saving...' : 'Save'}
              </button>
            )}
            <button onClick={onClose} style={{ ...styles.btn, padding: '8px 12px' }}>✕</button>
          </div>
        </div>
        {loading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#737373' }}>Loading...</div>
        ) : (
          <textarea
            value={content}
            onChange={e => !readOnly && setContent(e.target.value)}
            readOnly={readOnly}
            style={{
              flex: 1, width: '100%', background: '#0a0a0a', border: '1px solid #262626', borderRadius: '4px',
              padding: '16px', color: '#e5e5e5', fontSize: '13px',
              fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
              lineHeight: 1.6, resize: 'none', outline: 'none'
            }}
            spellCheck={false}
          />
        )}
      </div>
    </div>
  )
}

// Agent Card with avatar and files at bottom
function AgentCard({ agent, files, onEditFile, readOnly }: { agent: any, files: string[], onEditFile: (agent: string, file: string) => void, readOnly?: boolean }) {
  const [showFiles, setShowFiles] = useState(false)
  const meta = AGENT_META[agent.name.toLowerCase()] || { emoji: '🤖', role: 'Agent', team: 'other' }
  const teamColor = TEAM_COLORS[meta.team] || TEAM_COLORS.other

  return (
    <div style={{ ...styles.card, display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Agent header */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
        {/* Avatar */}
        <div style={{ 
          width: '48px', height: '48px', borderRadius: '12px', 
          background: `linear-gradient(135deg, ${teamColor}33, ${teamColor}11)`,
          border: `1px solid ${teamColor}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '24px', flexShrink: 0
        }}>
          {meta.emoji}
        </div>
        
        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
            <span style={{ fontWeight: 600, fontSize: '15px' }}>{agent.name}</span>
            <span style={{ 
              fontSize: '10px', padding: '2px 6px', borderRadius: '3px', 
              background: agent.status === 'active' ? '#166534' : '#262626', 
              color: agent.status === 'active' ? '#22c55e' : '#525252' 
            }}>
              {agent.status || 'idle'}
            </span>
          </div>
          <div style={{ fontSize: '12px', color: teamColor, marginBottom: '4px' }}>{meta.role}</div>
          {meta.description && (
            <div style={{ fontSize: '11px', color: '#525252', lineHeight: 1.4 }}>{meta.description}</div>
          )}
        </div>
      </div>

      {/* Files section at bottom */}
      {files.length > 0 && (
        <div style={{ borderTop: '1px solid #1a1a1a', paddingTop: '12px', marginTop: 'auto' }}>
          <button 
            onClick={() => setShowFiles(!showFiles)}
            style={{ 
              ...styles.btn, 
              padding: '6px 10px', 
              fontSize: '11px', 
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <span>📁 {files.length} files</span>
            <span>{showFiles ? '▲' : '▼'}</span>
          </button>
          
          {showFiles && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
              {files.map(file => (
                <button 
                  key={file} 
                  onClick={() => onEditFile(agent.name.toLowerCase(), file)}
                  style={{ 
                    ...styles.btn, 
                    padding: '4px 8px', 
                    fontSize: '11px', 
                    fontFamily: 'monospace',
                  }}
                >
                  {file}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function AdminPage() {
  const [localFiles, setLocalFiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingFile, setEditingFile] = useState<{ agent: string, file: string } | null>(null)
  const [source, setSource] = useState<string>('')
  const [readOnly, setReadOnly] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const filesData = await fetch('/api/agents/files').then(r => r.json())
      setLocalFiles(filesData.agents || [])
      setSource(filesData.source || 'unknown')
      setReadOnly(filesData.readOnly || false)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  // Group agents by team
  const teams: Record<string, any[]> = {
    'Coordinator': [],
    'Trading Team': [],
    'Marketing': [],
    'Other': []
  }

  localFiles.forEach(agent => {
    const meta = AGENT_META[agent.name.toLowerCase()]
    if (meta?.team === 'coordinator') teams['Coordinator'].push(agent)
    else if (meta?.team === 'trading') teams['Trading Team'].push(agent)
    else if (meta?.team === 'marketing') teams['Marketing'].push(agent)
    else teams['Other'].push(agent)
  })

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid #262626', padding: '16px 24px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Link href="/" style={{ color: '#525252', textDecoration: 'none', fontSize: '13px' }}>← Dashboard</Link>
              <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>🤖 Agent Portal</h1>
              {source && (
                <span style={{ fontSize: '11px', color: '#525252', background: '#171717', padding: '4px 8px', borderRadius: '4px' }}>
                  {source === 'github' ? (readOnly ? '📡 GitHub (read-only)' : '📡 GitHub') : '💾 Local'}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Link href="/admin/kanban" style={{ ...styles.btn, textDecoration: 'none' }}>
                📋 Kanban
              </Link>
              <button onClick={loadData} disabled={loading} style={{ ...styles.btn, background: loading ? '#171717' : '#166534' }}>
                {loading ? '...' : '↻'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
        {loading ? (
          <div style={{ ...styles.card, textAlign: 'center', padding: '48px', color: '#737373' }}>
            Loading agents...
          </div>
        ) : localFiles.length === 0 ? (
          <div style={styles.card}>
            <div style={styles.cardTitle}>No Agents Found</div>
            <p style={{ color: '#737373', fontSize: '13px', margin: 0 }}>
              Could not load agent files. Check that the agents directory exists.
            </p>
          </div>
        ) : (
          Object.entries(teams).map(([teamName, agents]) => 
            agents.length > 0 && (
              <div key={teamName} style={{ marginBottom: '32px' }}>
                <div style={{ 
                  ...styles.cardTitle, 
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{ 
                    width: '8px', height: '8px', borderRadius: '50%', 
                    background: TEAM_COLORS[teamName.toLowerCase().replace(' ', '')] || TEAM_COLORS.other 
                  }} />
                  {teamName}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                  {agents.map(agent => (
                    <AgentCard 
                      key={agent.name} 
                      agent={agent}
                      files={agent.files || []}
                      onEditFile={(a, f) => setEditingFile({ agent: a, file: f })}
                      readOnly={readOnly}
                    />
                  ))}
                </div>
              </div>
            )
          )
        )}
      </main>

      {/* File Editor Modal */}
      {editingFile && (
        <FileEditor
          agentName={editingFile.agent}
          fileName={editingFile.file}
          onClose={() => setEditingFile(null)}
          readOnly={readOnly}
        />
      )}
    </div>
  )
}
