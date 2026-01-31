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
    details: { errors: [] }
  };
  
  try {
    console.log('🕐 Checking for scheduled newsletters...');
    
    // Get current time for this check
    const currentTime = new Date().toISOString();
    
    // Call our custom function to get users due for newsletters
    const usersDue = await callSupabaseFunction('get_users_due_for_newsletter', {
      current_utc_time: currentTime
    });
    
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

// Allow POST as well (in case cron service prefers POST)
export async function POST(request) {
  return GET(request);
}