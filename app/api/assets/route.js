export const dynamic = 'force-dynamic';

const SUPABASE_URL = "https://lsqlqssigerzghlxfxjl.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzcWxxc3NpZ2VyemdobHhmeGpsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTU0MDk1MSwiZXhwIjoyMDg1MTE2OTUxfQ.Mxvw-Jl-BV8jf6ypK-yyjfsD3U3xRJrccfDMUAWRLvU";

export async function GET() {
  try {
    const [assetsRes, researchRes] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/assets?select=*&order=symbol`, {
        headers: { 'apikey': SUPABASE_KEY },
        cache: 'no-store'
      }),
      fetch(`${SUPABASE_URL}/rest/v1/research?select=ticker,title,updated_at&order=updated_at.desc`, {
        headers: { 'apikey': SUPABASE_KEY },
        cache: 'no-store'
      })
    ]);

    const assets = await assetsRes.json();
    const research = await researchRes.json();

    // Attach research to assets
    const assetsWithResearch = assets.map(a => ({
      ...a,
      research: research.filter(r => r.ticker === a.symbol)
    }));

    return Response.json({ assets: assetsWithResearch });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const { symbol, target_price, stop_loss, notes } = await request.json();
    
    const res = await fetch(`${SUPABASE_URL}/rest/v1/assets?symbol=eq.${symbol}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ 
        target_price: target_price || null, 
        stop_loss: stop_loss || null,
        notes: notes || null,
        updated_at: new Date().toISOString()
      })
    });

    return Response.json({ success: res.ok });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
