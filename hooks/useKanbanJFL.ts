import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const GITHUB_API_URL = '/api/kanban-jfl';

// Map status to display names
const STATUS_LABELS: Record<string, string> = {
  backlog: '📥 Backlog',
  ready: '✅ Ready',
  in_progress: '🔄 In Progress',
  done: '✨ Done'
};

// Map status to colors
const STATUS_COLORS: Record<string, string> = {
  backlog: '#6b7280',
  ready: '#3b82f6',
  in_progress: '#f59e0b',
  done: '#10b981'
};

const PRIORITY_COLORS: Record<string, string> = {
  critical: '#dc2626',
  high: '#f59e0b',
  medium: '#3b82f6',
  low: '#6b7280'
};

const PROJECT_COLORS: Record<string, string> = {
  myjunto: '#ec4899',
  clawstreet: '#10b981',
  dashboard: '#8b5cf6',
  infra: '#06b6d4',
  personal: '#14b8a6'
};

const ASSIGNEES = [
  { value: '', label: 'Unassigned', emoji: '—' },
  { value: 'scout', label: 'Scout', emoji: '🔭' },
  { value: 'builder', label: 'Builder', emoji: '🔨' },
  { value: 'jeb', label: 'Jeb', emoji: '📊' },
  { value: 'ant', label: 'Ant', emoji: '📈' },
  { value: 'mark', label: 'Mark', emoji: '📣' },
  { value: 'terry', label: 'Terry', emoji: '💻' },
  { value: 'jon', label: 'Jon', emoji: '👤' },
  { value: 'benji', label: 'Benji', emoji: '🐾' },
];

export function useKanban() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState({
    backlog: 0,
    ready: 0,
    in_progress: 0,
    done: 0
  });

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await fetch(GITHUB_API_URL);
      if (!response.ok) throw new Error('Failed to fetch tasks');
      const data = await response.json();
      setTasks(data.tasks || []);
      setSummary(data.summary || { backlog: 0, ready: 0, in_progress: 0, done: 0 });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const createTask = async (task: {
    title: string;
    description?: string;
    status?: string;
    assignee?: string;
    priority?: string;
    project?: string;
  }) => {
    try {
      const response = await fetch(GITHUB_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task)
      });
      if (!response.ok) throw new Error('Failed to create task');
      await fetchTasks();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
      return false;
    }
  };

  const updateTask = async (id: string, updates: any) => {
    try {
      const response = await fetch(GITHUB_API_URL, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates })
      });
      if (!response.ok) throw new Error('Failed to update task');
      await fetchTasks();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task');
      return false;
    }
  };

  const deleteTask = async (id: string) => {
    try {
      const response = await fetch(`${GITHUB_API_URL}?id=${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete task');
      await fetchTasks();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task');
      return false;
    }
  };

  const moveTask = async (id: string, newStatus: string) => {
    return updateTask(id, { status: newStatus });
  };

  useEffect(() => {
    fetchTasks();
    // Poll every 30 seconds
    const interval = setInterval(fetchTasks, 30000);
    return () => clearInterval(interval);
  }, []);

  return {
    tasks,
    loading,
    error,
    summary,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    moveTask
  };
}

export { STATUS_LABELS, STATUS_COLORS, PRIORITY_COLORS, PROJECT_COLORS, ASSIGNEES };
