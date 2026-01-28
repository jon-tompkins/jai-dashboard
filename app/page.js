'use client';
import { useState, useEffect } from 'react';

const SUPABASE_URL = "https://lsqlqssigerzghlxfxjl.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzcWxxc3NpZ2VyemdobHhmeGpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1NDA5NTEsImV4cCI6MjA4NTExNjk1MX0.jqoZUtW_gb8rehPteVgjmLLLlPRLYV-0fNJkpLGcf-s";

const styles = {
  container: { background: '#0d1117', minHeight: '100vh', color: '#e6edf3', padding: '20px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #30363d' },
  tabs: { display: 'flex', gap: '8px', marginBottom: '20px' },
  tab: { padding: '8px 16px', background: '#161b22', border: '1px solid #30363d', borderRadius: '6px', cursor: 'pointer', color: '#8b949e' },
  tabActive: { padding: '8px 16px', background: '#58a6ff', border: '1px solid #58a6ff', borderRadius: '6px', cursor: 'pointer', color: '#fff' },
  grid: { display: 'grid', gridTemplateColumns: '300px 1fr', gap: '16px' },
  card: { background: '#161b22', border: '1px solid #30363d', borderRadius: '8px', padding: '16px' },
  cardTitle: { fontSize: '14px', color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' },
  researchItem: { padding: '10px', margin: '4px 0', background: '#0d1117', border: '1px solid #30363d', borderRadius: '6px', cursor: 'pointer' },
  tag: { display: 'inline-block', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', marginRight: '8px' },
  content: { fontSize: '14px', lineHeight: '1.7', whiteSpace: 'pre-wrap' }
};

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

export default function Dashboard() {
  const [tab, setTab] = useState('research');
  const [reports, setReports] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  async function fetchReports() {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/research?select=*&order=updated_at.desc`, {
        headers: { 'apikey': SUPABASE_ANON }
      });
      const data = await res.json();
      setReports(data);
      if (data.length > 0) setSelected(data[0]);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={{ fontSize: '24px', margin: 0 }}>⚡ Jai Dashboard</h1>
        <div style={{ color: '#8b949e' }}>{new Date().toLocaleDateString()}</div>
      </div>

      <div style={styles.tabs}>
        <div style={tab === 'research' ? styles.tabActive : styles.tab} onClick={() => setTab('research')}>Research</div>
        <div style={tab === 'portfolio' ? styles.tabActive : styles.tab} onClick={() => setTab('portfolio')}>Portfolio</div>
      </div>

      {tab === 'research' && (
        <div style={styles.grid}>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>📊 Research Reports</h2>
            {loading ? (
              <p style={{ color: '#8b949e' }}>Loading...</p>
            ) : reports.length === 0 ? (
              <p style={{ color: '#8b949e' }}>No reports yet</p>
            ) : (
              reports.map(r => (
                <div 
                  key={r.id} 
                  style={{...styles.researchItem, borderColor: selected?.id === r.id ? '#58a6ff' : '#30363d'}}
                  onClick={() => setSelected(r)}
                >
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
            <h2 style={styles.cardTitle}>{selected?.ticker || 'Select a report'}</h2>
            {selected ? (
              <div style={styles.content} dangerouslySetInnerHTML={{ __html: renderMarkdown(selected.content) }} />
            ) : (
              <p style={{ color: '#8b949e' }}>← Click a report to view</p>
            )}
          </div>
        </div>
      )}

      {tab === 'portfolio' && (
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Portfolio Overview</h2>
          <p style={{ color: '#8b949e' }}>Coming soon — will show positions, P/L, allocation</p>
        </div>
      )}
    </div>
  );
}
