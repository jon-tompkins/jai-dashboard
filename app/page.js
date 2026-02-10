'use client';
import React, { useState, useEffect } from 'react';

const SUPABASE_URL = "https://lsqlqssigerzghlxfxjl.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzcWxxc3NpZ2VyemdobHhmeGpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1NDA5NTEsImV4cCI6MjA4NTExNjk1MX0.jqoZUtW_gb8rehPteVgjmLLLlPRLYV-0fNJkpLGcf-s";

const TRADE_COLORS = {
  'uranium-nuclear': '#3fb950',
  'lithium': '#58a6ff', 
  'silver-short': '#f85149',
  'energy-capex': '#d29922',
  'defense-drones': '#a371f7',
  'crypto-core': '#8957e5',
  'tech-semis': '#79c0ff',
  'hedges': '#da3633',
  'ai-victims': '#da3633'
};

const styles = {
  // Responsive container - uses CSS class for padding
  container: { 
    background: '#0d1117', 
    minHeight: '100vh', 
    color: '#e6edf3', 
    padding: 'clamp(12px, 3vw, 24px)', // Responsive padding
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif' 
  },
  // Header uses CSS class for responsive layout
  header: { 
    marginBottom: '24px', 
    paddingBottom: '16px', 
    borderBottom: '1px solid #30363d' 
  },
  // Tabs - horizontal scroll on mobile via CSS class
  tabs: { 
    marginBottom: '20px',
    paddingBottom: '8px',
  },
  tab: { 
    padding: '8px 14px', 
    background: '#0d0d0d', 
    border: '1px solid #262626', 
    borderRadius: '4px', 
    cursor: 'pointer', 
    color: '#737373',
    whiteSpace: 'nowrap',
    minHeight: '40px',
    display: 'flex',
    alignItems: 'center',
    fontSize: '13px',
  },
  tabActive: { 
    padding: '8px 14px', 
    background: '#171717', 
    border: '1px solid #404040', 
    borderRadius: '4px', 
    cursor: 'pointer', 
    color: '#fff',
    whiteSpace: 'nowrap',
    minHeight: '40px',
    display: 'flex',
    alignItems: 'center',
    fontSize: '13px',
  },
  // Responsive grid - uses CSS class
  grid: { 
    display: 'grid', 
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', // min() prevents overflow
    gap: '16px' 
  },
  card: { 
    background: '#0d0d0d', 
    border: '1px solid #262626', 
    borderRadius: '4px', 
    padding: 'clamp(12px, 2vw, 16px)'
  },
  cardTitle: { 
    fontSize: '12px', 
    color: '#737373', 
    textTransform: 'uppercase', 
    letterSpacing: '0.5px', 
    marginBottom: '12px', 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '8px',
    fontWeight: '500',
  },
  bigNum: { fontSize: 'clamp(24px, 5vw, 28px)', fontWeight: '600' },
  green: { color: '#3fb950' },
  red: { color: '#f85149' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '13px', marginTop: '12px' },
  th: { textAlign: 'left', padding: '8px 4px', borderBottom: '1px solid #262626', color: '#737373', fontWeight: '500', whiteSpace: 'nowrap', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' },
  thRight: { textAlign: 'right', padding: '8px 4px', borderBottom: '1px solid #262626', color: '#737373', fontWeight: '500', whiteSpace: 'nowrap', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' },
  td: { padding: '8px 4px', borderBottom: '1px solid #1a1a1a' },
  tdRight: { textAlign: 'right', padding: '8px 4px', borderBottom: '1px solid #1a1a1a', fontVariantNumeric: 'tabular-nums' },
  tag: { display: 'inline-block', padding: '2px 8px', borderRadius: '3px', fontSize: '11px', marginRight: '4px' },
  btn: { 
    padding: '8px 14px', 
    background: '#171717', 
    border: '1px solid #262626', 
    borderRadius: '4px', 
    color: '#e6edf3', 
    cursor: 'pointer', 
    fontSize: '13px',
    minHeight: '40px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Uses CSS class for responsive layout
  researchGrid: { gap: '16px' },
  researchItem: { 
    padding: '12px', 
    margin: '4px 0', 
    background: '#0d1117', 
    border: '1px solid #30363d', 
    borderRadius: '6px', 
    cursor: 'pointer',
    minHeight: '44px', // Touch-friendly
  },
  convictionBar: { display: 'flex', gap: '2px' },
  convictionDot: { width: '10px', height: '10px', borderRadius: '50%', background: '#30363d' },
  convictionDotFilled: { width: '10px', height: '10px', borderRadius: '50%', background: '#3fb950' },
  pieContainer: { position: 'relative', width: '180px', height: '180px' },
  // Uses CSS class for responsive layout
  summaryGrid: { gap: '24px', alignItems: 'start' },
};

function formatMoney(n, isPublic = false) { 
  if (isPublic) return '***';
  return '$' + (n || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }); 
}
function formatPct(n) { return (n >= 0 ? '+' : '') + (n * 100).toFixed(1) + '%'; }
function renderMarkdown(text) {
  if (!text) return '';
  
  // First, handle tables
  let result = text.replace(/(?:^|\n)((?:\|[^\n]+\|\n)+)/g, (match, tableBlock) => {
    const lines = tableBlock.trim().split('\n').filter(l => l.trim());
    if (lines.length < 2) return match;
    
    const parseRow = (line) => line.split('|').slice(1, -1).map(c => c.trim());
    const headers = parseRow(lines[0]);
    const isSeparator = (line) => /^\|[\s\-:|]+\|$/.test(line);
    const dataStartIdx = isSeparator(lines[1]) ? 2 : 1;
    const dataRows = lines.slice(dataStartIdx).map(parseRow);
    
    const tableStyle = 'width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px;';
    const thStyle = 'padding: 8px; border: 1px solid #30363d; background: #161b22; text-align: left; color: #8b949e;';
    const tdStyle = 'padding: 8px; border: 1px solid #30363d;';
    
    return `<table style="${tableStyle}"><thead><tr>${headers.map(h => `<th style="${thStyle}">${h}</th>`).join('')}</tr></thead><tbody>${dataRows.map(row => `<tr>${row.map(c => `<td style="${tdStyle}">${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  });
  
  return result
    .replace(/^### (.+)$/gm, '<h4 style="color: #58a6ff; margin: 16px 0 8px;">$1</h4>')
    .replace(/^## (.+)$/gm, '<h3 style="color: #e6edf3; margin: 20px 0 10px; border-bottom: 1px solid #30363d; padding-bottom: 6px;">$1</h3>')
    .replace(/^# (.+)$/gm, '<h2 style="font-size: 20px; margin: 0 0 16px;">$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li style="margin: 4px 0; margin-left: 20px;">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li style="margin: 4px 0; margin-left: 20px;">$2</li>')
    .replace(/\n\n/g, '<br><br>');
}

function ConvictionDots({ level }) {
  return (
    <div style={styles.convictionBar}>
      {[1,2,3,4,5].map(i => (
        <div key={i} style={i <= (level || 0) ? styles.convictionDotFilled : styles.convictionDot} />
      ))}
    </div>
  );
}

function HoldingsRow({ holding, s, publicScreenshot, formatMoney, formatPct, liveQuotes }) {
  const [expanded, setExpanded] = useState(false);
  const quote = liveQuotes?.[holding.symbol] || {};
  const dayChange = quote.changePercent;
  
  return (
    <React.Fragment>
      <tr style={{ cursor: holding.expandable ? 'pointer' : 'default' }} onClick={() => holding.expandable && setExpanded(!expanded)}>
        <td style={styles.td}>
          <strong>{holding.symbol}</strong>
          {holding.expandable && <span style={{ marginLeft: '8px', color: '#8b949e' }}>{expanded ? '▼' : '▶'}</span>}
        </td>
        <td style={styles.td}>
          <span style={{...styles.tag, background: 
            holding.type === 'EQUITY' ? '#238636' :
            holding.type === 'CRYPTO' ? '#8957e5' :
            holding.type === 'CASH' ? '#8b949e' :
            holding.type === 'OPTIONS' ? '#d29922' : '#a371f7'
          }}>{holding.type}</span>
        </td>
        <td style={styles.tdRight}>{quote.price ? `$${quote.price.toFixed(2)}` : `$${holding.price?.toFixed(2)}`}</td>
        <td style={{...styles.tdRight, color: dayChange > 0 ? '#3fb950' : dayChange < 0 ? '#f85149' : '#8b949e'}}>
          {dayChange !== undefined ? `${dayChange >= 0 ? '+' : ''}${dayChange.toFixed(2)}%` : '—'}
        </td>
        <td style={styles.tdRight}>{formatMoney(holding.value)}</td>
        <td style={{...styles.tdRight, ...(holding.pl >= 0 ? styles.green : styles.red)}}>
          {formatMoney(holding.pl)} ({formatPct(holding.plPct)})
        </td>
        <td style={styles.td}>
          {publicScreenshot && holding.data && (
            <span style={{ color: '#8b949e', fontSize: '11px' }}>
              {holding.type === 'EQUITY' && `${((holding.data.units * holding.data.price) / s.total * 100).toFixed(1)}%`}
              {holding.type === 'CRYPTO' && `${(holding.data.value / s.total * 100).toFixed(1)}%`}
              {holding.type === 'CASH' && `${(holding.data.value / s.total * 100).toFixed(1)}%`}
              {holding.type === 'OPTIONS' && `${(holding.data.value / s.total * 100).toFixed(1)}%`}
              {holding.type === 'COMBINED' && `${(holding.data.value / s.total * 100).toFixed(1)}%`}
            </span>
          )}
        </td>
      </tr>
      {expanded && holding.expandable && (
        <tr>
          <td colSpan="7" style={{...styles.td, background: '#0d1117', padding: '12px' }}>
            <table style={{...styles.table, margin: 0, fontSize: '12px' }}>
              <tbody>
                {holding.data.equity && (
                  <tr>
                    <td style={{...styles.td, border: 'none', padding: '4px 8px' }}>
                      <span style={{...styles.tag, background: '#238636', fontSize: '10px' }}>EQUITY</span>
                      <strong>{holding.data.equity.symbol}</strong>
                    </td>
                    <td style={{...styles.td, border: 'none', padding: '4px 8px' }}>
                      {publicScreenshot ? 
                        `${(holding.data.equity.value / holding.data.value * 100).toFixed(1)}%` :
                        `${holding.data.equity.units} shares`
                      }
                    </td>
                    <td style={{...styles.td, border: 'none', padding: '4px 8px' }}>
                      ${holding.data.equity.price?.toFixed(2)}
                    </td>
                    <td style={{...styles.td, border: 'none', padding: '4px 8px' }}>
                      {formatMoney(holding.data.equity.value)}
                    </td>
                    <td style={{...styles.td, border: 'none', padding: '4px 8px' }}>
                      {formatMoney(holding.data.equity.value)}
                    </td>
                    <td style={{...styles.td, border: 'none', padding: '4px 8px', ...(holding.data.equity.pl >= 0 ? styles.green : styles.red) }}>
                      {formatMoney(holding.data.equity.pl)} ({formatPct(holding.data.equity.plPct)})
                    </td>
                  </tr>
                )}
                {holding.data.options?.map((o, j) => (
                  <tr key={j}>
                    <td style={{...styles.td, border: 'none', padding: '4px 8px' }}>
                      <span style={{...styles.tag, background: o.type === 'CALL' ? '#238636' : '#da3633', fontSize: '10px' }}>
                        {o.type}
                      </span>
                      <strong>{o.contract}</strong>
                    </td>
                    <td style={{...styles.td, border: 'none', padding: '4px 8px' }}>
                      {publicScreenshot ? 
                        `${(o.value / holding.data.value * 100).toFixed(1)}%` :
                        `${o.qty} contracts`
                      }
                    </td>
                    <td style={{...styles.td, border: 'none', padding: '4px 8px' }}>
                      ${o.strike}
                    </td>
                    <td style={{...styles.td, border: 'none', padding: '4px 8px' }}>
                      {formatMoney(o.value)}
                    </td>
                    <td style={{...styles.td, border: 'none', padding: '4px 8px' }}>
                      {formatMoney(o.notional)}
                    </td>
                    <td style={{...styles.td, border: 'none', padding: '4px 8px' }}>
                      {formatMoney(o.value)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </td>
        </tr>
      )}
    </React.Fragment>
  );
}

function PieChart({ data }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) return <div style={{ ...styles.pieContainer, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b949e' }}>No positions</div>;
  
  let cumulative = 0;
  const slices = data.filter(d => d.value > 0).map(d => {
    const start = cumulative;
    cumulative += (d.value / total) * 360;
    return { ...d, start, end: cumulative };
  });

  const createSlicePath = (startAngle, endAngle, radius = 80) => {
    const start = { x: 90 + radius * Math.cos((startAngle - 90) * Math.PI / 180), y: 90 + radius * Math.sin((startAngle - 90) * Math.PI / 180) };
    const end = { x: 90 + radius * Math.cos((endAngle - 90) * Math.PI / 180), y: 90 + radius * Math.sin((endAngle - 90) * Math.PI / 180) };
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `M 90 90 L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
  };

  return (
    <svg width="180" height="180" viewBox="0 0 180 180">
      {slices.map((slice, i) => (
        <path key={i} d={createSlicePath(slice.start, slice.end)} fill={slice.color} stroke="#0d1117" strokeWidth="2" />
      ))}
      <circle cx="90" cy="90" r="40" fill="#0d1117" />
      <text x="90" y="85" textAnchor="middle" fill="#e6edf3" fontSize="16" fontWeight="bold">{formatMoney(total)}</text>
      <text x="90" y="102" textAnchor="middle" fill="#8b949e" fontSize="11">Total</text>
    </svg>
  );
}

// Helper to format task age
function formatTaskAge(dateStr) {
  if (!dateStr) return '';
  const created = new Date(dateStr);
  const now = new Date();
  const diffMs = now - created;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return created.toLocaleDateString();
}

// Task Card Component with inline editing
function TaskCard({ task, status, updateTask, deleteTask, styles }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDesc, setEditDesc] = useState(task.description || '');
  const [showMoveMenu, setShowMoveMenu] = useState(false);

  const saveEdit = () => {
    updateTask(task.id, { title: editTitle, description: editDesc });
    setIsEditing(false);
  };

  const cancelEdit = () => {
    setEditTitle(task.title);
    setEditDesc(task.description || '');
    setIsEditing(false);
  };

  const moveTask = (newStatus) => {
    updateTask(task.id, { status: newStatus });
    setShowMoveMenu(false);
  };

  const priorityColor = task.priority === 'high' ? '#da3633' : task.priority === 'medium' ? '#d29922' : '#238636';
  const assigneeColor = task.assignee === 'scout' ? '#8957e5' : '#d29922';

  return (
    <div 
      style={{ 
        padding: '12px', 
        background: '#161b22', 
        border: `1px solid ${task.priority === 'high' ? '#da3633' : '#30363d'}`, 
        borderRadius: '6px',
        borderLeft: `3px solid ${priorityColor}`,
      }}
    >
      {isEditing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            style={{ padding: '8px', background: '#0d1117', border: '1px solid #30363d', borderRadius: '4px', color: '#e6edf3', fontSize: '14px', fontWeight: 500 }}
            autoFocus
          />
          <textarea
            value={editDesc}
            onChange={(e) => setEditDesc(e.target.value)}
            placeholder="Description..."
            style={{ padding: '8px', background: '#0d1117', border: '1px solid #30363d', borderRadius: '4px', color: '#e6edf3', fontSize: '12px', minHeight: '50px', resize: 'vertical' }}
          />
          <div style={{ display: 'flex', gap: '6px' }}>
            <button onClick={saveEdit} style={{ padding: '4px 10px', background: '#238636', border: 'none', borderRadius: '4px', color: '#fff', cursor: 'pointer', fontSize: '12px' }}>Save</button>
            <button onClick={cancelEdit} style={{ padding: '4px 10px', background: '#21262d', border: '1px solid #30363d', borderRadius: '4px', color: '#e6edf3', cursor: 'pointer', fontSize: '12px' }}>Cancel</button>
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
            <div style={{ fontWeight: 500, flex: 1, cursor: 'pointer' }} onClick={() => setIsEditing(true)}>{task.title}</div>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button 
                onClick={() => setIsEditing(true)} 
                title="Edit"
                style={{ padding: '2px 6px', background: 'transparent', border: 'none', color: '#8b949e', cursor: 'pointer', fontSize: '12px' }}
              >✏️</button>
              <button 
                onClick={() => deleteTask(task.id)} 
                title="Delete"
                style={{ padding: '2px 6px', background: 'transparent', border: 'none', color: '#f85149', cursor: 'pointer', fontSize: '12px' }}
              >🗑️</button>
            </div>
          </div>
          {task.description && (
            <div 
              style={{ fontSize: '12px', color: '#8b949e', marginBottom: '8px', cursor: 'pointer' }} 
              onClick={() => setIsEditing(true)}
            >
              {task.description.slice(0, 120)}{task.description.length > 120 ? '...' : ''}
            </div>
          )}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '6px' }}>
            {task.assignee && <span style={{...styles.tag, background: assigneeColor}}>{task.assignee === 'scout' ? '🔭' : '🔨'} {task.assignee}</span>}
            <span style={{...styles.tag, background: priorityColor, fontSize: '10px'}}>{task.priority}</span>
            {task.session_key && <span style={{ fontSize: '10px', color: '#3fb950' }}>⚡ Running</span>}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', color: '#6e7681' }}>{formatTaskAge(task.created_at)}</span>
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setShowMoveMenu(!showMoveMenu)}
                style={{ padding: '4px 8px', background: '#21262d', border: '1px solid #30363d', borderRadius: '4px', color: '#e6edf3', cursor: 'pointer', fontSize: '11px' }}
              >
                Move →
              </button>
              {showMoveMenu && (
                <div style={{ 
                  position: 'absolute', 
                  right: 0, 
                  top: '100%', 
                  marginTop: '4px',
                  background: '#161b22', 
                  border: '1px solid #30363d', 
                  borderRadius: '6px', 
                  zIndex: 100,
                  minWidth: '120px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
                }}>
                  {['backlog', 'ready', 'in_progress', 'done'].filter(s => s !== status).map(s => (
                    <div 
                      key={s} 
                      onClick={() => moveTask(s)}
                      style={{ 
                        padding: '8px 12px', 
                        cursor: 'pointer', 
                        fontSize: '12px',
                        borderBottom: '1px solid #30363d',
                        color: '#e6edf3'
                      }}
                      onMouseEnter={(e) => e.target.style.background = '#21262d'}
                      onMouseLeave={(e) => e.target.style.background = 'transparent'}
                    >
                      {s === 'in_progress' ? '🔄 In Progress' : s === 'backlog' ? '📥 Backlog' : s === 'ready' ? '✅ Ready' : '✨ Done'}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          {task.result && (
            <div style={{ marginTop: '8px', padding: '8px', background: '#0d1117', borderRadius: '4px', fontSize: '11px', color: '#8b949e' }}>
              <strong>Result:</strong> {task.result.slice(0, 150)}{task.result.length > 150 ? '...' : ''}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Full Kanban Board Component
function KanbanBoard({ kanban, newTask, setNewTask, addTask, updateTask, deleteTask, fetchKanban, styles }) {
  const [showAddForm, setShowAddForm] = useState(false);

  const columns = [
    { id: 'backlog', label: '📥 Backlog', color: '#8b949e' },
    { id: 'ready', label: '✅ Ready', color: '#58a6ff' },
    { id: 'in_progress', label: '🔄 In Progress', color: '#d29922' },
    { id: 'done', label: '✨ Done', color: '#3fb950' },
  ];

  const handleAddTask = () => {
    addTask();
    setShowAddForm(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header with stats */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {columns.map(col => (
            <div key={col.id} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: col.color }} />
              <span style={{ fontSize: '12px', color: '#8b949e' }}>{kanban.summary?.[col.id] || 0}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            style={{...styles.btn, background: showAddForm ? '#21262d' : '#238636'}} 
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? '✕ Cancel' : '➕ Add Task'}
          </button>
          <button style={styles.btn} onClick={fetchKanban}>🔄</button>
        </div>
      </div>

      {/* Add Task Form - Collapsible */}
      {showAddForm && (
        <div style={{...styles.card, background: '#0d1117', border: '1px solid #238636'}}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input 
              placeholder="Task title..."
              value={newTask.title}
              onChange={(e) => setNewTask({...newTask, title: e.target.value})}
              onKeyDown={(e) => e.key === 'Enter' && newTask.title && handleAddTask()}
              style={{ padding: '10px', background: '#161b22', border: '1px solid #30363d', borderRadius: '6px', color: '#e6edf3', fontSize: '14px' }}
              autoFocus
            />
            <textarea 
              placeholder="Description (optional)..."
              value={newTask.description}
              onChange={(e) => setNewTask({...newTask, description: e.target.value})}
              style={{ padding: '10px', background: '#161b22', border: '1px solid #30363d', borderRadius: '6px', color: '#e6edf3', fontSize: '14px', minHeight: '60px', resize: 'vertical' }}
            />
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              <select 
                value={newTask.assignee || ''}
                onChange={(e) => setNewTask({...newTask, assignee: e.target.value || null})}
                style={{ padding: '8px', background: '#161b22', border: '1px solid #30363d', borderRadius: '6px', color: '#e6edf3', minHeight: '40px' }}
              >
                <option value="">Unassigned</option>
                <option value="scout">🔭 Scout</option>
                <option value="builder">🔨 Builder</option>
              </select>
              <select 
                value={newTask.priority}
                onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
                style={{ padding: '8px', background: '#161b22', border: '1px solid #30363d', borderRadius: '6px', color: '#e6edf3', minHeight: '40px' }}
              >
                <option value="low">🟢 Low</option>
                <option value="medium">🟡 Medium</option>
                <option value="high">🔴 High</option>
              </select>
              <button 
                style={{...styles.btn, background: '#238636', opacity: newTask.title ? 1 : 0.5}} 
                onClick={handleAddTask}
                disabled={!newTask.title}
              >
                Add Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Kanban Columns - Stack vertically on mobile */}
      <div className="kanban-board" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
        gap: '12px',
      }}>
        {columns.map(col => {
          const tasks = kanban.tasks?.filter(t => t.status === col.id) || [];
          return (
            <div 
              key={col.id} 
              style={{
                ...styles.card, 
                background: '#0d1117',
                borderTop: `3px solid ${col.color}`,
                minHeight: '200px',
              }}
            >
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: '12px',
                paddingBottom: '8px',
                borderBottom: '1px solid #21262d'
              }}>
                <span style={{ fontWeight: 600, fontSize: '14px' }}>{col.label}</span>
                <span style={{
                  ...styles.tag, 
                  background: col.color + '33', 
                  color: col.color,
                  fontWeight: 600
                }}>
                  {tasks.length}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {tasks.map(task => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    status={col.id}
                    updateTask={updateTask} 
                    deleteTask={deleteTask}
                    styles={styles}
                  />
                ))}
                {tasks.length === 0 && (
                  <div style={{ 
                    padding: '20px', 
                    color: '#6e7681', 
                    fontSize: '13px', 
                    textAlign: 'center',
                    background: '#161b2211',
                    borderRadius: '6px',
                    border: '1px dashed #30363d'
                  }}>
                    No tasks
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [tab, setTab] = useState('portfolio');
  const [portfolio, setPortfolio] = useState(null);
  const [trades, setTrades] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [priceRefreshing, setPriceRefreshing] = useState(false);
  const [lastPriceRefresh, setLastPriceRefresh] = useState(null);
  const [liveQuotes, setLiveQuotes] = useState({});
  const [reports, setReports] = useState([]);
  const [newsletters, setNewsletters] = useState([]);
  const [selected, setSelected] = useState(null);
  const [selectedNewsletter, setSelectedNewsletter] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [editingAsset, setEditingAsset] = useState(null);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [assetTarget, setAssetTarget] = useState('');
  const [assetStop, setAssetStop] = useState('');
  const [fitness, setFitness] = useState(null);
  const [chartToggles, setChartToggles] = useState({});
  const [workoutLogs, setWorkoutLogs] = useState({ metrics: [], logs: [] });
  const [showWorkoutForm, setShowWorkoutForm] = useState(false);
  const [workoutForm, setWorkoutForm] = useState({ date: new Date().toISOString().split('T')[0], type: 'upper', description: '', body_weight: '', duration_min: '', notes: '', trackedMetrics: [] });
  const [workoutFilter, setWorkoutFilter] = useState({ type: 'all', tracked: 'all' });
  const [publicScreenshot, setPublicScreenshot] = useState(false);
  const [reviewFiles, setReviewFiles] = useState([]);
  const [selectedReviewFile, setSelectedReviewFile] = useState(null);
  const [reviewContent, setReviewContent] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reportsListOpen, setReportsListOpen] = useState(true);
  const [juntoSettings, setJuntoSettings] = useState(null);
  const [juntoStatus, setJuntoStatus] = useState(null);
  const [juntoLoading, setJuntoLoading] = useState(false);
  const [kanban, setKanban] = useState({ tasks: [], summary: {} });
  const [newTask, setNewTask] = useState({ title: '', description: '', assignee: null, priority: 'medium' });
  const [userSchedule, setUserSchedule] = useState(null);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewsSummary, setReviewsSummary] = useState({});
  const [selectedReview, setSelectedReview] = useState(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [research, setResearch] = useState([]);
  const [selectedResearch, setSelectedResearch] = useState(null);
  const [researchContent, setResearchContent] = useState(null);
  const [researchLoading, setResearchLoading] = useState(false);
  const [allPositions, setAllPositions] = useState({ positions: [], trades: [] });
  const [positionsLoading, setPositionsLoading] = useState(false);
  const [positionsSort, setPositionsSort] = useState({ field: 'value', dir: 'desc' });
  const [tradeListView, setTradeListView] = useState(true);
  const [excludedTrades, setExcludedTrades] = useState({});
  const [editingTrade, setEditingTrade] = useState(null);
  const [expandedTrades, setExpandedTrades] = useState({});
  const [expandedUnderlyings, setExpandedUnderlyings] = useState({});
  const [showAddTrade, setShowAddTrade] = useState(false);
  const [newTradeForm, setNewTradeForm] = useState({ name: '', thesis: '', direction: 'long', timeframe: 'medium', conviction: 3, status: 'active' });

  // Wrapper that uses component state
  const fmtMoney = (n) => formatMoney(n, publicScreenshot);

  useEffect(() => { fetchFitness(); fetchWorkoutLogs(); }, []);
  useEffect(() => { if (tab === 'tasks') fetchKanban(); }, [tab]);
  useEffect(() => { if (tab === 'settings') fetchUserSchedule(); }, [tab]);
  useEffect(() => { if (tab === 'reviews') fetchReviews(); }, [tab]);
  useEffect(() => { if (tab === 'positions' || tab === 'trades') fetchAllPositions(); }, [tab]);
  useEffect(() => { if (tab === 'research') fetchResearch(); }, [tab]);

  function toggleChart(key) {
    setChartToggles(prev => ({ ...prev, [key]: !prev[key] }));
  }

  async function fetchFitness() {
    try {
      const res = await fetch('/api/fitness');
      const data = await res.json();
      setFitness(data);
    } catch (e) { console.error(e); }
  }

  async function fetchWorkoutLogs() {
    try {
      const res = await fetch('/api/workouts');
      const data = await res.json();
      setWorkoutLogs(data);
    } catch (e) { console.error(e); }
  }

  async function saveWorkout() {
    try {
      await fetch('/api/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workoutForm)
      });
      setShowWorkoutForm(false);
      setWorkoutForm({ date: new Date().toISOString().split('T')[0], type: 'upper', description: '', body_weight: '', duration_min: '', notes: '', trackedMetrics: [] });
      fetchWorkoutLogs();
      fetchFitness();
    } catch (e) { console.error(e); }
  }

  function toggleTrackedMetric(metric) {
    const existing = workoutForm.trackedMetrics.find(m => m.metric_id === metric.id);
    if (existing) {
      setWorkoutForm({ ...workoutForm, trackedMetrics: workoutForm.trackedMetrics.filter(m => m.metric_id !== metric.id) });
    } else {
      setWorkoutForm({ ...workoutForm, trackedMetrics: [...workoutForm.trackedMetrics, { metric_id: metric.id, name: metric.name, calc_type: metric.calc_type, value: '', reps: '', sets: 1 }] });
    }
  }

  function updateTrackedMetric(metricId, field, value) {
    setWorkoutForm({
      ...workoutForm,
      trackedMetrics: workoutForm.trackedMetrics.map(m => m.metric_id === metricId ? { ...m, [field]: value } : m)
    });
  }

  useEffect(() => { 
    fetchPortfolio(); 
    fetchReports(); 
    fetchTrades();
    fetchAssets();
    fetchNewsletters();
    fetchReviewFiles();
  }, []);

  async function fetchPortfolio() {
    setLoading(true);
    try {
      const res = await fetch('/api/portfolio');
      const data = await res.json();
      setPortfolio(data);
      setLastRefresh(new Date());
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function refreshPrices() {
    setPriceRefreshing(true);
    try {
      const res = await fetch('/api/prices?update=true');
      const data = await res.json();
      if (data.error) {
        alert('Price refresh error: ' + data.error + (data.hint ? '\n' + data.hint : ''));
      } else {
        setLastPriceRefresh(new Date());
        setLiveQuotes(data.quotes || {});
        // Refresh portfolio to show updated prices
        fetchPortfolio();
      }
    } catch (e) { 
      console.error(e);
      alert('Price refresh failed: ' + e.message);
    }
    setPriceRefreshing(false);
  }

  async function fetchReports() {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/research?select=*&order=updated_at.desc`, {
        headers: { 'apikey': SUPABASE_ANON }
      });
      const data = await res.json();
      setReports(data);
      if (data.length > 0) setSelected(data[0]);
    } catch (e) { console.error(e); }
  }

  async function fetchTrades() {
    try {
      const res = await fetch('/api/trades');
      const data = await res.json();
      setTrades(data.trades || []);
    } catch (e) { console.error(e); }
  }

  async function fetchAllPositions() {
    setPositionsLoading(true);
    try {
      const res = await fetch('/api/positions');
      const data = await res.json();
      setAllPositions(data);
    } catch (e) { console.error(e); }
    setPositionsLoading(false);
  }

  async function updatePositionTrade(id, table, tradeId) {
    try {
      const res = await fetch('/api/positions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, table, tradeId })
      });
      
      if (res.ok) {
        fetchAllPositions();
        fetchTrades();
        fetchPortfolio();
      } else {
        console.error('Failed to update position trade');
      }
    } catch (e) { console.error(e); }
  }

  async function createTrade() {
    if (!newTradeForm.name) return;
    
    try {
      const res = await fetch('/api/trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTradeForm)
      });
      
      if (res.ok) {
        setNewTradeForm({ name: '', thesis: '', direction: 'long', timeframe: 'medium', conviction: 3, status: 'active' });
        setShowAddTrade(false);
        fetchTrades();
        fetchAllPositions();
      } else {
        console.error('Failed to create trade');
        alert('Failed to create trade - check console for details');
      }
    } catch (e) { 
      console.error(e); 
      alert('Error creating trade: ' + e.message);
    }
  }

  async function updateTrade() {
    if (!editingTrade?.id || !newTradeForm.name) return;
    
    try {
      const res = await fetch('/api/trades', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingTrade.id, ...newTradeForm })
      });
      
      if (res.ok) {
        setNewTradeForm({ name: '', thesis: '', direction: 'long', timeframe: 'medium', conviction: 3, status: 'active' });
        setEditingTrade(null);
        fetchTrades();
        fetchAllPositions();
      } else {
        console.error('Failed to update trade');
        alert('Failed to update trade - check console for details');
      }
    } catch (e) { 
      console.error(e); 
      alert('Error updating trade: ' + e.message);
    }
  }

  function toggleTradeExpanded(tradeId) {
    setExpandedTrades(prev => ({ ...prev, [tradeId]: !prev[tradeId] }));
  }

  async function fetchAssets() {
    try {
      const res = await fetch('/api/assets');
      const data = await res.json();
      setAssets(data.assets || []);
    } catch (e) { console.error(e); }
  }

  async function fetchNewsletters() {
    try {
      const res = await fetch('/api/newsletters');
      const data = await res.json();
      setNewsletters(data.newsletters || []);
      if (data.newsletters?.length > 0) setSelectedNewsletter(data.newsletters[0]);
    } catch (e) { console.error(e); }
  }

  async function fetchReviewFiles() {
    try {
      const res = await fetch('/api/review');
      const data = await res.json();
      setReviewFiles(data.files || []);
    } catch (e) { console.error(e); }
  }

  async function fetchReviewContent(filePath) {
    setReviewLoading(true);
    try {
      const res = await fetch(`/api/review?file=${encodeURIComponent(filePath)}`);
      const data = await res.json();
      setReviewContent(data);
    } catch (e) { console.error(e); }
    setReviewLoading(false);
  }

  async function fetchReviews() {
    setReviewsLoading(true);
    try {
      const res = await fetch('/api/reviews');
      const data = await res.json();
      setReviews(data.reviews || []);
      setReviewsSummary(data.summary || {});
      if (data.reviews && data.reviews.length > 0 && !selectedReview) {
        setSelectedReview(data.reviews[0]);
      }
    } catch (e) { 
      console.error('Error fetching reviews:', e); 
    }
    setReviewsLoading(false);
  }

  async function fetchResearch() {
    setResearchLoading(true);
    try {
      const res = await fetch('/api/research');
      const data = await res.json();
      setResearch(data.research || []);
      if (data.research && data.research.length > 0 && !selectedResearch) {
        setSelectedResearch(data.research[0]);
        // Auto-load first research content
        const contentRes = await fetch(`/api/research?file=${data.research[0].filename}`);
        const contentData = await contentRes.json();
        setResearchContent(contentData.content);
      }
    } catch (e) { 
      console.error('Error fetching research:', e); 
    }
    setResearchLoading(false);
  }

  async function loadResearchContent(item) {
    setSelectedResearch(item);
    setResearchLoading(true);
    try {
      const res = await fetch(`/api/research?file=${item.filename}`);
      const data = await res.json();
      setResearchContent(data.content);
    } catch (e) {
      console.error('Error loading research:', e);
      setResearchContent('Error loading content');
    }
    setResearchLoading(false);
  }

  async function fetchJuntoStatus() {
    setJuntoLoading(true);
    try {
      // Fetch from junto API (deployed on Vercel)
      const statusRes = await fetch('https://myjunto.xyz/api/status');
      const statusData = await statusRes.json();
      setJuntoStatus(statusData);
      
      // Fetch user settings from Supabase
      const settingsRes = await fetch(`${SUPABASE_URL}/rest/v1/users?select=*&limit=1`, {
        headers: { 'apikey': SUPABASE_ANON }
      });
      const settingsData = await settingsRes.json();
      if (settingsData?.[0]) setJuntoSettings(settingsData[0]);
    } catch (e) { 
      console.error('Junto fetch error:', e); 
      // Try local fallback
      try {
        const res = await fetch('/api/junto-status');
        const data = await res.json();
        setJuntoStatus(data);
      } catch (e2) { console.error(e2); }
    }
    setJuntoLoading(false);
  }

  async function updateJuntoSettings(updates) {
    if (!juntoSettings?.id) return;
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${juntoSettings.id}`, {
        method: 'PATCH',
        headers: { 
          'apikey': SUPABASE_ANON,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(updates)
      });
      fetchJuntoStatus();
    } catch (e) { console.error(e); }
  }

  async function fetchKanban() {
    try {
      const res = await fetch('/api/kanban');
      const data = await res.json();
      setKanban(data);
    } catch (e) { console.error(e); }
  }

  async function addTask() {
    if (!newTask.title) return;
    try {
      await fetch('/api/kanban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newTask, status: 'backlog' })
      });
      setNewTask({ title: '', description: '', assignee: null, priority: 'medium' });
      fetchKanban();
    } catch (e) { console.error(e); }
  }

  async function updateTask(id, updates) {
    try {
      await fetch('/api/kanban', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates })
      });
      fetchKanban();
    } catch (e) { console.error(e); }
  }

  async function deleteTask(id) {
    if (!confirm('Delete this task?')) return;
    try {
      await fetch(`/api/kanban?id=${id}`, { method: 'DELETE' });
      fetchKanban();
    } catch (e) { console.error(e); }
  }

  async function fetchUserSchedule() {
    setScheduleLoading(true);
    try {
      // For demo purposes, use a default email. In production, this would come from auth
      const response = await fetch('/api/user-schedule?email=user@example.com');
      if (response.ok) {
        const data = await response.json();
        setUserSchedule(data);
      } else if (response.status === 404) {
        // User doesn't exist yet, set defaults
        setUserSchedule({
          email: 'user@example.com',
          preferred_send_time: '09:00:00',
          timezone: 'America/Los_Angeles',
          send_frequency: 'daily',
          weekend_delivery: false,
          max_newsletters_per_day: 1,
          next_newsletter: null
        });
      }
    } catch (e) { 
      console.error('Error fetching user schedule:', e);
    }
    setScheduleLoading(false);
  }

  async function updateUserSchedule(updates) {
    try {
      const response = await fetch('/api/user-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userSchedule?.email || 'user@example.com',
          name: userSchedule?.name || 'Demo User',
          ...updates
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserSchedule(data.user);
        return data.user;
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Update failed');
      }
    } catch (e) { 
      console.error('Error updating user schedule:', e);
      alert('Error updating preferences: ' + e.message);
      return null;
    }
  }

  async function updateAsset(symbol, updates) {
    try {
      await fetch('/api/assets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, ...updates })
      });
      fetchAssets();
      setEditingAsset(null);
    } catch (e) { console.error(e); }
  }

  const s = portfolio?.summary || {};

  function getTradeValue(trade) {
    if (!portfolio) return { equity: 0, options: 0, crypto: 0, total: 0, positions: [] };
    const symbols = trade.positions?.map(p => p.symbol.replace(' puts', '').replace(' calls', '')) || [];
    
    let equity = 0, options = 0, crypto = 0;
    const positionDetails = [];
    
    portfolio.equities?.forEach(e => {
      if (symbols.includes(e.symbol)) {
        equity += e.value;
        positionDetails.push({ symbol: e.symbol, type: 'equity', value: e.value, units: e.units, price: e.price });
      }
    });
    portfolio.crypto?.forEach(c => {
      if (symbols.includes(c.symbol)) {
        crypto += c.value;
        positionDetails.push({ symbol: c.symbol, type: 'crypto', value: c.value, units: c.units, price: c.price });
      }
    });
    portfolio.options?.forEach(o => {
      if (symbols.includes(o.symbol)) {
        options += o.value;
        positionDetails.push({ symbol: o.symbol, type: 'option', value: o.value, qty: o.qty, strike: o.strike, expiry: o.expiry });
      }
    });
    
    return { equity, options, crypto, total: equity + options + crypto, positions: positionDetails };
  }

  // Calculate all trade values for summary
  const tradeValues = trades.map(t => ({ ...t, values: getTradeValue(t), color: TRADE_COLORS[t.id] || '#8b949e' }));
  // Add cash as a pseudo-trade for the summary
  const cashTotal = portfolio?.cash?.reduce((sum, c) => sum + (c.value || 0), 0) || 0;
  const tradeValuesWithCash = [
    ...tradeValues,
    { id: 'cash', name: 'Cash', values: { equity: 0, options: 0, crypto: 0, total: cashTotal, positions: [] }, color: '#8b949e', isCash: true }
  ];
  const totalTradeValue = tradeValuesWithCash.reduce((sum, t) => sum + t.values.total, 0);
  const pieData = tradeValuesWithCash.filter(t => t.values.total > 0).map(t => ({ name: t.name, value: t.values.total, color: t.color }));

  return (
    <div style={styles.container} className="container-padding">
      <div style={styles.header} className="header-responsive">
        <h1 style={{ fontSize: 'clamp(20px, 4vw, 24px)', margin: 0 }}>⚡ Jai Dashboard</h1>
        <div className="header-actions">
          <button
            onClick={() => setPublicScreenshot(!publicScreenshot)}
            style={{
              padding: '8px 12px',
              background: publicScreenshot ? '#238636' : '#21262d',
              border: `1px solid ${publicScreenshot ? '#238636' : '#30363d'}`,
              borderRadius: '6px',
              color: '#e6edf3',
              cursor: 'pointer',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              minHeight: '44px',
            }}
          >
            {publicScreenshot ? '👁️' : '👁️‍🗨️'} <span className="hide-mobile">Public Screenshot</span><span style={{ display: 'none' }} className="show-mobile">Privacy</span>
          </button>
          <div style={{ color: '#8b949e', fontSize: '14px' }}>{new Date().toLocaleDateString()}</div>
        </div>
      </div>

      {/* Tabs - horizontal scroll on mobile */}
      <div style={styles.tabs} className="tabs-container">
        {['portfolio', 'positions', 'trades', 'assets', 'reports', 'fitness', 'reviews', 'tasks', 'settings'].map(t => (
          <div key={t} style={tab === t ? styles.tabActive : styles.tab} className="tab-item" onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </div>
        ))}
      </div>

      {tab === 'portfolio' && (
        <>
          <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button style={styles.btn} onClick={fetchPortfolio} disabled={loading}>
              {loading ? '⏳ Refreshing...' : '🔄 Refresh from Sheets'}
            </button>
            <button style={{...styles.btn, background: '#238636'}} onClick={refreshPrices} disabled={priceRefreshing}>
              {priceRefreshing ? '⏳ Fetching...' : '📈 Live Prices'}
            </button>
            {lastPriceRefresh && <span style={{ color: '#3fb950', fontSize: '12px' }}>Prices: {lastPriceRefresh.toLocaleTimeString()}</span>}
            {lastRefresh && !lastPriceRefresh && <span style={{ color: '#8b949e', fontSize: '12px' }}>Last: {lastRefresh.toLocaleTimeString()}</span>}
          </div>

          <div style={styles.grid}>
            <div style={styles.card}>
              <div style={styles.cardTitle}>Total Portfolio</div>
              <div style={styles.bigNum}>{formatMoney(s.total)}</div>
              <div style={{ marginTop: '12px', display: 'flex', height: '20px', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ background: '#8b949e', flex: s.cash || 1 }} title="Cash" />
                <div style={{ background: '#3fb950', flex: s.equities || 1 }} title="Equities" />
                <div style={{ background: '#8957e5', flex: s.crypto || 1 }} title="Crypto" />
                <div style={{ background: '#d29922', flex: s.options || 1 }} title="Options" />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px', fontSize: '11px', color: '#8b949e', flexWrap: 'wrap' }}>
                <span>⬜ Cash {formatMoney(s.cash)}</span>
                <span>🟢 Equities {formatMoney(s.equities)}</span>
                <span>🟣 Crypto {formatMoney(s.crypto)}</span>
                <span>🟡 Options {formatMoney(s.options)}</span>
              </div>
            </div>
            <div style={styles.card}>
              <div style={styles.cardTitle}>Cash</div>
              <div style={styles.bigNum}>{formatMoney(s.cash)}</div>
              <div style={{ color: '#8b949e', fontSize: '13px', marginTop: '8px' }}>
                {portfolio?.cash?.map(c => <div key={c.symbol}>{c.symbol}: {formatMoney(c.value)}</div>)}
              </div>
            </div>
          </div>

          {/* Unified Holdings Table */}
          <div style={{...styles.card, marginTop: '16px'}}>
            <div style={styles.cardTitle}>
              <span>📊 All Holdings</span>
              <span style={{ fontSize: '16px', fontWeight: '600' }}>{formatMoney(s.total)}</span>
            </div>
            <div className="table-responsive">
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Symbol</th>
                  <th style={styles.th}>Type</th>
                  <th style={styles.thRight}>Price</th>
                  <th style={styles.thRight}>Day %</th>
                  <th style={styles.thRight}>Value</th>
                  <th style={styles.thRight}>P/L</th>
                  <th style={styles.th}></th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  // Combine all holdings
                  const holdings = [];
                  
                  // Add cash
                  portfolio?.cash?.forEach(c => {
                    holdings.push({
                      symbol: c.symbol,
                      type: 'CASH',
                      price: 1,
                      value: c.value,
                      notional: c.value,
                      pl: c.pl,
                      plPct: c.plPct,
                      expandable: false,
                      data: c
                    });
                  });
                  
                  // Group options by underlying
                  const optionsByUnderlying = {};
                  portfolio?.options?.forEach(o => {
                    if (!optionsByUnderlying[o.symbol]) {
                      optionsByUnderlying[o.symbol] = {
                        symbol: o.symbol,
                        type: 'OPTIONS',
                        price: o.underlyingPrice,
                        value: 0,
                        notional: 0,
                        pl: 0,
                        options: [],
                        hasEquity: false
                      };
                    }
                    optionsByUnderlying[o.symbol].value += o.value;
                    optionsByUnderlying[o.symbol].notional += o.notional;
                    optionsByUnderlying[o.symbol].pl += o.value; // Options P/L is already in value
                    optionsByUnderlying[o.symbol].options.push(o);
                  });
                  
                  // Check which underlyings have equity positions
                  portfolio?.equities?.forEach(e => {
                    if (optionsByUnderlying[e.symbol]) {
                      optionsByUnderlying[e.symbol].hasEquity = true;
                    }
                  });
                  
                  // Add equities
                  portfolio?.equities?.forEach(e => {
                    if (optionsByUnderlying[e.symbol]) {
                      // This equity has options, create a combined row
                      const combined = optionsByUnderlying[e.symbol];
                      combined.equity = e;
                      combined.value += e.value;
                      combined.notional += e.value;
                      combined.pl += e.pl;
                      combined.plPct = (combined.pl / (e.value - e.pl + combined.value - combined.pl)) || 0;
                      holdings.push({
                        symbol: e.symbol,
                        type: 'COMBINED',
                        price: e.price,
                        value: combined.value,
                        notional: combined.notional,
                        pl: combined.pl,
                        plPct: combined.plPct,
                        expandable: true,
                        data: combined
                      });
                      delete optionsByUnderlying[e.symbol];
                    } else {
                      // Pure equity position
                      holdings.push({
                        symbol: e.symbol,
                        type: 'EQUITY',
                        price: e.price,
                        value: e.value,
                        notional: e.value,
                        pl: e.pl,
                        plPct: e.plPct,
                        expandable: false,
                        data: e
                      });
                    }
                  });
                  
                  // Add remaining options (without equity)
                  Object.values(optionsByUnderlying).forEach(group => {
                    holdings.push({
                      symbol: group.symbol,
                      type: 'OPTIONS',
                      price: group.price,
                      value: group.value,
                      notional: group.notional,
                      pl: group.pl,
                      plPct: 0,
                      expandable: true,
                      data: group
                    });
                  });
                  
                  // Add crypto
                  portfolio?.crypto?.forEach(c => {
                    holdings.push({
                      symbol: c.symbol,
                      type: 'CRYPTO',
                      price: c.price,
                      value: c.value,
                      notional: c.value,
                      pl: c.pl,
                      plPct: c.plPct,
                      expandable: false,
                      data: c
                    });
                  });
                  
                  // Sort by value descending
                  holdings.sort((a, b) => b.value - a.value);
                  
                  return holdings.map((h, i) => (
                    <HoldingsRow 
                      key={i} 
                      holding={h} 
                      s={s} 
                      publicScreenshot={publicScreenshot}
                      formatMoney={fmtMoney}
                      formatPct={formatPct}
                      liveQuotes={liveQuotes}
                    />
                  ));
                })()}
              </tbody>
            </table>
            </div>{/* table-responsive */}
          </div>
        </>
      )}

      {tab === 'positions' && (
        <>
          <div style={{ marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button style={styles.btn} onClick={fetchAllPositions} disabled={positionsLoading}>
              {positionsLoading ? '⏳ Loading...' : '🔄 Refresh'}
            </button>
            <span style={{ color: '#8b949e', fontSize: '12px' }}>
              All positions with trade assignment
            </span>
          </div>

          <div style={{...styles.card}}>
            <div style={styles.cardTitle}>
              <span>📊 All Positions</span>
              <span style={{ fontSize: '16px', fontWeight: '600' }}>
                {allPositions.positions?.length || 0} positions
              </span>
            </div>
            <div className="table-responsive">
              <table style={{...styles.table, fontSize: '12px'}}>
                <thead>
                  <tr>
                    <th style={{...styles.th, cursor: 'pointer', padding: '6px 4px'}} onClick={() => setPositionsSort(s => ({ field: 'symbol', dir: s.field === 'symbol' && s.dir === 'asc' ? 'desc' : 'asc' }))}>
                      Symbol {positionsSort.field === 'symbol' && (positionsSort.dir === 'asc' ? '▲' : '▼')}
                    </th>
                    <th style={{...styles.th, padding: '6px 4px'}}>Type</th>
                    <th style={{...styles.th, padding: '6px 4px'}}>Source</th>
                    <th style={{...styles.thRight, padding: '6px 4px'}}>Qty</th>
                    <th style={{...styles.thRight, cursor: 'pointer', padding: '6px 4px'}} onClick={() => setPositionsSort(s => ({ field: 'value', dir: s.field === 'value' && s.dir === 'desc' ? 'asc' : 'desc' }))}>
                      Value {positionsSort.field === 'value' && (positionsSort.dir === 'asc' ? '▲' : '▼')}
                    </th>
                    <th style={{...styles.th, padding: '6px 4px'}}>Trade</th>
                  </tr>
                </thead>
                <tbody>
                  {(allPositions.positions || [])
                    .slice()
                    .sort((a, b) => {
                      if (positionsSort.field === 'symbol') {
                        return positionsSort.dir === 'asc' ? a.symbol.localeCompare(b.symbol) : b.symbol.localeCompare(a.symbol);
                      }
                      return positionsSort.dir === 'asc' ? (a.value || 0) - (b.value || 0) : (b.value || 0) - (a.value || 0);
                    })
                    .map((pos) => {
                      const tradeName = (allPositions.trades || []).find(t => t.id === pos.tradeId)?.name;
                      return (
                        <tr key={`${pos.table}-${pos.id}`}>
                          <td style={{...styles.td, padding: '4px'}}>
                            <strong>{pos.symbol}</strong>
                            {pos.type === 'option' && (
                              <span style={{ fontSize: '10px', color: '#8b949e', marginLeft: '4px' }}>
                                {pos.optionType?.toUpperCase()} ${pos.strike}
                              </span>
                            )}
                          </td>
                          <td style={{...styles.td, padding: '4px'}}>
                            <span style={{
                              ...styles.tag, 
                              fontSize: '10px',
                              padding: '1px 6px',
                              background: pos.type === 'equity' ? '#238636' :
                                         pos.type === 'crypto' ? '#8957e5' :
                                         pos.type === 'option' ? '#d29922' : '#8b949e'
                            }}>
                              {pos.type?.toUpperCase()}
                            </span>
                          </td>
                          <td style={{...styles.td, padding: '4px'}}>
                            <span style={{ fontSize: '11px', color: '#8b949e' }}>
                              {pos.account || '—'}
                            </span>
                          </td>
                          <td style={{...styles.tdRight, padding: '4px'}}>{pos.quantity}</td>
                          <td style={{...styles.tdRight, padding: '4px'}}>{formatMoney(pos.value)}</td>
                          <td style={{...styles.td, padding: '4px'}}>
                            <select
                              value={pos.tradeId || ''}
                              onChange={(e) => updatePositionTrade(pos.id, pos.table, e.target.value || null)}
                              style={{
                                padding: '2px 4px',
                                background: '#161b22',
                                border: '1px solid #30363d',
                                borderRadius: '4px',
                                color: tradeName ? '#e6edf3' : '#8b949e',
                                fontSize: '11px',
                                minWidth: '100px'
                              }}
                            >
                              <option value="">No Trade</option>
                              {(allPositions.trades || []).map(trade => (
                                <option key={trade.id} value={trade.id}>{trade.name}</option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === 'trades' && (
        <>
          <div style={{ marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button style={styles.btn} onClick={() => { fetchTrades(); fetchPortfolio(); fetchAllPositions(); }}>🔄 Refresh</button>
            <button 
              style={{...styles.btn, background: tradeListView ? '#238636' : '#21262d'}} 
              onClick={() => setTradeListView(!tradeListView)}
            >
              {tradeListView ? '📋 List View' : '🃏 Card View'}
            </button>
            <button 
              style={{...styles.btn, background: '#238636'}} 
              onClick={() => { setShowAddTrade(true); setEditingTrade(null); setNewTradeForm({ name: '', thesis: '', direction: 'long', timeframe: 'medium', conviction: 3, status: 'active' }); }}
            >
              ⚙️ Manage Trades
            </button>
          </div>

          {/* Manage Trades Modal */}
          {showAddTrade && (
            <div style={{...styles.card, marginBottom: '16px', border: '1px solid #238636'}}>
              <div style={styles.cardTitle}>⚙️ Manage Trades</div>
              
              {/* Existing Trades List */}
              <div style={{ marginBottom: '16px', maxHeight: '200px', overflowY: 'auto' }}>
                <div style={{ fontSize: '12px', color: '#8b949e', marginBottom: '8px', textTransform: 'uppercase' }}>Existing Trades (click to edit)</div>
                {trades.map(t => (
                  <div 
                    key={t.id}
                    onClick={() => {
                      setEditingTrade(t);
                      setNewTradeForm({ name: t.name, thesis: t.thesis || '', direction: t.direction || 'long', timeframe: t.timeframe || 'medium', conviction: t.conviction || 3, status: t.status || 'active' });
                    }}
                    style={{ 
                      padding: '8px 12px', 
                      background: editingTrade?.id === t.id ? '#21262d' : '#0d1117', 
                      border: editingTrade?.id === t.id ? '1px solid #58a6ff' : '1px solid #30363d',
                      borderRadius: '4px', 
                      marginBottom: '4px', 
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '2px', background: t.color || '#8b949e' }} />
                      <span style={{ fontWeight: '500' }}>{t.name}</span>
                      <ConvictionDots level={t.conviction} />
                    </div>
                    <span style={{ fontSize: '11px', color: '#8b949e' }}>{t.direction} · {t.timeframe}</span>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: '1px solid #30363d', paddingTop: '16px' }}>
                <div style={{ fontSize: '12px', color: '#8b949e', marginBottom: '8px', textTransform: 'uppercase' }}>
                  {editingTrade ? `✏️ Edit: ${editingTrade.name}` : '➕ Create New Trade'}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                  <input
                    placeholder="Trade Name *"
                    value={newTradeForm.name}
                    onChange={(e) => setNewTradeForm({...newTradeForm, name: e.target.value})}
                    style={{ padding: '8px', background: '#0d1117', border: '1px solid #30363d', borderRadius: '4px', color: '#e6edf3' }}
                  />
                  <select
                    value={newTradeForm.direction}
                    onChange={(e) => setNewTradeForm({...newTradeForm, direction: e.target.value})}
                    style={{ padding: '8px', background: '#0d1117', border: '1px solid #30363d', borderRadius: '4px', color: '#e6edf3' }}
                  >
                    <option value="long">Long</option>
                    <option value="short">Short</option>
                  </select>
                  <select
                    value={newTradeForm.timeframe}
                    onChange={(e) => setNewTradeForm({...newTradeForm, timeframe: e.target.value})}
                    style={{ padding: '8px', background: '#0d1117', border: '1px solid #30363d', borderRadius: '4px', color: '#e6edf3' }}
                  >
                    <option value="short">Short Term</option>
                    <option value="medium">Medium Term</option>
                    <option value="long">Long Term</option>
                  </select>
                  <select
                    value={newTradeForm.conviction}
                    onChange={(e) => setNewTradeForm({...newTradeForm, conviction: parseInt(e.target.value)})}
                    style={{ padding: '8px', background: '#0d1117', border: '1px solid #30363d', borderRadius: '4px', color: '#e6edf3' }}
                  >
                    {[1,2,3,4,5].map(n => <option key={n} value={n}>Conviction: {n}</option>)}
                  </select>
                  <select
                    value={newTradeForm.status}
                    onChange={(e) => setNewTradeForm({...newTradeForm, status: e.target.value})}
                    style={{ padding: '8px', background: '#0d1117', border: '1px solid #30363d', borderRadius: '4px', color: '#e6edf3' }}
                  >
                    <option value="active">Active</option>
                    <option value="watching">Watching</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                <textarea
                  placeholder="Thesis / Notes"
                  value={newTradeForm.thesis}
                  onChange={(e) => setNewTradeForm({...newTradeForm, thesis: e.target.value})}
                  style={{ width: '100%', padding: '8px', background: '#0d1117', border: '1px solid #30363d', borderRadius: '4px', color: '#e6edf3', marginTop: '12px', minHeight: '60px' }}
                />
                <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                  {editingTrade ? (
                    <>
                      <button style={{...styles.btn, background: '#238636'}} onClick={updateTrade}>💾 Save Changes</button>
                      <button style={styles.btn} onClick={() => { setEditingTrade(null); setNewTradeForm({ name: '', thesis: '', direction: 'long', timeframe: 'medium', conviction: 3, status: 'active' }); }}>Cancel Edit</button>
                    </>
                  ) : (
                    <button style={{...styles.btn, background: '#238636'}} onClick={createTrade}>➕ Create Trade</button>
                  )}
                  <button style={styles.btn} onClick={() => { setShowAddTrade(false); setEditingTrade(null); }}>Close</button>
                </div>
              </div>
            </div>
          )}

          {/* Summary Section */}
          <div style={{...styles.card, marginBottom: '24px'}}>
            <div style={{...styles.cardTitle, justifyContent: 'space-between'}}>
              <span>📊 Trade Allocation Summary</span>
            </div>
            <div style={styles.summaryGrid} className="summary-grid">
              <div className="pie-container">
                <PieChart data={pieData.filter(d => !excludedTrades[d.name])} />
              </div>
              <div className="table-responsive">
                <table style={{...styles.table, marginTop: 0, fontSize: '12px'}}>
                  <thead>
                    <tr>
                      <th style={{...styles.th, width: '24px', padding: '4px 2px'}}></th>
                      <th style={{...styles.th, padding: '4px 6px'}}>Trade</th>
                      <th style={{...styles.th, padding: '4px 6px', textAlign: 'right'}}>Value</th>
                      <th style={{...styles.th, padding: '4px 6px', width: '40px', textAlign: 'right'}}>%</th>
                      <th style={{...styles.th, padding: '4px 6px', width: '80px'}}>Eq/Opt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tradeValuesWithCash
                      .filter(t => t.values.total > 0)
                      .sort((a,b) => b.values.total - a.values.total)
                      .map(t => {
                        const isExcluded = excludedTrades[t.name];
                        const eqPct = t.isCash ? 100 : (t.values.total > 0 ? Math.round((t.values.equity + t.values.crypto) / t.values.total * 100) : 0);
                        const optPct = t.isCash ? 0 : (100 - eqPct);
                        const filteredTotal = tradeValuesWithCash
                          .filter(tv => tv.values.total > 0 && !excludedTrades[tv.name])
                          .reduce((sum, tv) => sum + tv.values.total, 0);
                        return (
                          <tr key={t.id} style={{ opacity: isExcluded ? 0.5 : 1 }}>
                            <td style={{...styles.td, padding: '4px 2px'}}>
                              <input 
                                type="checkbox" 
                                checked={!isExcluded}
                                onChange={() => setExcludedTrades(prev => ({ ...prev, [t.name]: !prev[t.name] }))}
                                style={{ cursor: 'pointer', width: '14px', height: '14px' }}
                              />
                            </td>
                            <td style={{...styles.td, padding: '4px 6px'}}>
                              <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '2px', background: t.color, marginRight: '6px' }} />
                              <span style={{ whiteSpace: 'nowrap' }}>{t.name}</span>
                            </td>
                            <td style={{...styles.td, padding: '4px 6px', textAlign: 'right'}}>{formatMoney(t.values.total)}</td>
                            <td style={{...styles.td, padding: '4px 6px', textAlign: 'right'}}>{!isExcluded && filteredTotal > 0 ? Math.round(t.values.total / filteredTotal * 100) : '—'}%</td>
                            <td style={{...styles.td, padding: '4px 6px'}}>
                              {t.isCash ? (
                                <span style={{ fontSize: '10px', color: '#8b949e' }}>—</span>
                              ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                  <div style={{ width: '40px', height: '6px', background: '#21262d', borderRadius: '3px', overflow: 'hidden', display: 'flex' }}>
                                    <div style={{ width: `${eqPct}%`, background: '#3fb950' }} />
                                    <div style={{ width: `${optPct}%`, background: '#d29922' }} />
                                  </div>
                                  <span style={{ fontSize: '10px', color: '#8b949e' }}>{eqPct}/{optPct}</span>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
                <div style={{ fontSize: '11px', color: '#8b949e', marginTop: '8px' }}>
                  🟢 Equity/Crypto | 🟡 Options • Uncheck to exclude from chart
                </div>
              </div>
            </div>
          </div>

          {/* Trade List View */}
          {tradeListView ? (
            <div style={styles.card}>
              <div style={styles.cardTitle}>📋 Trades by Position</div>
              {(() => {
                // Group all positions by trade, then by underlying
                const groupedByTrade = {};
                
                // Add trades with their positions from allPositions (which has trade_id)
                (allPositions.positions || []).forEach(p => {
                  const tradeId = p.tradeId || 'no-trade';
                  const trade = trades.find(t => t.id === tradeId) || { id: 'no-trade', name: 'No Trade', color: '#8b949e' };
                  
                  if (!groupedByTrade[tradeId]) {
                    groupedByTrade[tradeId] = {
                      ...trade,
                      underlyings: {}
                    };
                  }
                  
                  const underlying = p.underlying || p.symbol;
                  if (!groupedByTrade[tradeId].underlyings[underlying]) {
                    groupedByTrade[tradeId].underlyings[underlying] = [];
                  }
                  groupedByTrade[tradeId].underlyings[underlying].push(p);
                });

                // Sort trades by total value, with No Trade last
                const sortedTrades = Object.values(groupedByTrade).sort((a, b) => {
                  if (a.id === 'no-trade') return 1;
                  if (b.id === 'no-trade') return -1;
                  const aTotal = Object.values(a.underlyings).flat().reduce((s, p) => s + (p.value || 0), 0);
                  const bTotal = Object.values(b.underlyings).flat().reduce((s, p) => s + (p.value || 0), 0);
                  return bTotal - aTotal;
                });

                return sortedTrades.map(trade => {
                  const allTradePositions = Object.values(trade.underlyings).flat();
                  const totalVal = allTradePositions.reduce((s, p) => s + (p.value || 0), 0);
                  const eqVal = allTradePositions.filter(p => p.type === 'equity' || p.type === 'crypto').reduce((s, p) => s + (p.value || 0), 0);
                  const optVal = allTradePositions.filter(p => p.type === 'option').reduce((s, p) => s + (p.value || 0), 0);
                  const eqPct = totalVal > 0 ? Math.round(eqVal / totalVal * 100) : 0;
                  const isExpanded = expandedTrades[trade.id];

                  if (totalVal === 0) return null;

                  return (
                    <div key={trade.id} style={{ borderBottom: '1px solid #30363d', padding: '8px 0' }}>
                      <div 
                        onClick={() => setExpandedTrades(prev => ({ ...prev, [trade.id]: !prev[trade.id] }))}
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '4px 0' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: '#8b949e', fontSize: '12px' }}>{isExpanded ? '▼' : '▶'}</span>
                          <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '2px', background: trade.color }} />
                          <strong style={{ fontSize: '14px' }}>{trade.name}</strong>
                          {trade.conviction && <ConvictionDots level={trade.conviction} />}
                          <span style={{ color: '#8b949e', fontSize: '12px' }}>({Object.keys(trade.underlyings).length})</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontWeight: '600', fontSize: '14px' }}>{formatMoney(totalVal)}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <div style={{ width: '50px', height: '6px', background: '#21262d', borderRadius: '3px', overflow: 'hidden', display: 'flex' }}>
                              <div style={{ width: `${eqPct}%`, background: '#3fb950' }} />
                              <div style={{ width: `${100-eqPct}%`, background: '#d29922' }} />
                            </div>
                            <span style={{ fontSize: '10px', color: '#8b949e', width: '40px' }}>{eqPct}/{100-eqPct}</span>
                          </div>
                        </div>
                      </div>
                      
                      {isExpanded && (
                        <div style={{ marginTop: '8px', marginLeft: '24px' }}>
                          {Object.entries(trade.underlyings).sort((a, b) => {
                            const aTotal = a[1].reduce((s, p) => s + (p.value || 0), 0);
                            const bTotal = b[1].reduce((s, p) => s + (p.value || 0), 0);
                            return bTotal - aTotal;
                          }).map(([underlying, positions]) => {
                            const underlyingTotal = positions.reduce((s, p) => s + (p.value || 0), 0);
                            const eqPositions = positions.filter(p => p.type === 'equity' || p.type === 'crypto');
                            const optPositions = positions.filter(p => p.type === 'option');
                            const eqTotal = eqPositions.reduce((s, p) => s + (p.value || 0), 0);
                            const optTotal = optPositions.reduce((s, p) => s + (p.value || 0), 0);
                            const underlyingKey = `${trade.id}-${underlying}`;
                            const isUnderlyingExpanded = expandedUnderlyings[underlyingKey];
                            
                            return (
                              <div key={underlying} style={{ padding: '6px 8px', margin: '2px 0', background: '#0d1117', borderRadius: '4px' }}>
                                <div 
                                  onClick={() => setExpandedUnderlyings(prev => ({ ...prev, [underlyingKey]: !prev[underlyingKey] }))}
                                  style={{ display: 'flex', justifyContent: 'space-between', cursor: 'pointer', alignItems: 'center' }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ color: '#8b949e', fontSize: '11px' }}>{isUnderlyingExpanded ? '▼' : '▶'}</span>
                                    <strong style={{ fontSize: '13px' }}>{underlying}</strong>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px' }}>
                                    {eqTotal > 0 && <span style={{ color: '#3fb950' }}>EQ: {formatMoney(eqTotal)}</span>}
                                    {optTotal > 0 && <span style={{ color: '#d29922' }}>OPT: {formatMoney(optTotal)}</span>}
                                    <span style={{ fontWeight: '500' }}>{formatMoney(underlyingTotal)}</span>
                                  </div>
                                </div>
                                
                                {isUnderlyingExpanded && (
                                  <div style={{ marginTop: '6px', marginLeft: '16px' }}>
                                    {positions.map((p, i) => (
                                      <div key={i} style={{ fontSize: '11px', color: '#8b949e', display: 'flex', justifyContent: 'space-between', padding: '2px 0', gap: '8px' }}>
                                        <span style={{ flex: 1 }}>
                                          <span style={{...styles.tag, background: p.type === 'option' ? '#d29922' : p.type === 'crypto' ? '#8957e5' : '#238636', fontSize: '9px', padding: '1px 4px'}}>{p.type}</span>
                                          {p.type === 'option' ? ` ${p.optionType?.toUpperCase() || ''} $${p.strike} ${p.expiry || ''}` : ` ${p.quantity} @ $${p.price?.toFixed(2)}`}
                                        </span>
                                        <span style={{ color: '#58a6ff', fontSize: '10px', minWidth: '60px' }}>{p.account || 'default'}</span>
                                        <span style={{ minWidth: '70px', textAlign: 'right' }}>{formatMoney(p.value)}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          ) : (
            /* Trade Cards */
            <div style={styles.grid}>
              {tradeValues.map(trade => {
                const values = trade.values;
                const eqPct = values.total > 0 ? Math.round((values.equity + values.crypto) / values.total * 100) : 0;
                return (
                  <div key={trade.id} style={{...styles.card, borderLeft: `3px solid ${trade.color}`}}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <div style={{ fontSize: '16px', fontWeight: '600' }}>{trade.name}</div>
                        <div style={{ fontSize: '12px', color: '#8b949e', marginTop: '2px' }}>
                          <span style={{...styles.tag, background: trade.direction === 'short' ? '#da3633' : '#238636'}}>{trade.direction}</span>
                          <span style={{...styles.tag, background: '#30363d'}}>{trade.timeframe}</span>
                          <span style={{...styles.tag, background: trade.status === 'active' ? '#238636' : '#d29922'}}>{trade.status}</span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '11px', color: '#8b949e' }}>Conviction</div>
                        <ConvictionDots level={trade.conviction} />
                      </div>
                    </div>
                    
                    <div style={{ fontSize: '13px', color: '#8b949e', marginBottom: '12px', fontStyle: 'italic' }}>
                      {trade.thesis}
                    </div>

                    {/* Value & Allocation */}
                    <div style={{ marginBottom: '12px', padding: '12px', background: '#0d1117', borderRadius: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '24px', fontWeight: '600' }}>{formatMoney(values.total)}</div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '11px', color: '#8b949e' }}>Equity / Options</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <div style={{ width: '50px', height: '8px', background: '#21262d', borderRadius: '4px', overflow: 'hidden', display: 'flex' }}>
                              <div style={{ width: `${eqPct}%`, background: '#3fb950' }} />
                              <div style={{ width: `${100-eqPct}%`, background: '#d29922' }} />
                            </div>
                            <span style={{ fontSize: '12px', fontWeight: '500' }}>{eqPct}%/{100-eqPct}%</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Position breakdown */}
                      {values.positions.length > 0 && (
                        <div style={{ marginTop: '8px', fontSize: '12px' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <tbody>
                              {values.positions.map((p, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid #21262d' }}>
                                  <td style={{ padding: '4px 0' }}>
                                    <span style={{...styles.tag, background: p.type === 'option' ? '#d29922' : p.type === 'crypto' ? '#8957e5' : '#238636', fontSize: '10px'}}>{p.type}</span>
                                    <strong>{p.symbol}</strong>
                                  </td>
                                  <td style={{ padding: '4px 0', textAlign: 'right', color: '#8b949e' }}>
                                    {p.type === 'option' ? `${p.qty}x $${p.strike}` : `${p.units} @ $${p.price?.toFixed(2)}`}
                                  </td>
                                  <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: '500' }}>{formatMoney(p.value)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* Watching */}
                    {trade.positions?.filter(p => p.role === 'watching').length > 0 && (
                      <div style={{ fontSize: '12px', marginTop: '8px' }}>
                        <span style={{ color: '#8b949e' }}>Watching: </span>
                        {trade.positions.filter(p => p.role === 'watching').map(p => (
                          <span key={p.symbol} style={{...styles.tag, background: '#30363d'}}>{p.symbol}</span>
                        ))}
                      </div>
                    )}

                    {trade.entry_signals && (
                      <div style={{ fontSize: '11px', color: '#8b949e', marginTop: '8px' }}>
                        <strong>Entry signals:</strong> {trade.entry_signals.join(', ')}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {tab === 'research' && (
        <div className="review-grid" style={{ display: 'grid', gridTemplateColumns: selectedResearch ? 'minmax(200px, 300px) 1fr' : '1fr', gap: '16px' }}>
          {/* Research List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{...styles.card, padding: '12px'}}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '16px' }}>📚 Research ({research.length})</h3>
                <button style={{...styles.btn, padding: '4px 8px', fontSize: '12px'}} onClick={fetchResearch} disabled={researchLoading}>
                  {researchLoading ? '⏳' : '🔄'}
                </button>
              </div>
              {research.map(item => (
                <div 
                  key={item.filename}
                  onClick={() => loadResearchContent(item)}
                  style={{
                    padding: '10px 12px',
                    background: selectedResearch?.filename === item.filename ? '#21262d' : 'transparent',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    borderLeft: selectedResearch?.filename === item.filename ? '3px solid #58a6ff' : '3px solid transparent',
                    marginBottom: '4px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    {item.symbol && (
                      <span style={{...styles.tag, background: '#238636', fontSize: '11px', padding: '2px 6px'}}>{item.symbol}</span>
                    )}
                    <span style={{ fontWeight: '500', fontSize: '13px', color: '#e6edf3' }}>{item.title.slice(0, 40)}{item.title.length > 40 ? '...' : ''}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#8b949e' }}>{item.date}</div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Research Content */}
          {selectedResearch && (
            <div style={styles.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <h2 style={{ margin: '0 0 8px 0', fontSize: '20px' }}>{selectedResearch.title}</h2>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {selectedResearch.symbol && (
                      <span style={{...styles.tag, background: '#238636'}}>{selectedResearch.symbol}</span>
                    )}
                    <span style={{ fontSize: '13px', color: '#8b949e' }}>{selectedResearch.date}</span>
                    <span style={{ fontSize: '12px', color: '#8b949e' }}>{(selectedResearch.size / 1024).toFixed(1)}KB</span>
                  </div>
                </div>
              </div>
              {researchLoading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#8b949e' }}>⏳ Loading...</div>
              ) : researchContent ? (
                <div 
                  style={{ fontSize: '14px', lineHeight: '1.7', color: '#c9d1d9' }}
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(researchContent) }}
                />
              ) : (
                <div style={{ padding: '40px', textAlign: 'center', color: '#8b949e' }}>Select a research report</div>
              )}
            </div>
          )}
        </div>
      )}

      {tab === 'assets' && (
        <div className="two-panel" style={{ gap: '16px' }}>
          {/* Asset List */}
          <div style={styles.card}>
            <div style={styles.cardTitle}>📋 Assets ({assets.length})</div>
            <div style={{ maxHeight: '50vh', overflowY: 'auto' }}>
              {assets.map(a => {
                const pos = portfolio?.equities?.find(e => e.symbol === a.symbol) || 
                            portfolio?.crypto?.find(c => c.symbol === a.symbol);
                const isSelected = selectedAsset?.symbol === a.symbol;
                return (
                  <div key={a.symbol} onClick={() => { setSelectedAsset(a); setAssetTarget(a.target_price || ''); setAssetStop(a.stop_loss || ''); }} style={{...styles.researchItem, borderColor: isSelected ? '#58a6ff' : '#30363d', cursor: 'pointer'}}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong>{a.symbol}</strong>
                        <span style={{ color: '#8b949e', marginLeft: '8px', fontSize: '12px' }}>{a.name}</span>
                      </div>
                      <span style={{...styles.tag, background: a.asset_type === 'crypto' ? '#8957e5' : a.asset_type === 'etf' ? '#d29922' : '#238636', fontSize: '10px'}}>{a.asset_type}</span>
                    </div>
                    <div style={{ fontSize: '12px', marginTop: '4px', display: 'flex', gap: '12px' }}>
                      {pos && <span>${pos.price?.toFixed(2)}</span>}
                      {a.target_price && <span style={styles.green}>T: ${a.target_price}</span>}
                      {a.stop_loss && <span style={styles.red}>S: ${a.stop_loss}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Asset Detail */}
          <div style={styles.card}>
            {selectedAsset ? (() => {
              const a = selectedAsset;
              const equityPos = portfolio?.equities?.filter(e => e.symbol === a.symbol) || [];
              const cryptoPos = portfolio?.crypto?.filter(c => c.symbol === a.symbol) || [];
              const optionPos = portfolio?.options?.filter(o => o.symbol === a.symbol) || [];
              const allPositions = [...equityPos.map(p => ({...p, type: 'equity'})), ...cryptoPos.map(p => ({...p, type: 'crypto'})), ...optionPos.map(p => ({...p, type: 'option'}))];
              const assetResearch = reports.filter(r => r.ticker === a.symbol || r.asset_symbol === a.symbol);
              const assetNewsletters = newsletters.filter(n => n.referenced_assets?.includes(a.symbol));
              
              return (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div>
                      <h2 style={{ margin: 0, fontSize: '24px' }}>{a.symbol}</h2>
                      <div style={{ color: '#8b949e', marginTop: '4px' }}>{a.name}</div>
                    </div>
                    <span style={{...styles.tag, background: a.asset_type === 'crypto' ? '#8957e5' : a.asset_type === 'etf' ? '#d29922' : '#238636'}}>{a.asset_type}</span>
                  </div>

                  {/* Positions */}
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '13px', color: '#8b949e', marginBottom: '8px', textTransform: 'uppercase' }}>Positions</div>
                    {allPositions.length > 0 ? (
                      <table style={styles.table}>
                        <thead><tr><th style={styles.th}>Type</th><th style={styles.th}>Qty</th><th style={styles.th}>Price</th><th style={styles.th}>Value</th><th style={styles.th}>P/L</th></tr></thead>
                        <tbody>
                          {allPositions.map((p, i) => (
                            <tr key={i}>
                              <td style={styles.td}><span style={{...styles.tag, background: p.type === 'option' ? '#d29922' : p.type === 'crypto' ? '#8957e5' : '#238636'}}>{p.type}</span></td>
                              <td style={styles.td}>{p.units || p.qty}</td>
                              <td style={styles.td}>${p.price?.toFixed(2)}</td>
                              <td style={styles.td}>{formatMoney(p.value)}</td>
                              <td style={{...styles.td, ...(p.pl >= 0 ? styles.green : styles.red)}}>{formatMoney(p.pl)} ({formatPct(p.plPct || 0)})</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div style={{ padding: '12px', background: '#0d1117', borderRadius: '6px', color: '#8b949e' }}>No open positions</div>
                    )}
                  </div>

                  {/* Target & Stop */}
                  <div style={{ marginBottom: '20px', padding: '16px', background: '#0d1117', borderRadius: '8px' }}>
                    <div style={{ fontSize: '13px', color: '#8b949e', marginBottom: '12px', textTransform: 'uppercase' }}>Price Targets</div>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
                      <div>
                        <label style={{ fontSize: '12px', color: '#8b949e', display: 'block', marginBottom: '4px' }}>Target Price</label>
                        <input type="number" value={assetTarget} onChange={e => setAssetTarget(e.target.value)} placeholder="—" style={{ width: '100px', background: '#161b22', border: '1px solid #30363d', color: '#3fb950', padding: '8px', borderRadius: '6px', fontSize: '16px' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', color: '#8b949e', display: 'block', marginBottom: '4px' }}>Stop Loss</label>
                        <input type="number" value={assetStop} onChange={e => setAssetStop(e.target.value)} placeholder="—" style={{ width: '100px', background: '#161b22', border: '1px solid #30363d', color: '#f85149', padding: '8px', borderRadius: '6px', fontSize: '16px' }} />
                      </div>
                      <button style={{...styles.btn, background: '#238636', padding: '8px 16px'}} onClick={() => { updateAsset(a.symbol, { target_price: assetTarget || null, stop_loss: assetStop || null }); setSelectedAsset({...a, target_price: assetTarget, stop_loss: assetStop}); }}>Save</button>
                    </div>
                  </div>

                  {/* Research */}
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '13px', color: '#8b949e', marginBottom: '8px', textTransform: 'uppercase' }}>Research Reports ({assetResearch.length})</div>
                    {assetResearch.length > 0 ? (
                      <table style={styles.table}>
                        <thead><tr><th style={styles.th}>Title</th><th style={styles.th}>Type</th><th style={styles.th}>Date</th></tr></thead>
                        <tbody>
                          {assetResearch.map(r => (
                            <tr key={r.id} style={{ cursor: 'pointer' }} onClick={() => { setTab('research'); setSelected(r); }}>
                              <td style={styles.td}>{r.title || r.ticker}</td>
                              <td style={styles.td}><span style={{...styles.tag, background: '#238636'}}>{r.type}</span></td>
                              <td style={styles.td}>{new Date(r.updated_at).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div style={{ padding: '12px', background: '#0d1117', borderRadius: '6px', color: '#8b949e' }}>No research reports</div>
                    )}
                  </div>

                  {/* Newsletters */}
                  <div>
                    <div style={{ fontSize: '13px', color: '#8b949e', marginBottom: '8px', textTransform: 'uppercase' }}>Related Newsletters ({assetNewsletters.length})</div>
                    {assetNewsletters.length > 0 ? (
                      <table style={styles.table}>
                        <thead><tr><th style={styles.th}>Title</th><th style={styles.th}>Type</th><th style={styles.th}>Date</th></tr></thead>
                        <tbody>
                          {assetNewsletters.map(n => (
                            <tr key={n.id} style={{ cursor: 'pointer' }} onClick={() => { setTab('newsletters'); setSelectedNewsletter(n); }}>
                              <td style={styles.td}>{n.title}</td>
                              <td style={styles.td}><span style={{...styles.tag, background: '#1d9bf0'}}>{n.type}</span></td>
                              <td style={styles.td}>{new Date(n.created_at).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div style={{ padding: '12px', background: '#0d1117', borderRadius: '6px', color: '#8b949e' }}>No related newsletters</div>
                    )}
                  </div>
                </>
              );
            })() : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', color: '#8b949e' }}>
                ← Select an asset to view details
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'reports' && (() => {
        const allReports = [
          ...reports.map(r => ({ ...r, _type: 'research', _title: r.title || r.ticker, _date: r.updated_at })),
          ...newsletters.map(n => ({ ...n, _type: 'newsletter', _title: n.title, _date: n.created_at }))
        ].sort((a, b) => new Date(b._date) - new Date(a._date));
        const selectedReport = selected || selectedNewsletter;
        
        // Filter by search
        const searchLower = (window.reportsSearch || '').toLowerCase();
        const filteredReports = searchLower ? allReports.filter(r => 
          r._title?.toLowerCase().includes(searchLower) ||
          r.ticker?.toLowerCase().includes(searchLower) ||
          r.referenced_assets?.some(a => a.toLowerCase().includes(searchLower)) ||
          r.content?.toLowerCase().includes(searchLower)
        ) : allReports;
        
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Mobile: Collapsible file picker with search */}
            <div style={styles.card} className="reports-picker">
              <div 
                style={{...styles.cardTitle, cursor: 'pointer', marginBottom: reportsListOpen ? '12px' : 0 }} 
                onClick={() => setReportsListOpen(!reportsListOpen)}
                className="collapsible-header"
              >
                <span>📊 Reports ({filteredReports.length}{searchLower ? `/${allReports.length}` : ''}) {selectedReport && !reportsListOpen ? `• ${selectedReport._title}` : ''}</span>
                <span style={{ fontSize: '12px', color: '#8b949e' }}>{reportsListOpen ? '▼ collapse' : '▶ expand'}</span>
              </div>
              {reportsListOpen && (
                <input
                  type="text"
                  placeholder="🔍 Search reports..."
                  defaultValue={window.reportsSearch || ''}
                  onChange={(e) => { window.reportsSearch = e.target.value; }}
                  onKeyUp={(e) => { if (e.key === 'Enter') { window.reportsSearch = e.target.value; e.target.blur(); e.target.focus(); } }}
                  style={{ width: '100%', padding: '8px 12px', background: '#0d1117', border: '1px solid #30363d', borderRadius: '4px', color: '#e6edf3', marginBottom: '12px', fontSize: '14px' }}
                />
              )}
              <div style={{ maxHeight: reportsListOpen ? '40vh' : 0, overflow: 'hidden', overflowY: reportsListOpen ? 'auto' : 'hidden', transition: 'max-height 0.2s ease' }}>
                {filteredReports.length === 0 ? (
                  <p style={{ color: '#8b949e' }}>{searchLower ? 'No matching reports' : 'No reports yet'}</p>
                ) : (
                  filteredReports.map(r => {
                    const isSelected = selectedReport?.id === r.id;
                    const typeColor = r._type === 'newsletter' ? '#1d9bf0' : r.type === 'sector' ? '#d29922' : '#238636';
                    const typeLabel = r._type === 'newsletter' ? (r.type || 'newsletter') : r.type;
                    return (
                      <div key={r.id} style={{...styles.researchItem, borderColor: isSelected ? '#58a6ff' : '#30363d'}} onClick={() => { r._type === 'newsletter' ? setSelectedNewsletter(r) : setSelected(r); r._type === 'newsletter' ? setSelected(null) : setSelectedNewsletter(null); }}>
                        <div style={{ fontWeight: 500 }}>{r._title}</div>
                        <div style={{ fontSize: '12px', color: '#8b949e', marginTop: '4px' }}>
                          <span style={{...styles.tag, background: typeColor}}>{typeLabel}</span>
                          {new Date(r._date).toLocaleDateString()}
                        </div>
                        {r.referenced_assets?.length > 0 && (
                          <div style={{ fontSize: '11px', marginTop: '4px' }}>
                            {r.referenced_assets.slice(0, 4).map(a => (
                              <span key={a} style={{...styles.tag, background: '#30363d', fontSize: '10px'}}>{a}</span>
                            ))}
                            {r.referenced_assets.length > 4 && <span style={{ color: '#8b949e' }}>+{r.referenced_assets.length - 4}</span>}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
            {/* Content area - full width on mobile */}
            <div style={{...styles.card, flex: 1 }}>
              <div style={{...styles.cardTitle, flexWrap: 'wrap', gap: '8px'}}>
                <span style={{ flex: 1 }}>{selectedReport?._title || selectedReport?.ticker || 'Select a report'}</span>
                {selectedReport && (
                  <button 
                    style={{...styles.btn, fontSize: '11px', padding: '4px 10px', minHeight: 'auto'}} 
                    onClick={() => setReportsListOpen(true)}
                  >
                    ← Back to list
                  </button>
                )}
              </div>
              {selectedReport ? (
                <>
                  {selectedReport.referenced_assets?.length > 0 && (
                    <div style={{ marginBottom: '12px', padding: '8px', background: '#0d1117', borderRadius: '6px', fontSize: '12px' }}>
                      <span style={{ color: '#8b949e' }}>Assets: </span>
                      {selectedReport.referenced_assets.map(a => (
                        <span key={a} style={{...styles.tag, background: '#30363d', cursor: 'pointer'}} onClick={() => { setTab('assets'); setSelectedAsset(assets.find(ast => ast.symbol === a)); }}>{a}</span>
                      ))}
                    </div>
                  )}
                  {selectedReport.source_accounts?.length > 0 && (
                    <div style={{ marginBottom: '12px', fontSize: '12px', color: '#8b949e' }}>
                      Sources: {selectedReport.source_accounts.map(a => `@${a}`).join(', ')}
                    </div>
                  )}
                  <div style={{ fontSize: '14px', lineHeight: '1.7' }} dangerouslySetInnerHTML={{ __html: renderMarkdown(selectedReport.content) }} />
                </>
              ) : (
                <p style={{ color: '#8b949e' }}>Tap "Reports" above to select one</p>
              )}
            </div>
          </div>
        );
      })()}

      {tab === 'fitness' && (
        <div style={styles.grid}>
          {/* Lift Progress Chart */}
          <div style={{...styles.card, gridColumn: 'span 2'}}>
            <div style={styles.cardTitle}>📈 Progress Over Time</div>
            {fitness?.liftHistory && (() => {
              // Collect all data series - filter to 2026+
              const filterDate = (d) => new Date(d.date) >= new Date('2026-01-01');
              
              const liftSeries = Object.entries(fitness.liftHistory).map(([name, data]) => ({
                name, data: data.filter(filterDate).map(d => ({ date: d.date, value: d.tracking1RM })),
                color: fitness.goals.lifts.find(g => g.name === name)?.color || '#8b949e',
                axis: 'left', unit: 'lbs', goal: fitness.goals.lifts.find(g => g.name === name)?.goal
              })).filter(s => s.data.length > 0);
              
              const weightSeries = fitness.weightHistory?.filter(filterDate).length > 0 ? [{
                name: 'Weight', data: fitness.weightHistory.filter(filterDate).map(d => ({ date: d.date, value: d.weight })),
                color: '#d29922', axis: 'left', unit: 'lbs', goal: 178
              }] : [];
              
              const runSeries = fitness.runHistory?.filter(filterDate).length > 0 ? [{
                name: '5k Est', data: fitness.runHistory.filter(filterDate).map(d => ({ date: d.date, value: d.est5k })),
                color: '#f778ba', axis: 'right', unit: 'min', goal: 25
              }] : [];
              
              const allSeries = [...liftSeries, ...weightSeries, ...runSeries];
              const visibleSeries = allSeries.filter(s => chartToggles[s.name] !== false);
              
              const leftSeries = visibleSeries.filter(s => s.axis === 'left');
              const rightSeries = visibleSeries.filter(s => s.axis === 'right');
              
              const allDates = [...new Set(visibleSeries.flatMap(s => s.data.map(d => d.date)))].sort();
              if (allDates.length === 0) return <p style={{ color: '#8b949e' }}>No data to display</p>;
              
              const minDate = allDates[0];
              const maxDate = allDates[allDates.length - 1];
              
              const leftValues = leftSeries.flatMap(s => s.data.map(d => d.value));
              const rightValues = rightSeries.flatMap(s => s.data.map(d => d.value));
              
              const leftMin = leftValues.length ? Math.min(...leftValues) - 20 : 0;
              const leftMax = leftValues.length ? Math.max(...leftValues) + 20 : 100;
              const rightMin = rightValues.length ? Math.min(...rightValues) - 5 : 0;
              const rightMax = rightValues.length ? Math.max(...rightValues) + 5 : 100;
              
              const width = 700, height = 280, padding = 50, rightPadding = rightSeries.length ? 50 : 20;
              
              const xScale = (date) => {
                if (minDate === maxDate) return width / 2;
                return padding + ((new Date(date) - new Date(minDate)) / (new Date(maxDate) - new Date(minDate))) * (width - padding - rightPadding);
              };
              const yScaleLeft = (val) => height - padding - ((val - leftMin) / (leftMax - leftMin || 1)) * (height - padding * 2);
              const yScaleRight = (val) => height - padding - ((val - rightMin) / (rightMax - rightMin || 1)) * (height - padding * 2);
              
              return (
                <div style={{ overflowX: 'auto' }}>
                  <svg width={width} height={height} style={{ background: '#0d1117', borderRadius: '6px' }}>
                    {/* Left axis grid */}
                    {leftSeries.length > 0 && [0, 0.25, 0.5, 0.75, 1].map(pct => {
                      const y = padding + pct * (height - padding * 2);
                      const val = Math.round(leftMax - pct * (leftMax - leftMin));
                      return (
                        <g key={'left-' + pct}>
                          <line x1={padding} y1={y} x2={width - rightPadding} y2={y} stroke="#21262d" />
                          <text x={padding - 5} y={y + 4} fill="#8b949e" fontSize="10" textAnchor="end">{val}</text>
                        </g>
                      );
                    })}
                    {/* Right axis labels */}
                    {rightSeries.length > 0 && [0, 0.25, 0.5, 0.75, 1].map(pct => {
                      const y = padding + pct * (height - padding * 2);
                      const val = Math.round((rightMax - pct * (rightMax - rightMin)) * 10) / 10;
                      return (
                        <text key={'right-' + pct} x={width - rightPadding + 5} y={y + 4} fill="#f778ba" fontSize="10" textAnchor="start">{val}</text>
                      );
                    })}
                    {/* Goal lines */}
                    {visibleSeries.filter(s => s.goal).map(s => {
                      const yScale = s.axis === 'left' ? yScaleLeft : yScaleRight;
                      const goalY = yScale(s.goal);
                      if (goalY < padding || goalY > height - padding) return null;
                      return <line key={s.name + '-goal'} x1={padding} y1={goalY} x2={width - rightPadding} y2={goalY} stroke={s.color} strokeDasharray="4,4" strokeOpacity="0.3" />;
                    })}
                    {/* Data lines */}
                    {visibleSeries.map(s => {
                      const yScale = s.axis === 'left' ? yScaleLeft : yScaleRight;
                      const points = s.data.map(d => `${xScale(d.date)},${yScale(d.value)}`).join(' ');
                      return (
                        <g key={s.name}>
                          <polyline fill="none" stroke={s.color} strokeWidth="2" points={points} />
                          {s.data.map((d, i) => (
                            <g key={i}>
                              <circle cx={xScale(d.date)} cy={yScale(d.value)} r="4" fill={s.color} />
                              <title>{s.name}: {d.value} {s.unit} ({d.date})</title>
                            </g>
                          ))}
                        </g>
                      );
                    })}
                    {/* X axis labels */}
                    {allDates.filter((_, i) => i % Math.max(1, Math.ceil(allDates.length / 6)) === 0).map(date => (
                      <text key={date} x={xScale(date)} y={height - 10} fill="#8b949e" fontSize="10" textAnchor="middle">
                        {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </text>
                    ))}
                  </svg>
                  {/* Legend - clickable toggles */}
                  <div style={{ display: 'flex', gap: '12px', marginTop: '12px', flexWrap: 'wrap' }}>
                    {allSeries.map(s => {
                      const isVisible = chartToggles[s.name] !== false;
                      const latest = s.data[s.data.length - 1]?.value;
                      return (
                        <div key={s.name} onClick={() => toggleChart(s.name)} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer', opacity: isVisible ? 1 : 0.4, padding: '4px 8px', background: '#161b22', borderRadius: '4px', border: `1px solid ${isVisible ? s.color : '#30363d'}` }}>
                          <div style={{ width: '10px', height: '3px', background: s.color, borderRadius: '2px' }} />
                          <span>{s.name}</span>
                          {latest && <span style={{ color: '#8b949e' }}>{latest}{s.goal ? ` → ${s.goal}` : ''}</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Strength Goals */}
          <div style={styles.card}>
            <div style={styles.cardTitle}>🏋️ Strength Goals</div>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Lift</th>
                  <th style={styles.th}>Current</th>
                  <th style={styles.th}>Goal</th>
                  <th style={styles.th}>Progress</th>
                </tr>
              </thead>
              <tbody>
                {fitness?.goals?.lifts?.map(l => {
                  const current = l.tracking || l.current;
                  const pct = Math.round((current / l.goal) * 100);
                  return (
                    <tr key={l.name}>
                      <td style={styles.td}><strong>{l.name}</strong></td>
                      <td style={styles.td}>{current} lbs {l.tracking && <span style={{ color: '#8b949e', fontSize: '11px' }}>(tracking)</span>}</td>
                      <td style={styles.td}>{l.goal} lbs</td>
                      <td style={styles.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '80px', height: '8px', background: '#21262d', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', background: pct >= 100 ? '#3fb950' : '#58a6ff' }} />
                          </div>
                          <span style={{ fontSize: '12px', color: '#8b949e' }}>{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Other Goals */}
          <div style={styles.card}>
            <div style={styles.cardTitle}>🎯 Other Goals</div>
            <table style={styles.table}>
              <tbody>
                {fitness?.goals?.other?.map(g => (
                  <tr key={g.name}>
                    <td style={styles.td}><strong>{g.name}</strong></td>
                    <td style={styles.td}>{g.current} {g.unit || ''}</td>
                    <td style={styles.td}>→ {g.goal} {g.unit || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: '16px', padding: '12px', background: '#0d1117', borderRadius: '6px', fontSize: '13px' }}>
              <div style={{ color: '#8b949e', marginBottom: '8px' }}>Schedule</div>
              <div>{fitness?.schedule?.daysPerWeek} days/week • {fitness?.schedule?.minutesPerDay} min/day</div>
              <div style={{ color: '#8b949e', marginTop: '4px' }}>1 class + {fitness?.schedule?.customDays} custom days</div>
            </div>
          </div>

          {/* Workout Log - Full Width at Bottom */}
          <div style={{...styles.card, gridColumn: '1 / -1'}}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={styles.cardTitle}>📋 Workout Log</div>
              <button style={{...styles.btn, background: '#238636'}} onClick={() => setShowWorkoutForm(!showWorkoutForm)}>
                {showWorkoutForm ? '✕ Cancel' : '+ Log Workout'}
              </button>
            </div>

            {/* Workout Form */}
            {showWorkoutForm && (
              <div style={{ padding: '16px', background: '#0d1117', borderRadius: '8px', marginBottom: '16px', border: '1px solid #30363d' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: '#8b949e', display: 'block', marginBottom: '4px' }}>Date</label>
                    <input type="date" value={workoutForm.date} onChange={e => setWorkoutForm({...workoutForm, date: e.target.value})} style={{ width: '100%', padding: '8px', background: '#161b22', border: '1px solid #30363d', borderRadius: '6px', color: '#e6edf3' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: '#8b949e', display: 'block', marginBottom: '4px' }}>Type</label>
                    <select value={workoutForm.type} onChange={e => setWorkoutForm({...workoutForm, type: e.target.value})} style={{ width: '100%', padding: '8px', background: '#161b22', border: '1px solid #30363d', borderRadius: '6px', color: '#e6edf3' }}>
                      <option value="upper">Upper</option>
                      <option value="lower">Lower</option>
                      <option value="full">Full Body</option>
                      <option value="run">Run</option>
                      <option value="conditioning">Conditioning</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: '#8b949e', display: 'block', marginBottom: '4px' }}>Body Weight</label>
                    <input type="number" placeholder="lbs" value={workoutForm.body_weight} onChange={e => setWorkoutForm({...workoutForm, body_weight: e.target.value})} style={{ width: '100%', padding: '8px', background: '#161b22', border: '1px solid #30363d', borderRadius: '6px', color: '#e6edf3' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: '#8b949e', display: 'block', marginBottom: '4px' }}>Duration</label>
                    <input type="number" placeholder="min" value={workoutForm.duration_min} onChange={e => setWorkoutForm({...workoutForm, duration_min: e.target.value})} style={{ width: '100%', padding: '8px', background: '#161b22', border: '1px solid #30363d', borderRadius: '6px', color: '#e6edf3' }} />
                  </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '12px', color: '#8b949e', display: 'block', marginBottom: '4px' }}>Description</label>
                  <textarea value={workoutForm.description} onChange={e => setWorkoutForm({...workoutForm, description: e.target.value})} placeholder="What did you do? e.g. Bench 135x5, 185x5, 225x5, 245x3" rows={3} style={{ width: '100%', padding: '8px', background: '#161b22', border: '1px solid #30363d', borderRadius: '6px', color: '#e6edf3', resize: 'vertical' }} />
                </div>

                {/* Tracked Metrics */}
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '12px', color: '#8b949e', display: 'block', marginBottom: '8px' }}>Tracked Lifts</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                    {workoutLogs.metrics?.map(m => {
                      const isSelected = workoutForm.trackedMetrics.some(tm => tm.metric_id === m.id);
                      return (
                        <button key={m.id} onClick={() => toggleTrackedMetric(m)} style={{...styles.btn, background: isSelected ? '#238636' : '#21262d', border: isSelected ? '1px solid #238636' : '1px solid #30363d'}}>
                          {isSelected ? '✓ ' : ''}{m.name}
                        </button>
                      );
                    })}
                  </div>
                  {workoutForm.trackedMetrics.map(tm => (
                    <div key={tm.metric_id} style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px', padding: '8px', background: '#161b22', borderRadius: '6px' }}>
                      <span style={{ minWidth: '100px', fontWeight: '500' }}>{tm.name}</span>
                      {tm.calc_type === 'weight_reps' && (
                        <>
                          <input type="number" placeholder="Weight" value={tm.value} onChange={e => updateTrackedMetric(tm.metric_id, 'value', e.target.value)} style={{ width: '80px', padding: '6px', background: '#0d1117', border: '1px solid #30363d', borderRadius: '4px', color: '#e6edf3' }} />
                          <span style={{ color: '#8b949e' }}>×</span>
                          <input type="number" placeholder="Reps" value={tm.reps} onChange={e => updateTrackedMetric(tm.metric_id, 'reps', e.target.value)} style={{ width: '60px', padding: '6px', background: '#0d1117', border: '1px solid #30363d', borderRadius: '4px', color: '#e6edf3' }} />
                          {tm.value && tm.reps && (
                            <span style={{ color: '#3fb950', fontSize: '12px' }}>→ {Math.round(tm.value * (1 + tm.reps / 30) * 0.9)} tracking</span>
                          )}
                        </>
                      )}
                      {tm.calc_type === 'reps_only' && (
                        <input type="number" placeholder="Reps" value={tm.value} onChange={e => updateTrackedMetric(tm.metric_id, 'value', e.target.value)} style={{ width: '80px', padding: '6px', background: '#0d1117', border: '1px solid #30363d', borderRadius: '4px', color: '#e6edf3' }} />
                      )}
                      {tm.calc_type === 'time' && (
                        <input type="number" placeholder="Minutes" value={tm.value} onChange={e => updateTrackedMetric(tm.metric_id, 'value', e.target.value)} style={{ width: '80px', padding: '6px', background: '#0d1117', border: '1px solid #30363d', borderRadius: '4px', color: '#e6edf3' }} />
                      )}
                    </div>
                  ))}
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '12px', color: '#8b949e', display: 'block', marginBottom: '4px' }}>Notes</label>
                  <input type="text" value={workoutForm.notes} onChange={e => setWorkoutForm({...workoutForm, notes: e.target.value})} placeholder="How did it feel? Any adjustments?" style={{ width: '100%', padding: '8px', background: '#161b22', border: '1px solid #30363d', borderRadius: '6px', color: '#e6edf3' }} />
                </div>

                <button style={{...styles.btn, background: '#238636', padding: '10px 20px'}} onClick={saveWorkout}>Save Workout</button>
              </div>
            )}

            {/* Filters */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <select value={workoutFilter.type} onChange={e => setWorkoutFilter({...workoutFilter, type: e.target.value})} style={{ padding: '6px 12px', background: '#161b22', border: '1px solid #30363d', borderRadius: '6px', color: '#e6edf3' }}>
                <option value="all">All Types</option>
                <option value="upper">Upper</option>
                <option value="lower">Lower</option>
                <option value="full">Full Body</option>
                <option value="run">Run</option>
                <option value="conditioning">Conditioning</option>
              </select>
              <select value={workoutFilter.tracked} onChange={e => setWorkoutFilter({...workoutFilter, tracked: e.target.value})} style={{ padding: '6px 12px', background: '#161b22', border: '1px solid #30363d', borderRadius: '6px', color: '#e6edf3' }}>
                <option value="all">All Workouts</option>
                <option value="tracked">With Tracked Lifts</option>
                <option value="untracked">Without Tracked</option>
              </select>
            </div>

            {/* Workout Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Date</th>
                    <th style={styles.th}>Type</th>
                    <th style={styles.th}>Description</th>
                    <th style={styles.th}>Tracked Lifts</th>
                    <th style={styles.th}>Weight</th>
                    <th style={styles.th}>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {(workoutLogs.logs?.length > 0 ? workoutLogs.logs : fitness?.recentWorkouts)
                    ?.filter(w => workoutFilter.type === 'all' || w.type === workoutFilter.type)
                    ?.filter(w => {
                      if (workoutFilter.tracked === 'all') return true;
                      const hasTracked = w.workout_metrics?.length > 0 || w.topSet;
                      return workoutFilter.tracked === 'tracked' ? hasTracked : !hasTracked;
                    })
                    ?.map((w, i) => {
                      const typeColor = w.type === 'run' ? '#f778ba' : w.type === 'upper' ? '#58a6ff' : w.type === 'lower' ? '#3fb950' : w.type === 'full' ? '#a371f7' : '#d29922';
                      return (
                        <tr key={w.id || w.date + i}>
                          <td style={styles.td}>{w.date}</td>
                          <td style={styles.td}><span style={{...styles.tag, background: typeColor}}>{w.type}</span></td>
                          <td style={{...styles.td, maxWidth: '300px'}}>{w.description}</td>
                          <td style={styles.td}>
                            {w.workout_metrics?.map(wm => (
                              <div key={wm.id} style={{ fontSize: '12px', marginBottom: '2px' }}>
                                <strong>{workoutLogs.metrics?.find(m => m.id === wm.metric_id)?.name}</strong>: {wm.value}{wm.reps ? ` × ${wm.reps}` : ''} {wm.calculated_max ? <span style={styles.green}>→ {wm.calculated_max}</span> : ''}
                              </div>
                            ))}
                            {w.topSet && (
                              <div style={{ fontSize: '12px' }}>
                                <strong>{w.topSet.lift}</strong>: {w.topSet.weight} × {w.topSet.reps} <span style={w.topSet.hit ? styles.green : styles.red}>→ {w.topSet.tracking1RM}</span>
                              </div>
                            )}
                          </td>
                          <td style={styles.td}>{w.body_weight || w.weight || '—'}</td>
                          <td style={{...styles.td, color: '#8b949e', fontSize: '12px', maxWidth: '200px'}}>{w.notes || '—'}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'reviews' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Header with stats */}
          <div style={{...styles.card, background: '#0d1117'}}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ margin: 0, fontSize: '20px' }}>📋 Sub-Agent Reviews</h2>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button 
                  style={{...styles.btn, background: reviewsLoading ? '#21262d' : '#238636'}} 
                  onClick={fetchReviews} 
                  disabled={reviewsLoading}
                >
                  {reviewsLoading ? '⏳ Refreshing...' : '🔄 Refresh'}
                </button>
              </div>
            </div>
            
            {/* Status Summary */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#3fb950' }} />
                <span style={{ fontSize: '13px', color: '#8b949e' }}>Ready to Test ({reviewsSummary['ready-to-test'] || 0})</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#d29922' }} />
                <span style={{ fontSize: '13px', color: '#8b949e' }}>Needs Setup ({reviewsSummary['needs-setup'] || 0})</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#f85149' }} />
                <span style={{ fontSize: '13px', color: '#8b949e' }}>Needs Action ({reviewsSummary['needs-action'] || 0})</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#58a6ff' }} />
                <span style={{ fontSize: '13px', color: '#8b949e' }}>Complete ({reviewsSummary['complete'] || 0})</span>
              </div>
            </div>
            
            <div style={{ fontSize: '14px', color: '#8b949e' }}>
              Review completed deliverables, testing instructions, and next steps for each sub-agent task.
            </div>
          </div>

          {reviewsLoading ? (
            <div style={{...styles.card, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px'}}>
              <div style={{ color: '#8b949e', fontSize: '16px' }}>⏳ Loading reviews...</div>
            </div>
          ) : reviews.length === 0 ? (
            <div style={{...styles.card, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px'}}>
              <div style={{ textAlign: 'center', color: '#8b949e' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
                <div style={{ fontSize: '16px', marginBottom: '8px' }}>No reviews found</div>
                <div style={{ fontSize: '14px' }}>Completed sub-agent deliverables will appear here</div>
              </div>
            </div>
          ) : (
            <div className="review-grid" style={{ display: 'grid', gridTemplateColumns: selectedReview ? 'minmax(200px, 280px) 1fr' : '1fr', gap: '16px' }}>
              {/* Task Cards List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {reviews.map(review => {
                  const isSelected = selectedReview?.taskId === review.taskId;
                  const statusColor = 
                    review.status === 'ready-to-test' ? '#3fb950' :
                    review.status === 'needs-setup' ? '#d29922' :
                    review.status === 'needs-action' ? '#f85149' :
                    review.status === 'complete' ? '#58a6ff' :
                    review.status === 'deployed' ? '#8957e5' : '#8b949e';
                  
                  const statusIcon = 
                    review.status === 'ready-to-test' ? '🟢' :
                    review.status === 'needs-setup' ? '🟡' :
                    review.status === 'needs-action' ? '🟠' :
                    review.status === 'complete' ? '✅' :
                    review.status === 'deployed' ? '🚀' : '⚪';
                  
                  const statusLabel = 
                    review.status === 'ready-to-test' ? 'Ready to Test' :
                    review.status === 'needs-setup' ? 'Needs Setup' :
                    review.status === 'needs-action' ? 'Needs Action' :
                    review.status === 'complete' ? 'Complete' :
                    review.status === 'deployed' ? 'Deployed' : 'Unknown';

                  return (
                    <div 
                      key={review.taskId}
                      onClick={() => setSelectedReview(isSelected ? null : review)}
                      style={{
                        ...styles.card,
                        background: isSelected ? '#21262d' : '#161b22',
                        border: `1px solid ${isSelected ? statusColor : '#30363d'}`,
                        borderLeft: `4px solid ${statusColor}`,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {/* Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>
                            {review.taskName}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{
                              ...styles.tag, 
                              background: statusColor + '33',
                              color: statusColor,
                              fontWeight: '500',
                              fontSize: '11px'
                            }}>
                              {statusIcon} {statusLabel}
                            </span>
                          </div>
                        </div>
                        <div style={{ fontSize: '11px', color: '#8b949e', textAlign: 'right' }}>
                          {new Date(review.lastModified).toLocaleDateString()}
                        </div>
                      </div>

                      {/* What was built */}
                      <div style={{ fontSize: '13px', color: '#8b949e', marginBottom: '12px', lineHeight: '1.4' }}>
                        {review.whatBuilt.slice(0, 120)}{review.whatBuilt.length > 120 ? '...' : ''}
                      </div>

                      {/* Key features preview */}
                      {review.keyFeatures.length > 0 && (
                        <div style={{ marginBottom: '12px' }}>
                          <div style={{ fontSize: '11px', color: '#8b949e', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Key Features
                          </div>
                          <div style={{ fontSize: '12px', color: '#e6edf3' }}>
                            {review.keyFeatures.slice(0, 2).map((feature, i) => (
                              <div key={i} style={{ marginBottom: '2px' }}>• {feature}</div>
                            ))}
                            {review.keyFeatures.length > 2 && (
                              <div style={{ color: '#8b949e', fontSize: '11px' }}>
                                +{review.keyFeatures.length - 2} more...
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Ready For checklist preview */}
                      {review.readyFor.length > 0 && (
                        <div style={{ marginBottom: '8px' }}>
                          <div style={{ fontSize: '11px', color: '#8b949e', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Ready For
                          </div>
                          <div style={{ display: 'flex', flex: 'wrap', gap: '4px', alignItems: 'center' }}>
                            {review.readyFor.slice(0, 3).map((item, i) => (
                              <span key={i} style={{ 
                                fontSize: '10px',
                                padding: '2px 6px',
                                background: item.completed ? '#238636' : '#30363d',
                                color: item.completed ? '#e6edf3' : '#8b949e',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '2px'
                              }}>
                                {item.completed ? '✓' : '○'} {item.text.slice(0, 20)}{item.text.length > 20 ? '...' : ''}
                              </span>
                            ))}
                            {review.readyFor.length > 3 && (
                              <span style={{ fontSize: '10px', color: '#8b949e' }}>+{review.readyFor.length - 3}</span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Deliverable count */}
                      {review.deliverableFiles.length > 0 && (
                        <div style={{ fontSize: '11px', color: '#8b949e', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          📁 {review.deliverableFiles.length} deliverable{review.deliverableFiles.length !== 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Detailed View */}
              {selectedReview && (
                <div style={{...styles.card, flex: 1, maxHeight: '80vh', overflowY: 'auto'}}>
                  <div style={{ 
                    position: 'sticky',
                    top: 0,
                    background: '#161b22',
                    paddingBottom: '16px',
                    marginBottom: '16px',
                    borderBottom: '1px solid #30363d',
                    zIndex: 10
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <h2 style={{ margin: 0, fontSize: '20px', marginBottom: '8px' }}>
                          {selectedReview.taskName}
                        </h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{
                            ...styles.tag,
                            background: 
                              selectedReview.status === 'ready-to-test' ? '#3fb950' :
                              selectedReview.status === 'needs-setup' ? '#d29922' :
                              selectedReview.status === 'needs-action' ? '#f85149' :
                              selectedReview.status === 'complete' ? '#58a6ff' :
                              selectedReview.status === 'deployed' ? '#8957e5' : '#8b949e',
                            fontWeight: '600',
                            fontSize: '12px'
                          }}>
                            {selectedReview.status === 'ready-to-test' ? '🟢 Ready to Test' :
                             selectedReview.status === 'needs-setup' ? '🟡 Needs Setup' :
                             selectedReview.status === 'needs-action' ? '🟠 Needs Action' :
                             selectedReview.status === 'complete' ? '✅ Complete' :
                             selectedReview.status === 'deployed' ? '🚀 Deployed' : '⚪ Unknown'}
                          </span>
                          <span style={{ fontSize: '12px', color: '#8b949e' }}>
                            Updated {new Date(selectedReview.lastModified).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <button 
                        style={{...styles.btn, fontSize: '11px', padding: '6px 12px', minHeight: 'auto'}}
                        onClick={() => setSelectedReview(null)}
                      >
                        ← Back
                      </button>
                    </div>
                  </div>

                  {/* What Was Built */}
                  <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '16px', color: '#58a6ff', margin: '0 0 12px', borderBottom: '1px solid #30363d', paddingBottom: '6px' }}>
                      🔨 What Was Built
                    </h3>
                    <div style={{ fontSize: '14px', lineHeight: '1.6', color: '#e6edf3' }}>
                      {selectedReview.whatBuilt}
                    </div>
                  </div>

                  {/* Key Features */}
                  {selectedReview.keyFeatures.length > 0 && (
                    <div style={{ marginBottom: '24px' }}>
                      <h3 style={{ fontSize: '16px', color: '#58a6ff', margin: '0 0 12px', borderBottom: '1px solid #30363d', paddingBottom: '6px' }}>
                        ⭐ Key Features
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {selectedReview.keyFeatures.map((feature, i) => (
                          <div key={i} style={{ 
                            display: 'flex', 
                            alignItems: 'flex-start', 
                            gap: '8px',
                            padding: '8px',
                            background: '#0d1117',
                            borderRadius: '6px',
                            border: '1px solid #21262d'
                          }}>
                            <span style={{ color: '#3fb950', fontSize: '12px', marginTop: '2px' }}>✓</span>
                            <span style={{ fontSize: '14px', lineHeight: '1.5' }}>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Testing Instructions */}
                  {selectedReview.testingInstructions && (
                    <div style={{ marginBottom: '24px' }}>
                      <h3 style={{ fontSize: '16px', color: '#58a6ff', margin: '0 0 12px', borderBottom: '1px solid #30363d', paddingBottom: '6px' }}>
                        🧪 Testing Instructions
                      </h3>
                      <div style={{
                        background: '#0d1117',
                        border: '1px solid #21262d',
                        borderRadius: '8px',
                        padding: '16px'
                      }}>
                        <div 
                          style={{ fontSize: '13px', lineHeight: '1.6', fontFamily: 'monospace' }}
                          dangerouslySetInnerHTML={{ __html: renderMarkdown(selectedReview.testingInstructions) }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Required Setup */}
                  {selectedReview.requiredSetup && (
                    <div style={{ marginBottom: '24px' }}>
                      <h3 style={{ fontSize: '16px', color: '#58a6ff', margin: '0 0 12px', borderBottom: '1px solid #30363d', paddingBottom: '6px' }}>
                        ⚙️ Required Setup
                      </h3>
                      <div style={{
                        background: '#0d1117',
                        border: '1px solid #d29922',
                        borderRadius: '8px',
                        padding: '16px'
                      }}>
                        <div 
                          style={{ fontSize: '14px', lineHeight: '1.6' }}
                          dangerouslySetInnerHTML={{ __html: renderMarkdown(selectedReview.requiredSetup) }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Ready For Checklist */}
                  {selectedReview.readyFor.length > 0 && (
                    <div style={{ marginBottom: '24px' }}>
                      <h3 style={{ fontSize: '16px', color: '#58a6ff', margin: '0 0 12px', borderBottom: '1px solid #30363d', paddingBottom: '6px' }}>
                        ✅ Ready For
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {selectedReview.readyFor.map((item, i) => (
                          <div key={i} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '12px',
                            background: item.completed ? '#238636' + '22' : '#21262d',
                            border: `1px solid ${item.completed ? '#238636' : '#30363d'}`,
                            borderRadius: '6px'
                          }}>
                            <span style={{ 
                              fontSize: '16px',
                              color: item.completed ? '#3fb950' : '#8b949e'
                            }}>
                              {item.completed ? '✅' : '☐'}
                            </span>
                            <span style={{ 
                              fontSize: '14px', 
                              color: item.completed ? '#e6edf3' : '#8b949e',
                              textDecoration: item.completed ? 'line-through' : 'none'
                            }}>
                              {item.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Deliverable Files */}
                  {selectedReview.deliverableFiles.length > 0 && (
                    <div style={{ marginBottom: '24px' }}>
                      <h3 style={{ fontSize: '16px', color: '#58a6ff', margin: '0 0 12px', borderBottom: '1px solid #30363d', paddingBottom: '6px' }}>
                        📁 Deliverable Files
                      </h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' }}>
                        {selectedReview.deliverableFiles.map((file, i) => (
                          <div key={i} style={{
                            padding: '8px 12px',
                            background: '#0d1117',
                            border: '1px solid #30363d',
                            borderRadius: '6px',
                            fontSize: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}>
                            <span>{file.type === 'folder' ? '📂' : '📄'}</span>
                            <span>{file.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Full Content (collapsible) */}
                  <div style={{ borderTop: '1px solid #30363d', paddingTop: '16px' }}>
                    <details style={{ fontSize: '14px' }}>
                      <summary style={{ 
                        cursor: 'pointer', 
                        color: '#58a6ff', 
                        marginBottom: '12px',
                        fontSize: '16px',
                        fontWeight: '500'
                      }}>
                        📄 View Full REVIEW.md Content
                      </summary>
                      <div 
                        style={{ 
                          background: '#0d1117',
                          border: '1px solid #30363d',
                          borderRadius: '8px',
                          padding: '16px',
                          fontSize: '13px',
                          lineHeight: '1.6',
                          fontFamily: 'monospace',
                          whiteSpace: 'pre-wrap',
                          color: '#8b949e'
                        }}
                      >
                        {selectedReview.fullContent}
                      </div>
                    </details>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {tab === 'tasks' && (
        <KanbanBoard 
          kanban={kanban}
          newTask={newTask}
          setNewTask={setNewTask}
          addTask={addTask}
          updateTask={updateTask}
          deleteTask={deleteTask}
          fetchKanban={fetchKanban}
          styles={styles}
        />
      )}

      {tab === 'settings' && (
        <div style={styles.grid}>
          {/* Newsletter Scheduling */}
          <div style={{...styles.card, gridColumn: 'span 2'}}>
            <div style={{...styles.cardTitle, marginBottom: '16px'}}>
              <span>📅 Newsletter Scheduling</span>
              <button style={styles.btn} onClick={fetchUserSchedule} disabled={scheduleLoading}>
                {scheduleLoading ? '⏳' : '🔄'} Refresh
              </button>
            </div>
            
            {userSchedule ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                {/* Time & Timezone Settings */}
                <div style={{ padding: '16px', background: '#0d1117', borderRadius: '8px', border: '1px solid #30363d' }}>
                  <h4 style={{ margin: '0 0 12px', color: '#58a6ff' }}>🕐 Delivery Time</h4>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '12px', color: '#8b949e', marginBottom: '4px' }}>Preferred Time</label>
                    <input 
                      type="time" 
                      value={userSchedule.preferred_send_time?.slice(0, 5) || '09:00'}
                      onChange={(e) => updateUserSchedule({ preferred_send_time: e.target.value + ':00' })}
                      style={{ padding: '8px', background: '#161b22', border: '1px solid #30363d', borderRadius: '6px', color: '#e6edf3', fontSize: '14px' }}
                    />
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '12px', color: '#8b949e', marginBottom: '4px' }}>Timezone</label>
                    <select 
                      value={userSchedule.timezone || 'America/Los_Angeles'}
                      onChange={(e) => updateUserSchedule({ timezone: e.target.value })}
                      style={{ padding: '8px', background: '#161b22', border: '1px solid #30363d', borderRadius: '6px', color: '#e6edf3', fontSize: '14px', width: '100%' }}
                    >
                      <optgroup label="US Timezones">
                        <option value="America/Los_Angeles">Pacific (PT)</option>
                        <option value="America/Denver">Mountain (MT)</option>
                        <option value="America/Chicago">Central (CT)</option>
                        <option value="America/New_York">Eastern (ET)</option>
                      </optgroup>
                      <optgroup label="Other">
                        <option value="UTC">UTC</option>
                        <option value="Europe/London">London (GMT)</option>
                        <option value="Europe/Paris">Paris (CET)</option>
                        <option value="Asia/Tokyo">Tokyo (JST)</option>
                        <option value="Australia/Sydney">Sydney (AEDT)</option>
                      </optgroup>
                    </select>
                  </div>
                  {userSchedule.next_newsletter && (
                    <div style={{ fontSize: '12px', color: '#3fb950', marginTop: '8px', padding: '8px', background: '#0d1117', borderRadius: '4px', border: '1px solid #238636' }}>
                      ✅ Next newsletter: <strong>{userSchedule.next_newsletter.local}</strong>
                    </div>
                  )}
                </div>

                {/* Frequency & Options */}
                <div style={{ padding: '16px', background: '#0d1117', borderRadius: '8px', border: '1px solid #30363d' }}>
                  <h4 style={{ margin: '0 0 12px', color: '#58a6ff' }}>📊 Frequency & Options</h4>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '12px', color: '#8b949e', marginBottom: '4px' }}>Send Frequency</label>
                    <select 
                      value={userSchedule.send_frequency || 'daily'}
                      onChange={(e) => updateUserSchedule({ send_frequency: e.target.value })}
                      style={{ padding: '8px', background: '#161b22', border: '1px solid #30363d', borderRadius: '6px', color: '#e6edf3', fontSize: '14px', width: '100%' }}
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="bi-weekly">Bi-weekly</option>
                    </select>
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={userSchedule.weekend_delivery || false}
                        onChange={(e) => updateUserSchedule({ weekend_delivery: e.target.checked })}
                        style={{ width: '16px', height: '16px' }}
                      />
                      <span style={{ fontSize: '14px', color: '#e6edf3' }}>Weekend Delivery</span>
                    </label>
                    <div style={{ fontSize: '11px', color: '#8b949e', marginTop: '4px', marginLeft: '24px' }}>
                      Receive newsletters on weekends
                    </div>
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <label style={{ display: 'block', fontSize: '12px', color: '#8b949e', marginBottom: '4px' }}>Max per Day</label>
                    <input 
                      type="number" 
                      min="1" 
                      max="5"
                      value={userSchedule.max_newsletters_per_day || 1}
                      onChange={(e) => updateUserSchedule({ max_newsletters_per_day: parseInt(e.target.value) })}
                      style={{ padding: '8px', background: '#161b22', border: '1px solid #30363d', borderRadius: '6px', color: '#e6edf3', fontSize: '14px', width: '80px' }}
                    />
                  </div>
                </div>

                {/* Status & History */}
                <div style={{ padding: '16px', background: '#0d1117', borderRadius: '8px', border: '1px solid #30363d' }}>
                  <h4 style={{ margin: '0 0 12px', color: '#58a6ff' }}>📈 Status</h4>
                  <div style={{ fontSize: '13px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                      <span style={{ color: '#8b949e' }}>Status</span>
                      <span style={{ color: userSchedule.preferred_send_time ? '#3fb950' : '#d29922' }}>
                        {userSchedule.preferred_send_time ? '🟢 Active' : '🟡 Not Scheduled'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                      <span style={{ color: '#8b949e' }}>Last Sent</span>
                      <span>{userSchedule.last_newsletter_sent || 'Never'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                      <span style={{ color: '#8b949e' }}>Email</span>
                      <span style={{ fontSize: '11px' }}>{userSchedule.email}</span>
                    </div>
                  </div>
                  
                  {/* Quick Actions */}
                  <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button 
                      style={{...styles.btn, background: '#238636', fontSize: '12px', padding: '6px 12px'}} 
                      onClick={() => {
                        // Test the scheduling system
                        fetch('/api/newsletter/check-scheduled')
                          .then(r => r.json())
                          .then(data => {
                            alert(`Test run complete:\n${data.summary?.users_checked || 0} users checked\n${data.summary?.newsletters_sent || 0} newsletters sent`);
                          })
                          .catch(e => alert('Test failed: ' + e.message));
                      }}
                    >
                      🧪 Test Send
                    </button>
                    <button 
                      style={{...styles.btn, fontSize: '12px', padding: '6px 12px'}} 
                      onClick={() => {
                        if (confirm('Reset all scheduling preferences to defaults?')) {
                          fetch(`/api/user-schedule?email=${userSchedule.email}`, { method: 'DELETE' })
                            .then(() => fetchUserSchedule())
                            .catch(e => alert('Reset failed: ' + e.message));
                        }
                      }}
                    >
                      🔄 Reset
                    </button>
                  </div>
                </div>

                {/* Preview */}
                {userSchedule.next_newsletter && (
                  <div style={{ padding: '16px', background: '#0d1117', borderRadius: '8px', border: '1px solid #3fb950', gridColumn: 'span 2' }}>
                    <h4 style={{ margin: '0 0 12px', color: '#3fb950' }}>🔮 Preview</h4>
                    <div style={{ fontSize: '13px', color: '#8b949e' }}>
                      Based on your current settings, your next newsletter will be delivered on:
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: '600', color: '#3fb950', margin: '8px 0' }}>
                      {userSchedule.next_newsletter.local}
                    </div>
                    <div style={{ fontSize: '12px', color: '#8b949e' }}>
                      That's <strong>{userSchedule.preferred_send_time?.slice(0, 5)}</strong> in your timezone ({userSchedule.timezone})
                    </div>
                    {userSchedule.send_frequency !== 'daily' && (
                      <div style={{ fontSize: '11px', color: '#d29922', marginTop: '4px' }}>
                        📅 Recurring {userSchedule.send_frequency}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#8b949e' }}>
                <p>Click Refresh to load scheduling preferences</p>
                <button style={{...styles.btn, marginTop: '12px'}} onClick={fetchUserSchedule}>
                  Load Preferences
                </button>
              </div>
            )}
          </div>
          
          {/* myjunto Settings */}
          <div style={{...styles.card, gridColumn: 'span 2'}}>
            <div style={{...styles.cardTitle, marginBottom: '16px'}}>
              <span>⚙️ myjunto Settings</span>
              <button style={styles.btn} onClick={fetchJuntoStatus}>
                {juntoLoading ? '⏳' : '🔄'} Refresh
              </button>
            </div>
            
            {juntoStatus ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                {/* Delivery Settings */}
                <div style={{ padding: '16px', background: '#0d1117', borderRadius: '8px', border: '1px solid #30363d' }}>
                  <h4 style={{ margin: '0 0 12px', color: '#58a6ff' }}>📬 Newsletter Delivery</h4>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '12px', color: '#8b949e', marginBottom: '4px' }}>Delivery Time</label>
                    <input 
                      type="time" 
                      value={juntoSettings?.settings?.delivery_time || '05:00'}
                      onChange={(e) => updateJuntoSettings({ settings: { ...juntoSettings?.settings, delivery_time: e.target.value } })}
                      style={{ padding: '8px', background: '#161b22', border: '1px solid #30363d', borderRadius: '6px', color: '#e6edf3', fontSize: '14px' }}
                    />
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '12px', color: '#8b949e', marginBottom: '4px' }}>Timezone</label>
                    <select 
                      value={juntoSettings?.settings?.timezone || 'America/Los_Angeles'}
                      onChange={(e) => updateJuntoSettings({ settings: { ...juntoSettings?.settings, timezone: e.target.value } })}
                      style={{ padding: '8px', background: '#161b22', border: '1px solid #30363d', borderRadius: '6px', color: '#e6edf3', fontSize: '14px', width: '100%' }}
                    >
                      <option value="America/Los_Angeles">Pacific (PT)</option>
                      <option value="America/Denver">Mountain (MT)</option>
                      <option value="America/Chicago">Central (CT)</option>
                      <option value="America/New_York">Eastern (ET)</option>
                      <option value="UTC">UTC</option>
                    </select>
                  </div>
                  {juntoStatus?.user?.next_newsletter && (
                    <div style={{ fontSize: '12px', color: '#3fb950', marginTop: '8px' }}>
                      ✓ Next delivery: {juntoStatus.user.next_newsletter.local} ({juntoStatus.user.next_newsletter.timezone})
                    </div>
                  )}
                </div>

                {/* Data Sources */}
                <div style={{ padding: '16px', background: '#0d1117', borderRadius: '8px', border: '1px solid #30363d' }}>
                  <h4 style={{ margin: '0 0 12px', color: '#58a6ff' }}>📡 Data Sources</h4>
                  <div style={{ fontSize: '13px' }}>
                    <div style={{ marginBottom: '8px', color: '#8b949e' }}>
                      Tracking {juntoStatus?.system?.profiles_tracked || 0} profiles
                    </div>
                    {juntoStatus?.data_sources?.map(src => (
                      <div key={src.handle} style={{ padding: '6px 0', borderBottom: '1px solid #21262d', display: 'flex', justifyContent: 'space-between' }}>
                        <span>{src.handle}</span>
                        <span style={{ color: '#8b949e', fontSize: '11px' }}>
                          {src.tweets} tweets • {src.last_fetch ? new Date(src.last_fetch).toLocaleString() : 'never'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* System Status */}
                <div style={{ padding: '16px', background: '#0d1117', borderRadius: '8px', border: '1px solid #30363d' }}>
                  <h4 style={{ margin: '0 0 12px', color: '#58a6ff' }}>📊 System Status</h4>
                  <div style={{ fontSize: '13px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                      <span style={{ color: '#8b949e' }}>Status</span>
                      <span style={{ color: juntoStatus?.status === 'healthy' ? '#3fb950' : '#f85149' }}>
                        {juntoStatus?.status === 'healthy' ? '🟢 Healthy' : '🔴 Error'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                      <span style={{ color: '#8b949e' }}>Newsletters (7d)</span>
                      <span>{juntoStatus?.system?.newsletters_last_7d || 0}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                      <span style={{ color: '#8b949e' }}>Total Tweets</span>
                      <span>{juntoStatus?.system?.total_tweets?.toLocaleString() || 0}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                      <span style={{ color: '#8b949e' }}>Cron Schedule</span>
                      <span style={{ fontSize: '11px' }}>{juntoStatus?.system?.cron_schedule || 'hourly'}</span>
                    </div>
                  </div>
                </div>

                {/* Custom Prompt */}
                <div style={{ padding: '16px', background: '#0d1117', borderRadius: '8px', border: '1px solid #30363d', gridColumn: 'span 2' }}>
                  <h4 style={{ margin: '0 0 12px', color: '#58a6ff' }}>✍️ Custom Prompt (optional)</h4>
                  <textarea 
                    value={juntoSettings?.custom_prompt || ''}
                    onChange={(e) => updateJuntoSettings({ custom_prompt: e.target.value })}
                    placeholder="Leave empty for default prompt. Add custom instructions to personalize your newsletter..."
                    style={{ 
                      width: '100%', 
                      minHeight: '100px', 
                      padding: '12px', 
                      background: '#161b22', 
                      border: '1px solid #30363d', 
                      borderRadius: '6px', 
                      color: '#e6edf3', 
                      fontSize: '13px',
                      resize: 'vertical'
                    }}
                  />
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#8b949e' }}>
                <p>Click Refresh to load myjunto settings</p>
                <button style={{...styles.btn, marginTop: '12px'}} onClick={fetchJuntoStatus}>
                  Load Settings
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
