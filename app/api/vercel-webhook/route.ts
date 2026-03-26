import { NextRequest, NextResponse } from 'next/server';

/**
 * Vercel Deployment Webhook
 * Receives deployment status updates and sends notifications
 * 
 * Configure in Vercel: Project Settings → Git → Deploy Hooks
 * Or use Vercel Integration webhooks
 */

interface VercelWebhookPayload {
  id: string;
  type: 'deployment' | 'deployment.error' | 'deployment.success' | 'deployment.failed';
  createdAt: number;
  payload: {
    deploymentId: string;
    url?: string;
    error?: {
      message: string;
      code: string;
    };
    project?: {
      id: string;
      name: string;
    };
  };
}

export async function POST(request: NextRequest) {
  try {
    const payload: VercelWebhookPayload = await request.json();
    
    // Log all deployments
    console.log('[Vercel Webhook]', payload.type, payload.payload.deploymentId);
    
    // Only notify on failures
    if (payload.type === 'deployment.failed' || payload.type === 'deployment.error') {
      const error = payload.payload.error;
      const projectName = payload.payload.project?.name || 'Unknown';
      
      // Send notification (Telegram in this case)
      await notifyFailure(projectName, payload.payload.deploymentId, error);
      
      return NextResponse.json({ 
        status: 'notified', 
        message: 'Deployment failure recorded and notification sent' 
      });
    }
    
    return NextResponse.json({ status: 'ok' });
    
  } catch (error) {
    console.error('[Vercel Webhook] Error:', error);
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}

async function notifyFailure(projectName: string, deploymentId: string, error?: { message: string; code: string }) {
  // Send to Telegram (your main channel)
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID || '380299589'; // Your chat ID
  
  if (!botToken) {
    console.error('[Vercel Webhook] No Telegram bot token configured');
    return;
  }
  
  const message = `
🚨 **Vercel Deployment Failed**

**Project:** ${projectName}
**Deployment:** ${deploymentId}
${error ? `**Error:** ${error.message} (${error.code})` : ''}

Check Vercel dashboard for details.
  `.trim();
  
  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
      }),
    });
  } catch (err) {
    console.error('[Vercel Webhook] Failed to send Telegram notification:', err);
  }
}

// Also support GET for webhook verification
export async function GET() {
  return NextResponse.json({ 
    status: 'Vercel webhook endpoint ready',
    usage: 'Configure this URL in Vercel project settings under Webhooks'
  });
}
