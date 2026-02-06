export const dynamic = 'force-dynamic';

const SUPABASE_URL = "https://lsqlqssigerzghlxfxjl.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzcWxxc3NpZ2VyemdobHhmeGpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1NDA5NTEsImV4cCI6MjA4NTExNjk1MX0.jqoZUtW_gb8rehPteVgjmLLLlPRLYV-0fNJkpLGcf-s";

export async function GET() {
  try {
    // Fetch from Supabase
    const [positionsRes, optionsRes] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/positions?select=*`, {
        headers: { 'apikey': SUPABASE_ANON },
        cache: 'no-store'
      }),
      fetch(`${SUPABASE_URL}/rest/v1/options?select=*&order=expiry.asc`, {
        headers: { 'apikey': SUPABASE_ANON },
        cache: 'no-store'
      })
    ]);

    const positions = await positionsRes.json();
    const optionsData = await optionsRes.json();

    // Handle errors
    if (positions.error || optionsData.error) {
      throw new Error(positions.error?.message || optionsData.error?.message || 'Failed to fetch');
    }

    // Categorize positions
    const cash = [];
    const equities = [];
    const crypto = [];

    (positions || []).forEach(row => {
      const item = {
        symbol: row.symbol,
        name: row.name,
        price: row.current_price || 0,
        value: row.market_value || 0,
        pl: row.profit_loss || 0,
        plPct: row.profit_loss_pct || 0,
        units: row.units || 0,
        cost: row.cost_basis || 0,
        type: row.type,
        account: row.account
      };

      if (row.type === 'cash' || row.type === 'fund') {
        cash.push(item);
      } else if (row.type === 'crypto') {
        crypto.push(item);
      } else {
        equities.push(item);
      }
    });

    // Process options
    const options = (optionsData || []).map(row => ({
      contract: row.contract_symbol,
      symbol: row.underlying,
      name: row.name,
      type: row.option_type,
      strike: row.strike || 0,
      expiry: row.expiry,
      price: row.price || 0,
      qty: row.qty || 0,
      value: row.market_value || 0,
      underlyingPrice: row.underlying_price || 0,
      daysToExpiry: row.days_to_expiry || 0,
      status: row.status,
      notional: row.notional || 0,
      account: row.account
    }));

    // Calculate totals
    const cashTotal = cash.reduce((sum, c) => sum + c.value, 0);
    const equitiesTotal = equities.reduce((sum, e) => sum + e.value, 0);
    const cryptoTotal = crypto.reduce((sum, c) => sum + c.value, 0);
    const optionsTotal = options.reduce((sum, o) => sum + o.value, 0);

    return Response.json({
      lastUpdated: new Date().toISOString(),
      source: 'supabase',
      summary: {
        cash: cashTotal,
        equities: equitiesTotal,
        crypto: cryptoTotal,
        options: optionsTotal,
        total: cashTotal + equitiesTotal + cryptoTotal + optionsTotal
      },
      cash,
      equities,
      crypto,
      options
    });
  } catch (error) {
    console.error('Portfolio API error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
