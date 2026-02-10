export const dynamic = 'force-dynamic';

const FINNHUB_KEY = process.env.FINNHUB_API_KEY;
const SUPABASE_URL = "https://lsqlqssigerzghlxfxjl.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzcWxxc3NpZ2VyemdobHhmeGpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1NDA5NTEsImV4cCI6MjA4NTExNjk1MX0.jqoZUtW_gb8rehPteVgjmLLLlPRLYV-0fNJkpLGcf-s";

// Finnhub quote endpoint
async function getQuote(symbol) {
  if (!FINNHUB_KEY) return null;
  
  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_KEY}`,
      { cache: 'no-store' }
    );
    if (!res.ok) return null;
    const data = await res.json();
    // Finnhub returns: c=current, h=high, l=low, o=open, pc=previous close, t=timestamp
    if (data.c && data.c > 0) {
      return {
        price: data.c,
        change: data.c - data.pc,
        changePercent: ((data.c - data.pc) / data.pc) * 100,
        high: data.h,
        low: data.l,
        open: data.o,
        prevClose: data.pc,
        timestamp: data.t
      };
    }
    return null;
  } catch (e) {
    console.error(`Finnhub error for ${symbol}:`, e.message);
    return null;
  }
}

// Batch fetch with rate limiting (60/min = 1/sec to be safe)
async function batchFetchQuotes(symbols) {
  const results = {};
  const uniqueSymbols = [...new Set(symbols)].filter(s => s && !s.includes(' '));
  
  // Skip money market funds and crypto (Finnhub doesn't cover these well)
  const stockSymbols = uniqueSymbols.filter(s => 
    !['SPAXX', 'SPRXX', 'FDRXX', 'BTC', 'ETH', 'USDC', 'ZRO', 'UNI', 'REN', 'HYPE'].includes(s)
  );
  
  for (const symbol of stockSymbols) {
    const quote = await getQuote(symbol);
    if (quote) {
      results[symbol] = quote;
    }
    // Rate limit: wait 100ms between calls (safe for 60/min limit)
    await new Promise(r => setTimeout(r, 100));
  }
  
  return results;
}

// GET: Fetch current prices for all positions
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const symbolsParam = searchParams.get('symbols');
  const updateDb = searchParams.get('update') === 'true';
  
  if (!FINNHUB_KEY) {
    return Response.json({ 
      error: 'FINNHUB_API_KEY not configured',
      hint: 'Add FINNHUB_API_KEY to environment variables'
    }, { status: 500 });
  }

  try {
    let symbols = [];
    
    if (symbolsParam) {
      // Specific symbols requested
      symbols = symbolsParam.split(',').map(s => s.trim().toUpperCase());
    } else {
      // Fetch all position symbols from database
      const [posRes, optRes] = await Promise.all([
        fetch(`${SUPABASE_URL}/rest/v1/positions?select=symbol`, {
          headers: { 'apikey': SUPABASE_ANON }
        }),
        fetch(`${SUPABASE_URL}/rest/v1/options?select=underlying`, {
          headers: { 'apikey': SUPABASE_ANON }
        })
      ]);
      
      const positions = await posRes.json();
      const options = await optRes.json();
      
      symbols = [
        ...positions.map(p => p.symbol),
        ...options.map(o => o.underlying)
      ];
    }

    // Fetch quotes
    const quotes = await batchFetchQuotes(symbols);
    const fetchedCount = Object.keys(quotes).length;
    
    // Optionally update database with new prices
    if (updateDb && fetchedCount > 0) {
      for (const [symbol, quote] of Object.entries(quotes)) {
        // Update positions table
        await fetch(`${SUPABASE_URL}/rest/v1/positions?symbol=eq.${symbol}`, {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_ANON,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            current_price: quote.price,
            updated_at: new Date().toISOString()
          })
        });
        
        // Update options table (underlying price)
        await fetch(`${SUPABASE_URL}/rest/v1/options?underlying=eq.${symbol}`, {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_ANON,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            underlying_price: quote.price,
            updated_at: new Date().toISOString()
          })
        });
      }
    }

    return Response.json({
      quotes,
      count: fetchedCount,
      requested: symbols.length,
      updated: updateDb,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Prices API error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// POST: Refresh prices and update database
export async function POST(request) {
  const url = new URL(request.url);
  url.searchParams.set('update', 'true');
  
  // Reuse GET logic with update=true
  return GET(new Request(url));
}
// Trigger redeploy Tue Feb 10 14:44:05 UTC 2026
