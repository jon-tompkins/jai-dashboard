const SUPABASE_URL = "https://lsqlqssigerzghlxfxjl.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzcWxxc3NpZ2VyemdobHhmeGpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1NDA5NTEsImV4cCI6MjA4NTExNjk1MX0.jqoZUtW_gb8rehPteVgjmLLLlPRLYV-0fNJkpLGcf-s";

// Helper function to fetch from Supabase REST API
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

// Helper to get greeting based on time
function getTimeOfDayGreeting(timeString) {
  const hour = parseInt(timeString.split(':')[0]);
  if (hour < 12) return 'Morning';
  if (hour < 17) return 'Afternoon';
  return 'Evening';
}

// Get current time in a specific timezone
function getCurrentTimeInTimezone(timezone) {
  const now = new Date();
  // Get the local time string in the specified timezone
  const options = {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  };
  return new Intl.DateTimeFormat('en-GB', options).format(now);
}

// Get current date in a specific timezone (YYYY-MM-DD)
function getCurrentDateInTimezone(timezone) {
  const now = new Date();
  const options = {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  };
  // Format: MM/DD/YYYY -> YYYY-MM-DD
  const parts = new Intl.DateTimeFormat('en-US', options).formatToParts(now);
  const month = parts.find(p => p.type === 'month').value;
  const day = parts.find(p => p.type === 'day').value;
  const year = parts.find(p => p.type === 'year').value;
  return `${year}-${month}-${day}`;
}

// Compare time strings (HH:MM:SS format)
function timeHasPassed(preferredTime, currentTime) {
  const [prefH, prefM] = preferredTime.split(':').map(Number);
  const [curH, curM] = currentTime.split(':').map(Number);
  
  if (curH > prefH) return true;
  if (curH === prefH && curM >= prefM) return true;
  return false;
}

// Check if user should receive newsletter based on frequency
function shouldSendBasedOnFrequency(lastSent, frequency) {
  if (!lastSent) return true; // Never sent before
  
  const lastDate = new Date(lastSent);
  const now = new Date();
  const daysDiff = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));
  
  switch (frequency) {
    case 'daily':
      return daysDiff >= 1;
    case 'weekly':
      return daysDiff >= 7;
    case 'bi-weekly':
      return daysDiff >= 14;
    default:
      return daysDiff >= 1;
  }
}

// Check if today is a weekend
function isWeekendInTimezone(timezone) {
  const now = new Date();
  const options = { timeZone: timezone, weekday: 'short' };
  const dayName = new Intl.DateTimeFormat('en-US', options).format(now);
  return dayName === 'Sat' || dayName === 'Sun';
}

/**
 * Get users who are due for newsletter delivery.
 * Per spec: "Looks for users with delivery times less than current time 
 * that have not had a newsletter delivered"
 */
async function getUsersDueForNewsletter() {
  try {
    // Get all users with email and scheduling preferences set
    const users = await supabaseQuery(
      'users', 
      'select=id,email,name,preferred_send_time,timezone,last_newsletter_sent,send_frequency,weekend_delivery,custom_prompt,settings&email=not.is.null&preferred_send_time=not.is.null&timezone=not.is.null'
    );
    
    console.log(`📋 Found ${users.length} users with scheduling preferences`);
    
    const usersDue = [];
    
    for (const user of users) {
      try {
        // Get current time in user's timezone
        const currentTimeInUserTz = getCurrentTimeInTimezone(user.timezone);
        const currentDateInUserTz = getCurrentDateInTimezone(user.timezone);
        
        // Check if delivery time has passed in user's timezone
        if (!timeHasPassed(user.preferred_send_time, currentTimeInUserTz)) {
          console.log(`⏰ ${user.email}: Delivery time ${user.preferred_send_time} not yet reached (current: ${currentTimeInUserTz} ${user.timezone})`);
          continue;
        }
        
        // Check weekend preference
        if (isWeekendInTimezone(user.timezone) && !user.weekend_delivery) {
          console.log(`📅 ${user.email}: Skipping weekend delivery (weekend_delivery=false)`);
          continue;
        }
        
        // Check if already sent today (based on user's timezone date)
        // last_newsletter_sent is stored as a date, so compare dates
        if (user.last_newsletter_sent === currentDateInUserTz) {
          console.log(`✅ ${user.email}: Already sent newsletter today (${user.last_newsletter_sent})`);
          continue;
        }
        
        // Check frequency requirements
        if (!shouldSendBasedOnFrequency(user.last_newsletter_sent, user.send_frequency)) {
          console.log(`📊 ${user.email}: Frequency check failed (${user.send_frequency}, last sent: ${user.last_newsletter_sent})`);
          continue;
        }
        
        console.log(`✨ ${user.email}: DUE for newsletter (time: ${user.preferred_send_time}, tz: ${user.timezone})`);
        usersDue.push({
          user_id: user.id,
          email: user.email,
          name: user.name,
          preferred_send_time: user.preferred_send_time,
          timezone: user.timezone,
          last_newsletter_sent: user.last_newsletter_sent,
          send_frequency: user.send_frequency,
          custom_prompt: user.custom_prompt,
          settings: user.settings
        });
        
      } catch (userError) {
        console.error(`❌ Error processing user ${user.email}:`, userError.message);
      }
    }
    
    return usersDue;
  } catch (error) {
    console.error('Error getting users due for newsletter:', error);
    throw error;
  }
}

// Function to generate newsletter content for a user
async function generateNewsletterContent(user) {
  try {
    const todayDate = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const content = {
      title: `Daily Brief - ${todayDate}`,
      summary: "Your personalized newsletter digest",
      type: 'daily_scheduled',
      user_timezone: user.timezone,
      user_send_time: user.preferred_send_time,
      generated_at: new Date().toISOString(),
      content: `# Daily Brief for ${user.name || user.email}
      
## Good ${getTimeOfDayGreeting(user.preferred_send_time)}!

This is your scheduled newsletter for ${todayDate}.

### Your Settings
- Timezone: ${user.timezone}
- Delivery time: ${user.preferred_send_time}
- Frequency: ${user.send_frequency}

### Status
✅ Newsletter delivery is working!

---
*Delivered by MyJunto at your preferred time.*
`
    };
    
    return content;
  } catch (error) {
    console.error('Error generating newsletter content:', error);
    return {
      title: `Daily Brief - ${new Date().toLocaleDateString()}`,
      summary: "Error generating content",
      type: 'daily_scheduled',
      content: "There was an error generating your newsletter content. Please contact support.",
      error: error.message
    };
  }
}

// Function to create newsletter and queue entry
async function createAndSendNewsletter(user, content) {
  try {
    // 1. Create newsletter record
    const newsletterData = {
      title: content.title,
      content: content.content,
      summary: content.summary,
      type: 'scheduled_personal',
      referenced_assets: [],
      source_accounts: []
    };
    
    const newsletters = await supabaseQuery('newsletters', '', {
      method: 'POST',
      headers: { 'Prefer': 'return=representation' },
      body: newsletterData
    });
    
    const newsletter = newsletters[0];
    console.log(`📰 Created newsletter ${newsletter.id} for ${user.email}`);
    
    // 2. Create queue entry (for tracking)
    const queueData = {
      user_id: user.user_id,
      scheduled_for: new Date().toISOString(),
      status: 'sent',
      newsletter_id: newsletter.id,
      content: content,
      send_attempts: 1,
      last_attempt_at: new Date().toISOString()
    };
    
    await supabaseQuery('newsletter_queue', '', {
      method: 'POST',
      body: queueData
    });
    
    // 3. Update user's last_newsletter_sent to TODAY (in their timezone)
    const todayInUserTz = getCurrentDateInTimezone(user.timezone);
    await supabaseQuery('users', `id=eq.${user.user_id}`, {
      method: 'PATCH',
      body: {
        last_newsletter_sent: todayInUserTz,
        updated_at: new Date().toISOString()
      }
    });
    
    console.log(`✅ Newsletter sent to ${user.email}, updated last_newsletter_sent to ${todayInUserTz}`);
    
    return newsletter;
    
  } catch (error) {
    console.error(`Error sending newsletter to ${user.email}:`, error);
    
    // Try to log the failure in queue
    try {
      await supabaseQuery('newsletter_queue', '', {
        method: 'POST',
        body: {
          user_id: user.user_id,
          scheduled_for: new Date().toISOString(),
          status: 'failed',
          content: content,
          send_attempts: 1,
          last_attempt_at: new Date().toISOString(),
          error_message: error.message
        }
      });
    } catch (queueError) {
      console.error('Failed to log queue error:', queueError);
    }
    
    throw error;
  }
}

// Main API route handler
export async function GET(request) {
  const startTime = Date.now();
  let logData = {
    run_timestamp: new Date().toISOString(),
    users_checked: 0,
    users_matched: 0,
    newsletters_queued: 0,
    newsletters_sent: 0,
    errors_count: 0,
    details: { 
      status: 'started',
      start_time: new Date().toISOString(),
      errors: [],
      processed_users: []
    }
  };
  
  try {
    console.log('🕐 Newsletter scheduling check started at', new Date().toISOString());
    
    // Get users due for newsletters
    const usersDue = await getUsersDueForNewsletter();
    
    // Count total users checked (from query)
    const allUsers = await supabaseQuery('users', 'select=id&email=not.is.null&preferred_send_time=not.is.null&timezone=not.is.null');
    logData.users_checked = allUsers.length;
    logData.users_matched = usersDue.length;
    
    if (usersDue.length === 0) {
      console.log('✅ No users due for newsletters at this time');
      logData.details.message = 'No users due for newsletters';
      logData.details.status = 'completed';
    } else {
      console.log(`📧 Found ${usersDue.length} users due for newsletters`);
      
      // Process each user
      for (const user of usersDue) {
        try {
          console.log(`🔄 Processing: ${user.email}`);
          
          // Generate content
          const content = await generateNewsletterContent(user);
          logData.newsletters_queued++;
          
          // Create and send newsletter
          const newsletter = await createAndSendNewsletter(user, content);
          logData.newsletters_sent++;
          
          logData.details.processed_users.push({
            email: user.email,
            newsletter_id: newsletter.id,
            status: 'sent'
          });
          
          console.log(`✅ Successfully sent to ${user.email}`);
          
        } catch (userError) {
          logData.errors_count++;
          logData.details.errors.push({
            user_email: user.email,
            error: userError.message,
            type: 'processing_error'
          });
          console.error(`❌ Failed for ${user.email}:`, userError.message);
        }
      }
      
      logData.details.status = 'completed';
    }
    
    // Calculate processing time
    logData.processing_time_ms = Date.now() - startTime;
    logData.details.end_time = new Date().toISOString();
    
    // Log this run to the database
    await supabaseQuery('scheduling_logs', '', {
      method: 'POST',
      body: {
        ...logData,
        details: logData.details
      }
    });
    
    // Return success response
    return Response.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        users_checked: logData.users_checked,
        users_matched: logData.users_matched,
        newsletters_queued: logData.newsletters_queued,
        newsletters_sent: logData.newsletters_sent,
        errors_count: logData.errors_count,
        processing_time_ms: logData.processing_time_ms
      },
      details: logData.details,
      next_check_in: '5 minutes'
    });
    
  } catch (error) {
    console.error('💥 Scheduling check failed:', error);
    
    logData.errors_count++;
    logData.processing_time_ms = Date.now() - startTime;
    logData.details.status = 'failed';
    logData.details.errors.push({
      error: error.message,
      type: 'system_error'
    });
    
    // Still try to log the error
    try {
      await supabaseQuery('scheduling_logs', '', {
        method: 'POST',
        body: {
          ...logData,
          details: logData.details
        }
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
    
    return Response.json({ 
      success: false, 
      error: error.message,
      summary: logData
    }, { status: 500 });
  }
}

// Allow POST as well (in case cron service prefers POST)
export async function POST(request) {
  return GET(request);
}
