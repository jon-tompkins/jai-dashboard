export const dynamic = 'force-dynamic';

const SUPABASE_URL = "https://lsqlqssigerzghlxfxjl.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzcWxxc3NpZ2VyemdobHhmeGpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1NDA5NTEsImV4cCI6MjA4NTExNjk1MX0.jqoZUtW_gb8rehPteVgjmLLLlPRLYV-0fNJkpLGcf-s";

const TRADE_COLORS = [
  '#3fb950', '#58a6ff', '#f85149', '#d29922', '#a371f7', 
  '#8957e5', '#79c0ff', '#da3633', '#238636', '#bc8cff'
];

export async function GET() {
  try {
    const [tradesRes, tradePositionsRes, positionsRes, optionsRes] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/trades?select=*&order=conviction.desc.nullslast`, {
        headers: { 'apikey': SUPABASE_ANON },
        cache: 'no-store'
      }),
      fetch(`${SUPABASE_URL}/rest/v1/trade_positions?select=*`, {
        headers: { 'apikey': SUPABASE_ANON },
        cache: 'no-store'
      }),
      fetch(`${SUPABASE_URL}/rest/v1/positions?select=*&trade_id=is.null`, {
        headers: { 'apikey': SUPABASE_ANON },
        cache: 'no-store'
      }),
      fetch(`${SUPABASE_URL}/rest/v1/options?select=*&trade_id=is.null`, {
        headers: { 'apikey': SUPABASE_ANON },
        cache: 'no-store'
      })
    ]);

    const trades = await tradesRes.json();
    const tradePositions = await tradePositionsRes.json();
    const unassignedPositions = await positionsRes.json();
    const unassignedOptions = await optionsRes.json();

    // Group trade positions by trade
    const tradesWithPositions = trades.map(t => ({
      ...t,
      positions: tradePositions.filter(p => p.trade_id === t.id)
    }));

    // Group unassigned positions by underlying symbol
    const noTradePositions = {};
    
    // Add regular positions
    (unassignedPositions || []).forEach(pos => {
      const symbol = pos.symbol;
      if (!noTradePositions[symbol]) {
        noTradePositions[symbol] = { underlying: symbol, positions: [], options: [] };
      }
      noTradePositions[symbol].positions.push({
        id: pos.id,
        symbol: pos.symbol,
        type: pos.type === 'crypto' ? 'crypto' : 'equity',
        value: pos.market_value || 0,
        qty: pos.units || 0,
        price: pos.current_price || 0
      });
    });

    // Add options
    (unassignedOptions || []).forEach(opt => {
      const symbol = opt.underlying;
      if (!noTradePositions[symbol]) {
        noTradePositions[symbol] = { underlying: symbol, positions: [], options: [] };
      }
      noTradePositions[symbol].options.push({
        id: opt.id,
        contract: opt.contract_symbol,
        type: opt.option_type,
        strike: opt.strike,
        expiry: opt.expiry,
        qty: opt.qty || 0,
        value: opt.market_value || 0,
        price: opt.price || 0
      });
    });

    // Convert to array and calculate totals
    const noTradeGroups = Object.values(noTradePositions).map(group => {
      const totalValue = [...group.positions, ...group.options].reduce((sum, item) => sum + (item.value || 0), 0);
      return { ...group, totalValue };
    }).sort((a, b) => b.totalValue - a.totalValue);

    return Response.json({ 
      trades: tradesWithPositions, 
      unassignedPositions: noTradeGroups 
    });
  } catch (error) {
    console.error('Trades API error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, thesis, direction, timeframe, conviction, status } = body;

    if (!name) {
      return Response.json({ error: 'Name is required' }, { status: 400 });
    }

    // Pick a random color
    const color = TRADE_COLORS[Math.floor(Math.random() * TRADE_COLORS.length)];
    
    // Create theme from name (lowercase, hyphenated)
    const theme = name.toLowerCase().replace(/\s+/g, '-');

    const res = await fetch(`${SUPABASE_URL}/rest/v1/trades`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        name,
        thesis: thesis || '',
        direction: direction || 'long',
        timeframe: timeframe || 'medium',
        conviction: conviction || 3,
        status: status || 'active',
        theme,
        color
      })
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(error);
    }

    const created = await res.json();
    return Response.json({ trade: created[0] });
  } catch (error) {
    console.error('Trades POST error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const { id, name, thesis, direction, timeframe, conviction, status } = body;

    if (!id) {
      return Response.json({ error: 'Trade ID is required' }, { status: 400 });
    }

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (thesis !== undefined) updates.thesis = thesis;
    if (direction !== undefined) updates.direction = direction;
    if (timeframe !== undefined) updates.timeframe = timeframe;
    if (conviction !== undefined) updates.conviction = conviction;
    if (status !== undefined) updates.status = status;

    // Update theme if name changed
    if (name) {
      updates.theme = name.toLowerCase().replace(/\s+/g, '-');
    }

    const res = await fetch(`${SUPABASE_URL}/rest/v1/trades?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_ANON,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(updates)
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(error);
    }

    const updated = await res.json();
    return Response.json({ trade: updated[0] });
  } catch (error) {
    console.error('Trades PATCH error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}