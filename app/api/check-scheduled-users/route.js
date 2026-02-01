const SUPABASE_URL = "https://lsqlqssigerzghlxfxjl.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzcWxxc3NpZ2VyemdobHhmeGpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1NDA5NTEsImV4cCI6MjA4NTExNjk1MX0.jqoZUtW_gb8rehPteVgjmLLLlPRLYV-0fNJkpLGcf-s";

// Helper function to call Supabase RPC functions
async function callSupabaseFunction(functionName, params = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${functionName}`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params)
  });
  
  if (!response.ok) {
    throw new Error(`Supabase RPC call failed: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

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
    throw new Error(`Supabase query failed: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

// Function to generate newsletter content for a user
async function generateNewsletterContent(user) {
  try {
    // For now, create a simple newsletter structure
    // In the future, this could integrate with AI/tweet aggregation
    const content = {
      title: `Daily Brief - ${new Date().toLocaleDateString()}`,
      summary: "Your personalized newsletter is being prepared...",
      type: 'daily_scheduled',
      user_timezone: user.timezone,
      user_send_time: user.preferred_send_time,
      generated_at: new Date().toISOString(),
      content: `# Daily Brief for ${user.email}
      
## Good ${getTimeOfDayGreeting(user.preferred_send_time)}!

This is your scheduled newsletter for ${new Date().toLocaleDateString()}.

### Key Updates
- Newsletter system is now personalized for your timezone: ${user.timezone}
- Scheduled delivery at: ${user.preferred_send_time}
- Frequency: ${user.send_frequency}

### Coming Soon
- Tweet aggregation from your followed accounts
- AI-generated summaries
- Personalized content based on your interests

---
*This newsletter was automatically generated and sent at your preferred time.*
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

// Helper to get greeting based on time
function getTimeOfDayGreeting(timeString) {
  const hour = parseInt(timeString.split(':')[0]);
  if (hour < 12) return 'Morning';
  if (hour < 17) return 'Afternoon';
  return 'Evening';
}

// Function to actually send newsletter (placeholder for now)
async function sendNewsletter(user, content) {
  try {
    // For now, just create a newsletter record in the database
    // In the future, this could integrate with email service, push notifications, etc.
    
    const newsletterData = {
      title: content.title,
      content: content.content,
      summary: content.summary,
      type: 'scheduled_personal',
      referenced_assets: [],
      source_accounts: [`user_${user.user_id}`],
    };
    
    // Insert newsletter into newsletters table
    const newsletters = await supabaseQuery('newsletters', '', {
      method: 'POST',
      headers: { 'Prefer': 'return=representation' },
      body: newsletterData
    });
    
    const newsletter = newsletters[0];
    
    // Log successful send
    console.log(`Newsletter sent to ${user.email}: ${newsletter.id}`);
    
    return newsletter;
    
  } catch (error) {
    console.error('Error sending newsletter:', error);
    throw error;
  }
}

// Function to get users due for newsletter (implemented in JS since DB function may not be available)
async function getUsersDueForNewsletter(currentUtcTime) {
  try {
    // Get all users with scheduling preferences
    const users = await supabaseQuery(
      'users', 
      'select=id,email,preferred_send_time,timezone,last_newsletter_sent,send_frequency,weekend_delivery&preferred_send_time=not.is.null&timezone=not.is.null&email=not.is.null'
    );
    
    const currentDate = new Date(currentUtcTime);
    const windowStart = new Date(currentDate.getTime());
    windowStart.setSeconds(0, 0); // Round down to minute
    const windowEnd = new Date(windowStart.getTime() + 5 * 60 * 1000); // Add 5 minutes
    
    const usersDue = [];
    
    for (const user of users) {
      try {
        // Calculate when this user's preferred time occurs in UTC
        const [hours, minutes] = user.preferred_send_time.split(':').map(Number);
        
        // Create a date object for today at the user's preferred time in their timezone
        const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD format
        const userLocalTimeStr = `${today}T${user.preferred_send_time}`;
        
        // Convert to UTC
        const userLocalTime = new Date(userLocalTimeStr);
        const timezoneOffset = getTimezoneOffset(user.timezone, userLocalTime);
        const userUtcTime = new Date(userLocalTime.getTime() - timezoneOffset);
        
        // Check if user's preferred UTC time falls within our 5-minute window
        if (userUtcTime >= windowStart && userUtcTime < windowEnd) {
          // Check frequency requirements
          const lastSent = user.last_newsletter_sent ? new Date(user.last_newsletter_sent) : null;
          const daysSinceLastSent = lastSent ? Math.floor((currentDate - lastSent) / (1000 * 60 * 60 * 24)) : 999;
          
          let shouldSend = false;
          
          switch (user.send_frequency) {
            case 'daily':
              shouldSend = !lastSent || daysSinceLastSent >= 1;
              break;
            case 'weekly':
              shouldSend = !lastSent || daysSinceLastSent >= 7;
              break;
            case 'bi-weekly':
              shouldSend = !lastSent || daysSinceLastSent >= 14;
              break;
            default:
              shouldSend = !lastSent || daysSinceLastSent >= 1;
          }
          
          // Check weekend delivery preference
          const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
          if (isWeekend && !user.weekend_delivery) {
            shouldSend = false;
          }
          
          if (shouldSend) {
            usersDue.push({
              user_id: user.id,
              email: user.email,
              preferred_send_time: user.preferred_send_time,
              timezone: user.timezone,
              local_send_time: userUtcTime.toISOString(),
              last_newsletter_sent: user.last_newsletter_sent,
              send_frequency: user.send_frequency
            });
          }
        }
      } catch (userError) {
        console.error(`Error processing user ${user.email}:`, userError);
        // Continue with other users
      }
    }
    
    return usersDue;
  } catch (error) {
    console.error('Error getting users due for newsletter:', error);
    throw error;
  }
}

// Helper function to get timezone offset (simplified)
function getTimezoneOffset(timezone, date) {
  try {
    // This is a simplified approach - in production, you'd want a more robust timezone library
    const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
    const localDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
    return localDate.getTime() - utcDate.getTime();
  } catch (error) {
    console.error('Error calculating timezone offset:', error);
    return 0; // Default to UTC
  }
}

// Main API route handler
export async function POST(request) {
  const startTime = Date.now();
  let logData = {
    run_timestamp: new Date().toISOString(),
    users_checked: 0,
    users_matched: 0,
    newsletters_queued: 0,
    newsletters_sent: 0,
    errors_count: 0,
    details: { errors: [] }
  };
  
  try {
    console.log('🕐 Checking for scheduled newsletters...');
    
    // Get current time for this check
    const currentTime = new Date().toISOString();
    
    // Get users due for newsletters (using direct implementation instead of DB function)
    let usersDue;
    try {
      usersDue = await callSupabaseFunction('get_users_due_for_newsletter', {
        current_utc_time: currentTime
      });
    } catch (dbFunctionError) {
      console.log('⚠️ Database function not available, using fallback implementation');
      usersDue = await getUsersDueForNewsletter(currentTime);
    }
    
    logData.users_checked = usersDue.length;
    
    if (usersDue.length === 0) {
      console.log('✅ No users due for newsletters at this time');
      logData.details.message = 'No users due for newsletters';
    } else {
      console.log(`📧 Found ${usersDue.length} users due for newsletters`);
      logData.users_matched = usersDue.length;
      
      // Process each user
      for (const user of usersDue) {
        try {
          console.log(`Processing user ${user.email} (${user.timezone}, ${user.preferred_send_time})`);
          
          // Generate newsletter content
          const content = await generateNewsletterContent(user);
          
          // Queue the newsletter
          const queueId = await callSupabaseFunction('queue_newsletter_for_user', {
            p_user_id: user.user_id,
            p_scheduled_for: currentTime,
            p_content: content
          });
          
          logData.newsletters_queued++;
          
          // Immediately try to send it (for real-time delivery)
          try {
            const newsletter = await sendNewsletter(user, content);
            
            // Mark as sent in the queue
            await callSupabaseFunction('mark_newsletter_sent', {
              p_queue_id: queueId,
              p_newsletter_id: newsletter.id
            });
            
            logData.newsletters_sent++;
            console.log(`✅ Newsletter sent successfully to ${user.email}`);
            
          } catch (sendError) {
            // Update queue with error
            await supabaseQuery('newsletter_queue', `id=eq.${queueId}`, {
              method: 'PATCH',
              body: {
                status: 'failed',
                error_message: sendError.message,
                send_attempts: 1,
                last_attempt_at: currentTime
              }
            });
            
            logData.errors_count++;
            logData.details.errors.push({
              user_email: user.email,
              error: sendError.message,
              type: 'send_error'
            });
            console.error(`❌ Failed to send newsletter to ${user.email}:`, sendError.message);
          }
          
        } catch (userError) {
          logData.errors_count++;
          logData.details.errors.push({
            user_email: user.email,
            error: userError.message,
            type: 'processing_error'
          });
          console.error(`❌ Error processing user ${user.email}:`, userError.message);
        }
      }
    }
    
    // Calculate processing time
    logData.processing_time_ms = Date.now() - startTime;
    
    // Log this run to the database
    await supabaseQuery('scheduling_logs', '', {
      method: 'POST',
      body: {
        ...logData,
        details: JSON.stringify(logData.details)
      }
    });
    
    // Return success response
    return Response.json({
      success: true,
      timestamp: currentTime,
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
          details: JSON.stringify(logData.details)
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

// Allow GET as well (for easy testing via browser)
export async function GET(request) {
  return POST(request);
}