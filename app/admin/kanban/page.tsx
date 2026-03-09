'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

const styles = {
  container: { background: '#0a0a0a', minHeight: '100vh', color: '#e5e5e5', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif' },
  card: { background: '#0d0d0d', border: '1px solid #262626', borderRadius: '4px', padding: '16px' },
  cardTitle: { fontSize: '12px', color: '#737373', textTransform: 'uppercase' as const, letterSpacing: '0.5px', marginBottom: '12px' },
  btn: { padding: '8px 14px', background: '#171717', border: '1px solid #262626', borderRadius: '4px', color: '#e5e5e5', cursor: 'pointer', fontSize: '13px' },
  btnActive: { padding: '8px 14px', background: '#171717', border: '1px solid #404040', borderRadius: '4px', color: '#fff', cursor: 'pointer', fontSize: '13px' },
  tag: { display: 'inline-block', padding: '2px 8px', borderRadius: '3px', fontSize: '11px', marginRight: '4px' },
  modalOverlay: { position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: '#0d0d0d', border: '1px solid #404040', borderRadius: '8px', padding: '24px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflow: 'auto' },
}

const PRIORITY_COLORS: Record<string, string> = { critical: '#dc2626', high: '#f59e0b', medium: '#3b82f6', low: '#6b7280' }
const PROJECT_COLORS: Record<string, string> = { 
  dashboard: '#8b5cf6', 
  myjunto: '#ec4899', 
  clawstreet: '#10b981', 
  ailmanack: '#f59e0b', 
  trading: '#06b6d4', 
  fitness: '#14b8a6' 
}
const ASSIGNEES = [
  { value: '', label: 'Unassigned', emoji: '—' },
  { value: 'scout', label: 'Scout', emoji: '🔭' },
  { value: 'builder', label: 'Builder', emoji: '🔨' },
  { value: 'jeb', label: 'Jeb', emoji: '📊' },
  { value: 'ant', label: 'Ant', emoji: '📈' },
  { value: 'mark', label: 'Mark', emoji: '📣' },
  { value: 'jon', label: 'Jon', emoji: '👤' },
  { value: 'jai', label: 'Jai', emoji: '⚡' },
]
const PROJECTS = ['dashboard', 'myjunto', 'clawstreet', 'ailmanack', 'trading', 'fitness']

// Generate short task number from UUID
function getTaskNumber(id: string): string {
  if (!id) return '??'
  // Take first 4 chars of UUID and convert to number
  const num = parseInt(id.substring(0, 8), 16) % 10000
  return `#${num.toString().padStart(4, '0')}`
}

function TaskCard({ task, updateTask, deleteTask, onEdit }: any) {
  const [expanded, setExpanded] = useState(false)
  const priorityColor = PRIORITY_COLORS[task.priority] || '#6b7280'
  const projectColor = PROJECT_COLORS[task.project?.toLowerCase()] || '#404040'
  const assignee = ASSIGNEES.find(a => a.value === task.assignee) || ASSIGNEES[0]
  const taskNum = getTaskNumber(task.id)

  const moveTask = (newStatus: string) => {
    updateTask(task.id, { status: newStatus })
  }

  const statusBtns = [
    { id: 'backlog', icon: '📥' },
    { id: 'ready', icon: '✅' },
    { id: 'in_progress', icon: '🔄' },
    { id: 'done', icon: '✨' },
  ]

  return (
    <div 
      style={{ 
        ...styles.card, 
        padding: '10px 12px', 
        marginBottom: '8px', 
        borderLeft: `3px solid ${projectColor}`, 
        cursor: 'pointer',
        position: 'relative'
      }}
      onClick={() => setExpanded(!expanded)}
    >
      {/* Priority circle top right */}
      <div 
        title={task.priority || 'medium'}
        style={{ 
          position: 'absolute', 
          top: '8px', 
          right: '8px', 
          width: '10px', 
          height: '10px', 
          borderRadius: '50%', 
          background: priorityColor 
        }} 
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', paddingRight: '16px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Task number and title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <span style={{ fontSize: '11px', color: '#525252', fontFamily: 'monospace' }}>{taskNum}</span>
            <span style={{ fontWeight: 500, fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.title}</span>
          </div>
          
          {/* Project, priority text, assignee */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
            {task.project && (
              <span style={{ ...styles.tag, background: `${projectColor}22`, color: projectColor, fontWeight: 500 }}>
                {task.project}
              </span>
            )}
            <span style={{ ...styles.tag, background: `${priorityColor}22`, color: priorityColor, fontSize: '10px' }}>
              {task.priority || 'medium'}
            </span>
            <span style={{ fontSize: '11px', color: '#737373' }}>
              {assignee.emoji} {assignee.value || 'unassigned'}
            </span>
          </div>
        </div>
      </div>

      {expanded && (
        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #262626' }} onClick={(e) => e.stopPropagation()}>
          {task.description && <p style={{ fontSize: '12px', color: '#a3a3a3', margin: '0 0 12px', whiteSpace: 'pre-wrap' }}>{task.description}</p>}
          
          {task.tags?.length > 0 && (
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '12px' }}>
              {task.tags.map((tag: string) => (
                <span key={tag} style={{ ...styles.tag, background: '#262626', color: '#a3a3a3' }}>{tag}</span>
              ))}
            </div>
          )}

          {/* Status buttons */}
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', color: '#525252', marginRight: '4px' }}>Move:</span>
            {statusBtns.filter(s => s.id !== task.status).map(s => (
              <button 
                key={s.id} 
                onClick={() => moveTask(s.id)} 
                title={s.id.replace('_', ' ')}
                style={{ padding: '4px 6px', background: '#171717', border: '1px solid #262626', borderRadius: '3px', cursor: 'pointer', fontSize: '12px' }}
              >
                {s.icon}
              </button>
            ))}
            
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px' }}>
              <button 
                onClick={() => onEdit(task)} 
                title="Edit"
                style={{ padding: '4px 6px', background: '#171717', border: '1px solid #262626', borderRadius: '3px', cursor: 'pointer', fontSize: '12px' }}
              >
                ✏️
              </button>
              <button 
                onClick={() => deleteTask(task.id)} 
                title="Delete"
                style={{ padding: '4px 6px', background: '#171717', border: '1px solid #3f1d1d', borderRadius: '3px', cursor: 'pointer', fontSize: '12px' }}
              >
                🗑
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function TaskModal({ task, onClose, onSave, isEdit }: { task?: any, onClose: () => void, onSave: (task: any) => void, isEdit?: boolean }) {
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    assignee: task?.assignee || '',
    priority: task?.priority || 'medium',
    tags: Array.isArray(task?.tags) ? task.tags.join(', ') : '',
    project: task?.project || ''
  })
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    titleRef.current?.focus()
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) return
    onSave({
      ...(task?.id ? { id: task.id } : {}),
      ...form,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : []
    })
  }

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
            {isEdit ? `Edit Task ${getTaskNumber(task?.id)}` : 'Create Task'}
          </h2>
          <button onClick={onClose} style={{ ...styles.btn, padding: '4px 10px' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', color: '#737373', display: 'block', marginBottom: '6px' }}>Title *</label>
            <input 
              ref={titleRef}
              placeholder="What needs to be done?" 
              value={form.title} 
              onChange={(e) => setForm({...form, title: e.target.value})}
              style={{ padding: '10px 12px', background: '#171717', border: '1px solid #262626', borderRadius: '4px', color: '#e5e5e5', fontSize: '14px', width: '100%', boxSizing: 'border-box' }} 
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', color: '#737373', display: 'block', marginBottom: '6px' }}>Description</label>
            <textarea 
              placeholder="Details, context, links..." 
              value={form.description} 
              onChange={(e) => setForm({...form, description: e.target.value})}
              style={{ padding: '10px 12px', background: '#171717', border: '1px solid #262626', borderRadius: '4px', color: '#e5e5e5', fontSize: '14px', minHeight: '100px', resize: 'vertical', width: '100%', boxSizing: 'border-box' }} 
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', color: '#737373', display: 'block', marginBottom: '6px' }}>Project</label>
              <select 
                value={form.project} 
                onChange={(e) => setForm({...form, project: e.target.value})}
                style={{ padding: '10px 12px', background: '#171717', border: '1px solid #262626', borderRadius: '4px', color: '#e5e5e5', width: '100%' }}
              >
                <option value="">None</option>
                {PROJECTS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#737373', display: 'block', marginBottom: '6px' }}>Priority</label>
              <select 
                value={form.priority} 
                onChange={(e) => setForm({...form, priority: e.target.value})}
                style={{ padding: '10px 12px', background: '#171717', border: '1px solid #262626', borderRadius: '4px', color: '#e5e5e5', width: '100%' }}
              >
                <option value="low">🟢 Low</option>
                <option value="medium">🟡 Medium</option>
                <option value="high">🟠 High</option>
                <option value="critical">🔴 Critical</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
            <div>
              <label style={{ fontSize: '12px', color: '#737373', display: 'block', marginBottom: '6px' }}>Assignee</label>
              <select 
                value={form.assignee} 
                onChange={(e) => setForm({...form, assignee: e.target.value})}
                style={{ padding: '10px 12px', background: '#171717', border: '1px solid #262626', borderRadius: '4px', color: '#e5e5e5', width: '100%' }}
              >
                {ASSIGNEES.map(a => <option key={a.value} value={a.value}>{a.emoji} {a.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#737373', display: 'block', marginBottom: '6px' }}>Tags</label>
              <input 
                placeholder="bug, feature, research" 
                value={form.tags} 
                onChange={(e) => setForm({...form, tags: e.target.value})}
                style={{ padding: '10px 12px', background: '#171717', border: '1px solid #262626', borderRadius: '4px', color: '#e5e5e5', fontSize: '14px', width: '100%', boxSizing: 'border-box' }} 
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={styles.btn}>Cancel</button>
            <button 
              type="submit" 
              disabled={!form.title.trim()}
              style={{ ...styles.btn, background: form.title.trim() ? '#166534' : '#262626', border: '1px solid #166534' }}
            >
              {isEdit ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function KanbanPage() {
  const [kanban, setKanban] = useState<{ tasks: any[], summary: Record<string, number> }>({ tasks: [], summary: {} })
  const [loading, setLoading] = useState(true)
  const [modalTask, setModalTask] = useState<any>(null)
  const [filterProject, setFilterProject] = useState<string>('')
  const [filterAssignee, setFilterAssignee] = useState<string>('')

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

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'n' && !modalTask && !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as Element)?.tagName)) {
        e.preventDefault()
        setModalTask({})
      }
      if (e.key === 'Escape' && modalTask) {
        setModalTask(null)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [modalTask])

  const saveTask = async (taskData: any) => {
    if (taskData.id) {
      await fetch('/api/kanban', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      })
    } else {
      await fetch('/api/kanban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...taskData, status: 'backlog' })
      })
    }
    setModalTask(null)
    fetchKanban()
  }

  const updateTask = async (id: string, updates: any) => {
    await fetch('/api/kanban', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates })
    })
    fetchKanban()
  }

  const deleteTask = async (id: string) => {
    if (!confirm('Delete this task?')) return
    await fetch(`/api/kanban?id=${id}`, { method: 'DELETE' })
    fetchKanban()
  }

  const filteredTasks = kanban.tasks?.filter(t => {
    if (filterProject && t.project !== filterProject) return false
    if (filterAssignee && t.assignee !== filterAssignee) return false
    return true
  }) || []

  return (
    <div style={styles.container}>
      {modalTask !== null && (
        <TaskModal 
          task={modalTask.id ? modalTask : undefined}
          isEdit={!!modalTask.id}
          onClose={() => setModalTask(null)} 
          onSave={saveTask} 
        />
      )}

      <header style={{ borderBottom: '1px solid #262626', padding: '16px 24px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Link href="/" style={{ color: '#525252', textDecoration: 'none', fontSize: '13px' }}>← Dashboard</Link>
              <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>🤖 Agent Portal</h1>
            </div>
            <button onClick={fetchKanban} disabled={loading} style={{ ...styles.btn, background: loading ? '#171717' : '#166534' }}>
              {loading ? '...' : '↻ Refresh'}
            </button>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <Link href="/admin" style={{ ...styles.btn, textDecoration: 'none', color: '#737373' }}>
              🤖 Agents
            </Link>
            <div style={styles.btnActive}>
              📋 Kanban
            </div>
            <Link href="/admin/crons" style={{ ...styles.btn, textDecoration: 'none', color: '#737373' }}>
              ⏰ Crons
            </Link>
            <Link href="/admin/files" style={{ ...styles.btn, textDecoration: 'none', color: '#737373' }}>
              📁 Files
            </Link>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
        {/* Summary row with controls */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
          {columns.map(col => {
            const count = filteredTasks.filter(t => t.status === col.id).length
            return (
              <div key={col.id} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: col.color }} />
                <span style={{ fontSize: '12px', color: '#737373' }}>{col.label}: {count}</span>
              </div>
            )
          })}
          
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <select 
              value={filterProject} 
              onChange={(e) => setFilterProject(e.target.value)}
              style={{ padding: '6px 10px', background: '#171717', border: '1px solid #262626', borderRadius: '4px', color: '#e5e5e5', fontSize: '12px' }}
            >
              <option value="">All Projects</option>
              {PROJECTS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select 
              value={filterAssignee} 
              onChange={(e) => setFilterAssignee(e.target.value)}
              style={{ padding: '6px 10px', background: '#171717', border: '1px solid #262626', borderRadius: '4px', color: '#e5e5e5', fontSize: '12px' }}
            >
              <option value="">All Assignees</option>
              {ASSIGNEES.filter(a => a.value).map(a => <option key={a.value} value={a.value}>{a.emoji} {a.label}</option>)}
            </select>
            <button onClick={() => setModalTask({})} style={{ ...styles.btn, background: '#166534', padding: '6px 12px', fontSize: '12px' }}>
              + New Task
            </button>
          </div>
        </div>

        {/* Project color legend */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {Object.entries(PROJECT_COLORS).map(([project, color]) => (
            <div key={project} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '12px', height: '3px', background: color, borderRadius: '1px' }} />
              <span style={{ fontSize: '10px', color: '#525252' }}>{project}</span>
            </div>
          ))}
        </div>

        {/* Columns */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {columns.map(col => {
            const tasks = filteredTasks.filter(t => t.status === col.id)
            return (
              <div key={col.id} style={{ ...styles.card, borderTop: `2px solid ${col.color}`, minHeight: '300px' }}>
                <div style={{ ...styles.cardTitle, display: 'flex', justifyContent: 'space-between' }}>
                  <span>{col.label}</span>
                  <span style={{ color: col.color }}>{tasks.length}</span>
                </div>
                {tasks.map(task => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    updateTask={updateTask} 
                    deleteTask={deleteTask}
                    onEdit={(t: any) => setModalTask(t)}
                  />
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
