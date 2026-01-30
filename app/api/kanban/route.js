import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = "https://lsqlqssigerzghlxfxjl.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzcWxxc3NpZ2VyemdobHhmeGpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1NDA5NTEsImV4cCI6MjA4NTExNjk1MX0.jqoZUtW_gb8rehPteVgjmLLLlPRLYV-0fNJkpLGcf-s";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

// GET - List all tasks
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const assignee = searchParams.get('assignee');
  
  let query = supabase
    .from('kanban_tasks')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (status) query = query.eq('status', status);
  if (assignee) query = query.eq('assignee', assignee);
  
  const { data: tasks, error } = await query;
  
  if (error) {
    console.error('Supabase error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
  
  // Calculate summary
  const summary = {
    backlog: tasks.filter(t => t.status === 'backlog').length,
    ready: tasks.filter(t => t.status === 'ready').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    done: tasks.filter(t => t.status === 'done').length,
  };
  
  return Response.json({ 
    lastUpdated: new Date().toISOString(),
    columns: ['backlog', 'ready', 'in_progress', 'done'],
    tasks: tasks || [],
    summary
  });
}

// POST - Create new task
export async function POST(request) {
  const body = await request.json();
  
  const task = {
    title: body.title || 'Untitled',
    description: body.description || '',
    status: body.status || 'backlog',
    assignee: body.assignee || null,
    priority: body.priority || 'medium',
    result: body.result || null,
    session_key: body.sessionKey || body.session_key || null,
  };
  
  const { data, error } = await supabase
    .from('kanban_tasks')
    .insert(task)
    .select()
    .single();
  
  if (error) {
    console.error('Supabase error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
  
  return Response.json({ ok: true, task: data });
}

// PATCH - Update task
export async function PATCH(request) {
  const body = await request.json();
  const { id, ...updates } = body;
  
  if (!id) return Response.json({ error: 'Missing task id' }, { status: 400 });
  
  // Map sessionKey to session_key if present
  if (updates.sessionKey !== undefined) {
    updates.session_key = updates.sessionKey;
    delete updates.sessionKey;
  }
  
  // Set updated_at
  updates.updated_at = new Date().toISOString();
  
  const { data, error } = await supabase
    .from('kanban_tasks')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('Supabase error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
  
  return Response.json({ ok: true, task: data });
}

// DELETE - Remove task
export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  
  if (!id) return Response.json({ error: 'Missing task id' }, { status: 400 });
  
  const { error } = await supabase
    .from('kanban_tasks')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Supabase error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
  
  return Response.json({ ok: true });
}
