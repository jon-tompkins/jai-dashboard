import Link from 'next/link'

export const revalidate = 30

const CLAWSTREET_SUPABASE_URL = process.env.CLAWSTREET_SUPABASE_URL || 'https://jmrdgvsorhklbqrwmxwv.supabase.co'
const CLAWSTREET_SUPABASE_KEY = process.env.CLAWSTREET_SUPABASE_KEY || ''

async function clawstreetQuery(table: string, params: string = '') {
  if (!CLAWSTREET_SUPABASE_KEY) return []
  const res = await fetch(`${CLAWSTREET_SUPABASE_URL}/rest/v1/${table}?${params}`, {
    headers: {
      'apikey': CLAWSTREET_SUPABASE_KEY,
      'Authorization': `Bearer ${CLAWSTREET_SUPABASE_KEY}`,
    },
    next: { revalidate: 30 }
  })
  return res.json()
}

function formatNumber(num: number): string {
  return num.toLocaleString('en-US', { maximumFractionDigits: 0 })
}

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

function isActive(lastTradeAt: string | null): boolean {
  if (!lastTradeAt) return false
  const dayAgo = Date.now() - 24 * 60 * 60 * 1000
  return new Date(lastTradeAt).getTime() > dayAgo
}

async function getAgentsWithStats() {
  if (!CLAWSTREET_SUPABASE_KEY) return []
  const agents = await clawstreetQuery('agents', 'status=eq.active&order=points.desc&select=id,name,points,cash_balance,status,twitter_url')
  if (!agents || !Array.isArray(agents)) return []
  const agentIds = agents.map((a: any) => a.id)
  const positions = await clawstreetQuery('positions', `agent_id=in.(${agentIds.join(',')})&select=agent_id`)
  const trades = await clawstreetQuery('trades', `agent_id=in.(${agentIds.join(',')})&order=created_at.desc&select=agent_id,created_at`)
  const positionCounts: Record<string, number> = {}
  positions?.forEach((p: any) => { positionCounts[p.agent_id] = (positionCounts[p.agent_id] || 0) + 1 })
  const lastTrades: Record<string, string> = {}
  trades?.forEach((t: any) => { if (!lastTrades[t.agent_id]) lastTrades[t.agent_id] = t.created_at })
  return agents.map((agent: any) => ({
    ...agent,
    positionCount: positionCounts[agent.id] || 0,
    lastTradeAt: lastTrades[agent.id] || null,
    isActive: isActive(lastTrades[agent.id] || null)
  }))
}

async function getTrollboxMessages() {
  try {
    const res = await fetch('https://clawstreet.club/api/messages?limit=15', { next: { revalidate: 30 } })
    const data = await res.json()
    return data.messages || []
  } catch { return [] }
}

async function getKanbanTasks() {
  const fs = await import('fs/promises')
  try {
    const content = await fs.readFile('/home/ubuntu/clawd/kanban/tasks.json', 'utf-8')
    const data = JSON.parse(content)
    return data.tasks || []
  } catch { return [] }
}

const styles = {
  page: { background: '#0d1117', minHeight: '100vh', color: '#e6edf3', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif' },
  header: { borderBottom: '1px solid #30363d', background: 'rgba(22,27,34,0.5)', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' as const, gap: '12px' },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '16px' },
  backLink: { color: '#8b949e', textDecoration: 'none', fontSize: '14px' },
  title: { fontSize: '20px', fontWeight: 'bold', margin: 0 },
  subtitle: { color: '#8b949e', fontSize: '14px' },
  main: { maxWidth: '1200px', margin: '0 auto', padding: '24px 20px' },
  section: { marginBottom: '32px' },
  sectionTitle: { fontSize: '16px', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' },
  card: { background: '#161b22', border: '1px solid #30363d', borderRadius: '8px', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: '14px' },
  th: { textAlign: 'left' as const, padding: '12px 16px', borderBottom: '1px solid #30363d', color: '#8b949e', fontWeight: '500', fontSize: '12px', background: 'rgba(30,35,42,0.5)' },
  thRight: { textAlign: 'right' as const, padding: '12px 16px', borderBottom: '1px solid #30363d', color: '#8b949e', fontWeight: '500', fontSize: '12px', background: 'rgba(30,35,42,0.5)' },
  td: { padding: '12px 16px', borderBottom: '1px solid #21262d' },
  tdRight: { textAlign: 'right' as const, padding: '12px 16px', borderBottom: '1px solid #21262d' },
  agentLink: { color: '#58a6ff', textDecoration: 'none', fontWeight: '500' },
  statusActive: { color: '#3fb950', fontSize: '14px' },
  statusIdle: { color: '#d29922', fontSize: '14px' },
  mono: { fontFamily: 'monospace', fontSize: '13px' },
  muted: { color: '#8b949e' },
  green: { color: '#3fb950' },
  kanbanGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' },
  kanbanCol: { background: '#161b22', border: '1px solid #30363d', borderRadius: '8px' },
  kanbanHeader: { padding: '12px 16px', borderBottom: '1px solid #30363d', background: 'rgba(30,35,42,0.5)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  kanbanTitle: { fontWeight: '500', fontSize: '14px', textTransform: 'capitalize' as const },
  kanbanCount: { color: '#8b949e', fontSize: '12px' },
  kanbanBody: { padding: '12px', maxHeight: '400px', overflowY: 'auto' as const },
  taskCard: { padding: '12px', marginBottom: '8px', background: '#21262d', border: '1px solid #30363d', borderRadius: '6px' },
  taskTitle: { fontWeight: '500', fontSize: '13px', marginBottom: '8px', color: '#e6edf3' },
  taskMeta: { display: 'flex', flexWrap: 'wrap' as const, gap: '8px', alignItems: 'center' },
  priorityCritical: { background: '#f85149', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '11px' },
  priorityHigh: { background: '#d29922', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '11px' },
  priorityMedium: { background: '#8b949e', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '11px' },
  assignee: { color: '#8b949e', fontSize: '12px' },
  project: { color: '#6e7681', fontSize: '12px' },
  messageItem: { padding: '12px 16px', borderBottom: '1px solid #21262d', display: 'flex', gap: '12px' },
  avatar: { width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #58a6ff, #8957e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px', flexShrink: 0 },
  messageContent: { flex: 1, minWidth: 0 },
  messageMeta: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' as const },
  messageText: { fontSize: '14px', color: '#e6edf3', lineHeight: '1.5', wordBreak: 'break-word' as const },
  noTasks: { textAlign: 'center' as const, color: '#6e7681', padding: '16px', fontSize: '13px' },
  tableWrap: { overflowX: 'auto' as const },
}

function getPriorityStyle(priority: string) {
  if (priority === 'critical') return styles.priorityCritical
  if (priority === 'high') return styles.priorityHigh
  return styles.priorityMedium
}

export default async function AdminPage() {
  const [agents, messages, tasks] = await Promise.all([getAgentsWithStats(), getTrollboxMessages(), getKanbanTasks()])
  
  const tasksByStatus = {
    queue: tasks.filter((t: any) => t.status === 'queue').slice(0, 8),
    active: tasks.filter((t: any) => t.status === 'active' || t.status === 'in_progress'),
    review: tasks.filter((t: any) => t.status === 'review'),
    done: tasks.filter((t: any) => t.status === 'done').slice(0, 5)
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <Link href="/" style={styles.backLink}>← Back</Link>
          <h1 style={styles.title}>🎛️ Admin Dashboard</h1>
        </div>
        <div style={styles.subtitle}>Auto-refreshes every 30s</div>
      </header>

      <main style={styles.main}>
        {/* AGENTS */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}><span>🤖</span> Agents</h2>
          <div style={{...styles.card, ...styles.tableWrap}}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Agent</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.thRight}>Balance</th>
                  <th style={styles.thRight}>Positions</th>
                  <th style={styles.thRight}>Points</th>
                  <th style={styles.thRight}>Last Trade</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((agent: any) => (
                  <tr key={agent.id}>
                    <td style={styles.td}>
                      <span style={styles.agentLink}>{agent.name}</span>
                    </td>
                    <td style={styles.td}>
                      <span style={agent.isActive ? styles.statusActive : styles.statusIdle}>
                        {agent.isActive ? '🟢 Active' : '🟡 Idle'}
                      </span>
                    </td>
                    <td style={{...styles.tdRight, ...styles.mono}}>
                      {formatNumber(agent.cash_balance || 0)} <span style={styles.muted}>LOBS</span>
                    </td>
                    <td style={styles.tdRight}>{agent.positionCount}</td>
                    <td style={{...styles.tdRight, ...styles.mono, ...styles.green}}>{formatNumber(agent.points || 0)}</td>
                    <td style={{...styles.tdRight, ...styles.muted}}>{agent.lastTradeAt ? timeAgo(agent.lastTradeAt) : 'Never'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* KANBAN */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}><span>📋</span> Kanban</h2>
          <div style={styles.kanbanGrid}>
            {(['queue', 'active', 'review', 'done'] as const).map(status => (
              <div key={status} style={styles.kanbanCol}>
                <div style={styles.kanbanHeader}>
                  <span style={styles.kanbanTitle}>{status === 'active' ? 'In Progress' : status}</span>
                  <span style={styles.kanbanCount}>{tasksByStatus[status].length}</span>
                </div>
                <div style={styles.kanbanBody}>
                  {tasksByStatus[status].length === 0 ? (
                    <div style={styles.noTasks}>No tasks</div>
                  ) : (
                    tasksByStatus[status].map((task: any) => (
                      <div key={task.id} style={styles.taskCard}>
                        <div style={styles.taskTitle}>{task.title}</div>
                        <div style={styles.taskMeta}>
                          {task.priority && <span style={getPriorityStyle(task.priority)}>{task.priority}</span>}
                          {task.assignee && <span style={styles.assignee}>@{task.assignee}</span>}
                          {task.project && <span style={styles.project}>{task.project}</span>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* TROLLBOX */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}><span>💬</span> Trollbox Feed</h2>
          <div style={styles.card}>
            {messages.map((msg: any) => (
              <div key={msg.id} style={styles.messageItem}>
                <div style={styles.avatar}>{msg.agent_name?.charAt(0) || '?'}</div>
                <div style={styles.messageContent}>
                  <div style={styles.messageMeta}>
                    <span style={styles.agentLink}>{msg.agent_name}</span>
                    <span style={styles.muted}>{timeAgo(msg.created_at)}</span>
                    <span style={{...styles.muted, fontSize: '12px'}}>{formatNumber(msg.agent_points)} pts</span>
                  </div>
                  <p style={styles.messageText}>{msg.content}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
