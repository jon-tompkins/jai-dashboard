import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

const KANBAN_PATH = join(homedir(), 'clawd/kanban/tasks.json');

function readKanban() {
  try {
    return JSON.parse(readFileSync(KANBAN_PATH, 'utf-8'));
  } catch (e) {
    return { lastUpdated: new Date().toISOString(), columns: ['backlog', 'ready', 'in_progress', 'done'], tasks: [] };
  }
}

function writeKanban(data) {
  data.lastUpdated = new Date().toISOString();
  writeFileSync(KANBAN_PATH, JSON.stringify(data, null, 2));
}

// GET - List all tasks
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const assignee = searchParams.get('assignee');
  
  const kanban = readKanban();
  let tasks = kanban.tasks;
  
  if (status) tasks = tasks.filter(t => t.status === status);
  if (assignee) tasks = tasks.filter(t => t.assignee === assignee);
  
  return Response.json({ 
    ...kanban, 
    tasks,
    summary: {
      backlog: kanban.tasks.filter(t => t.status === 'backlog').length,
      ready: kanban.tasks.filter(t => t.status === 'ready').length,
      in_progress: kanban.tasks.filter(t => t.status === 'in_progress').length,
      done: kanban.tasks.filter(t => t.status === 'done').length,
    }
  });
}

// POST - Create new task
export async function POST(request) {
  const body = await request.json();
  const kanban = readKanban();
  
  const task = {
    id: randomUUID(),
    title: body.title || 'Untitled',
    description: body.description || '',
    status: body.status || 'backlog',
    assignee: body.assignee || null,
    priority: body.priority || 'medium',
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    result: null,
    sessionKey: null,
  };
  
  kanban.tasks.push(task);
  writeKanban(kanban);
  
  return Response.json({ ok: true, task });
}

// PATCH - Update task
export async function PATCH(request) {
  const body = await request.json();
  const { id, ...updates } = body;
  
  if (!id) return Response.json({ error: 'Missing task id' }, { status: 400 });
  
  const kanban = readKanban();
  const taskIndex = kanban.tasks.findIndex(t => t.id === id);
  
  if (taskIndex === -1) return Response.json({ error: 'Task not found' }, { status: 404 });
  
  kanban.tasks[taskIndex] = { 
    ...kanban.tasks[taskIndex], 
    ...updates, 
    updated: new Date().toISOString() 
  };
  writeKanban(kanban);
  
  return Response.json({ ok: true, task: kanban.tasks[taskIndex] });
}

// DELETE - Remove task
export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  
  if (!id) return Response.json({ error: 'Missing task id' }, { status: 400 });
  
  const kanban = readKanban();
  kanban.tasks = kanban.tasks.filter(t => t.id !== id);
  writeKanban(kanban);
  
  return Response.json({ ok: true });
}
