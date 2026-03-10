'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
// Use pre-built structure with embedded file contents
// Run: node scripts/build-structure.js before deploying
import structure from './structure-built.json'

const styles = {
  container: { background: '#0a0a0a', minHeight: '100vh', color: '#e5e5e5', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif' },
  card: { background: '#0d0d0d', border: '1px solid #262626', borderRadius: '8px', padding: '16px' },
  cardTitle: { fontSize: '12px', color: '#737373', textTransform: 'uppercase' as const, letterSpacing: '0.5px', marginBottom: '12px', fontWeight: 500 },
  btn: { padding: '8px 14px', background: '#171717', border: '1px solid #262626', borderRadius: '4px', color: '#e5e5e5', cursor: 'pointer', fontSize: '13px' },
  btnActive: { padding: '8px 14px', background: '#171717', border: '1px solid #404040', borderRadius: '4px', color: '#fff', cursor: 'pointer', fontSize: '13px' },
  tag: { display: 'inline-block', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase' as const },
  tagLoaded: { background: '#166534', color: '#4ade80' },
  tagRef: { background: '#1e3a5f', color: '#60a5fa' },
}

// Find file content from embedded structure
function findFileContent(structure: any, targetPath: string): string | null {
  if (!structure) return null
  
  // Check if this object has the matching path
  if (structure.path === targetPath && structure.content) {
    return structure.content
  }
  
  // Search in arrays
  if (Array.isArray(structure)) {
    for (const item of structure) {
      const found = findFileContent(item, targetPath)
      if (found) return found
    }
  }
  
  // Search in object properties
  if (typeof structure === 'object') {
    for (const key of Object.keys(structure)) {
      const found = findFileContent(structure[key], targetPath)
      if (found) return found
    }
  }
  
  return null
}

// File viewer modal
function FileViewer({ path, onClose }: { path: string, onClose: () => void }) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    // Look up content from embedded structure
    const embedded = findFileContent(structure, path)
    if (embedded) {
      if (embedded.startsWith('[Error:') || embedded === '[File too large]') {
        setError(embedded)
      } else {
        setContent(embedded)
      }
    } else {
      setError('File not found in embedded structure. Run: node scripts/build-structure.js')
    }
    setLoading(false)
  }, [path])

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onClick={onClose}>
      <div style={{ ...styles.card, maxWidth: '1000px', width: '100%', height: '85vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #262626', flexShrink: 0 }}>
          <span style={{ fontWeight: 600, fontSize: '14px', fontFamily: 'monospace' }}>{path}</span>
          <button onClick={onClose} style={{ ...styles.btn, padding: '8px 12px' }}>✕</button>
        </div>
        {loading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#737373' }}>Loading...</div>
        ) : error ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>{error}</div>
        ) : (
          <pre style={{
            flex: 1, width: '100%', background: '#0a0a0a', border: '1px solid #262626', borderRadius: '4px',
            padding: '16px', color: '#e5e5e5', fontSize: '12px', margin: 0,
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
            lineHeight: 1.6, overflow: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word'
          }}>
            {content}
          </pre>
        )}
      </div>
    </div>
  )
}

// File item component
function FileItem({ file, onFileClick }: { file: any, onFileClick: (path: string) => void }) {
  return (
    <div
      onClick={() => !file.isDir && onFileClick(file.path)}
      style={{
        display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px',
        background: '#171717', borderRadius: '4px', cursor: file.isDir ? 'default' : 'pointer',
        border: '1px solid #262626', fontSize: '13px',
        transition: 'border-color 0.1s'
      }}
      onMouseEnter={e => !file.isDir && (e.currentTarget.style.borderColor = '#404040')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = '#262626')}
    >
      <span>{file.isDir ? '📂' : '📄'}</span>
      <span style={{ flex: 1 }}>{file.label}</span>
      <span style={{ ...styles.tag, ...(file.loaded ? styles.tagLoaded : styles.tagRef) }}>
        {file.loaded ? 'loaded' : 'ref'}
      </span>
    </div>
  )
}

// Section component for file groups
function FileSection({ title, description, files, onFileClick }: { title: string, description?: string, files: any[], onFileClick: (path: string) => void }) {
  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ fontSize: '11px', color: '#737373', marginBottom: '6px', fontWeight: 500 }}>{title}</div>
      {description && <div style={{ fontSize: '11px', color: '#525252', marginBottom: '8px' }}>{description}</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {files.map((file: any, i: number) => (
          <FileItem key={i} file={file} onFileClick={onFileClick} />
        ))}
      </div>
    </div>
  )
}

// Sub-agent card
function SubAgentCard({ agent, onFileClick }: { agent: any, onFileClick: (path: string) => void }) {
  const [expanded, setExpanded] = useState(false)
  
  return (
    <div style={{ ...styles.card, padding: '12px' }}>
      <div 
        onClick={() => setExpanded(!expanded)}
        style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
      >
        <span style={{ fontSize: '16px' }}>{agent.icon}</span>
        <span style={{ fontWeight: 500, fontSize: '14px' }}>{agent.label}</span>
        <span style={{ color: '#525252', fontSize: '10px', marginLeft: 'auto' }}>
          {expanded ? '▼' : '▶'} {agent.files?.length || 0} files
        </span>
      </div>
      {expanded && agent.files && (
        <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {agent.files.map((file: any, i: number) => (
            <FileItem key={i} file={file} onFileClick={onFileClick} />
          ))}
        </div>
      )}
    </div>
  )
}

// Project card
function ProjectCard({ project, onFileClick }: { project: any, onFileClick: (path: string) => void }) {
  const [expanded, setExpanded] = useState(false)
  
  return (
    <div style={{ ...styles.card }}>
      <div 
        onClick={() => setExpanded(!expanded)}
        style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: expanded ? '12px' : 0 }}
      >
        <span style={{ fontSize: '20px' }}>{project.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: '15px' }}>{project.label}</div>
          <div style={{ fontSize: '12px', color: '#737373' }}>{project.description}</div>
        </div>
        <span style={{ color: '#525252', fontSize: '11px' }}>
          {expanded ? '▼' : '▶'}
        </span>
      </div>
      
      {expanded && (
        <div style={{ borderTop: '1px solid #262626', paddingTop: '12px' }}>
          {project.files && project.files.length > 0 && (
            <FileSection title="Project Files" files={project.files} onFileClick={onFileClick} />
          )}
          
          {project.subAgents && project.subAgents.length > 0 && (
            <div>
              <div style={{ fontSize: '11px', color: '#737373', marginBottom: '8px', fontWeight: 500 }}>Sub-Agents</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {project.subAgents.map((agent: any) => (
                  <SubAgentCard key={agent.id} agent={agent} onFileClick={onFileClick} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Coordinator section
function CoordinatorSection({ data, onFileClick }: { data: any, onFileClick: (path: string) => void }) {
  const [expanded, setExpanded] = useState(true)
  
  return (
    <div style={{ ...styles.card }}>
      <div 
        onClick={() => setExpanded(!expanded)}
        style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: expanded ? '16px' : 0 }}
      >
        <span style={{ fontSize: '24px' }}>{data.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: '16px' }}>{data.label}</div>
          <div style={{ fontSize: '12px', color: '#737373' }}>{data.description}</div>
        </div>
        <span style={{ color: '#525252' }}>{expanded ? '▼' : '▶'}</span>
      </div>
      
      {expanded && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ background: '#0a0a0a', borderRadius: '6px', padding: '12px', border: '1px solid #1a3d1a' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
              <span style={{ ...styles.tag, ...styles.tagLoaded }}>loaded at start</span>
            </div>
            <FileSection 
              title={data.systemFiles.label}
              description={data.systemFiles.description}
              files={data.systemFiles.files}
              onFileClick={onFileClick}
            />
          </div>
          <div style={{ background: '#0a0a0a', borderRadius: '6px', padding: '12px', border: '1px solid #1e3a5f' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
              <span style={{ ...styles.tag, ...styles.tagRef }}>referenced on demand</span>
            </div>
            <FileSection 
              title={data.contextFiles.label}
              description={data.contextFiles.description}
              files={data.contextFiles.files}
              onFileClick={onFileClick}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default function FilesPage() {
  const [viewingFile, setViewingFile] = useState<string | null>(null)

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid #262626', padding: '16px 24px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Link href="/" style={{ color: '#525252', textDecoration: 'none', fontSize: '13px' }}>← Dashboard</Link>
              <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>🗂️ Agent Structure</h1>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ ...styles.tag, ...styles.tagLoaded }}>loaded</span>
              <span style={{ fontSize: '12px', color: '#737373' }}>= in system prompt</span>
              <span style={{ ...styles.tag, ...styles.tagRef }}>ref</span>
              <span style={{ fontSize: '12px', color: '#737373' }}>= read on demand</span>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link href="/admin" style={{ ...styles.btn, textDecoration: 'none', color: '#737373' }}>🤖 Agents</Link>
            <Link href="/admin/kanban" style={{ ...styles.btn, textDecoration: 'none', color: '#737373' }}>📋 Kanban</Link>
            <Link href="/admin/crons" style={{ ...styles.btn, textDecoration: 'none', color: '#737373' }}>⏰ Crons</Link>
            <div style={styles.btnActive}>🗂️ Structure</div>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
        {/* Global Layer */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <span style={{ fontSize: '20px' }}>{structure.global.icon}</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: '14px' }}>{structure.global.label}</div>
              <div style={{ fontSize: '12px', color: '#737373' }}>{structure.global.description}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {structure.global.files.map((file: any, i: number) => (
              <FileItem key={i} file={file} onFileClick={setViewingFile} />
            ))}
          </div>
        </div>

        {/* Coordinator */}
        <div style={{ marginBottom: '24px' }}>
          <CoordinatorSection data={structure.coordinator} onFileClick={setViewingFile} />
        </div>

        {/* Projects */}
        <div style={{ marginBottom: '24px' }}>
          <div style={styles.cardTitle}>Projects</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '16px' }}>
            {structure.projects.map((project: any) => (
              <ProjectCard key={project.id} project={project} onFileClick={setViewingFile} />
            ))}
          </div>
        </div>

        {/* Memory System */}
        <div style={styles.card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <span style={{ fontSize: '20px' }}>{structure.memory.icon}</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: '15px' }}>{structure.memory.label}</div>
              <div style={{ fontSize: '12px', color: '#737373' }}>{structure.memory.description}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {structure.memory.files.map((file: any, i: number) => (
              <FileItem key={i} file={file} onFileClick={setViewingFile} />
            ))}
          </div>
        </div>
      </main>

      {/* File viewer modal */}
      {viewingFile && (
        <FileViewer path={viewingFile} onClose={() => setViewingFile(null)} />
      )}
    </div>
  )
}
