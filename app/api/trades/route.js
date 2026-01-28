export const dynamic = 'force-dynamic';

const SUPABASE_URL = "https://lsqlqssigerzghlxfxjl.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzcWxxc3NpZ2VyemdobHhmeGpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1NDA5NTEsImV4cCI6MjA4NTExNjk1MX0.jqoZUtW_gb8rehPteVgjmLLLlPRLYV-0fNJkpLGcf-s";

export async function GET() {
  try {
    const [tradesRes, positionsRes] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/trades?select=*&order=conviction.desc.nullslast`, {
        headers: { 'apikey': SUPABASE_ANON },
        cache: 'no-store'
      }),
      fetch(`${SUPABASE_URL}/rest/v1/trade_positions?select=*`, {
        headers: { 'apikey': SUPABASE_ANON },
        cache: 'no-store'
      })
    ]);

    const trades = await tradesRes.json();
    const positions = await positionsRes.json();

    // Group positions by trade
    const tradesWithPositions = trades.map(t => ({
      ...t,
      positions: positions.filter(p => p.trade_id === t.id)
    }));

    return Response.json({ trades: tradesWithPositions });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
