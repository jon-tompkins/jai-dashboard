import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

// GET /api/agents/activity - Get recent activity
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const project = searchParams.get('project');
    const agent_id = searchParams.get('agent_id');

    const supabase = getSupabase();
    let query = supabase
      .from('agent_activity')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (project) query = query.eq('project', project);
    if (agent_id) query = query.eq('agent_id', agent_id);

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ activities: data });
  } catch (error) {
    console.error('Error fetching activity:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/agents/activity - Log new activity
export async function POST(request) {
  try {
    const body = await request.json();
    const { agent_id, agent_name, project, action, content, metadata } = body;

    if (!agent_id || !action) {
      return NextResponse.json({ error: 'agent_id and action required' }, { status: 400 });
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('agent_activity')
      .insert({
        agent_id,
        agent_name,
        project,
        action,
        content,
        metadata: metadata || {},
      })
      .select()
      .single();

    if (error) throw error;

    // Also update agent's last_active
    await supabase
      .from('agent_registry')
      .update({ last_active: new Date().toISOString(), status: 'active' })
      .eq('id', agent_id);

    return NextResponse.json({ activity: data });
  } catch (error) {
    console.error('Error logging activity:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
