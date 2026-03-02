'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

const SUPABASE_URL = 'https://lsqlqssigerzghlxfxjl.supabase.co'
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzcWxxc3NpZ2VyemdobHhmeGpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1NDA5NTEsImV4cCI6MjA4NTExNjk1MX0.jqoZUtW_gb8rehPteVgjmLLLlPRLYV-0fNJkpLGcf-s'

// Team colors - bold, distinctive
const TEAM_COLORS: Record<string, { bg: string, border: string, text: string }> = {
  core: { bg: '#1a1a2e', border: '#4a4ae8', text: '#8b8bff' },
  clawstreet: { bg: '#1a2e1a', border: '#3fb950', text: '#7ee787' },
  trading: { bg: '#2e1a1a', border: '#f85149', text: '#ff7b72' },
  junto: { bg: '#2e2a1a', border: '#d29922', text: '#e3b341' },
  ailmanack: { bg: '#1a2a2e', border: '#39c5cf', text: '#7dd3e0' },
}

const DEFAULT_TEAM = { bg: '#21262d', border: '#30363d', text: '#8b949e' }

function getTeamColor(team: string | null) {
  return TEAM_COLORS[team || ''] || DEFAULT_TEAM
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

// Avatar component with fallback
function AgentAvatar({ agent, size = 56, teamColor }: { agent: any, size?: number, teamColor: any }) {
  const avatarUrl = agent?.avatar_url || (agent?.slug ? `/avatars/${agent.slug}.jpg` : null)
  
  if (avatarUrl) {
    return (
      <img 
        src={avatarUrl} 
        alt={agent?.name || 'Agent'} 
        style={{
          width: size, height: size, borderRadius: size > 48 ? '12px' : '10px',
          objectFit: 'cover', border: `2px solid ${teamColor.border}`, flexShrink: 0
        }} 
      />
    )
  }
  
  return (
    <div style={{
      width: size, height: size, borderRadius: size > 48 ? '12px' : '10px',
      background: `linear-gradient(135deg, ${teamColor.border}, ${teamColor.text})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.5, border: `2px solid ${teamColor.border}`, flexShrink: 0
    }}>{agent?.emoji || '🤖'}</div>
  )
}

// Agent Detail Modal
function AgentModal({ agent, onClose, activity, messages }: { agent: any, onClose: () => void, activity: any[], messages: any[] }) {
  const teamColor = getTeamColor(agent.team)
  const agentActivity = activity.filter(a => a.agent_id === agent.id).slice(0, 10)
  const agentMessages = messages.filter(m => m.from_agent_id === agent.id || m.to_agent_id === agent.id).slice(0, 10)

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', 
      display: 'flex', alignItems: 'center', justifyContent: 'center', 
      zIndex: 1000, padding: '20px'
    }} onClick={onClose}>
      <div style={{
        background: '#0d1117', border: `2px solid ${teamColor.border}`,
        borderRadius: '12px', maxWidth: '700px', width: '100%', maxHeight: '90vh',
        overflow: 'auto', boxShadow: `0 0 40px ${teamColor.border}33`
      }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          padding: '24px', borderBottom: `1px solid ${teamColor.border}`,
          background: teamColor.bg, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'
        }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <AgentAvatar agent={agent} size={64} teamColor={teamColor} />
            <div>
              <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 800 }}>{agent.name}</h2>
              <div style={{ color: teamColor.text, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', fontSize: '12px' }}>
                {agent.role} • {agent.team}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: '#8b949e', fontSize: '24px', cursor: 'pointer'
          }}>✕</button>
        </div>

        {/* Status Bar */}
        <div style={{
          padding: '12px 24px', background: '#161b22',
          display: 'flex', gap: '24px', flexWrap: 'wrap', borderBottom: '1px solid #30363d'
        }}>
          <div><span style={{ color: '#8b949e' }}>Status:</span> <span style={{
            color: agent.status === 'active' ? '#3fb950' : '#d29922',
            fontWeight: 700
          }}>● {agent.status?.toUpperCase()}</span></div>
          <div><span style={{ color: '#8b949e' }}>Model:</span> <span style={{ fontFamily: 'monospace' }}>{agent.model || 'default'}</span></div>
          {agent.last_active_at && <div><span style={{ color: '#8b949e' }}>Last Active:</span> {timeAgo(agent.last_active_at)}</div>}
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {/* Description */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: '14px', color: '#8b949e', textTransform: 'uppercase', letterSpacing: '1px' }}>Description</h3>
            <p style={{ margin: 0, lineHeight: 1.6 }}>{agent.description || 'No description set.'}</p>
          </div>

          {/* Current Task */}
          {agent.current_task && (
            <div style={{
              padding: '16px', background: teamColor.bg, border: `1px solid ${teamColor.border}`,
              borderRadius: '8px', marginBottom: '24px'
            }}>
              <div style={{ fontSize: '12px', color: teamColor.text, fontWeight: 700, marginBottom: '4px' }}>📌 CURRENT TASK</div>
              <div>{agent.current_task}</div>
            </div>
          )}

          {/* Files */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '14px', color: '#8b949e', textTransform: 'uppercase', letterSpacing: '1px' }}>Files & Config</h3>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {agent.soul_path && <div style={{
                padding: '8px 12px', background: '#21262d', borderRadius: '6px', fontSize: '13px', fontFamily: 'monospace'
              }}>📄 {agent.soul_path}</div>}
              {agent.config_path && <div style={{
                padding: '8px 12px', background: '#21262d', borderRadius: '6px', fontSize: '13px', fontFamily: 'monospace'
              }}>⚙️ {agent.config_path}</div>}
              {!agent.soul_path && !agent.config_path && <span style={{ color: '#6e7681' }}>No files configured</span>}
            </div>
          </div>

          {/* Recent Activity */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '14px', color: '#8b949e', textTransform: 'uppercase', letterSpacing: '1px' }}>Recent Activity</h3>
            {agentActivity.length === 0 ? (
              <div style={{ color: '#6e7681', fontSize: '13px' }}>No activity recorded yet</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {agentActivity.map(a => (
                  <div key={a.id} style={{
                    padding: '8px 12px', background: '#161b22', borderRadius: '6px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}>
                    <span>{a.title}</span>
                    <span style={{ color: '#6e7681', fontSize: '12px' }}>{timeAgo(a.created_at)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Messages */}
          <div>
            <h3 style={{ margin: '0 0 12px', fontSize: '14px', color: '#8b949e', textTransform: 'uppercase', letterSpacing: '1px' }}>Recent Chatter</h3>
            {agentMessages.length === 0 ? (
              <div style={{ color: '#6e7681', fontSize: '13px' }}>No messages yet</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {agentMessages.map(m => (
                  <div key={m.id} style={{
                    padding: '8px 12px', background: '#161b22', borderRadius: '6px', fontSize: '13px'
                  }}>
                    <div style={{ color: '#8b949e', marginBottom: '4px' }}>{timeAgo(m.created_at)}</div>
                    <div>{m.content}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdminPage() {
  const [tab, setTab] = useState('agents')
  const [agents, setAgents] = useState<any[]>([])
  const [activity, setActivity] = useState<any[]>([])
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [teamFilter, setTeamFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedAgent, setSelectedAgent] = useState<any>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const [agentsData, activityData, messagesData] = await Promise.all([
        fetchSupabase('agents', 'order=name'),
        fetchSupabase('agent_activity', 'order=created_at.desc&limit=50'),
        fetchSupabase('agent_messages', 'order=created_at.desc&limit=50'),
      ])
      setAgents(Array.isArray(agentsData) ? agentsData : [])
      setActivity(Array.isArray(activityData) ? activityData : [])
      setMessages(Array.isArray(messagesData) ? messagesData : [])
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  const filteredAgents = agents.filter(a => {
    if (teamFilter !== 'all' && a.team !== teamFilter) return false
    if (statusFilter !== 'all' && a.status !== statusFilter) return false
    return true
  })

  const teams = Array.from(new Set(agents.map(a => a.team).filter(Boolean)))
  const agentMap = Object.fromEntries(agents.map(a => [a.id, a]))

  return (
    <div style={{
      background: '#0d1117', minHeight: '100vh', color: '#e6edf3',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif'
    }}>
      {/* Header - Neobrutalist */}
      <header style={{
        borderBottom: '3px solid #30363d', padding: '20px 24px',
        background: 'linear-gradient(180deg, #161b22 0%, #0d1117 100%)'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Link href="/" style={{ color: '#8b949e', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>← DASHBOARD</Link>
              <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 900, letterSpacing: '-1px' }}>
                🎛️ AGENT PORTAL
              </h1>
            </div>
            <button onClick={loadData} disabled={loading} style={{
              padding: '10px 20px', background: loading ? '#21262d' : '#238636',
              border: '2px solid #238636', borderRadius: '6px', color: '#fff',
              fontWeight: 700, cursor: 'pointer', fontSize: '14px'
            }}>
              {loading ? '⏳ LOADING...' : '🔄 REFRESH'}
            </button>
          </div>

          {/* Tabs - Bold */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
            {[
              { id: 'agents', label: '🤖 AGENTS', count: agents.length },
              { id: 'activity', label: '📊 ACTIVITY', count: activity.length },
              { id: 'chatter', label: '💬 CHATTER', count: messages.length },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                padding: '12px 20px', border: '2px solid',
                borderColor: tab === t.id ? '#58a6ff' : '#30363d',
                background: tab === t.id ? '#58a6ff22' : 'transparent',
                borderRadius: '6px', color: tab === t.id ? '#58a6ff' : '#8b949e',
                fontWeight: 800, cursor: 'pointer', fontSize: '13px', whiteSpace: 'nowrap',
                display: 'flex', alignItems: 'center', gap: '8px'
              }}>
                {t.label}
                <span style={{
                  background: tab === t.id ? '#58a6ff' : '#30363d',
                  color: tab === t.id ? '#0d1117' : '#8b949e',
                  padding: '2px 8px', borderRadius: '10px', fontSize: '11px'
                }}>{t.count}</span>
              </button>
            ))}
            <Link href="/?tab=tasks" style={{
              padding: '12px 20px', border: '2px solid #30363d',
              background: 'transparent', borderRadius: '6px', color: '#8b949e',
              fontWeight: 800, textDecoration: 'none', fontSize: '13px', whiteSpace: 'nowrap',
              display: 'flex', alignItems: 'center', gap: '8px'
            }}>
              📋 KANBAN →
            </Link>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
        {/* AGENTS TAB */}
        {tab === 'agents' && (
          <div>
            {/* Filters */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
              <select value={teamFilter} onChange={e => setTeamFilter(e.target.value)} style={{
                padding: '10px 16px', background: '#161b22', border: '2px solid #30363d',
                borderRadius: '6px', color: '#e6edf3', fontWeight: 600, fontSize: '14px'
              }}>
                <option value="all">ALL TEAMS</option>
                {teams.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
              </select>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{
                padding: '10px 16px', background: '#161b22', border: '2px solid #30363d',
                borderRadius: '6px', color: '#e6edf3', fontWeight: 600, fontSize: '14px'
              }}>
                <option value="all">ALL STATUS</option>
                <option value="active">ACTIVE</option>
                <option value="idle">IDLE</option>
                <option value="paused">PAUSED</option>
              </select>
            </div>

            {/* Agent Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
              {filteredAgents.map(agent => {
                const teamColor = getTeamColor(agent.team)
                return (
                  <div key={agent.id} onClick={() => setSelectedAgent(agent)} style={{
                    background: teamColor.bg, border: `2px solid ${teamColor.border}`,
                    borderRadius: '12px', padding: '20px', cursor: 'pointer',
                    transition: 'transform 0.15s, box-shadow 0.15s', position: 'relative'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${teamColor.border}33` }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}
                  >
                    {/* Status - Top Right */}
                    <div style={{
                      position: 'absolute', top: '12px', right: '12px',
                      display: 'flex', alignItems: 'center', gap: '6px',
                      padding: '4px 10px', borderRadius: '20px',
                      background: agent.status === 'active' ? '#3fb95033' : '#d2992233',
                      border: `1px solid ${agent.status === 'active' ? '#3fb950' : '#d29922'}`
                    }}>
                      <span style={{
                        width: '8px', height: '8px', borderRadius: '50%',
                        background: agent.status === 'active' ? '#3fb950' : '#d29922'
                      }} />
                      <span style={{
                        fontSize: '11px', fontWeight: 700, textTransform: 'uppercase',
                        color: agent.status === 'active' ? '#3fb950' : '#d29922'
                      }}>{agent.status}</span>
                    </div>

                    {/* Agent Info */}
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                      <AgentAvatar agent={agent} size={56} teamColor={teamColor} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 800 }}>{agent.name}</h3>
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px'
                        }}>
                          <span style={{
                            padding: '2px 8px', borderRadius: '4px', fontSize: '11px',
                            fontWeight: 700, textTransform: 'uppercase',
                            background: teamColor.border, color: '#fff'
                          }}>{agent.team}</span>
                          <span style={{ color: '#8b949e', fontSize: '13px' }}>{agent.role}</span>
                        </div>
                        <p style={{
                          margin: 0, fontSize: '13px', color: '#8b949e',
                          overflow: 'hidden', textOverflow: 'ellipsis',
                          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any
                        }}>{agent.description || 'No description'}</p>
                      </div>
                    </div>

                    {/* Model tag */}
                    <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{
                        fontSize: '11px', color: '#6e7681', fontFamily: 'monospace',
                        background: '#21262d', padding: '4px 8px', borderRadius: '4px'
                      }}>🧠 {agent.model || 'default'}</span>
                      <span style={{ fontSize: '12px', color: teamColor.text }}>View Details →</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ACTIVITY TAB */}
        {tab === 'activity' && (
          <div style={{ background: '#161b22', border: '2px solid #30363d', borderRadius: '12px', overflow: 'hidden' }}>
            {activity.length === 0 ? (
              <div style={{ padding: '48px', textAlign: 'center', color: '#6e7681' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
                <div>No activity recorded yet. Activity will appear here as agents work.</div>
              </div>
            ) : (
              activity.map((a, i) => {
                const agent = agentMap[a.agent_id]
                const teamColor = getTeamColor(agent?.team)
                return (
                  <div key={a.id} style={{
                    padding: '16px 20px', borderBottom: i < activity.length - 1 ? '1px solid #30363d' : 'none',
                    display: 'flex', gap: '16px', alignItems: 'flex-start'
                  }}>
                    <AgentAvatar agent={agent} size={40} teamColor={teamColor} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                        <span style={{ color: teamColor.text }}>{agent?.name || 'Unknown'}</span>
                        <span style={{ color: '#8b949e', fontWeight: 400 }}> {a.title}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#6e7681' }}>
                        <span>{timeAgo(a.created_at)}</span>
                        {a.project && <span>📁 {a.project}</span>}
                        <span style={{
                          padding: '2px 8px', background: '#21262d', borderRadius: '4px'
                        }}>{a.activity_type}</span>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* CHATTER TAB */}
        {tab === 'chatter' && (
          <div style={{ background: '#161b22', border: '2px solid #30363d', borderRadius: '12px', overflow: 'hidden' }}>
            {messages.length === 0 ? (
              <div style={{ padding: '48px', textAlign: 'center', color: '#6e7681' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
                <div>No inter-agent chatter yet. Messages will appear here as agents communicate.</div>
              </div>
            ) : (
              messages.map((m, i) => {
                const from = agentMap[m.from_agent_id]
                const to = agentMap[m.to_agent_id]
                const teamColor = getTeamColor(from?.team)
                return (
                  <div key={m.id} style={{
                    padding: '16px 20px', borderBottom: i < messages.length - 1 ? '1px solid #30363d' : 'none',
                    display: 'flex', gap: '16px'
                  }}>
                    <AgentAvatar agent={from} size={40} teamColor={teamColor} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, color: teamColor.text }}>{from?.name || 'Unknown'}</span>
                        {to && <>
                          <span style={{ color: '#6e7681' }}>→</span>
                          <span style={{ fontWeight: 600 }}>{to.emoji} {to.name}</span>
                        </>}
                        <span style={{ color: '#6e7681', fontSize: '12px' }}>{timeAgo(m.created_at)}</span>
                      </div>
                      <div style={{
                        padding: '12px 16px', background: '#21262d', borderRadius: '8px',
                        borderLeft: `3px solid ${teamColor.border}`, lineHeight: 1.5
                      }}>{m.content}</div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}
      </main>

      {/* Agent Detail Modal */}
      {selectedAgent && (
        <AgentModal
          agent={selectedAgent}
          onClose={() => setSelectedAgent(null)}
          activity={activity}
          messages={messages}
        />
      )}
    </div>
  )
}
