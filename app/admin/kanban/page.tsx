'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

const styles = {
  container: { background: '#0a0a0a', minHeight: '100vh', color: '#e5e5e5', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif' },
  card: { background: '#0d0d0d', border: '1px solid #262626', borderRadius: '4px', padding: '16px' },
  cardTitle: { fontSize: '12px', color: '#737373', textTransform: 'uppercase' as const, letterSpacing: '0.5px', marginBottom: '12px' },
  btn: { padding: '8px 14px', background: '#171717', border: '1px solid #262626', borderRadius: '4px', color: '#e5e5e5', cursor: 'pointer', fontSize: '13px' },
  tag: { display: 'inline-block', padding: '2px 8px', borderRadius: '3px', fontSize: '11px', marginRight: '4px' },
}

const PRIORITY_COLORS: Record<string, string> = { critical: '#dc2626', high: '#f59e0b', medium: '#3b82f6', low: '#6b7280' }
const ASSIGNEE_EMOJI: Record<string, string> = { scout: '🔭', builder: '🔨', jon: '👤', jai: '⚡', mark: '📣', jeb: '📊', ant: '📈' }

function TaskCard({ task, updateTask, deleteTask }: any) {
  const [expanded, setExpanded] = useState(false)
  const priorityColor = PRIORITY_COLORS[task.priority] || '#6b7280'

  const moveTask = (newStatus: string) => {
    updateTask(task.id, { status: newStatus })
  }

  return (
    <div style={{ ...styles.card, padding: '12px', marginBottom: '8px', borderLeft: `3px solid ${priorityColor}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 500, fontSize: '13px', marginBottom: '4px' }}>{task.title}</div>
          {task.assignee && (
            <span style={{ fontSize: '11px', color: '#737373' }}>
              {ASSIGNEE_EMOJI[task.assignee] || '👤'} {task.assignee}
            </span>
          )}
        </div>
        <button onClick={() => setExpanded(!expanded)} style={{ ...styles.btn, padding: '4px 8px', fontSize: '11px' }}>
          {expanded ? '−' : '+'}
        </button>
      </div>

      {expanded && (
        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #262626' }}>
          {task.description && <p style={{ fontSize: '12px', color: '#a3a3a3', margin: '0 0 12px' }}>{task.description}</p>}
          
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
            {task.tags?.map((tag: string) => (
              <span key={tag} style={{ ...styles.tag, background: '#262626', color: '#a3a3a3' }}>{tag}</span>
            ))}
            {task.project && <span style={{ ...styles.tag, background: '#1e3a5f', color: '#60a5fa' }}>{task.project}</span>}
          </div>

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {task.status !== 'backlog' && <button onClick={() => moveTask('backlog')} style={{ ...styles.btn, padding: '4px 10px', fontSize: '11px' }}>📥 Backlog</button>}
            {task.status !== 'ready' && <button onClick={() => moveTask('ready')} style={{ ...styles.btn, padding: '4px 10px', fontSize: '11px' }}>✅ Ready</button>}
            {task.status !== 'in_progress' && <button onClick={() => moveTask('in_progress')} style={{ ...styles.btn, padding: '4px 10px', fontSize: '11px' }}>🔄 Progress</button>}
            {task.status !== 'done' && <button onClick={() => moveTask('done')} style={{ ...styles.btn, padding: '4px 10px', fontSize: '11px' }}>✨ Done</button>}
            <button onClick={() => deleteTask(task.id)} style={{ ...styles.btn, padding: '4px 10px', fontSize: '11px', color: '#ef4444' }}>🗑</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function KanbanPage() {
  const [kanban, setKanban] = useState<{ tasks: any[], summary: Record<string, number> }>({ tasks: [], summary: {} })
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTask, setNewTask] = useState({ title: '', description: '', assignee: '', priority: 'medium', tags: '', project: '' })

  const columns = [
    { id: 'backlog', label: 'Backlog', color: '#6b7280' },
    { id: 'ready', label: 'Ready', color: '#3b82f6' },
    { id: 'in_progress', label: 'In Progress', color: '#f59e0b' },
    { id: 'done', label: 'Done', color: '#22c55e' },
  ]

  const fetchKanban = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/kanban')
      const data = await res.json()
      setKanban(data)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => { fetchKanban() }, [])

  const addTask = async () => {
    if (!newTask.title) return
    await fetch('/api/kanban', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        ...newTask, 
        status: 'backlog',
        tags: newTask.tags ? newTask.tags.split(',').map(t => t.trim()) : []
      })
    })
    setNewTask({ title: '', description: '', assignee: '', priority: 'medium', tags: '', project: '' })
    setShowAddForm(false)
    fetchKanban()
  }

  const updateTask = async (id: string, updates: any) => {
    await fetch('/api/kanban', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates })
    })
    fetchKanban()
  }

  const deleteTask = async (id: string) => {
    await fetch(`/api/kanban?id=${id}`, { method: 'DELETE' })
    fetchKanban()
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid #262626', padding: '16px 24px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>📋 Kanban</h1>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setShowAddForm(!showAddForm)} style={{ ...styles.btn, background: showAddForm ? '#262626' : '#166534' }}>
                {showAddForm ? '✕ Cancel' : '+ Add Task'}
              </button>
              <button onClick={fetchKanban} disabled={loading} style={styles.btn}>
                {loading ? '...' : '↻'}
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link href="/admin" style={{ ...styles.btn, textDecoration: 'none', color: '#737373' }}>
              🤖 Agents
            </Link>
            <div style={{ ...styles.btn, background: '#171717', border: '1px solid #404040', color: '#e5e5e5' }}>
              📋 Kanban
            </div>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
        {/* Add Task Form */}
        {showAddForm && (
          <div style={{ ...styles.card, marginBottom: '24px', border: '1px solid #166534' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <input placeholder="Task title..." value={newTask.title} onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                style={{ padding: '10px', background: '#171717', border: '1px solid #262626', borderRadius: '4px', color: '#e5e5e5', fontSize: '14px', gridColumn: 'span 2' }} />
              <textarea placeholder="Description..." value={newTask.description} onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                style={{ padding: '10px', background: '#171717', border: '1px solid #262626', borderRadius: '4px', color: '#e5e5e5', fontSize: '14px', minHeight: '60px', resize: 'vertical', gridColumn: 'span 2' }} />
              <select value={newTask.assignee} onChange={(e) => setNewTask({...newTask, assignee: e.target.value})}
                style={{ padding: '10px', background: '#171717', border: '1px solid #262626', borderRadius: '4px', color: '#e5e5e5' }}>
                <option value="">Unassigned</option>
                <option value="scout">🔭 Scout</option>
                <option value="builder">🔨 Builder</option>
                <option value="jeb">📊 Jeb</option>
                <option value="ant">📈 Ant</option>
                <option value="mark">📣 Mark</option>
                <option value="jon">👤 Jon</option>
              </select>
              <select value={newTask.priority} onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
                style={{ padding: '10px', background: '#171717', border: '1px solid #262626', borderRadius: '4px', color: '#e5e5e5' }}>
                <option value="low">🟢 Low</option>
                <option value="medium">🟡 Medium</option>
                <option value="high">🟠 High</option>
                <option value="critical">🔴 Critical</option>
              </select>
              <input placeholder="Tags (comma separated)" value={newTask.tags} onChange={(e) => setNewTask({...newTask, tags: e.target.value})}
                style={{ padding: '10px', background: '#171717', border: '1px solid #262626', borderRadius: '4px', color: '#e5e5e5', fontSize: '14px' }} />
              <input placeholder="Project" value={newTask.project} onChange={(e) => setNewTask({...newTask, project: e.target.value})}
                style={{ padding: '10px', background: '#171717', border: '1px solid #262626', borderRadius: '4px', color: '#e5e5e5', fontSize: '14px' }} />
            </div>
            <button onClick={addTask} disabled={!newTask.title} style={{ ...styles.btn, marginTop: '12px', background: newTask.title ? '#166534' : '#262626' }}>
              Add Task
            </button>
          </div>
        )}

        {/* Summary */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {columns.map(col => (
            <div key={col.id} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: col.color }} />
              <span style={{ fontSize: '12px', color: '#737373' }}>{col.label}: {kanban.summary?.[col.id] || 0}</span>
            </div>
          ))}
        </div>

        {/* Columns */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {columns.map(col => {
            const tasks = kanban.tasks?.filter(t => t.status === col.id) || []
            return (
              <div key={col.id} style={{ ...styles.card, borderTop: `2px solid ${col.color}`, minHeight: '300px' }}>
                <div style={{ ...styles.cardTitle, display: 'flex', justifyContent: 'space-between' }}>
                  <span>{col.label}</span>
                  <span style={{ color: col.color }}>{tasks.length}</span>
                </div>
                {tasks.map(task => (
                  <TaskCard key={task.id} task={task} updateTask={updateTask} deleteTask={deleteTask} />
                ))}
                {tasks.length === 0 && (
                  <div style={{ padding: '24px', color: '#525252', fontSize: '12px', textAlign: 'center', border: '1px dashed #262626', borderRadius: '4px' }}>
                    No tasks
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}
