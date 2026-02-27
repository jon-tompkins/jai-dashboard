import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// GET /api/agents/messages - Get messages for an agent
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const to_agent = searchParams.get('to');
    const from_agent = searchParams.get('from');
    const unread_only = searchParams.get('unread') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabase
      .from('agent_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (to_agent) query = query.eq('to_agent', to_agent);
    if (from_agent) query = query.eq('from_agent', from_agent);
    if (unread_only) query = query.eq('read', false);

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ messages: data });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/agents/messages - Send a message to another agent
export async function POST(request) {
  try {
    const body = await request.json();
    const { from_agent, to_agent, content, project } = body;

    if (!from_agent || !to_agent || !content) {
      return NextResponse.json({ error: 'from_agent, to_agent, and content required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('agent_messages')
      .insert({
        from_agent,
        to_agent,
        content,
        project,
        read: false,
      })
      .select()
      .single();

    if (error) throw error;

    // Log as activity too
    await supabase.from('agent_activity').insert({
      agent_id: from_agent,
      project,
      action: 'message',
      content: `Message to ${to_agent}: ${content.substring(0, 100)}...`,
    });

    return NextResponse.json({ message: data });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/agents/messages - Mark messages as read
export async function PATCH(request) {
  try {
    const body = await request.json();
    const { message_ids, to_agent } = body;

    let query = supabase
      .from('agent_messages')
      .update({ read: true });

    if (message_ids && message_ids.length > 0) {
      query = query.in('id', message_ids);
    } else if (to_agent) {
      query = query.eq('to_agent', to_agent).eq('read', false);
    } else {
      return NextResponse.json({ error: 'message_ids or to_agent required' }, { status: 400 });
    }

    const { data, error } = await query.select();

    if (error) throw error;

    return NextResponse.json({ updated: data?.length || 0 });
  } catch (error) {
    console.error('Error marking messages read:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
