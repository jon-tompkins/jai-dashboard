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
    padding: '10px 16px', 
    background: '#161b22', 
    border: '1px solid #30363d', 
    borderRadius: '6px', 
    cursor: 'pointer', 
    color: '#8b949e',
    whiteSpace: 'nowrap',
    minHeight: '44px', // Touch-friendly
    display: 'flex',
    alignItems: 'center',
  },
  tabActive: { 
    padding: '10px 16px', 
    background: '#58a6ff', 
    border: '1px solid #58a6ff', 
    borderRadius: '6px', 
    cursor: 'pointer', 
    color: '#fff',
    whiteSpace: 'nowrap',
    minHeight: '44px',
    display: 'flex',
    alignItems: 'center',
  },
  // Responsive grid - uses CSS class
  grid: { 
    display: 'grid', 
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', // min() prevents overflow
    gap: '16px' 
  },
  card: { 
    background: '#161b22', 
    border: '1px solid #30363d', 
    borderRadius: '8px', 
    padding: 'clamp(12px, 2vw, 16px)' // Responsive padding
  },
  cardTitle: { 
    fontSize: '14px', 
    color: '#8b949e', 
    textTransform: 'uppercase', 
    letterSpacing: '0.5px', 
    marginBottom: '12px', 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '8px',
  },
  bigNum: { fontSize: 'clamp(24px, 5vw, 28px)', fontWeight: '600' },
  green: { color: '#3fb950' },
  red: { color: '#f85149' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '13px', marginTop: '12px' },
  th: { textAlign: 'left', padding: '8px 4px', borderBottom: '1px solid #30363d', color: '#8b949e', fontWeight: '500', whiteSpace: 'nowrap' },
  td: { padding: '8px 4px', borderBottom: '1px solid #21262d' },
  tag: { display: 'inline-block', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', marginRight: '4px' },
  btn: { 
    padding: '8px 16px', 
    background: '#21262d', 
    border: '1px solid #30363d', 
    borderRadius: '6px', 
    color: '#e6edf3', 
    cursor: 'pointer', 
    fontSize: '14px',
    minHeight: '44px', // Touch-friendly
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
  return text
    .replace(/^### (.+)$/gm, '<h4 style="color: #58a6ff; margin: 16px 0 8px;">$1</h4>')
    .replace(/^## (.+)$/gm, '<h3 style="color: #e6edf3; margin: 20px 0 10px; border-bottom: 1px solid #30363d; padding-bottom: 6px;">$1</h3>')
    .replace(/^# (.+)$/gm, '<h2 style="font-size: 20px; margin: 0 0 16px;">$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li style="margin: 4px 0; margin-left: 20px;">$1</li>')
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

function HoldingsRow({ holding, s, publicScreenshot, formatMoney, formatPct }) {
  const [expanded, setExpanded] = useState(false);
  
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
        <td style={styles.td}>${holding.price?.toFixed(2)}</td>
        <td style={styles.td}>{formatMoney(holding.value)}</td>
        <td style={styles.td}>{formatMoney(holding.notional)}</td>
        <td style={{...styles.td, ...(holding.pl >= 0 ? styles.green : styles.red)}}>
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

export default function Dashboard() {
  const [tab, setTab] = useState('portfolio');
  const [portfolio, setPortfolio] = useState(null);
  const [trades, setTrades] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);
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

  // Wrapper that uses component state
  const fmtMoney = (n) => formatMoney(n, publicScreenshot);

  useEffect(() => { fetchFitness(); fetchWorkoutLogs(); }, []);

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
  const totalTradeValue = tradeValues.reduce((sum, t) => sum + t.values.total, 0);
  const pieData = tradeValues.filter(t => t.values.total > 0).map(t => ({ name: t.name, value: t.values.total, color: t.color }));

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
        {['portfolio', 'trades', 'assets', 'reports', 'fitness', 'review'].map(t => (
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
            {lastRefresh && <span style={{ color: '#8b949e', fontSize: '12px' }}>Last: {lastRefresh.toLocaleTimeString()}</span>}
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
                  <th style={styles.th}>Price</th>
                  <th style={styles.th}>Value</th>
                  <th style={styles.th}>Notional</th>
                  <th style={styles.th}>P/L</th>
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
                    />
                  ));
                })()}
              </tbody>
            </table>
            </div>{/* table-responsive */}
          </div>
        </>
      )}

      {tab === 'trades' && (
        <>
          <div style={{ marginBottom: '16px' }}>
            <button style={styles.btn} onClick={() => { fetchTrades(); fetchPortfolio(); }}>🔄 Refresh</button>
          </div>

          {/* Summary Section */}
          <div style={{...styles.card, marginBottom: '24px'}}>
            <div style={styles.cardTitle}>📊 Trade Allocation Summary</div>
            <div style={styles.summaryGrid} className="summary-grid">
              <div className="pie-container">
                <PieChart data={pieData} />
              </div>
              <div className="table-responsive">
                <table style={{...styles.table, marginTop: 0}}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Trade</th>
                      <th style={styles.th}>Value</th>
                      <th style={styles.th}>%</th>
                      <th style={{...styles.th, minWidth: '100px'}}>Eq/Opt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tradeValues.filter(t => t.values.total > 0).sort((a,b) => b.values.total - a.values.total).map(t => {
                      const eqPct = t.values.total > 0 ? Math.round((t.values.equity + t.values.crypto) / t.values.total * 100) : 0;
                      const optPct = 100 - eqPct;
                      return (
                        <tr key={t.id}>
                          <td style={styles.td}>
                            <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '2px', background: t.color, marginRight: '8px' }} />
                            <span style={{ whiteSpace: 'nowrap' }}>{t.name}</span>
                          </td>
                          <td style={styles.td}>{formatMoney(t.values.total)}</td>
                          <td style={styles.td}>{totalTradeValue > 0 ? Math.round(t.values.total / totalTradeValue * 100) : 0}%</td>
                          <td style={styles.td}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <div style={{ width: '50px', height: '8px', background: '#21262d', borderRadius: '4px', overflow: 'hidden', display: 'flex' }}>
                                <div style={{ width: `${eqPct}%`, background: '#3fb950' }} />
                                <div style={{ width: `${optPct}%`, background: '#d29922' }} />
                              </div>
                              <span style={{ fontSize: '11px', color: '#8b949e' }}>{eqPct}/{optPct}</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div style={{ fontSize: '11px', color: '#8b949e', marginTop: '8px' }}>
                  🟢 Equity/Crypto | 🟡 Options
                </div>
              </div>
            </div>
          </div>

          {/* Trade Cards */}
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
        </>
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
        
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Mobile: Collapsible file picker */}
            <div style={styles.card} className="reports-picker">
              <div 
                style={{...styles.cardTitle, cursor: 'pointer', marginBottom: reportsListOpen ? '12px' : 0 }} 
                onClick={() => setReportsListOpen(!reportsListOpen)}
                className="collapsible-header"
              >
                <span>📊 Reports ({allReports.length}) {selectedReport && !reportsListOpen ? `• ${selectedReport._title}` : ''}</span>
                <span style={{ fontSize: '12px', color: '#8b949e' }}>{reportsListOpen ? '▼ collapse' : '▶ select'}</span>
              </div>
              <div style={{ maxHeight: reportsListOpen ? '40vh' : 0, overflow: 'hidden', overflowY: reportsListOpen ? 'auto' : 'hidden', transition: 'max-height 0.2s ease' }}>
                {allReports.length === 0 ? (
                  <p style={{ color: '#8b949e' }}>No reports yet</p>
                ) : (
                  allReports.map(r => {
                    const isSelected = selectedReport?.id === r.id;
                    const typeColor = r._type === 'newsletter' ? '#1d9bf0' : r.type === 'sector' ? '#d29922' : '#238636';
                    const typeLabel = r._type === 'newsletter' ? (r.type || 'newsletter') : r.type;
                    return (
                      <div key={r.id} style={{...styles.researchItem, borderColor: isSelected ? '#58a6ff' : '#30363d'}} onClick={() => { r._type === 'newsletter' ? setSelectedNewsletter(r) : setSelected(r); r._type === 'newsletter' ? setSelected(null) : setSelectedNewsletter(null); setReportsListOpen(false); }}>
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

      {tab === 'review' && (
        <div className="review-grid" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'minmax(200px, 280px) 1fr', 
          gap: '16px'
        }}>
          {/* File List - responsive */}
          <div className="review-file-list" style={{...styles.card, maxHeight: reviewContent ? '40vh' : 'auto', overflowY: 'auto'}}>
            <div style={styles.cardTitle}>📁 Files ({reviewFiles.length})</div>
            {reviewFiles.length === 0 ? (
              <p style={{ color: '#8b949e', fontSize: '14px' }}>Loading files...</p>
            ) : (
              Object.entries(reviewFiles.reduce((acc, f) => {
                if (!acc[f.category]) acc[f.category] = [];
                acc[f.category].push(f);
                return acc;
              }, {})).map(([category, files]) => (
                <div key={category} style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '11px', color: '#8b949e', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>{category}</div>
                  {files.map(f => {
                    const isSelected = selectedReviewFile?.path === f.path;
                    return (
                      <div 
                        key={f.path} 
                        onClick={() => { setSelectedReviewFile(f); fetchReviewContent(f.path); }}
                        style={{
                          padding: '10px 12px',
                          margin: '4px 0',
                          background: isSelected ? '#21262d' : '#0d1117',
                          border: `1px solid ${isSelected ? '#58a6ff' : '#30363d'}`,
                          borderRadius: '6px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ fontWeight: 500, fontSize: '14px' }}>📄 {f.name}</div>
                        <div style={{ fontSize: '11px', color: '#8b949e', marginTop: '4px' }}>
                          {(f.size / 1024).toFixed(1)} KB • {new Date(f.modified).toLocaleDateString()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* File Content Viewer */}
          <div className="review-content" style={{...styles.card, minHeight: '60vh', maxHeight: '80vh', overflowY: 'auto'}}>
            {reviewLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: '#8b949e' }}>
                ⏳ Loading...
              </div>
            ) : reviewContent ? (
              <>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '16px',
                  paddingBottom: '12px',
                  borderBottom: '1px solid #30363d',
                  position: 'sticky',
                  top: 0,
                  background: '#161b22',
                  zIndex: 10
                }}>
                  <h2 style={{ margin: 0, fontSize: '18px' }}>📄 {reviewContent.name}</h2>
                  <span style={{ fontSize: '12px', color: '#8b949e' }}>{(reviewContent.size / 1024).toFixed(1)} KB</span>
                </div>
                <div 
                  style={{ 
                    fontSize: '14px', 
                    lineHeight: '1.7',
                    color: '#e6edf3'
                  }} 
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(reviewContent.content) }} 
                />
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: '#8b949e' }}>
                ← Select a file to view
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
