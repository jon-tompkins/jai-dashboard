'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// Team colors
const teamColors = {
  ailmanack: { bg: 'bg-amber-900/30', border: 'border-amber-500', text: 'text-amber-400' },
  myjunto: { bg: 'bg-blue-900/30', border: 'border-blue-500', text: 'text-blue-400' },
  clawstreet: { bg: 'bg-emerald-900/30', border: 'border-emerald-500', text: 'text-emerald-400' },
  dashboard: { bg: 'bg-purple-900/30', border: 'border-purple-500', text: 'text-purple-400' },
};

// Status indicators
const statusColors = {
  idle: 'bg-gray-500',
  active: 'bg-green-500 animate-pulse',
  error: 'bg-red-500',
};

function timeAgo(date) {
  if (!date) return 'never';
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function AgentCard({ agent, onClick }) {
  const colors = teamColors[agent.team] || teamColors.dashboard;
  
  return (
    <div 
      onClick={() => onClick(agent)}
      className={`${colors.bg} ${colors.border} border rounded-lg p-4 cursor-pointer hover:opacity-80 transition-opacity`}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-bold text-white">{agent.name}</h3>
        <div className={`w-3 h-3 rounded-full ${statusColors[agent.status] || statusColors.idle}`} />
      </div>
      <p className="text-gray-400 text-sm">{agent.role}</p>
      <p className={`${colors.text} text-xs mt-1`}>{agent.team}</p>
      <p className="text-gray-500 text-xs mt-2">Last active: {timeAgo(agent.last_active)}</p>
    </div>
  );
}

function TeamSection({ team, agents, onAgentClick }) {
  const colors = teamColors[team] || teamColors.dashboard;
  const teamNames = {
    ailmanack: 'AIlmanack',
    myjunto: 'myjunto',
    clawstreet: 'Clawstreet',
    dashboard: 'Dashboard',
  };
  
  return (
    <div className="mb-8">
      <h2 className={`text-xl font-bold ${colors.text} mb-4 flex items-center gap-2`}>
        <span className={`w-3 h-3 rounded-full ${colors.border} border-2`} />
        {teamNames[team] || team}
        <span className="text-gray-500 text-sm font-normal">({agents.length} agents)</span>
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {agents.map(agent => (
          <AgentCard key={agent.id} agent={agent} onClick={onAgentClick} />
        ))}
      </div>
    </div>
  );
}

function ActivityFeed({ activities }) {
  return (
    <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
      <h2 className="text-lg font-bold text-white mb-4">Recent Activity</h2>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {activities.length === 0 ? (
          <p className="text-gray-500 text-sm">No recent activity</p>
        ) : (
          activities.map(activity => (
            <div key={activity.id} className="border-l-2 border-gray-600 pl-3">
              <div className="flex items-center gap-2">
                <span className={`font-medium ${teamColors[activity.project]?.text || 'text-gray-400'}`}>
                  {activity.agent_name || activity.agent_id}
                </span>
                <span className="text-gray-500 text-xs">{timeAgo(activity.created_at)}</span>
              </div>
              <p className="text-gray-300 text-sm">{activity.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function AgentModal({ agent, onClose }) {
  const [memory, setMemory] = useState('Loading...');
  const colors = teamColors[agent.team] || teamColors.dashboard;

  useEffect(() => {
    // In a real implementation, this would fetch from GitHub API or local files
    setMemory(`Agent memory for ${agent.name} would be loaded here from ${agent.memory_path}`);
  }, [agent]);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className={`${colors.bg} ${colors.border} border rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white">{agent.name}</h2>
            <p className="text-gray-400">{agent.role} — {agent.team}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-black/30 rounded p-3">
            <p className="text-gray-500 text-xs">Status</p>
            <p className="text-white flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${statusColors[agent.status]}`} />
              {agent.status}
            </p>
          </div>
          <div className="bg-black/30 rounded p-3">
            <p className="text-gray-500 text-xs">Last Active</p>
            <p className="text-white">{timeAgo(agent.last_active)}</p>
          </div>
        </div>

        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-400 mb-2">SOUL.md</h3>
          <div className="bg-black/30 rounded p-3 text-gray-300 text-sm font-mono">
            {agent.soul_path}
          </div>
        </div>

        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-400 mb-2">MEMORY.md</h3>
          <div className="bg-black/30 rounded p-3 text-gray-300 text-sm font-mono whitespace-pre-wrap">
            {memory}
          </div>
        </div>

        <div className="flex gap-2">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm">
            Spawn Task
          </button>
          <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm">
            View History
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AgentsDashboard() {
  const [agents, setAgents] = useState([]);
  const [activities, setActivities] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch agents
        const { data: agentData, error: agentError } = await supabase
          .from('agent_registry')
          .select('*')
          .order('team', { ascending: true });
        
        if (agentError) throw agentError;
        setAgents(agentData || []);

        // Fetch recent activity
        const { data: activityData, error: activityError } = await supabase
          .from('agent_activity')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20);
        
        if (!activityError) {
          setActivities(activityData || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        // Use fallback data if DB not set up yet
        setAgents([
          { id: 'jai', name: 'Jai', role: 'Orchestrator', team: 'dashboard', status: 'active', last_active: new Date().toISOString() },
          { id: 'scout', name: 'Scout', role: 'Eager Analyst', team: 'ailmanack', status: 'idle' },
          { id: 'jeb', name: 'Jeb', role: 'Value Investor', team: 'ailmanack', status: 'idle' },
          { id: 'ant', name: 'Ant', role: 'Quant/Trader', team: 'ailmanack', status: 'idle' },
          { id: 'ben', name: 'Ben', role: 'Monitor', team: 'myjunto', status: 'idle' },
          { id: 'terry', name: 'Terry', role: 'CTO', team: 'clawstreet', status: 'idle' },
          { id: 'sport', name: 'Sport', role: 'Support', team: 'clawstreet', status: 'idle' },
          { id: 'mark', name: 'Mark', role: 'Marketing', team: 'clawstreet', status: 'idle' },
          { id: 'quai', name: 'Quai', role: 'QA', team: 'clawstreet', status: 'idle' },
        ]);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
    
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Group agents by team
  const agentsByTeam = agents.reduce((acc, agent) => {
    if (!acc[agent.team]) acc[agent.team] = [];
    acc[agent.team].push(agent);
    return acc;
  }, {});

  // Order teams
  const teamOrder = ['dashboard', 'ailmanack', 'myjunto', 'clawstreet'];

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-xl">Loading agents...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-2">🦞 Agent Dashboard</h1>
          <p className="text-gray-400">Command center for all teams and agents</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {teamOrder.map(team => (
              agentsByTeam[team] && (
                <TeamSection 
                  key={team} 
                  team={team} 
                  agents={agentsByTeam[team]} 
                  onAgentClick={setSelectedAgent}
                />
              )
            ))}
          </div>
          
          <div>
            <ActivityFeed activities={activities} />
          </div>
        </div>

        {selectedAgent && (
          <AgentModal agent={selectedAgent} onClose={() => setSelectedAgent(null)} />
        )}
      </div>
    </div>
  );
}
