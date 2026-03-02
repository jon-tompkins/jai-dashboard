'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

const SUPABASE_URL = 'https://lsqlqssigerzghlxfxjl.supabase.co'
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzcWxxc3NpZ2VyemdobHhmeGpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1NDA5NTEsImV4cCI6MjA4NTExNjk1MX0.jqoZUtW_gb8rehPteVgjmLLLlPRLYV-0fNJkpLGcf-s'

const styles = {
  page: { background: '#0d1117', minHeight: '100vh', color: '#e6edf3', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif' },
  header: { borderBottom: '1px solid #30363d', background: 'rgba(22,27,34,0.5)', padding: '16px 20px' },
  headerTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' as const, gap: '12px', marginBottom: '16px' },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '16px' },
  backLink: { color: '#8b949e', textDecoration: 'none', fontSize: '14px' },
  title: { fontSize: '20px', fontWeight: 'bold', margin: 0 },
  subtitle: { color: '#8b949e', fontSize: '14px' },
  tabs: { display: 'flex', gap: '8px', overflowX: 'auto' as const },
  tab: { padding: '8px 16px', background: '#21262d', border: '1px solid #30363d', borderRadius: '6px', color: '#8b949e', cursor: 'pointer', fontSize: '14px', whiteSpace: 'nowrap' as const },
  tabActive: { padding: '8px 16px', background: '#388bfd22', border: '1px solid #388bfd', borderRadius: '6px', color: '#58a6ff', cursor: 'pointer', fontSize: '14px', whiteSpace: 'nowrap' as const },
  main: { maxWidth: '1200px', margin: '0 auto', padding: '24px 20px' },
  section: { marginBottom: '32px' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' as const, gap: '12px' },
  sectionTitle: { fontSize: '16px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 },
  filters: { display: 'flex', gap: '8px', flexWrap: 'wrap' as const },
  select: { padding: '6px 12px', background: '#21262d', border: '1px solid #30363d', borderRadius: '6px', color: '#e6edf3', fontSize: '13px' },
  card: { background: '#161b22', border: '1px solid #30363d', borderRadius: '8px', overflow: 'hidden' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' },
  agentCard: { background: '#161b22', border: '1px solid #30363d', borderRadius: '8px', padding: '16px', cursor: 'pointer', transition: 'border-color 0.2s' },
  agentHeader: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' },
  avatar: { width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #58a6ff, #8957e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' },
  agentName: { fontSize: '16px', fontWeight: '600', color: '#e6edf3' },
  agentRole: { fontSize: '13px', color: '#8b949e', textTransform: 'capitalize' as const },
  agentMeta: { display: 'flex', gap: '16px', fontSize: '13px', color: '#8b949e' },
  statusDot: { display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', marginRight: '6px' },
  green: { background: '#3fb950' },
  yellow: { background: '#d29922' },
  gray: { background: '#8b949e' },
  table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: '14px' },
  th: { textAlign: 'left' as const, padding: '12px 16px', borderBottom: '1px solid #30363d', color: '#8b949e', fontWeight: '500', fontSize: '12px', background: 'rgba(30,35,42,0.5)' },
  td: { padding: '12px 16px', borderBottom: '1px solid #21262d' },
  activityItem: { padding: '12px 16px', borderBottom: '1px solid #21262d', display: 'flex', gap: '12px' },
  activityIcon: { width: '32px', height: '32px', borderRadius: '50%', background: '#21262d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 },
  activityContent: { flex: 1, minWidth: 0 },
  activityTitle: { fontSize: '14px', color: '#e6edf3', marginBottom: '4px' },
  activityMeta: { fontSize: '12px', color: '#8b949e', display: 'flex', gap: '8px', flexWrap: 'wrap' as const },
  kanbanGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' },
  kanbanCol: { background: '#161b22', border: '1px solid #30363d', borderRadius: '8px' },
  kanbanHeader: { padding: '12px 16px', borderBottom: '1px solid #30363d', background: 'rgba(30,35,42,0.5)', display: 'flex', justifyContent: 'space-between' },
  kanbanBody: { padding: '12px', maxHeight: '400px', overflowY: 'auto' as const },
  taskCard: { padding: '12px', marginBottom: '8px', background: '#21262d', border: '1px solid #30363d', borderRadius: '6px' },
  taskTitle: { fontWeight: '500', fontSize: '13px', marginBottom: '8px', color: '#e6edf3' },
  taskMeta: { display: 'flex', flexWrap: 'wrap' as const, gap: '8px' },
  tag: { padding: '2px 8px', borderRadius: '4px', fontSize: '11px' },
  tagCritical: { background: '#f85149', color: '#fff' },
  tagHigh: { background: '#d29922', color: '#fff' },
  tagMedium: { background: '#8b949e', color: '#fff' },
  muted: { color: '#8b949e' },
  empty: { textAlign: 'center' as const, padding: '32px', color: '#8b949e' },
  messageItem: { padding: '12px 16px', borderBottom: '1px solid #21262d', display: 'flex', gap: '12px' },
  messageBubble: { background: '#21262d', padding: '12px', borderRadius: '8px', flex: 1 },
  messageHeader: { display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center', flexWrap: 'wrap' as const },
  messageFrom: { fontWeight: '500', color: '#58a6ff' },
  messageTo: { color: '#8b949e', fontSize: '13px' },
  messageText: { fontSize: '14px', color: '#e6edf3', lineHeight: '1.5' },
  refreshBtn: { padding: '6px 12px', background: '#238636', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontSize: '13px' },
}

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

async function fetchSupabase(table: string, params: string = '') {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, {
    headers: { 'apikey': SUPABASE_ANON, 'Authorization': `Bearer ${SUPABASE_ANON}` }
  })
  return res.json()
}

export default function AdminPage() {
  const [tab, setTab] = useState('agents')
  const [agents, setAgents] = useState<any[]>([])
  const [activity, setActivity] = useState<any[]>([])
  const [messages, setMessages] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [teamFilter, setTeamFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const loadData = async () => {
    setLoading(true)
    try {
      const [agentsData, activityData, messagesData, tasksData] = await Promise.all([
        fetchSupabase('agents', 'order=name'),
        fetchSupabase('agent_activity', 'order=created_at.desc&limit=50'),
        fetchSupabase('agent_messages', 'order=created_at.desc&limit=50'),
        fetchSupabase('kanban_tasks', 'order=created_at.desc')
      ])
      setAgents(Array.isArray(agentsData) ? agentsData : [])
      setActivity(Array.isArray(activityData) ? activityData : [])
      setMessages(Array.isArray(messagesData) ? messagesData : [])
      setTasks(Array.isArray(tasksData) ? tasksData : [])
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

  const tasksByStatus = {
    queue: tasks.filter(t => t.status === 'queue').slice(0, 10),
    active: tasks.filter(t => ['active', 'in_progress'].includes(t.status)),
    review: tasks.filter(t => t.status === 'review'),
    done: tasks.filter(t => t.status === 'done').slice(0, 5)
  }

  const getStatusColor = (status: string) => {
    if (status === 'active') return styles.green
    if (status === 'idle') return styles.yellow
    return styles.gray
  }

  const getPriorityStyle = (p: string) => {
    if (p === 'critical') return styles.tagCritical
    if (p === 'high') return styles.tagHigh
    return styles.tagMedium
  }

  const getActivityIcon = (type: string) => {
    const icons: Record<string, string> = {
      task_started: '🚀', task_completed: '✅', trade: '📈', post: '📝',
      alert: '🔔', error: '❌', spawn: '🤖', message_sent: '💬'
    }
    return icons[type] || '📋'
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.headerTop}>
          <div style={styles.headerLeft}>
            <Link href="/" style={styles.backLink}>← Dashboard</Link>
            <h1 style={styles.title}>🎛️ Agent Portal</h1>
          </div>
          <button style={styles.refreshBtn} onClick={loadData} disabled={loading}>
            {loading ? '⏳' : '🔄'} Refresh
          </button>
        </div>
        <div style={styles.tabs}>
          {['agents', 'activity', 'chatter', 'kanban'].map(t => (
            <div key={t} style={tab === t ? styles.tabActive : styles.tab} onClick={() => setTab(t)}>
              {t === 'agents' && '🤖 Agents'}
              {t === 'activity' && '📊 Activity'}
              {t === 'chatter' && '💬 Chatter'}
              {t === 'kanban' && '📋 Kanban'}
            </div>
          ))}
        </div>
      </header>

      <main style={styles.main}>
        {/* AGENTS TAB */}
        {tab === 'agents' && (
          <section>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>All Agents</h2>
              <div style={styles.filters}>
                <select style={styles.select} value={teamFilter} onChange={e => setTeamFilter(e.target.value)}>
                  <option value="all">All Teams</option>
                  {teams.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <select style={styles.select} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="idle">Idle</option>
                  <option value="paused">Paused</option>
                  <option value="offline">Offline</option>
                </select>
              </div>
            </div>
            {filteredAgents.length === 0 ? (
              <div style={styles.empty}>No agents found</div>
            ) : (
              <div style={styles.grid}>
                {filteredAgents.map(agent => (
                  <div key={agent.id} style={styles.agentCard}>
                    <div style={styles.agentHeader}>
                      <div style={styles.avatar}>{agent.emoji || agent.name?.charAt(0)}</div>
                      <div>
                        <div style={styles.agentName}>{agent.name}</div>
                        <div style={styles.agentRole}>{agent.role} • {agent.team}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: '13px', color: '#8b949e', marginBottom: '12px' }}>
                      {agent.description || 'No description'}
                    </div>
                    <div style={styles.agentMeta}>
                      <span><span style={{...styles.statusDot, ...getStatusColor(agent.status)}} />{agent.status}</span>
                      <span>🧠 {agent.model || 'default'}</span>
                    </div>
                    {agent.current_task && (
                      <div style={{ marginTop: '12px', padding: '8px', background: '#21262d', borderRadius: '4px', fontSize: '12px' }}>
                        📌 {agent.current_task}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ACTIVITY TAB */}
        {tab === 'activity' && (
          <section>
            <h2 style={styles.sectionTitle}>Activity Feed</h2>
            <div style={{...styles.card, marginTop: '16px'}}>
              {activity.length === 0 ? (
                <div style={styles.empty}>No activity yet</div>
              ) : (
                activity.map(a => {
                  const agent = agentMap[a.agent_id]
                  return (
                    <div key={a.id} style={styles.activityItem}>
                      <div style={styles.activityIcon}>{getActivityIcon(a.activity_type)}</div>
                      <div style={styles.activityContent}>
                        <div style={styles.activityTitle}>
                          <strong>{agent?.emoji} {agent?.name || 'Unknown'}</strong> {a.title}
                        </div>
                        <div style={styles.activityMeta}>
                          <span>{timeAgo(a.created_at)}</span>
                          {a.project && <span>📁 {a.project}</span>}
                          <span style={{...styles.tag, ...styles.tagMedium}}>{a.activity_type}</span>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </section>
        )}

        {/* CHATTER TAB */}
        {tab === 'chatter' && (
          <section>
            <h2 style={styles.sectionTitle}>Inter-Agent Chatter</h2>
            <div style={{...styles.card, marginTop: '16px'}}>
              {messages.length === 0 ? (
                <div style={styles.empty}>No messages yet</div>
              ) : (
                messages.map(m => {
                  const from = agentMap[m.from_agent_id]
                  const to = agentMap[m.to_agent_id]
                  return (
                    <div key={m.id} style={styles.messageItem}>
                      <div style={{...styles.avatar, width: '36px', height: '36px', fontSize: '18px'}}>
                        {from?.emoji || '?'}
                      </div>
                      <div style={styles.messageBubble}>
                        <div style={styles.messageHeader}>
                          <span style={styles.messageFrom}>{from?.name || 'Unknown'}</span>
                          {to && <span style={styles.messageTo}>→ {to.name}</span>}
                          <span style={styles.muted}>{timeAgo(m.created_at)}</span>
                          {m.project && <span style={{...styles.tag, background: '#30363d'}}>{m.project}</span>}
                        </div>
                        <div style={styles.messageText}>{m.content}</div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </section>
        )}

        {/* KANBAN TAB */}
        {tab === 'kanban' && (
          <section>
            <h2 style={styles.sectionTitle}>Kanban Board</h2>
            <div style={{...styles.kanbanGrid, marginTop: '16px'}}>
              {(['queue', 'active', 'review', 'done'] as const).map(status => (
                <div key={status} style={styles.kanbanCol}>
                  <div style={styles.kanbanHeader}>
                    <span style={{ fontWeight: '500', textTransform: 'capitalize' }}>{status === 'active' ? 'In Progress' : status}</span>
                    <span style={styles.muted}>{tasksByStatus[status].length}</span>
                  </div>
                  <div style={styles.kanbanBody}>
                    {tasksByStatus[status].length === 0 ? (
                      <div style={{ ...styles.muted, textAlign: 'center', padding: '16px' }}>No tasks</div>
                    ) : (
                      tasksByStatus[status].map(task => (
                        <div key={task.id} style={styles.taskCard}>
                          <div style={styles.taskTitle}>{task.title}</div>
                          <div style={styles.taskMeta}>
                            {task.priority && <span style={{...styles.tag, ...getPriorityStyle(task.priority)}}>{task.priority}</span>}
                            {task.assignee && <span style={styles.muted}>@{task.assignee}</span>}
                            {task.project && <span style={styles.muted}>{task.project}</span>}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
