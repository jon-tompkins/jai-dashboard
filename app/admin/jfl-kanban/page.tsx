'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

const styles = {
  container: { background: '#0a0a0a', minHeight: '100vh', color: '#e5e5e5', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif' },
  card: { background: '#0d0d0d', border: '1px solid #262626', borderRadius: '8px', padding: '16px' },
  btn: { padding: '8px 14px', background: '#171717', border: '1px solid #262626', borderRadius: '4px', color: '#e5e5e5', cursor: 'pointer', fontSize: '13px' },
  btnPrimary: { padding: '8px 14px', background: '#166534', border: '1px solid #166534', borderRadius: '4px', color: '#e5e5e5', cursor: 'pointer', fontSize: '13px' },
  tag: { display: 'inline-block', padding: '2px 8px', borderRadius: '3px', fontSize: '11px', marginRight: '4px' },
}

const AGENT_EMOJIS: Record<string, string> = {
  scout: '🔭',
  builder: '🔨',
  jeb: '📊',
  ant: '📈',
  mark: '📣',
  benji: '🐾',
  jai: '⚡',
  jon: '👤'
}

const COLUMN_CONFIG = [
  { id: 'backlog', label: 'Backlog', color: '#6b7280', bgColor: '#171717' },
  { id: 'ready', label: 'Ready', color: '#3b82f6', bgColor: '#172554' },
  { id: 'in_progress', label: 'In Progress', color: '#f59e0b', bgColor: '#451a03' },
  { id: 'done', label: 'Done', color: '#22c55e', bgColor: '#052e16' }
]

interface Task {
  id: string
  title: string
  description: string
  status: string
  assignee: string | null
  priority: string
  project: string
  labels: string[]
  created_at: string
  updated_at: string
  url: string
}

function TaskCard({ task, onStatusChange }: { task: Task; onStatusChange: (id: string, status: string) => void }) {
  const agentEmoji = task.assignee ? AGENT_EMOJIS[task.assignee] || '👤' : '—'
  const priorityColors: Record<string, string> = {
    critical: '#dc2626',
    high: '#f59e0b',
    medium: '#3b82f6',
    low: '#6b7280'
  }
  
  return (
    <div style={{ 
      ...styles.card, 
      padding: '12px', 
      marginBottom: '8px',
      borderLeft: `3px solid ${priorityColors[task.priority] || '#6b7280'}`
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <span style={{ fontSize: '11px', color: '#525252', fontFamily: 'monospace' }}>#{task.id}</span>
        <span style={{ fontSize: '11px', color: '#737373' }}>{agentEmoji} {task.assignee || 'unassigned'}</span>
      </div>
      
      <h4 style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: 500, lineHeight: 1.4 }}>
        <a href={task.url} target="_blank" rel="noopener noreferrer" style={{ color: '#e5e5e5', textDecoration: 'none' }}>
          {task.title}
        </a>
      </h4>
      
      {task.project && (
        <span style={{ ...styles.tag, background: '#262626', color: '#a3a3a3', marginBottom: '8px' }}>
          {task.project}
        </span>
      )}
      
      <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
        {COLUMN_CONFIG.filter(col => col.id !== task.status).map(col => (
          <button
            key={col.id}
            onClick={() => onStatusChange(task.id, col.id)}
            style={{ 
              padding: '2px 6px', 
              background: col.bgColor, 
              border: `1px solid ${col.color}`, 
              borderRadius: '3px', 
              cursor: 'pointer', 
              fontSize: '10px',
              color: col.color
            }}
          >
            → {col.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function JFLKanbanPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterAgent, setFilterAgent] = useState<string>('')
  const [filterProject, setFilterProject] = useState<string>('')

  const fetchTasks = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/kanban-jfl')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setTasks(data.tasks || [])
    } catch (e) {
      console.error('Failed to fetch tasks:', e)
      setError(e instanceof Error ? e.message : 'Failed to load tasks')
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchTasks()
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchTasks, 30000)
    return () => clearInterval(interval)
  }, [])

  const updateTaskStatus = async (id: string, status: string) => {
    try {
      const res = await fetch('/api/kanban-jfl', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      })
      if (!res.ok) throw new Error('Failed to update')
      fetchTasks()
    } catch (e) {
      console.error('Update failed:', e)
      alert('Failed to update task status')
    }
  }

  const filteredTasks = tasks.filter(task => {
    if (filterAgent && task.assignee !== filterAgent) return false
    if (filterProject && task.project !== filterProject) return false
    return true
  })

  const uniqueAgents = Array.from(new Set(tasks.map(t => t.assignee).filter(Boolean)))
  const uniqueProjects = Array.from(new Set(tasks.map(t => t.project).filter(Boolean)))

  const getColumnTasks = (status: string) => filteredTasks.filter(t => t.status === status)

  return (
    <div style={styles.container}>
      <header style={{ borderBottom: '1px solid #262626', padding: '16px 24px' }}>
        <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Link href="/admin" style={{ color: '#525252', textDecoration: 'none', fontSize: '13px' }}>← Admin</Link>
              <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>🤖 JFL Context Hub</h1>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={fetchTasks} disabled={loading} style={styles.btn}>
                {loading ? '...' : '↻ Refresh'}
              </button>
              <a 
                href="https://github.com/jon-tompkins/clawd/issues" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ ...styles.btn, textDecoration: 'none' }}
              >
                View on GitHub →
              </a>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <select 
              value={filterAgent} 
              onChange={(e) => setFilterAgent(e.target.value)}
              style={{ padding: '6px 10px', background: '#171717', border: '1px solid #262626', borderRadius: '4px', color: '#e5e5e5', fontSize: '12px' }}
            >
              <option value="">All Agents</option>
              {uniqueAgents.map(agent => (
                <option key={agent} value={agent}>{AGENT_EMOJIS[agent] || '👤'} {agent}</option>
              ))}
            </select>
            
            <select 
              value={filterProject} 
              onChange={(e) => setFilterProject(e.target.value)}
              style={{ padding: '6px 10px', background: '#171717', border: '1px solid #262626', borderRadius: '4px', color: '#e5e5e5', fontSize: '12px' }}
            >
              <option value="">All Projects</option>
              {uniqueProjects.map(project => (
                <option key={project} value={project}>{project}</option>
              ))}
            </select>

            {(filterAgent || filterProject) && (
              <button 
                onClick={() => { setFilterAgent(''); setFilterProject('') }}
                style={{ ...styles.btn, fontSize: '11px' }}
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '1600px', margin: '0 auto', padding: '24px' }}>
        {error && (
          <div style={{ 
            background: '#450a0a', 
            border: '1px solid #dc2626', 
            borderRadius: '8px', 
            padding: '16px', 
            marginBottom: '24px',
            color: '#fca5a5'
          }}>
            <strong>Error:</strong> {error}
            <button onClick={fetchTasks} style={{ ...styles.btn, marginLeft: '12px' }}>Retry</button>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          {COLUMN_CONFIG.map(col => {
            const columnTasks = getColumnTasks(col.id)
            return (
              <div key={col.id}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '12px 16px',
                  background: col.bgColor,
                  borderRadius: '8px 8px 0 0',
                  border: `1px solid ${col.color}`,
                  borderBottom: 'none'
                }}>
                  <span style={{ fontWeight: 600, color: col.color }}>{col.label}</span>
                  <span style={{ 
                    background: col.color, 
                    color: '#000', 
                    padding: '2px 8px', 
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 600
                  }}>
                    {columnTasks.length}
                  </span>
                </div>
                
                <div style={{ 
                  background: '#0d0d0d', 
                  border: `1px solid ${col.color}`, 
                  borderTop: 'none',
                  borderRadius: '0 0 8px 8px',
                  padding: '12px',
                  minHeight: '400px'
                }}>
                  {columnTasks.length === 0 ? (
                    <div style={{ 
                      padding: '24px', 
                      color: '#525252', 
                      fontSize: '12px', 
                      textAlign: 'center',
                      border: '1px dashed #262626',
                      borderRadius: '4px'
                    }}>
                      No tasks
                    </div>
                  ) : (
                    columnTasks.map(task => (
                      <TaskCard 
                        key={task.id} 
                        task={task} 
                        onStatusChange={updateTaskStatus}
                      />
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <div style={{ marginTop: '32px', padding: '16px', background: '#171717', borderRadius: '8px' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '14px', color: '#a3a3a3' }}>Agent Legend</h3>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {Object.entries(AGENT_EMOJIS).map(([agent, emoji]) => (
              <span key={agent} style={{ fontSize: '12px', color: '#737373' }}>
                {emoji} {agent}
              </span>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
