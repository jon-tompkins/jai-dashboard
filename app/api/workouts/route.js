export const dynamic = 'force-dynamic';

const SUPABASE_URL = "https://lsqlqssigerzghlxfxjl.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzcWxxc3NpZ2VyemdobHhmeGpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1NDA5NTEsImV4cCI6MjA4NTExNjk1MX0.jqoZUtW_gb8rehPteVgjmLLLlPRLYV-0fNJkpLGcf-s";

// Calculate tracking 1RM: Epley formula * 0.9
function calcTracking1RM(weight, reps) {
  if (!weight || !reps) return null;
  if (reps === 1) return Math.round(weight * 0.9);
  const epley = weight * (1 + reps / 30);
  return Math.round(epley * 0.9);
}

export async function GET() {
  try {
    // Get tracked metrics
    const metricsRes = await fetch(`${SUPABASE_URL}/rest/v1/tracked_metrics?select=*&order=sort_order`, {
      headers: { 'apikey': SUPABASE_KEY }
    });
    const metrics = await metricsRes.json();

    // Get workout logs with their metrics
    const logsRes = await fetch(`${SUPABASE_URL}/rest/v1/workout_logs?select=*,workout_metrics(*)&order=date.desc&limit=20`, {
      headers: { 'apikey': SUPABASE_KEY }
    });
    const logs = await logsRes.json();

    return Response.json({ metrics, logs });
  } catch (e) {
    return Response.json({ error: e.message, metrics: [], logs: [] });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { date, type, description, body_weight, duration_min, notes, trackedMetrics } = body;

    // Create workout log
    const logRes = await fetch(`${SUPABASE_URL}/rest/v1/workout_logs`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ date, type, description, body_weight, duration_min, notes })
    });
    const [workout] = await logRes.json();

    // Add tracked metrics if any
    if (trackedMetrics?.length > 0 && workout?.id) {
      const metricsToInsert = trackedMetrics.map(m => ({
        workout_id: workout.id,
        metric_id: m.metric_id,
        value: m.value,
        reps: m.reps,
        sets: m.sets,
        calculated_max: m.calc_type === 'weight_reps' ? calcTracking1RM(m.value, m.reps) : null,
        is_pr: m.is_pr || false,
        notes: m.notes
      }));

      await fetch(`${SUPABASE_URL}/rest/v1/workout_metrics`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(metricsToInsert)
      });
    }

    return Response.json({ success: true, workout });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
