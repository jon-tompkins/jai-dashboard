'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

const styles = {
  container: { background: '#0a0a0a', minHeight: '100vh', color: '#e5e5e5', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif' },
  card: { background: '#0d0d0d', border: '1px solid #262626', borderRadius: '8px', padding: '16px' },
  btn: { padding: '8px 14px', background: '#171717', border: '1px solid #262626', borderRadius: '4px', color: '#e5e5e5', cursor: 'pointer', fontSize: '13px' },
  btnActive: { padding: '8px 14px', background: '#171717', border: '1px solid #404040', borderRadius: '4px', color: '#fff', cursor: 'pointer', fontSize: '13px' },
  btnSmall: { padding: '4px 8px', background: '#171717', border: '1px solid #262626', borderRadius: '4px', color: '#e5e5e5', cursor: 'pointer', fontSize: '11px' },
}

function formatTime(ms: number | undefined): string {
  if (!ms) return '—'
  const date = new Date(ms)
  const now = new Date()
  const diff = ms - now.getTime()
  
  // If in the past, show relative time
  if (diff < 0) {
    const mins = Math.floor(-diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
  
  // If in the future, show relative time
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `in ${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `in ${hours}h`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function formatCron(expr: string): string {
  // Common patterns
  const patterns: Record<string, string> = {
    '0,30 * * * *': 'Every 30 min',
    '0 * * * *': 'Hourly',
    '0 */4 * * *': 'Every 4 hours',
    '0 */6 * * *': 'Every 6 hours',
    '0 12 * * *': 'Daily 12:00 UTC',
    '0 14 * * 1-5': 'Weekdays 14:00 UTC',
    '0 16 * * 1-5': 'Weekdays 16:00 UTC',
    '0 21 * * 1-5': 'Weekdays 21:00 UTC',
    '30 14-20 * * 1-5': 'Weekdays 14:30-20:30 UTC',
  }
  return patterns[expr] || expr
}

function CronRow({ job, onAction }: { job: any, onAction: (action: string, jobId: string) => void }) {
  const [expanded, setExpanded] = useState(false)
  const [running, setRunning] = useState(false)
  
  const handleRun = async () => {
    setRunning(true)
    await onAction('run', job.id)
    setRunning(false)
  }
  
  const statusColor = job.state?.lastStatus === 'ok' ? '#22c55e' : job.state?.lastStatus === 'error' ? '#ef4444' : '#737373'
  
  return (
    <div style={{ ...styles.card, marginBottom: '8px', opacity: job.enabled ? 1 : 0.5 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Enable toggle */}
        <button
          onClick={() => onAction(job.enabled ? 'disable' : 'enable', job.id)}
          style={{
            width: '36px', height: '20px', borderRadius: '10px', border: 'none', cursor: 'pointer',
            background: job.enabled ? '#166534' : '#262626', position: 'relative', flexShrink: 0
          }}
        >
          <div style={{
            width: '16px', height: '16px', borderRadius: '50%', background: '#fff',
            position: 'absolute', top: '2px', transition: 'left 0.2s',
            left: job.enabled ? '18px' : '2px'
          }} />
        </button>
        
        {/* Name and schedule */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 500, fontSize: '14px' }}>{job.name}</span>
            <span style={{ fontSize: '11px', color: '#525252', fontFamily: 'monospace' }}>
              {formatCron(job.schedule?.expr)}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '16px', fontSize: '11px', color: '#737373', marginTop: '2px' }}>
            <span>Last: <span style={{ color: statusColor }}>{formatTime(job.state?.lastRunAtMs)}</span></span>
            <span>Next: {formatTime(job.state?.nextRunAtMs)}</span>
            {job.state?.lastDurationMs !== undefined && (
              <span>{job.state.lastDurationMs}ms</span>
            )}
          </div>
        </div>
        
        {/* Actions */}
        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
          <button 
            onClick={handleRun} 
            disabled={running || !job.enabled}
            style={{ ...styles.btnSmall, background: '#166534', opacity: running || !job.enabled ? 0.5 : 1 }}
          >
            {running ? '...' : '▶ Run'}
          </button>
          <button 
            onClick={() => setExpanded(!expanded)} 
            style={styles.btnSmall}
          >
            {expanded ? '▲' : '▼'}
          </button>
        </div>
      </div>
      
      {expanded && (
        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #262626' }}>
          <div style={{ fontSize: '11px', color: '#525252', marginBottom: '4px' }}>Payload:</div>
          <pre style={{ 
            fontSize: '11px', color: '#a3a3a3', margin: 0, padding: '8px', 
            background: '#0a0a0a', borderRadius: '4px', whiteSpace: 'pre-wrap', 
            wordBreak: 'break-word', maxHeight: '200px', overflow: 'auto'
          }}>
            {job.payload?.text || JSON.stringify(job.payload, null, 2)}
          </pre>
          <div style={{ marginTop: '8px', fontSize: '10px', color: '#525252', fontFamily: 'monospace' }}>
            ID: {job.id}
          </div>
        </div>
      )}
    </div>
  )
}

export default function CronsPage() {
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchJobs = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/crons')
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        setJobs(data.jobs || [])
      }
    } catch (e: any) {
      setError(e.message)
    }
    setLoading(false)
  }

  useEffect(() => { fetchJobs() }, [])

  const handleAction = async (action: string, jobId: string) => {
    try {
      await fetch('/api/crons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, jobId })
      })
      // Refresh after action
      setTimeout(fetchJobs, 500)
    } catch (e) {
      console.error(e)
    }
  }

  // Sort: enabled first, then by next run
  const sortedJobs = [...jobs].sort((a, b) => {
    if (a.enabled !== b.enabled) return a.enabled ? -1 : 1
    return (a.state?.nextRunAtMs || 0) - (b.state?.nextRunAtMs || 0)
  })

  const enabledCount = jobs.filter(j => j.enabled).length

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
            <button onClick={fetchJobs} disabled={loading} style={{ ...styles.btn, background: loading ? '#171717' : '#166534' }}>
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
            <div style={styles.btnActive}>
              ⏰ Crons
            </div>
            <Link href="/admin/files" style={{ ...styles.btn, textDecoration: 'none', color: '#737373' }}>
              📁 Files
            </Link>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
        {/* Summary */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: '#737373' }}>
            {enabledCount} active / {jobs.length} total
          </span>
        </div>

        {error && (
          <div style={{ ...styles.card, borderColor: '#ef4444', marginBottom: '16px' }}>
            <span style={{ color: '#ef4444' }}>Error: {error}</span>
            <p style={{ fontSize: '12px', color: '#737373', margin: '8px 0 0' }}>
              Make sure CLAWDBOT_GATEWAY_URL and CLAWDBOT_GATEWAY_TOKEN are set in Vercel env vars.
            </p>
          </div>
        )}

        {loading && jobs.length === 0 ? (
          <div style={{ ...styles.card, textAlign: 'center', padding: '48px', color: '#737373' }}>
            Loading crons...
          </div>
        ) : (
          <div>
            {sortedJobs.map(job => (
              <CronRow key={job.id} job={job} onAction={handleAction} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
