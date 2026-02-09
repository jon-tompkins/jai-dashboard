export const dynamic = 'force-dynamic';

const SUPABASE_URL = "https://lsqlqssigerzghlxfxjl.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzcWxxc3NpZ2VyemdobHhmeGpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1NDA5NTEsImV4cCI6MjA4NTExNjk1MX0.jqoZUtW_gb8rehPteVgjmLLLlPRLYV-0fNJkpLGcf-s";

export async function GET() {
  try {
    // Fetch positions, options, and trades
    const [positionsRes, optionsRes, tradesRes] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/positions?select=*`, {
        headers: { 'apikey': SUPABASE_ANON },
        cache: 'no-store'
      }),
      fetch(`${SUPABASE_URL}/rest/v1/options?select=*&order=expiry.asc`, {
        headers: { 'apikey': SUPABASE_ANON },
        cache: 'no-store'
      }),
      fetch(`${SUPABASE_URL}/rest/v1/trades?select=*&order=name.asc`, {
        headers: { 'apikey': SUPABASE_ANON },
        cache: 'no-store'
      })
    ]);

    const positions = await positionsRes.json();
    const options = await optionsRes.json();
    const trades = await tradesRes.json();

    // Handle errors
    if (positions.error || options.error || trades.error) {
      throw new Error(positions.error?.message || options.error?.message || trades.error?.message || 'Failed to fetch data');
    }

    // Create trade lookup
    const tradeLookup = {};
    (trades || []).forEach(trade => {
      tradeLookup[trade.id] = trade;
    });

    // Process positions
    const allPositions = [];
    
    // Add equity/cash/crypto positions
    (positions || []).forEach(pos => {
      allPositions.push({
        id: pos.id,
        table: 'positions',
        symbol: pos.symbol,
        name: pos.name,
        type: pos.type === 'cash' || pos.type === 'fund' ? 'cash' : 
              pos.type === 'crypto' ? 'crypto' : 'equity',
        quantity: pos.units || 0,
        price: pos.current_price || 0,
        value: pos.market_value || 0,
        pl: pos.profit_loss || 0,
        plPct: pos.profit_loss_pct || 0,
        tradeId: pos.trade_id || null,
        trade: pos.trade_id ? tradeLookup[pos.trade_id] : null,
        account: pos.account,
        costBasis: pos.cost_basis || 0,
        underlying: pos.symbol
      });
    });

    // Add options positions
    (options || []).forEach(opt => {
      allPositions.push({
        id: opt.id,
        table: 'options',
        symbol: opt.contract_symbol,
        name: `${opt.underlying} ${opt.option_type} ${opt.strike} ${opt.expiry}`,
        type: 'option',
        quantity: opt.qty || 0,
        price: opt.price || 0,
        value: opt.market_value || 0,
        pl: (opt.market_value || 0) - ((opt.qty || 0) * (opt.cost_basis || 0) * 100),
        plPct: 0,
        tradeId: opt.trade_id || null,
        trade: opt.trade_id ? tradeLookup[opt.trade_id] : null,
        account: opt.account,
        costBasis: opt.cost_basis || 0,
        underlying: opt.underlying,
        optionType: opt.option_type,
        strike: opt.strike,
        expiry: opt.expiry,
        daysToExpiry: opt.days_to_expiry
      });
    });

    // Sort by value descending
    allPositions.sort((a, b) => (b.value || 0) - (a.value || 0));

    return Response.json({ 
      positions: allPositions,
      trades: trades || []
    });
  } catch (error) {
    console.error('Positions API error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const { id, table, tradeId } = await request.json();
    
    if (!id || !table) {
      return Response.json({ error: 'Missing id or table' }, { status: 400 });
    }

    const tableName = table === 'options' ? 'options' : 'positions';
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}?id=eq.${id}`, {
      method: 'PATCH',
      headers: { 
        'apikey': SUPABASE_ANON,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ trade_id: tradeId || null })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Update failed');
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Position update error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}