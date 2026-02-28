import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

// GET /api/agents - List all agents
export async function GET() {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('agent_registry')
      .select('*')
      .order('team', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ agents: data });
  } catch (error) {
    console.error('Error fetching agents:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/agents - Update agent status
export async function POST(request) {
  try {
    const body = await request.json();
    const { agent_id, status, last_active } = body;

    if (!agent_id) {
      return NextResponse.json({ error: 'agent_id required' }, { status: 400 });
    }

    const updates = { updated_at: new Date().toISOString() };
    if (status) updates.status = status;
    if (last_active) updates.last_active = last_active;

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('agent_registry')
      .update(updates)
      .eq('id', agent_id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ agent: data });
  } catch (error) {
    console.error('Error updating agent:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
