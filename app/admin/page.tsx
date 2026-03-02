'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

const SUPABASE_URL = 'https://lsqlqssigerzghlxfxjl.supabase.co'
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzcWxxc3NpZ2VyemdobHhmeGpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1NDA5NTEsImV4cCI6MjA4NTExNjk1MX0.jqoZUtW_gb8rehPteVgjmLLLlPRLYV-0fNJkpLGcf-s'

// Clean styles - myjunto inspired
const styles = {
  container: { background: '#0a0a0a', minHeight: '100vh', color: '#e5e5e5', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif' },
  card: { background: '#0d0d0d', border: '1px solid #262626', borderRadius: '4px', padding: '16px' },
  cardTitle: { fontSize: '12px', color: '#737373', textTransform: 'uppercase' as const, letterSpacing: '0.5px', marginBottom: '12px' },
  btn: { padding: '8px 14px', background: '#171717', border: '1px solid #262626', borderRadius: '4px', color: '#e5e5e5', cursor: 'pointer', fontSize: '13px' },
  btnActive: { padding: '8px 14px', background: '#171717', border: '1px solid #404040', borderRadius: '4px', color: '#fff', cursor: 'pointer', fontSize: '13px' },
  tag: { display: 'inline-block', padding: '2px 8px', borderRadius: '3px', fontSize: '11px', marginRight: '4px' },
}

const TEAM_COLORS: Record<string, string> = {
  core: '#6366f1', trading: '#ef4444', clawstreet: '#22c55e', junto: '#f59e0b', ailmanack: '#06b6d4'
}

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`
  return `${Math.floor(seconds / 86400)}d`
}

async function fetchSupabase(table: string, params: string = '') {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, {
    headers: { 'apikey': SUPABASE_ANON, 'Authorization': `Bearer ${SUPABASE_ANON}` }
  })
  return res.json()
}

// File Viewer Modal
function FileViewer({ agentName, fileName, onClose }: { agentName: string, fileName: string, onClose: () => void }) {
  const [content, setContent] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/agents/files?agent=${agentName}&file=${fileName}`)
      .then(r => r.json())
      .then(d => { setContent(d.content || 'Failed to load'); setLoading(false) })
      .catch(() => { setContent('Error loading file'); setLoading(false) })
  }, [agentName, fileName])

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onClick={onClose}>
      <div style={{ ...styles.card, maxWidth: '800px', width: '100%', maxHeight: '90vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #262626', paddingBottom: '12px' }}>
          <div>
            <span style={{ color: '#737373', fontSize: '12px' }}>{agentName}/</span>
            <span style={{ fontWeight: 600 }}>{fileName}</span>
          </div>
          <button onClick={onClose} style={{ ...styles.btn, padding: '4px 12px' }}>✕</button>
        </div>
        <pre style={{ margin: 0, fontSize: '13px', lineHeight: 1.6, whiteSpace: 'pre-wrap', color: '#a3a3a3', fontFamily: 'ui-monospace, monospace' }}>
          {loading ? 'Loading...' : content}
        </pre>
      </div>
    </div>
  )
}

// Agent Modal with Files
function AgentModal({ agent, localFiles, onClose, activity, messages, onViewFile }: any) {
  const teamColor = TEAM_COLORS[agent.team] || '#737373'
  const agentFiles = localFiles.find((a: any) => a.name === agent.slug || a.name === agent.name?.toLowerCase())?.files || []
  const agentActivity = activity.filter((a: any) => a.agent_id === agent.id).slice(0, 5)

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onClick={onClose}>
      <div style={{ ...styles.card, maxWidth: '700px', width: '100%', maxHeight: '90vh', overflow: 'auto', borderTop: `2px solid ${teamColor}` }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <h2 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: 600 }}>{agent.emoji || '🤖'} {agent.name}</h2>
            <div style={{ fontSize: '13px', color: '#737373' }}>{agent.role} • <span style={{ color: teamColor }}>{agent.team}</span></div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '4px', background: agent.status === 'active' ? '#166534' : '#262626', color: agent.status === 'active' ? '#22c55e' : '#737373' }}>
              ● {agent.status?.toUpperCase()}
            </span>
            <button onClick={onClose} style={{ ...styles.btn, padding: '4px 12px' }}>✕</button>
          </div>
        </div>

        {/* Description */}
        <p style={{ fontSize: '14px', color: '#a3a3a3', lineHeight: 1.6, margin: '0 0 20px' }}>{agent.description || 'No description'}</p>

        {/* Files */}
        <div style={{ marginBottom: '20px' }}>
          <div style={styles.cardTitle}>📁 Agent Files</div>
          {agentFiles.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {agentFiles.map((file: string) => (
                <button key={file} onClick={() => onViewFile(agent.slug || agent.name?.toLowerCase(), file)} style={{ ...styles.btn, fontSize: '12px', fontFamily: 'monospace' }}>
                  {file}
                </button>
              ))}
            </div>
          ) : (
            <div style={{ color: '#525252', fontSize: '13px' }}>No local files found at ~/clawd/agents/{agent.slug || agent.name?.toLowerCase()}/</div>
          )}
        </div>

        {/* Current Task */}
        {agent.current_task && (
          <div style={{ padding: '12px', background: '#171717', border: '1px solid #262626', borderRadius: '4px', marginBottom: '20px' }}>
            <div style={{ fontSize: '11px', color: teamColor, fontWeight: 600, marginBottom: '4px' }}>📌 CURRENT TASK</div>
            <div style={{ fontSize: '13px' }}>{agent.current_task}</div>
          </div>
        )}

        {/* Activity */}
        <div>
          <div style={styles.cardTitle}>Recent Activity</div>
          {agentActivity.length === 0 ? (
            <div style={{ color: '#525252', fontSize: '13px' }}>No activity recorded</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {agentActivity.map((a: any) => (
                <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '8px', background: '#171717', borderRadius: '4px' }}>
                  <span>{a.title}</span>
                  <span style={{ color: '#525252' }}>{timeAgo(a.created_at)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AdminPage() {
  const [tab, setTab] = useState('agents')
  const [agents, setAgents] = useState<any[]>([])
  const [localFiles, setLocalFiles] = useState<any[]>([])
  const [activity, setActivity] = useState<any[]>([])
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAgent, setSelectedAgent] = useState<any>(null)
  const [viewingFile, setViewingFile] = useState<{ agent: string, file: string } | null>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const [agentsData, activityData, messagesData, filesData] = await Promise.all([
        fetchSupabase('agents', 'order=name'),
        fetchSupabase('agent_activity', 'order=created_at.desc&limit=50'),
        fetchSupabase('agent_messages', 'order=created_at.desc&limit=50'),
        fetch('/api/agents/files').then(r => r.json()),
      ])
      setAgents(Array.isArray(agentsData) ? agentsData : [])
      setActivity(Array.isArray(activityData) ? activityData : [])
      setMessages(Array.isArray(messagesData) ? messagesData : [])
      setLocalFiles(filesData.agents || [])
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  const agentMap = Object.fromEntries(agents.map(a => [a.id, a]))

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid #262626', padding: '16px 24px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Link href="/" style={{ color: '#525252', textDecoration: 'none', fontSize: '13px' }}>← Dashboard</Link>
              <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>🤖 Agents</h1>
            </div>
            <button onClick={loadData} disabled={loading} style={{ ...styles.btn, background: loading ? '#171717' : '#166534' }}>
              {loading ? '...' : '↻ Refresh'}
            </button>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {[
              { id: 'agents', label: '🤖 Agents' },
              { id: 'files', label: '📁 Files' },
              { id: 'activity', label: '📊 Activity' },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={tab === t.id ? styles.btnActive : styles.btn}>
                {t.label}
              </button>
            ))}
            <Link href="/admin/kanban" style={{ ...styles.btn, textDecoration: 'none' }}>
              📋 Kanban
            </Link>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
        {/* AGENTS TAB */}
        {tab === 'agents' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
            {agents.map(agent => {
              const teamColor = TEAM_COLORS[agent.team] || '#737373'
              return (
                <div key={agent.id} onClick={() => setSelectedAgent(agent)} style={{ ...styles.card, cursor: 'pointer', borderLeft: `3px solid ${teamColor}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '15px' }}>{agent.emoji || '🤖'} {agent.name}</div>
                      <div style={{ fontSize: '12px', color: '#737373' }}>{agent.role}</div>
                    </div>
                    <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '3px', background: agent.status === 'active' ? '#166534' : '#262626', color: agent.status === 'active' ? '#22c55e' : '#525252' }}>
                      {agent.status}
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', color: '#737373', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {agent.description || 'No description'}
                  </p>
                </div>
              )
            })}
          </div>
        )}

        {/* FILES TAB */}
        {tab === 'files' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
            {localFiles.map(agent => (
              <div key={agent.name} style={styles.card}>
                <div style={{ ...styles.cardTitle, marginBottom: '12px' }}>{agent.name}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {agent.files.map((file: string) => (
                    <button key={file} onClick={() => setViewingFile({ agent: agent.name, file })} style={{ ...styles.btn, fontSize: '11px', fontFamily: 'monospace', padding: '4px 8px' }}>
                      {file}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ACTIVITY TAB */}
        {tab === 'activity' && (
          <div style={styles.card}>
            {activity.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#525252' }}>No activity recorded</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {activity.map((a) => {
                  const agent = agentMap[a.agent_id]
                  return (
                    <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#171717', borderRadius: '4px' }}>
                      <div>
                        <span style={{ fontWeight: 500, color: TEAM_COLORS[agent?.team] || '#737373' }}>{agent?.name || 'Unknown'}</span>
                        <span style={{ color: '#737373' }}> {a.title}</span>
                      </div>
                      <span style={{ color: '#525252', fontSize: '12px' }}>{timeAgo(a.created_at)}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modals */}
      {selectedAgent && (
        <AgentModal
          agent={selectedAgent}
          localFiles={localFiles}
          onClose={() => setSelectedAgent(null)}
          activity={activity}
          messages={messages}
          onViewFile={(agent: string, file: string) => setViewingFile({ agent, file })}
        />
      )}

      {viewingFile && (
        <FileViewer
          agentName={viewingFile.agent}
          fileName={viewingFile.file}
          onClose={() => setViewingFile(null)}
        />
      )}
    </div>
  )
}
