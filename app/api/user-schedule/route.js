const SUPABASE_URL = "https://lsqlqssigerzghlxfxjl.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzcWxxc3NpZ2VyemdobHhmeGpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1NDA5NTEsImV4cCI6MjA4NTExNjk1MX0.jqoZUtW_gb8rehPteVgjmLLLlPRLYV-0fNJkpLGcf-s";

// Helper function to make Supabase API calls
async function supabaseQuery(table, query = '', options = {}) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
  if (query) url.search = query;
  
  const response = await fetch(url.toString(), {
    method: options.method || 'GET',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...(options.body && { body: JSON.stringify(options.body) })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Supabase query failed: ${response.status} - ${errorText}`);
  }
  
  return response.json();
}

// Validate timezone
function isValidTimezone(timezone) {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch (e) {
    return false;
  }
}

// Validate time format (HH:MM:SS or HH:MM)
function isValidTime(timeStr) {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
  return timeRegex.test(timeStr);
}

// Convert HH:MM to HH:MM:SS format
function normalizeTime(timeStr) {
  if (timeStr.includes(':') && timeStr.split(':').length === 2) {
    return timeStr + ':00';
  }
  return timeStr;
}

// Calculate next newsletter time in user's timezone
function calculateNextNewsletterTime(preferredTime, timezone, frequency = 'daily') {
  try {
    const now = new Date();
    const userTime = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
    
    // Parse preferred time
    const [hours, minutes] = preferredTime.split(':').map(Number);
    
    // Create next newsletter time
    let nextTime = new Date(userTime);
    nextTime.setHours(hours, minutes, 0, 0);
    
    // If time has passed today, move to next occurrence based on frequency
    if (nextTime <= userTime) {
      switch (frequency) {
        case 'daily':
          nextTime.setDate(nextTime.getDate() + 1);
          break;
        case 'weekly':
          nextTime.setDate(nextTime.getDate() + 7);
          break;
        case 'bi-weekly':
          nextTime.setDate(nextTime.getDate() + 14);
          break;
        default:
          nextTime.setDate(nextTime.getDate() + 1);
      }
    }
    
    // Format for display
    const localTimeStr = nextTime.toLocaleString('en-US', {
      timeZone: timezone,
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    
    return {
      utc: nextTime.toISOString(),
      local: localTimeStr,
      timezone: timezone
    };
  } catch (error) {
    console.error('Error calculating next newsletter time:', error);
    return null;
  }
}

// GET - Fetch current user's scheduling preferences
export async function GET(request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('user_id');
    const email = url.searchParams.get('email');
    
    if (!userId && !email) {
      return Response.json({ error: 'user_id or email parameter required' }, { status: 400 });
    }
    
    // Build query
    let query = '';
    if (userId) {
      query = `id=eq.${userId}`;
    } else if (email) {
      query = `email=eq.${encodeURIComponent(email)}`;
    }
    
    const users = await supabaseQuery('users', `select=*&${query}`);
    
    if (users.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }
    
    const user = users[0];
    
    // Calculate next newsletter time if preferences are set
    let nextNewsletter = null;
    if (user.preferred_send_time && user.timezone) {
      nextNewsletter = calculateNextNewsletterTime(
        user.preferred_send_time, 
        user.timezone, 
        user.send_frequency
      );
    }
    
    return Response.json({
      user_id: user.id,
      email: user.email,
      name: user.name,
      preferred_send_time: user.preferred_send_time,
      timezone: user.timezone,
      send_frequency: user.send_frequency,
      weekend_delivery: user.weekend_delivery,
      max_newsletters_per_day: user.max_newsletters_per_day,
      last_newsletter_sent: user.last_newsletter_sent,
      next_newsletter: nextNewsletter,
      created_at: user.created_at,
      updated_at: user.updated_at
    });
    
  } catch (error) {
    console.error('Error fetching user schedule:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create or update user scheduling preferences
export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      email, 
      name,
      preferred_send_time, 
      timezone, 
      send_frequency = 'daily',
      weekend_delivery = false,
      max_newsletters_per_day = 1
    } = body;
    
    // Validation
    if (!email) {
      return Response.json({ error: 'email is required' }, { status: 400 });
    }
    
    if (preferred_send_time && !isValidTime(preferred_send_time)) {
      return Response.json({ error: 'Invalid time format. Use HH:MM or HH:MM:SS' }, { status: 400 });
    }
    
    if (timezone && !isValidTimezone(timezone)) {
      return Response.json({ error: 'Invalid timezone' }, { status: 400 });
    }
    
    if (send_frequency && !['daily', 'weekly', 'bi-weekly'].includes(send_frequency)) {
      return Response.json({ error: 'Invalid send_frequency. Must be daily, weekly, or bi-weekly' }, { status: 400 });
    }
    
    // Normalize time format
    const normalizedTime = preferred_send_time ? normalizeTime(preferred_send_time) : null;
    
    // Prepare update data
    const updateData = {
      email,
      ...(name && { name }),
      ...(normalizedTime && { preferred_send_time: normalizedTime }),
      ...(timezone && { timezone }),
      ...(send_frequency && { send_frequency }),
      weekend_delivery: Boolean(weekend_delivery),
      max_newsletters_per_day: parseInt(max_newsletters_per_day) || 1,
      updated_at: new Date().toISOString()
    };
    
    // Try to update existing user first
    const existingUsers = await supabaseQuery('users', `select=id&email=eq.${encodeURIComponent(email)}`);
    
    let user;
    if (existingUsers.length > 0) {
      // Update existing user
      const userId = existingUsers[0].id;
      const updatedUsers = await supabaseQuery('users', `id=eq.${userId}`, {
        method: 'PATCH',
        headers: { 'Prefer': 'return=representation' },
        body: updateData
      });
      user = updatedUsers[0];
    } else {
      // Create new user
      const newUsers = await supabaseQuery('users', '', {
        method: 'POST',
        headers: { 'Prefer': 'return=representation' },
        body: updateData
      });
      user = newUsers[0];
    }
    
    // Calculate next newsletter time
    let nextNewsletter = null;
    if (user.preferred_send_time && user.timezone) {
      nextNewsletter = calculateNextNewsletterTime(
        user.preferred_send_time, 
        user.timezone, 
        user.send_frequency
      );
    }
    
    return Response.json({
      success: true,
      user: {
        user_id: user.id,
        email: user.email,
        name: user.name,
        preferred_send_time: user.preferred_send_time,
        timezone: user.timezone,
        send_frequency: user.send_frequency,
        weekend_delivery: user.weekend_delivery,
        max_newsletters_per_day: user.max_newsletters_per_day,
        last_newsletter_sent: user.last_newsletter_sent,
        next_newsletter: nextNewsletter,
        updated_at: user.updated_at
      }
    });
    
  } catch (error) {
    console.error('Error updating user schedule:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// PATCH - Update specific fields for existing user
export async function PATCH(request) {
  try {
    const body = await request.json();
    const { user_id, email, ...updates } = body;
    
    if (!user_id && !email) {
      return Response.json({ error: 'user_id or email is required' }, { status: 400 });
    }
    
    // Validate updates
    if (updates.preferred_send_time && !isValidTime(updates.preferred_send_time)) {
      return Response.json({ error: 'Invalid time format. Use HH:MM or HH:MM:SS' }, { status: 400 });
    }
    
    if (updates.timezone && !isValidTimezone(updates.timezone)) {
      return Response.json({ error: 'Invalid timezone' }, { status: 400 });
    }
    
    if (updates.send_frequency && !['daily', 'weekly', 'bi-weekly'].includes(updates.send_frequency)) {
      return Response.json({ error: 'Invalid send_frequency. Must be daily, weekly, or bi-weekly' }, { status: 400 });
    }
    
    // Normalize time format if provided
    if (updates.preferred_send_time) {
      updates.preferred_send_time = normalizeTime(updates.preferred_send_time);
    }
    
    // Add updated timestamp
    updates.updated_at = new Date().toISOString();
    
    // Build query
    let query = '';
    if (user_id) {
      query = `id=eq.${user_id}`;
    } else if (email) {
      query = `email=eq.${encodeURIComponent(email)}`;
    }
    
    // Update user
    const updatedUsers = await supabaseQuery('users', query, {
      method: 'PATCH',
      headers: { 'Prefer': 'return=representation' },
      body: updates
    });
    
    if (updatedUsers.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }
    
    const user = updatedUsers[0];
    
    // Calculate next newsletter time
    let nextNewsletter = null;
    if (user.preferred_send_time && user.timezone) {
      nextNewsletter = calculateNextNewsletterTime(
        user.preferred_send_time, 
        user.timezone, 
        user.send_frequency
      );
    }
    
    return Response.json({
      success: true,
      user: {
        user_id: user.id,
        email: user.email,
        name: user.name,
        preferred_send_time: user.preferred_send_time,
        timezone: user.timezone,
        send_frequency: user.send_frequency,
        weekend_delivery: user.weekend_delivery,
        max_newsletters_per_day: user.max_newsletters_per_day,
        last_newsletter_sent: user.last_newsletter_sent,
        next_newsletter: nextNewsletter,
        updated_at: user.updated_at
      }
    });
    
  } catch (error) {
    console.error('Error updating user schedule:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Remove user scheduling preferences (reset to defaults)
export async function DELETE(request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('user_id');
    const email = url.searchParams.get('email');
    
    if (!userId && !email) {
      return Response.json({ error: 'user_id or email parameter required' }, { status: 400 });
    }
    
    // Build query
    let query = '';
    if (userId) {
      query = `id=eq.${userId}`;
    } else if (email) {
      query = `email=eq.${encodeURIComponent(email)}`;
    }
    
    // Reset scheduling fields to defaults
    const resetData = {
      preferred_send_time: '09:00:00',
      timezone: 'America/Los_Angeles',
      send_frequency: 'daily',
      weekend_delivery: false,
      max_newsletters_per_day: 1,
      last_newsletter_sent: null,
      updated_at: new Date().toISOString()
    };
    
    const updatedUsers = await supabaseQuery('users', query, {
      method: 'PATCH',
      headers: { 'Prefer': 'return=representation' },
      body: resetData
    });
    
    if (updatedUsers.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }
    
    return Response.json({
      success: true,
      message: 'User scheduling preferences reset to defaults',
      user: updatedUsers[0]
    });
    
  } catch (error) {
    console.error('Error resetting user schedule:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}