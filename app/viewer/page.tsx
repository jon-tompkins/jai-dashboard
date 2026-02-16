'use client';

import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';

interface FileInfo {
  name: string;
  type: string;
  url: string;
}

const REPORTS_PATH = 'public';
const REPO_OWNER = 'jon-tompkins';
const REPO_NAME = 'jai-dashboard';

function getFileType(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('jeb') || lower.includes('evaluation')) return 'jeb';
  if (lower.includes('ant') || lower.includes('timing')) return 'ant';
  if (lower.includes('scout') || lower.includes('report')) return 'scout';
  return 'doc';
}

function formatTitle(filename: string): string {
  return filename
    .replace('.md', '')
    .replace(/-/g, ' ')
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function formatDate(filename: string): string {
  const match = filename.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const date = new Date(parseInt(match[1]), parseInt(match[2])-1, parseInt(match[3]));
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }
  return '';
}

export default function ViewerPage() {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [filter, setFilter] = useState('all');
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFiles() {
      try {
        const res = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${REPORTS_PATH}`);
        if (res.ok) {
          const data = await res.json();
          const mdFiles = data
            .filter((f: any) => f.name.endsWith('.md') && !f.name.toLowerCase().includes('readme') && !f.name.toLowerCase().includes('spec') && !f.name.toLowerCase().includes('review.md'))
            .map((f: any) => ({
              name: f.name,
              url: f.download_url,
              type: getFileType(f.name)
            }))
            .sort((a: FileInfo, b: FileInfo) => b.name.localeCompare(a.name));
          setFiles(mdFiles);
        }
      } catch (e) {
        console.error('Failed to load files', e);
      }
      setLoading(false);
    }
    loadFiles();
  }, []);

  async function loadContent(file: FileInfo) {
    setSelectedFile(file);
    setContent('Loading...');
    try {
      const res = await fetch(file.url);
      const text = await res.text();
      setContent(text);
    } catch (e) {
      setContent('Failed to load file');
    }
  }

  const filtered = filter === 'all' ? files : files.filter(f => f.type === filter);
  const typeColors: Record<string, string> = {
    jeb: 'bg-green-900/50 text-green-400',
    ant: 'bg-yellow-900/50 text-yellow-400',
    scout: 'bg-blue-900/50 text-blue-400',
    doc: 'bg-purple-900/50 text-purple-400'
  };

  if (selectedFile) {
    return (
      <div className="min-h-screen bg-[#0d1117] text-[#e6edf3] p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <button 
            onClick={() => setSelectedFile(null)} 
            className="text-[#8b949e] hover:text-[#58a6ff] mb-6 flex items-center gap-2"
          >
            ← Back to list
          </button>
          <h1 className="text-2xl font-bold mb-2">{formatTitle(selectedFile.name)}</h1>
          <p className="text-[#8b949e] text-sm mb-6 pb-4 border-b border-[#30363d]">
            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold uppercase mr-2 ${typeColors[selectedFile.type]}`}>
              {selectedFile.type}
            </span>
            {formatDate(selectedFile.name)}
          </p>
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 md:p-8 prose prose-invert max-w-none">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#e6edf3] p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between pb-6 mb-8 border-b border-[#30363d]">
          <h1 className="text-2xl font-bold">
            <span className="text-[#58a6ff]">📊 Research</span>
            <span className="text-[#8b949e] font-normal">Viewer</span>
          </h1>
          <nav className="flex gap-4 mt-4 md:mt-0">
            <a href="https://myjunto.xyz/research" target="_blank" className="text-[#8b949e] hover:text-[#58a6ff] text-sm">MyJunto</a>
            <a href="https://github.com/jon-tompkins/jai-dashboard" target="_blank" className="text-[#8b949e] hover:text-[#58a6ff] text-sm">GitHub</a>
          </nav>
        </header>

        <div className="flex flex-wrap gap-2 mb-6">
          {['all', 'scout', 'jeb', 'ant', 'doc'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm border transition-all ${
                filter === f 
                  ? 'border-[#58a6ff] text-[#58a6ff] bg-[#58a6ff]/10' 
                  : 'border-[#30363d] text-[#8b949e] hover:border-[#58a6ff] hover:text-[#58a6ff]'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-[#8b949e] text-center py-12">Loading reports...</p>
        ) : filtered.length === 0 ? (
          <p className="text-[#8b949e] text-center py-12">No reports found</p>
        ) : (
          <div className="grid gap-3">
            {filtered.map(file => (
              <div
                key={file.name}
                onClick={() => loadContent(file)}
                className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 cursor-pointer hover:border-[#58a6ff] hover:translate-x-1 transition-all"
              >
                <h3 className="text-[#58a6ff] font-medium mb-1">{formatTitle(file.name)}</h3>
                <div className="text-xs text-[#8b949e]">
                  <span className={`inline-block px-2 py-0.5 rounded-full font-semibold uppercase mr-2 ${typeColors[file.type]}`}>
                    {file.type}
                  </span>
                  {formatDate(file.name)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
