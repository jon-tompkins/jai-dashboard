'use client';
import { useState, useEffect } from 'react';

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
  'hedges': '#da3633'
};

const styles = {
  container: { background: '#0d1117', minHeight: '100vh', color: '#e6edf3', padding: '20px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #30363d' },
  tabs: { display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' },
  tab: { padding: '8px 16px', background: '#161b22', border: '1px solid #30363d', borderRadius: '6px', cursor: 'pointer', color: '#8b949e' },
  tabActive: { padding: '8px 16px', background: '#58a6ff', border: '1px solid #58a6ff', borderRadius: '6px', cursor: 'pointer', color: '#fff' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' },
  card: { background: '#161b22', border: '1px solid #30363d', borderRadius: '8px', padding: '16px' },
  cardTitle: { fontSize: '14px', color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  bigNum: { fontSize: '28px', fontWeight: '600' },
  green: { color: '#3fb950' },
  red: { color: '#f85149' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '13px', marginTop: '12px' },
  th: { textAlign: 'left', padding: '8px 4px', borderBottom: '1px solid #30363d', color: '#8b949e', fontWeight: '500' },
  td: { padding: '8px 4px', borderBottom: '1px solid #21262d' },
  tag: { display: 'inline-block', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', marginRight: '4px' },
  btn: { padding: '6px 12px', background: '#21262d', border: '1px solid #30363d', borderRadius: '6px', color: '#e6edf3', cursor: 'pointer', fontSize: '12px' },
  researchGrid: { display: 'grid', gridTemplateColumns: '280px 1fr', gap: '16px' },
  researchItem: { padding: '10px', margin: '4px 0', background: '#0d1117', border: '1px solid #30363d', borderRadius: '6px', cursor: 'pointer' },
  convictionBar: { display: 'flex', gap: '2px' },
  convictionDot: { width: '8px', height: '8px', borderRadius: '50%', background: '#30363d' },
  convictionDotFilled: { width: '8px', height: '8px', borderRadius: '50%', background: '#3fb950' },
  pieContainer: { position: 'relative', width: '180px', height: '180px' },
  summaryGrid: { display: 'grid', gridTemplateColumns: '200px 1fr', gap: '24px', alignItems: 'start' },
};

function formatMoney(n) { return '$' + (n || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }); }
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

  useEffect(() => { 
    fetchPortfolio(); 
    fetchReports(); 
    fetchTrades();
    fetchAssets();
    fetchNewsletters();
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
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={{ fontSize: '24px', margin: 0 }}>⚡ Jai Dashboard</h1>
        <div style={{ color: '#8b949e' }}>{new Date().toLocaleDateString()}</div>
      </div>

      <div style={styles.tabs}>
        {['portfolio', 'trades', 'assets', 'research', 'newsletters'].map(t => (
          <div key={t} style={tab === t ? styles.tabActive : styles.tab} onClick={() => setTab(t)}>
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

          <div style={{...styles.card, marginTop: '16px'}}>
            <div style={styles.cardTitle}>
              <span>📈 Equities ({portfolio?.equities?.length || 0})</span>
              <span style={{ fontSize: '16px', fontWeight: '600' }}>{formatMoney(s.equities)}</span>
            </div>
            <table style={styles.table}>
              <thead><tr><th style={styles.th}>Symbol</th><th style={styles.th}>Shares</th><th style={styles.th}>Price</th><th style={styles.th}>Value</th><th style={styles.th}>P/L</th></tr></thead>
              <tbody>
                {portfolio?.equities?.map(e => (
                  <tr key={e.symbol + e.units}>
                    <td style={styles.td}><strong>{e.symbol}</strong></td>
                    <td style={styles.td}>{e.units}</td>
                    <td style={styles.td}>${e.price?.toFixed(2)}</td>
                    <td style={styles.td}>{formatMoney(e.value)}</td>
                    <td style={{...styles.td, ...(e.pl >= 0 ? styles.green : styles.red)}}>{formatMoney(e.pl)} ({formatPct(e.plPct)})</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{...styles.card, marginTop: '16px'}}>
            <div style={styles.cardTitle}>
              <span>🪙 Crypto ({portfolio?.crypto?.length || 0})</span>
              <span style={{ fontSize: '16px', fontWeight: '600' }}>{formatMoney(s.crypto)}</span>
            </div>
            <table style={styles.table}>
              <thead><tr><th style={styles.th}>Symbol</th><th style={styles.th}>Units</th><th style={styles.th}>Price</th><th style={styles.th}>Value</th><th style={styles.th}>P/L</th></tr></thead>
              <tbody>
                {portfolio?.crypto?.map(c => (
                  <tr key={c.symbol}>
                    <td style={styles.td}><strong>{c.symbol}</strong></td>
                    <td style={styles.td}>{c.units?.toFixed(c.units < 10 ? 4 : 2)}</td>
                    <td style={styles.td}>${c.price?.toLocaleString()}</td>
                    <td style={styles.td}>{formatMoney(c.value)}</td>
                    <td style={{...styles.td, ...(c.pl >= 0 ? styles.green : styles.red)}}>{formatMoney(c.pl)} ({formatPct(c.plPct)})</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{...styles.card, marginTop: '16px'}}>
            <div style={styles.cardTitle}>
              <span>📊 Options ({portfolio?.options?.length || 0})</span>
              <span style={{ fontSize: '16px', fontWeight: '600' }}>{formatMoney(s.options)}</span>
            </div>
            <table style={styles.table}>
              <thead><tr><th style={styles.th}>Contract</th><th style={styles.th}>Type</th><th style={styles.th}>Strike</th><th style={styles.th}>Expiry</th><th style={styles.th}>Qty</th><th style={styles.th}>Value</th><th style={styles.th}>Status</th></tr></thead>
              <tbody>
                {portfolio?.options?.sort((a,b) => a.daysToExpiry - b.daysToExpiry).map(o => (
                  <tr key={o.contract}>
                    <td style={styles.td}><strong>{o.symbol}</strong></td>
                    <td style={styles.td}><span style={{...styles.tag, background: o.type === 'CALL' ? '#238636' : '#da3633'}}>{o.type}</span></td>
                    <td style={styles.td}>${o.strike}</td>
                    <td style={styles.td}>{o.expiry} <span style={{color: '#8b949e'}}>({o.daysToExpiry}d)</span></td>
                    <td style={styles.td}>{o.qty}</td>
                    <td style={styles.td}>{formatMoney(o.value)}</td>
                    <td style={styles.td}><span style={{...styles.tag, background: o.status === 'IN' ? '#238636' : '#30363d'}}>{o.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
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
            <div style={styles.summaryGrid}>
              <PieChart data={pieData} />
              <div>
                <table style={{...styles.table, marginTop: 0}}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Trade</th>
                      <th style={styles.th}>Value</th>
                      <th style={styles.th}>%</th>
                      <th style={styles.th}>Equity/Options</th>
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
                            {t.name}
                          </td>
                          <td style={styles.td}>{formatMoney(t.values.total)}</td>
                          <td style={styles.td}>{totalTradeValue > 0 ? Math.round(t.values.total / totalTradeValue * 100) : 0}%</td>
                          <td style={styles.td}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <div style={{ width: '60px', height: '8px', background: '#21262d', borderRadius: '4px', overflow: 'hidden', display: 'flex' }}>
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
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '16px' }}>
          {/* Asset List */}
          <div style={styles.card}>
            <div style={styles.cardTitle}>📋 Assets ({assets.length})</div>
            <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
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

      {tab === 'research' && (
        <div style={styles.researchGrid}>
          <div style={styles.card}>
            <div style={styles.cardTitle}>📊 Research Reports</div>
            {reports.length === 0 ? (
              <p style={{ color: '#8b949e' }}>No reports yet</p>
            ) : (
              reports.map(r => (
                <div key={r.id} style={{...styles.researchItem, borderColor: selected?.id === r.id ? '#58a6ff' : '#30363d'}} onClick={() => setSelected(r)}>
                  <div style={{ fontWeight: 500 }}>{r.ticker}</div>
                  <div style={{ fontSize: '12px', color: '#8b949e', marginTop: '4px' }}>
                    <span style={{...styles.tag, background: r.type === 'sector' ? '#d29922' : '#238636'}}>{r.type}</span>
                    {new Date(r.updated_at).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
          <div style={styles.card}>
            <div style={styles.cardTitle}>{selected?.ticker || 'Select a report'}</div>
            {selected ? (
              <div style={{ fontSize: '14px', lineHeight: '1.7' }} dangerouslySetInnerHTML={{ __html: renderMarkdown(selected.content) }} />
            ) : (
              <p style={{ color: '#8b949e' }}>← Click a report to view</p>
            )}
          </div>
        </div>
      )}

      {tab === 'newsletters' && (
        <div style={styles.researchGrid}>
          <div style={styles.card}>
            <div style={styles.cardTitle}>📰 Newsletters & Reports</div>
            {newsletters.length === 0 ? (
              <p style={{ color: '#8b949e' }}>No newsletters yet</p>
            ) : (
              newsletters.map(n => (
                <div key={n.id} style={{...styles.researchItem, borderColor: selectedNewsletter?.id === n.id ? '#58a6ff' : '#30363d'}} onClick={() => setSelectedNewsletter(n)}>
                  <div style={{ fontWeight: 500 }}>{n.title}</div>
                  <div style={{ fontSize: '12px', color: '#8b949e', marginTop: '4px' }}>
                    <span style={{...styles.tag, background: n.type === 'twitter_digest' ? '#1d9bf0' : '#238636'}}>{n.type}</span>
                    {new Date(n.created_at).toLocaleDateString()}
                  </div>
                  {n.source_accounts?.length > 0 && (
                    <div style={{ fontSize: '11px', color: '#8b949e', marginTop: '4px' }}>
                      Sources: {n.source_accounts.slice(0, 3).map(a => `@${a}`).join(', ')}{n.source_accounts.length > 3 ? '...' : ''}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
          <div style={styles.card}>
            <div style={styles.cardTitle}>{selectedNewsletter?.title || 'Select a newsletter'}</div>
            {selectedNewsletter ? (
              <>
                {selectedNewsletter.referenced_assets?.length > 0 && (
                  <div style={{ marginBottom: '12px', padding: '8px', background: '#0d1117', borderRadius: '6px', fontSize: '12px' }}>
                    <span style={{ color: '#8b949e' }}>Referenced: </span>
                    {selectedNewsletter.referenced_assets.map(a => (
                      <span key={a} style={{...styles.tag, background: '#30363d'}}>{a}</span>
                    ))}
                  </div>
                )}
                <div style={{ fontSize: '14px', lineHeight: '1.7' }} dangerouslySetInnerHTML={{ __html: renderMarkdown(selectedNewsletter.content) }} />
              </>
            ) : (
              <p style={{ color: '#8b949e' }}>← Click a newsletter to view</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
